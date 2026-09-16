# Voxa — Text-to-Speech &amp; OCR Studio

Voxa turns written text into natural-sounding speech and extracts text from images, all in a polished web app. It pairs **Kokoro-82M** (offline, on-device neural TTS) with **Qwen2.5-VL** (vision-language OCR), served through a FastAPI backend and a Next.js frontend, with Supabase powering authentication, cloud storage, and metadata.

![Tech Stack](https://img.shields.io/badge/backend-FastAPI-2575?logo=fastapi&color=2563EB)
![Tech Stack](https://img.shields.io/badge/frontend-Next.js-16.2-000000?logo=next.js)
![TTS](https://img.shields.io/badge/tts-Kokoro--82M-9C6EFE)
![OCR](https://img.shields.io/badge/ocr-Qwen2.5--VL-3B-28C9B7)
![Auth](https://img.shields.io/badge/auth-Supabase-3ECF8E?logo=supabase)

---

## Features

- **Neural text-to-speech** — Kokoro-82M runs entirely on-device (no cloud TTS API), producing 24 kHz speech from plain text.
- **Multiple output formats** — Generate `WAV`, `MP3`, `OGG`, or `FLAC` from a single button.
- **Word-timestamp subtitles** — Every generation ships with a matching `.srt` subtitle file using accurate per-word timing.
- **Voice preview** — Audition any voice instantly from the dropdown before committing to a full read.
- **Batch generation** — Write multiple scripts (blank-line separated) and synthesize them all in one run with per-item results.
- **Saved voice presets** — Store (voice, speed, format) combos under a name and re-apply them with one click.
- **Image OCR → TTS** — Upload a photo of text, extract the text with Qwen2.5-VL, edit it, and send it straight to TTS.
- **Speed control** — 0.5×–2.0× playback speed presets.
- **Full auth** — Supabase email/password signup &amp; login, JWT-secured API, user-scoped data.
- **History &amp; cloud storage** — Every generation is recorded with metadata, uploaded to Supabase Storage, and available in the history view, with per-user isolation.

---

## Architecture

```
┌──────────────┐      Bearer JWT       ┌──────────────────────────────┐
│  Next.js 16  │ ────────────────────► │         FastAPI backend      │
│  frontend    │  POST /generate       │  ├── routers/                │
│  (React 19)  │  GET /audio           │  │   tts, preview, batch,    │
│              │  POST /generate/batch │  │   audio, ocr, presets,    │
│              │  GET/POST/DELETE      │  │   config                  │
│              │     /presets          │  ├── services/               │
│              │  POST /ocr            │  │   tts (Kokoro-82M),       │
│              │  GET /generate/{f}/   │  │   ocr (Qwen2.5-VL)        │
│              │     subtitles         │  ├── storage/                │
└──────────────┘                       │  │   Supabase Storage        │
        │                              │  └── database/               │
        │                              │      PostgreSQL metadata     │
        ▼                              └───────────┬──────────────────┘
   Supabase Auth                                 │
   (JWT ES256)                                    ▼
                                          Supabase Storage
                                          (voxa-audio bucket)
```

- **PostgreSQL** = the single source of truth for generation metadata, presets, and user scoping.
- **Supabase Storage** = durable cloud copy of every audio file (short-lived signed URLs for playback/download).
- **Local `backend/outputs/`** = working directory for recently written files and the static mount, plus the SRT sidecars.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, Uvicorn |
| TTS | Kokoro-82M (via the `kokoro` package), soundfile, NumPy |
| OCR | Qwen2.5-VL-3B (transformers), qwen-vl-utils |
| Auth | Supabase Auth (JWT, ES256, JWKS) |
| Storage | Supabase Storage (bucket `voxa-audio`) |
| Database | PostgreSQL (psycopg2) |
| Frontend | Next.js 16.2 (Turbopack), React 19, Tailwind CSS v4, `@supabase/ssr` |

> **Note:** All models are CPU-capable. No CUDA GPU is required to develop or run locally, but inference is much faster on a machine with a real CPU; cloud servers with shared vCPUs will be slow (see [Deployment](#deployment)).

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- A Supabase project (Auth enabled + a storage bucket named `voxa-audio`)
- Optional: local PostgreSQL, or point the backend at Supabase Postgres directly

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate    # macOS/Linux

pip install -r requirements.txt
copy .env.example .env        # fill in your credentials (see below)
```

**Environment variables** — `backend/.env`:

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SECRET_KEY` | Supabase service-role key (Storage ops) |
| `SUPABASE_JWKS_URL` | `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json` (JWT verification) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection (metadata + presets) |

**The Supabase Auth email templates** (password reset, confirm signup, magic link) are configured in the Supabase dashboard — **Authentication → Email Templates** — not in code.

**Database schema** — the backend auto-fails gracefully if the DB is unreachable (generations still work, just aren't persisted). To enable persistence you need:

```sql
CREATE TABLE audio_generations (
    id            BIGSERIAL PRIMARY KEY,
    filename      TEXT NOT NULL UNIQUE,
    voice_id      TEXT NOT NULL,
    voice_name    TEXT NOT NULL,
    speed         DOUBLE PRECISION NOT NULL,
    text          TEXT NOT NULL,
    size_bytes    BIGINT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    storage_path  TEXT,
    user_id       UUID,
    format        TEXT NOT NULL DEFAULT 'wav',
    has_subtitles BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE voice_presets (
    id         BIGSERIAL PRIMARY KEY,
    user_id    UUID NOT NULL,
    name       TEXT NOT NULL,
    voice_id   TEXT NOT NULL,
    speed      DOUBLE PRECISION NOT NULL,
    format     TEXT NOT NULL DEFAULT 'wav',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_voice_presets_user ON voice_presets(user_id);
```

#### Run the backend

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

API docs land at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs). The first launch downloads Kokoro-82M (~330 MB) and Qwen2.5-VL weights into `~/.cache/huggingface`.

### 2. Frontend

```bash
cd frontend
npm install
```

**Environment variables** — `frontend/.env.local`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Same Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase **anon** (publishable) key |
| `NEXT_PUBLIC_API_URL` | Backend URL, e.g. `http://127.0.0.1:8000` |

#### Run the frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up or log in, and you're in the TTS Studio.

---

## API Reference

All endpoints except `/config`, `/preview`, and `/docs` require a `Authorization: Bearer <supabase_jwt>` header. Every user-scoped route filters by the JWT `sub` claim.

### TTS

| Method | Path | Description |
|---|---|---|
| `POST` | `/generate` | Synthesize one script. Body: `{ text, voiceId, speed, format }` |
| `POST` | `/generate/batch` | Synthesize many scripts at once (max 20). Body: `{ items: [{ text, voiceId, speed, format }] }` |
| `GET` | `/generate/{filename}/subtitles` | Download the word-timestamp `.srt` for a generation |

`format` ∈ `wav | mp3 | ogg | flac` (default `wav`).

### Voices &amp; preview

| Method | Path | Description |
|---|---|---|
| `GET` | `/preview?voiceId=af_bella&speed=1.0` | Short sample of a voice (public, returns WAV) |
| `GET` | `/config` | Voices, text/speed limits, supported formats, batch cap |

### Audio history

| Method | Path | Description |
|---|---|---|
| `GET` | `/audio` | List the user's generations (with playable `audio_url`) |
| `GET` | `/audio/{filename}` | One generation's metadata |
| `DELETE` | `/audio/{filename}` | Delete the row + cloud + local copies |

### Presets

| Method | Path | Description |
|---|---|---|
| `GET` | `/presets` | List the user's presets |
| `POST` | `/presets` | Create `{ name, voiceId, speed, format }` |
| `PATCH` | `/presets/{id}` | Update any subset of fields |
| `DELETE` | `/presets/{id}` | Remove a preset |

### OCR

| Method | Path | Description |
|---|---|---|
| `POST` | `/ocr` | Multipart image upload → extracted text (Qwen2.5-VL) |

---

## Available Voices

| ID | Name |
|---|---|
| `af_alloy` | Alloy |
| `af_bella` | Bella |
| `am_adam` | Adam |
| `am_michael` | Michael |

New Kokoro voices can be added by extending `VOICES` in `backend/config.py` (IDs follow the `af_`/`am_` naming convention for English female/male).

---

## Deployment

> ⚠️ **Read this before deploying.** The current architecture is designed for local/low-traffic CPU use.

**On Railway (and most PaaS CPU instances), this will not work well out of the box.** Blockers:

1. **Compute** — TTS/OCR need real CPU. Free/small Railway plans (shared vCPU, 512 MB–2 GB RAM) will OOM on model load and be impractically slow.
2. **No run config** — there is no `Procfile`, `Dockerfile`, or `railway.json`; the server also binds to `127.0.0.1` and CORS only allows `http://localhost:3000`. Both must change for any host.
3. **Ephemeral disk** — `backend/outputs/` is local. Deployments reset the filesystem on restart, so locally-mounted audio/SRT files vanish.
4. **DB** — `DB_HOST` points at localhost; production must use a hosted Postgres (Railway plugin or Supabase).

**Recommended paths:**

- **Run the heavy backend where the CPU lives** — your machine, a VPS, or a GPU cloud (RunPod / Vast / Replicate) — and deploy only the **frontend** (Next.js, static client, deploys anywhere) pointing `NEXT_PUBLIC_API_URL` at the API host.
- Use **Supabase Postgres + Storage** (already wired) so no metadata or audio depends on an ephemeral filesystem.
- Move the SRT sidecar upload into Supabase Storage (currently stored on local disk next to the audio).

---

## Project Layout

```
text-to-speech/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── main.py           # app factory: CORS, static mount, routers
│   │   ├── dependencies.py   # JWT verification (ES256, JWKS)
│   │   ├── routers/          # tts, preview, audio, presets, ocr, config
│   │   └── repositories/     # audio_repository (DB access layer)
│   ├── database/             # psycopg2 connection + SQL queries
│   ├── services/             # tts (Kokoro), ocr (Qwen), metadata
│   ├── storage/              # Supabase Storage client
│   ├── config.py             # constants: voices, formats, limits
│   ├── models.py             # Pydantic request/response models
│   ├── validators.py         # request validation
│   ├── outputs/              # generated audio + .srt files (gitignored)
│   └── requirements.txt
├── frontend/                 # Next.js 16 app
│   ├── app/
│   │   ├── app/              # protected dashboard: studio, history, ocr, settings
│   │   ├── login/            # login page
│   │   └── register/         # signup page
│   ├── components/           # AudioPlayer, VoiceSelect, Toast, Sidebar, etc.
│   ├── lib/                  # api client, supabase client, shared types
│   └── package.json
├── decisions.md              # architectural decision log (29+ decisions)
└── flow.md                   # entry points &amp; request flows
```

---

## Planned / Known Limits

- **`MAX_TEXT_LENGTH = 800`**, max speed `1.5×` (hard-clamped in `backend/config.py`).
- Single-worker CPU inference blocks the event loop — a generation/OCR request occupies the worker until done. For concurrency you'd add a queue/worker pool and multi-worker uvicorn on beefier hardware.
- Voice list is fixed to the four configured voices (extend in `config.py`).

---

## License

Private project. See your repository owner for licensing details.