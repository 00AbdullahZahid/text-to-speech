# Voxa — Architectural Decisions Log

Every meaningful decision, why it was made, and when it changed.

---

## 1. Backend Framework: FastAPI

**Decision:** Use FastAPI for the Python backend (not Flask, Django, etc.).

**Reason:** Native async support, auto-generated OpenAPI docs, Pydantic integration for request/response validation, and lightweight enough for a local-first TTS tool. The app doesn't need Django's ORM or Flask's ecosystem — FastAPI gives the most with the least boilerplate.

---

## 2. TTS Engine: Kokoro-82M

**Decision:** Use `kokoro` (KPipeline, `lang_code="a"`) as the TTS engine, running on CPU.

**Reason:** Kokoro-82M is a small, high-quality model that runs acceptably on CPU without a GPU. It produces natural-sounding speech. The user's machine is CPU-only (no CUDA), so a larger model would be too slow. The pipeline's generator interface allows streaming chunk concatenation, keeping memory usage manageable.

---

## 3. OCR Engine: Qwen2.5-VL-3B-Instruct

**Decision:** Use `Qwen/Qwen2.5-VL-3B-Instruct` for image-to-text extraction, with `float16` and CPU.

**Reason:** It's the smallest Qwen VL model that's still accurate enough for real OCR work. Chosen over larger variants (7B+) because the user's machine is CPU-only. The 3B model fits in memory and processes images in a few seconds.

---

## 4. OCR Image Handling: PIL Image Conversion (not raw data URLs)

**Decision:** Decode base64 data URLs into PIL Images before passing to `process_vision_info`.

**Reason:** The `qwen_vl_utils.process_vision_info` function only accepts PIL Images, HTTP URLs, or file paths — it does not parse `data:image/png;base64,...` URLs. Passing the raw data URL string caused silent failures. The fix (`services/ocr.py`) decodes the base64, opens it via `PIL.Image.open(BytesIO(...))`, and passes the PIL object. This is the correct way to feed local images to the Qwen VL pipeline.

**Changed in:** `services/ocr.py` — added `PIL.Image` + `BytesIO` imports, replaced the raw string pass-through with explicit PIL conversion.

---

## 5. Auth Provider: Supabase Auth (ES256 JWTs)

**Decision:** Use Supabase Auth for sign-up/sign-in, with backend JWT verification via ES256 (ECDSA P-256).

**Reason:** Supabase Auth handles the full auth lifecycle client-side (sign-up, sign-in, session refresh, password reset) with zero backend code. The backend only needs to verify the JWT — which Supabase signs with ES256 by default. Using `PyJWKClient` to fetch JWKS from Supabase's JWKS endpoint means the backend auto-discovers the signing key with no hardcoded secrets.

**Key detail:** `load_dotenv()` is called inside `dependencies.py` (not just `main.py`) because FastAPI's dependency injection can resolve modules before `main.py` runs. Without the per-module `load_dotenv()`, `SUPABASE_JWKS_URL` reads as empty and auth fails with a 500.

---

## 6. Auth on the Frontend: @supabase/ssr (browser client)

**Decision:** Use `@supabase/ssr`'s `createBrowserClient` for the frontend (not the legacy `@supabase/supabase-js` directly).

**Reason:** Next.js 16's App Router uses Server Components by default. The `@supabase/ssr` package handles cookie-based session management across the client/server boundary. The browser client is used in `lib/auth.ts` for all client-side session access, and `lib/api.ts` wraps every API call with the session's access token.

---

## 7. API Calls: Centralized apiFetch with Bearer Token

**Decision:** All backend API calls go through `lib/api.ts`'s `apiFetch()`, which attaches the Supabase JWT.

**Reason:** Avoids duplicating auth-header logic in every page/component. The function gets the current session, extracts `access_token`, and sets the `Authorization: Bearer ...` header. If the session is expired or missing, the request goes through without a token — the backend returns 401, and the frontend's `AuthGuard` redirects to login.

---

## 8. Database: PostgreSQL (localhost) with Repository Pattern

**Decision:** Use a local PostgreSQL database with a repository layer (`audio_repository.py` → `queries.py`), not an ORM.

**Reason:** The data model is simple (one table: `audio_generations`). A full ORM (SQLAlchemy, Tortoise) would be overkill. Raw SQL with psycopg2 is faster and more transparent. The repository pattern keeps routers clean — they never touch SQL directly.

**Important change:** The foreign key constraint `audio_generations_user_id_fkey` was dropped. It was preventing inserts because Supabase Auth user IDs don't map to a `users` table in the local DB. The table still has a `user_id` column for row-level scoping; it just doesn't enforce FK.

---

## 9. Storage: Supabase Storage (optional, graceful degradation)

**Decision:** Audio files are uploaded to Supabase Storage (`voxa-audio` bucket), but the app works without it.

**Reason:** Supabase Storage provides CDN-backed, signed-URL access to generated audio — better than serving from the local filesystem over the network. But the backend doesn't fail if Supabase is unreachable: `upload_audio()`, `delete_audio()`, and `get_audio_url()` all return `False`/`None` on failure, and the frontend falls back to the local static file URL (`/outputs/{filename}`).

---

## 10. Frontend Framework: Next.js 16 (App Router, Turbopack)

**Decision:** Use Next.js 16 with App Router and Turbopack dev server.

**Reason:** App Router gives nested layouts (auth shell wraps all `/app/*` pages), file-system routing, and Server Component support. Turbopack gives fast HMR. The AGENTS.md warning notes this is a breaking-change version of Next.js — all code must be verified against `node_modules/next/dist/docs/` before writing.

---

## 11. Frontend State: Client Components (no Server Components for interactive pages)

**Decision:** All interactive pages (`/app`, `/app/ocr`, `/app/history`, etc.) are `"use client"` — no Server Components for data fetching.

**Reason:** Every interactive page needs React state (`useState`, `useEffect`), event handlers, and browser APIs (`fetch`, `navigator.clipboard`). Server Components would add complexity (prop-passing, Server Actions) for no benefit in this app. The only Server Component is `app/layout.tsx` (font loading, metadata).

---

## 12. Design System: Resonance (violet-led palette)

**Decision:** Adopt a "Resonance" design system with Midnight Plum (#110D2A), Resonance Violet (#7C5CFC), VU Gold (#F0C244), Recording Red (#FF6B6B), Whisper (#F5F3FF), Pure (#FFFFFF). Signature visual: SpectrumBars (5 vertical bars of varying heights).

**Reason:** Gives the app a distinctive audio-production identity without being generic "blue SaaS". The spectrum bars motif recurs across all pages (logo, loading states, buttons, empty states) to reinforce the audio theme. Violet is the primary action color; gold is for speed/pause controls; red is for destructive actions and errors.

**Typography:** Plus Jakarta Sans (display/headings), DM Sans (body), JetBrains Mono (code/data). All loaded via `next/font/google` in `app/layout.tsx`.

---

## 13. Sidebar: Collapsible with localStorage Persistence

**Decision:** Sidebar collapses from 260px to 72px, toggled by a double-chevron button, state saved to localStorage.

**Reason:** Saves screen real estate when the user is focused on a single task (e.g., OCR or TTS). The 72px collapsed state shows only icons, which are self-explanatory with tooltips. localStorage persistence means the user's preference survives page refreshes.

---

## 14. Voice Dropdown: Searchable with Click-Outside Close

**Decision:** Voice selector is a custom dropdown (not native `<select>`) with a search input and click-outside dismissal.

**Reason:** The voice list can be long (many languages/accents). Search lets users find a voice quickly. A native `<select>` can't have a search input. Click-outside is handled via a `mousedown` listener on `document` checking `voiceDropdownRef.current`.

---

## 15. OCR → TTS Pipeline: Query Parameter Handoff

**Decision:** When the user clicks "Send extracted text to TTS" on the OCR page, the extracted text is passed to the TTS Studio via `?ocrText=<encoded>` URL query parameter.

**Reason:** Simple, stateless, no shared state management needed. The TTS Studio's `useEffect` reads `searchParams.get("ocrText")` and calls `setText(ocrText)` to populate the Script field. This is the standard Next.js way to pass data between pages.

---

## 16. Error Surfacing: Backend Errors Exposed to Frontend

**Decision:** Backend error detail messages (from `HTTPException.detail`) are extracted and shown to the user in the frontend, not replaced with generic messages.

**Reason:** Generic "something went wrong" messages make debugging impossible for the user. If the backend says "Token expired" or "Invalid image data format", the user should see that. The OCR page's `catch` block uses `e instanceof Error ? e.message : fallback` to surface the real error.

---

## 17. Audio Playback: Dual-Source (Supabase signed URL, local fallback)

**Decision:** Audio URLs are constructed as: prefer signed Supabase Storage URL → fallback to local `/outputs/{filename}`.

**Reason:** Signed URLs provide faster, CDN-backed playback and work even if the backend is down. But if Supabase is unreachable or the file wasn't uploaded, the local static mount still serves the file. The `_with_audio_url()` helper in `audio.py` handles this logic per-item.

---

## 18. Voice Preview: No Auth Required

**Decision:** `GET /preview` does not require authentication.

**Reason:** Preview is a lightweight, stateless operation (generate 3 seconds of audio for a voice sample). Requiring auth would force the user to log in before they can even hear what a voice sounds like — a poor onboarding experience. No sensitive data is exposed.

---

## 19. OCR Page States: Five Distinct States

**Decision:** OCR page has 5 states: `upload` → `uploading` → `processing` → `result` / `error`.

**Reason:** Gives the user clear visual feedback at each step. `uploading` (image loaded, user clicks "Extract text") is separate from `processing` (model is running) so the user can review their image before committing. The `error` state shows the actual error with a retry button instead of silently resetting.

---

## 20. Generating Animation: Spectrum Bars + Status Messages

**Decision:** TTS generation shows an animated SpectrumBars component with "Kokoro-82M is generating your audio..." text. OCR processing shows a larger animated SpectrumBars with "Analyzing image..." text.

**Reason:** Both operations take several seconds on CPU. A static spinner doesn't communicate "audio is being created." The animated spectrum bars reinforce the brand and give a sense of active processing. The OCR variant is larger (xl size) to fill the two-column layout.

---

## 21. Toast Notifications: 4.5s Auto-Dismiss

**Decision:** Toast notifications auto-dismiss after 4.5 seconds, positioned fixed top-right.

**Reason:** Long enough to read, short enough to not clutter the screen. The 4.5s timeout is tuned for the longest typical message (~50 chars). Manual dismiss is available via the X button for users who want to dismiss immediately.

---

## 22. Success Auto-Dismiss: 3.5 Seconds

**Decision:** The "Audio generated successfully" success banner auto-hides after 3.5 seconds.

**Reason:** Success states are informational — the user doesn't need to act on them. Keeping them visible too long clutters the UI. 3.5s is enough to register the success before the next action.

---

## 23. History: Search + Voice Filter + Sort

**Decision:** The history page supports text search, voice filtering via dropdown, and ascending/descending sort by date.

**Reason:** Users generate many audio files. Without search/filter, finding a specific generation requires scrolling through the entire list. Voice filtering is especially useful because users often stick to one voice and want to compare outputs.

---

## 24. Sidebar Active State: Left Violet Border

**Decision:** The active nav item in the sidebar gets a 3px left border in Resonance Violet (#7C5CFC), not a background color change.

**Reason:** A left border is a standard "active rail" pattern in SaaS sidebars. It's visually distinct without being heavy. A background change would clash with the Midnight Plum sidebar background and reduce contrast for the nav label text.

---

## 25. Login/Register: Split-Screen with Brand Panel

**Decision:** Login and Register pages use a split-screen layout: left panel (Midnight Plum background, animated SpectrumBars, tagline) + right panel (white, form).

**Reason:** Establishes brand identity at the most important entry points. The animated spectrum bars and tagline ("Turn words into voice" / "Your voice, amplified") communicate the product's value before the user even signs in. The split-screen pattern is proven in SaaS onboarding (Stripe, Linear, Vercel).

---

## 26. Backend: load_dotenv() in Every Module That Reads Env Vars

**Decision:** `load_dotenv()` is called in `dependencies.py` and `storage/supabase_storage.py`, not just in `main.py`.

**Reason:** FastAPI resolves dependencies at import time, which can happen before `main.py`'s top-level `load_dotenv()` runs. If `dependencies.py` reads `SUPABASE_JWKS_URL` before `.env` is loaded, it gets an empty string and the PyJWKClient fails. Per-module `load_dotenv()` is defensive and ensures env vars are always available.

---

## 27. OCR Prompt: "Extract all text exactly as it appears"

**Decision:** The OCR prompt sent to Qwen2.5-VL is: "Extract all text from this image exactly as it appears. Output only the extracted text with no commentary."

**Reason:** Maximizes the chance of clean, usable text output. The "exactly as it appears" instruction tells the model to preserve formatting. The "no commentary" instruction prevents the model from adding preamble like "Here is the text I found:" which would need to be stripped manually.

---

## 28. Max New Tokens: 512 for OCR

**Decision:** `model.generate(..., max_new_tokens=512)` for OCR inference.

**Reason:** Most OCR tasks produce fewer than 500 tokens of text. 512 is enough for a full page of text while keeping inference time reasonable on CPU. Higher values (1024+) would double inference time for rare edge cases.

---

## 29. Pixel Limits for OCR: 640 * 28 * 28 max

**Decision:** `max_pixels=640 * 28 * 28` (≈500K pixels) for the Qwen VL processor.

**Reason:** Larger images consume proportionally more memory and inference time. 640 * 28 * 28 is the recommended default for Qwen2.5-VL — it preserves enough resolution for readable text while keeping CPU inference under ~10 seconds per image. Larger images are downscaled automatically by the processor.
