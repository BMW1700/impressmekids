## Brutally honest audit

### 1) Crop/splice editor
- The timeline currently has split/delete buttons, but it does **not** have a clear, reliable crop UI on the clip itself.
- The existing split logic is also risky: it shortens the left clip by overwriting `duration_seconds`, which can corrupt timing for clips that were already trimmed or played at a different speed.
- Result: it looks like there is no crop button, and even when a user tries to splice, the stored trim math can be wrong.

### 2) R2 transfers
- The backend secrets exist: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_ENDPOINT` are configured.
- The failure is not a missing setting. The database shows real R2 permission failures:
  - `R2 PUT 403 AccessDenied` on new transfers.
  - `R2 COPY 403 AccessDenied` on cache-header repatching.
- Most failures are concentrated in:
  - `prek-word-tts` new uploads.
  - `prek-level-videos` new uploads.
  - `aura-audio` / `prek-level-videos` repatch operations.
- The current R2 page is misleading because the CDN health widget can be green while the S3 API token still cannot write/copy objects. CDN read health and R2 write permission are separate things.

## Plan

### A) Make crop actually work in the timeline
1. Add visible draggable crop handles on audio clips:
   - Left handle = crop/trim start.
   - Right handle = crop/trim end.
   - Handles appear on the clip block itself, not hidden only inside the inspector.
2. Wire the handles to update:
   - `trim_start_seconds` when dragging the left edge inward.
   - `trim_end_seconds` when dragging the right edge inward.
3. Keep the clip anchored correctly:
   - Cropping the start should move the timeline anchor forward and advance the audio trim start by the same audio-time amount.
   - Cropping the end should set the effective audio end without moving the start.
4. Keep this safe for iPad/touch by using the existing pointer-event drag system.

### B) Fix split/splice math
1. Update split logic so it preserves the original raw audio duration.
2. For the left clip, set `trim_end_seconds` instead of overwriting the source duration incorrectly.
3. For the right clip, set `trim_start_seconds` from the split point and preserve the original `duration_seconds`.
4. Add guardrails so users cannot split/crop outside the clip or create near-zero-length clips.

### C) Make playback respect crop end
1. Update editor preview playback so it stops or loops based on the trimmed audio window, not just the raw file.
2. Update runtime audio playback so cropped clips do not continue past `trim_end_seconds`.

### D) Make the R2 Migration page tell the truth
1. Add an API-level R2 write diagnostic action to `migrate-to-r2`:
   - Performs a tiny signed `PUT` test to the configured bucket.
   - Performs a tiny signed self-copy/metadata replacement test.
   - Deletes the test object if possible.
   - Returns exact pass/fail details without exposing secrets.
2. Add a “Test R2 write permissions” button to the migration page.
3. Show the actual conclusion on the page:
   - CDN health is only read-path health.
   - `403 AccessDenied` means the R2 token cannot perform the required S3 object operations on `yubilearn-media`.

### E) Make R2 retry/repatch recovery cleaner
1. Add “Clear repatch failures” / reset logic so old repatch errors do not keep polluting the count after credentials are fixed.
2. Add bucket-level failure summary so it is obvious whether failures are from Pre-K videos, word TTS, private audio, etc.
3. Keep migration batches idempotent and non-destructive.

## What you will still need to do outside the app
The code cannot magically grant Cloudflare permissions. If the diagnostic still returns `AccessDenied`, the Cloudflare R2 API token must be replaced or re-scoped with permissions equivalent to:
- Object Read
- Object Write
- Object Delete
- Permission for the exact R2 bucket `yubilearn-media`
- Ideally no path/prefix restriction unless it includes every app prefix being written, such as `prek-level-videos/`, `prek-level-audio/`, `prek-word-tts/`, and `aura-audio/`

Once the token is fixed, the app-side reset/retry tools will recover the failed rows.