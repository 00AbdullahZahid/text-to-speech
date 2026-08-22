# Voxa — Code Execution Flow

How the application starts, how requests move through the system, and what calls what.

---

## 1. Entry Points

### Backend

```
backend/main.py                  ← uvicorn entrypoint: uvicorn main:app --reload
  └── imports app.main.app       ← the FastAPI application instance
        └── create_app()         ← app factory in backend/app/main.py
```

`backend/main.py` is a one-line shim: `from app.main import app`. It exists so `uvicorn main:app` works from the `backend/` directory.

`backend/app/main.py:create_app()` builds the app:
1. Creates `outputs/` directory
2. Registers custom exception handlers (`validation_exception_handler`, `http_exception_handler`)
3. Mounts `/outputs` as a static file directory
4. Adds CORS middleware (allows `localhost:3000`)
5. Includes 5 routers: `config`, `tts`, `preview`, `audio`, `ocr`
6. Defines `GET /` health check

### Frontend

```
frontend/app/layout.tsx         ← Root layout (Server Component)
  ├── Loads 3 Google Fonts (Plus Jakarta Sans, DM Sans, JetBrains Mono)
  ├── Sets <html> metadata (title, description)
  └── Renders children → routes

frontend/app/page.tsx            ← Landing page (public, /)
frontend/app/login/page.tsx      ← Login page (/login)
frontend/app/register/page.tsx   ← Register page (/register)

frontend/app/app/layout.tsx      ← Auth shell (wraps all /app/* routes)
  ├── <AuthGuard>                ← checks Supabase session, redirects to /login if unauthenticated
  └── <Sidebar>                  ← navigation sidebar

frontend/app/app/page.tsx        ← TTS Studio (/app)
frontend/app/app/ocr/page.tsx    ← OCR (/app/ocr)
frontend/app/app/history/page.tsx              ← History list (/app/history)
frontend/app/app/history/[filename]/page.tsx   ← Generation detail (/app/history/:filename)
frontend/app/app/settings/page.tsx             ← Settings (/app/settings)
```

---

## 2. Authentication Flow

```
Browser                                    Backend
──────                                    ───────
User signs in via LoginForm.tsx
  └── supabase.auth.signInWithPassword()
      → Supabase Auth stores JWT in cookies

User navigates to /app/*
  └── AuthGuard.tsx mounts
      └── supabase.auth.getSession()
          → reads JWT from cookies
          → if no session → redirect to /login
          → if session → render children

User clicks "Generate" (or any API action)
  └── apiFetch("/generate", { ... })
      └── lib/api.ts:createClient()
          → supabase.auth.getSession()
          → extracts session.access_token
          → sets Authorization: Bearer <token>
          → fetch("http://127.0.0.1:8000/generate", { headers })

Backend receives request
  └── Dependencies: UserId = Depends(get_current_user)
      └── dependencies.py:get_current_user(authorization)
          → strips "Bearer " prefix
          → PyJWKClient.get_signing_key_from_jwt(token)  ← fetches JWKS from Supabase
          → jwt.decode(token, key, algorithms=["ES256"])
          → returns payload["sub"] (user UUID)
          → if any step fails → HTTPException(401)
```

**Key files in the auth chain:**
- `frontend/components/auth/AuthGuard.tsx` — session gate
- `frontend/lib/auth.ts` — Supabase browser client
- `frontend/lib/api.ts` — attaches Bearer token
- `backend/app/dependencies.py` — verifies JWT, extracts user ID

---

## 3. TTS Generation Flow

```
User types text, selects voice/speed → clicks "Generate speech"
  │
  ▼
frontend/app/app/page.tsx:handleGenerate()
  │  sets isGenerating = true
  │
  ├── apiFetch("/generate", {
  │     method: "POST",
  │     body: JSON.stringify({ text, voiceId, speed })
  │   })
  │
  ▼
backend/app/routers/tts.py:generate()
  │  Dependencies: _user_id: UserId (auth check)
  │
  ├── validators.validate_generate_request(request)
  │     → checks voiceId in VALID_VOICE_IDS
  │     → checks MIN_SPEED ≤ speed ≤ MAX_SPEED
  │     → checks MIN_TEXT_LENGTH ≤ len(text) ≤ MAX_TEXT_LENGTH
  │
  ├── services/tts.generate_speech(text, voice_id, speed)
  │     → KPipeline(lang_code="a") creates pipeline (cached at import)
  │     → pipeline generator produces (phoneme, audio) chunks
  │     → chunks are concatenated into a single numpy array
  │     → returns numpy array at SAMPLE_RATE=24000
  │
  ├── services/tts.save_audio(audio, filename)
  │     → soundfile.write(path, audio, SAMPLE_RATE)
  │     → saves to outputs/<filename>
  │
  ├── storage/supabase_storage.upload_audio(storage_path, local_path)
  │     → Supabase client uploads to voxa-audio bucket
  │     → returns True/False
  │
  ├── audio_repository.insert_generation(...)
  │     → queries.insert_generation(conn, ...)
  │     → INSERT INTO audio_generations ... ON CONFLICT DO NOTHING
  │     → returns True/False
  │
  └── returns GenerateResponse(filename=filename)
      │
      ▼
Frontend receives response
  ├── fetches updated history: apiFetch("/audio")
  ├── sets selectedGeneration, triggers auto-play
  ├── shows success toast + banner (auto-dismiss 3.5s)
  └── sets isGenerating = false
```

---

## 4. OCR Flow

```
User drops/selects an image → clicks "Extract text"
  │
  ▼
frontend/app/app/ocr/page.tsx:handleExtract()
  │  state: "uploading" → "processing"
  │
  ├── apiFetch("/ocr", {
  │     method: "POST",
  │     body: JSON.stringify({ imageData: dataURL })
  │   })
  │
  ▼
backend/app/routers/ocr.py:ocr()
  │  Dependencies: _user_id: UserId (auth check)
  │
  ├── services/ocr.extract_text_from_base64(imageData)
  │     │
  │     ├── Validates data URL format (must start with "data:")
  │     ├── base64.b64decode(encoded portion)
  │     ├── PIL.Image.open(BytesIO(image_bytes))  ← converts to PIL Image
  │     │
  │     ├── Builds messages array:
  │     │     [{ role: "user", content: [
  │     │       { type: "image", image: PIL_Image },
  │     │       { type: "text", text: "Extract all text..." }
  │     │     ]}]
  │     │
  │     ├── processor.apply_chat_template(messages)
  │     ├── process_vision_info(messages)  ← extracts PIL images from messages
  │     ├── processor(text, images, padding=True)  ← tokenizes + encodes
  │     ├── model.generate(**inputs, max_new_tokens=512)
  │     │     → Qwen2.5-VL-3B-Instruct, CPU, float16
  │     │     → torch.no_grad() context
  │     ├── processor.batch_decode(generated_ids_trimmed)
  │     └── returns extracted text string
  │
  └── returns OCRResponse(text=text)
      │
      ▼
Frontend receives response
  ├── setOcrText(data.text)
  ├── state: "processing" → "result"
  │
  ▼
User reviews/edits text → clicks "Send extracted text to TTS"
  │
  ├── router.push(`/app?ocrText=${encodeURIComponent(ocrText)}`)
  │
  ▼
TTS Studio page loads
  └── useEffect reads searchParams.get("ocrText")
      └── setText(ocrText)  ← populates the Script textarea
```

---

## 5. Audio History / CRUD Flow

### List all generations

```
Page mounts → useEffect
  └── apiFetch("/audio")
      │
      ▼
backend/app/routers/audio.py:list_audio()
  │  Dependencies: _user_id: UserId
  │
  ├── audio_repository.list_generations(user_id=user_id)
  │     → queries.list_generations(conn, user_id)
  │     → SELECT * FROM audio_generations WHERE user_id = ? ORDER BY created_at DESC
  │
  └── for each item: _with_audio_url(item)
        → if storage_path exists → supabase_storage.get_audio_url(path)
          → generates signed URL (1h TTL)
        → else → returns None (frontend falls back to local URL)

Returns { files: [...], total: N }
```

### Delete a generation

```
User clicks delete → confirms
  │
  ▼
apiFetch(`/audio/${filename}`, { method: "DELETE" })
  │
  ▼
backend/app/routers/audio.py:delete_audio()
  │  Dependencies: _user_id: UserId
  │
  ├── audio_repository.get_generation(filename, user_id)
  │     → to get storage_path for cloud deletion
  │
  ├── storage/supabase_storage.delete_audio(storage_path)
  │     → Supabase client removes from bucket
  │
  ├── os.remove(local_path)
  │     → removes from outputs/ directory
  │
  └── audio_repository.delete_generation(filename, user_id)
        → queries.delete_generation(conn, filename, user_id)
        → DELETE FROM audio_generations WHERE filename = ? AND user_id = ?
```

### Get single generation

```
frontend/app/app/history/[filename]/page.tsx
  └── useEffect: apiFetch(`/audio/${filename}`)
      │
      ▼
backend/app/routers/audio.py:get_audio()
  └── audio_repository.get_generation(filename, user_id)
      → SELECT * FROM audio_generations WHERE filename = ? AND user_id = ?
```

---

## 6. Voice Preview Flow

```
User clicks "Preview voice" button (no auth required)
  │
  ▼
frontend/components/VoiceSelect.tsx
  └── fetch(`${API_URL}/preview?voiceId=${voiceId}&speed=${speed}`)
      (plain fetch, no Bearer token)
      │
      ▼
backend/app/routers/preview.py:preview()
  │  NO auth dependency
  │
  ├── validates voiceId and speed
  ├── services/tts.generate_speech(template_text, voice_id, speed)
  └── returns Response(content=wav_bytes, media_type="audio/wav")
      │
      ▼
Frontend creates Blob URL → plays via <audio> element
```

---

## 7. Settings / Account Flow

```
frontend/app/app/settings/page.tsx
  └── useEffect:
      ├── supabase.auth.getUser()  ← gets current user email, ID
      └── renders account info, engine info, sign-out button

Sign out:
  └── supabase.auth.signOut()
      → clears cookies/session
      → AuthGuard detects no session → redirect to /login
```

No backend calls on this page — everything is Supabase client-side.

---

## 8. Landing Page Flow

```
frontend/app/page.tsx
  └── Static React component (no API calls)
      ├── Hero section with animated SpectrumBars
      ├── Features grid (TTS, OCR, History, Languages)
      ├── "How it works" flow diagram
      └── CTA buttons → /login, /register
```

---

## 9. Config Loading Flow

```
TTS Studio mounts → useEffect
  └── fetch(`${API_URL}/config`)
      │  (plain fetch, no auth — /config is public)
      │
      ▼
backend/app/routers/config.py:config()
  └── returns ConfigResponse(
        voices=VOICE_OPTIONS,
        minTextLength=MIN_TEXT_LENGTH,
        maxTextLength=MAX_TEXT_LENGTH,
        minSpeed=MIN_SPEED,
        maxSpeed=MAX_SPEED,
        outputsPath=STATIC_MOUNT_PATH
      )
```

---

## 10. Module Dependency Graph

### Backend (local imports only)

```
main.py
  └── app/main.py
        ├── app/routers/config.py → config.py
        ├── app/routers/tts.py → app/dependencies.py, services/tts.py, storage/supabase_storage.py,
        │                         app/repositories/audio_repository.py, config.py, models.py, validators.py, logger.py
        ├── app/routers/preview.py → services/tts.py, config.py
        ├── app/routers/audio.py → app/dependencies.py, storage/supabase_storage.py,
        │                           app/repositories/audio_repository.py, config.py, logger.py
        ├── app/routers/ocr.py → app/dependencies.py, services/ocr.py
        ├── app/repositories/audio_repository.py → database/queries.py, database/connection.py
        ├── storage/supabase_storage.py → (supabase SDK, dotenv, logger)
        ├── database/connection.py → (psycopg2, dotenv)
        └── database/queries.py → (raw SQL)

services/tts.py → (kokoro, soundfile, numpy, config)
services/ocr.py → (torch, PIL, transformers, qwen_vl_utils)
```

### Frontend (local imports only)

```
app/layout.tsx → (fonts)
app/page.tsx → components/SpectrumBars

app/app/layout.tsx → components/auth/AuthGuard, components/Sidebar
app/app/page.tsx → components/AudioPlayer, components/Toast, components/SpectrumBars, lib/api
app/app/ocr/page.tsx → lib/api, components/SpectrumBars
app/app/history/page.tsx → lib/api, lib/types, components/SpectrumBars
app/app/history/[filename]/page.tsx → lib/api, lib/types, components/AudioPlayer, components/SpectrumBars
app/app/settings/page.tsx → lib/auth, components/SpectrumBars

app/login/page.tsx → components/auth/LoginForm
app/register/page.tsx → components/auth/RegisterForm

components/auth/AuthGuard.tsx → lib/auth
components/auth/LoginForm.tsx → lib/auth, components/SpectrumBars
components/auth/RegisterForm.tsx → lib/auth, components/SpectrumBars

lib/api.ts → lib/auth
lib/auth.ts → (@supabase/ssr)
```

---

## 11. AI-Modified Code (Areas Changed by AI Assistance)

The following files were substantially written or modified by AI during development:

### Backend
- **`backend/services/ocr.py`** — Rewrote image handling to use PIL Images instead of raw data URLs. Added `PIL.Image` + `BytesIO` imports. This was a bug fix for `process_vision_info` not accepting data URL strings.
- **`backend/app/dependencies.py`** — Added `load_dotenv()` call to fix env vars not loading when FastAPI resolves dependencies before `main.py` runs.
- **`backend/app/routers/tts.py`** — Added Supabase Storage upload + PostgreSQL insert after local file save. Added user-scoping.
- **`backend/app/routers/audio.py`** — Added `_with_audio_url()` helper for dual-source URLs (signed Supabase URL vs local fallback). Added user-scoping to all queries.
- **`backend/app/routers/ocr.py`** — Created (new file). Auth-gated OCR endpoint.
- **`backend/app/repositories/audio_repository.py`** — Created (new file). Repository pattern wrapping database queries with connection lifecycle.
- **`backend/storage/supabase_storage.py`** — Created (new file). Supabase Storage integration (upload/delete/signed-URL).
- **`backend/database/queries.py`** — Modified to add `user_id` column and drop FK constraint.

### Frontend
- **`frontend/app/app/ocr/page.tsx`** — Fully rewritten multiple times. Current version has 5 states (upload/uploading/processing/result/error) with two-column layout.
- **`frontend/app/app/page.tsx`** — Added voice search dropdown, generating animation card, error state with retry, success auto-dismiss, OCR text import via query param.
- **`frontend/app/page.tsx`** — Full landing page written from scratch (Resonance design system).
- **`frontend/app/layout.tsx`** — Added Plus Jakarta Sans / DM Sans / JetBrains Mono font imports.
- **`frontend/app/globals.css`** — Rewrote CSS variables for Resonance palette, added spectrum-pulse animation.
- **`frontend/components/Sidebar.tsx`** — Fully rewritten: Midnight Plum bg, collapsible with localStorage, SpectrumBars in logo, violet left-border active state.
- **`frontend/components/SpectrumBars.tsx`** — Created (new file). Reusable spectrum bars in 4 sizes.
- **`frontend/components/AudioPlayer.tsx`** — Fully rewritten: 50-bar waveform scrubber, click-to-seek, Resonance Violet played bars.
- **`frontend/components/Toast.tsx`** — Resonance-tinted shadow.
- **`frontend/components/auth/LoginForm.tsx`** — Fully rewritten: split-screen with brand panel, forgot-password flow.
- **`frontend/components/auth/RegisterForm.tsx`** — Fully rewritten: split-screen with brand panel.
- **`frontend/lib/api.ts`** — Created (new file). Centralized `apiFetch()` with Bearer token injection.
- **`frontend/lib/auth.ts`** — Created (new file). Supabase browser client via `@supabase/ssr`.
- **All route pages** under `app/app/` — Written from scratch with Resonance design system.

### Files NOT modified by AI
- `backend/config.py` — Original hand-written constants
- `backend/models.py` — Original Pydantic models
- `backend/validators.py` — Original validation logic
- `backend/logger.py` — Original logging setup
- `backend/exception_handlers.py` — Original error handlers
- `backend/services/tts.py` — Original Kokoro wrapper (unchanged)
- `frontend/next.config.ts` — Default Next.js config
- `frontend/tsconfig.json` — Standard TypeScript config
- `frontend/package.json` — Original dependency manifest
