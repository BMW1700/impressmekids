## Brutally honest audit result

The redub side can work, but the music side is **not perfect right now**. The `prek-clip-music-extract` backend function is still using LALAL.AI's older API format:

- Old auth header: `Authorization: license ...`
- Old endpoints: `/api/upload/`, `/api/split/`, `/api/check/`
- Old form fields: `params`, `id`
- Old response fields: `status: success`, `split.back_track`, `task.state`

LALAL's current v1 API expects:

- `X-License-Key` header
- `/api/v1/upload/`
- `/api/v1/split/stem_separator/`
- `/api/v1/check/`
- JSON bodies with `source_id`, `presets`, and `task_ids`
- success response tracks under `result.tracks`, where the music/SFX stem is the `type: "back"` / `no_vocals` track

That mismatch explains why clicking Music appears to do nothing except show the generic non-2xx error, and why Track 89 never appears.

## Fix plan

1. **Update the music extraction backend function**
   - Switch LALAL calls to current v1 endpoints.
   - Use `X-License-Key` auth.
   - Upload source video/audio bytes to `/api/v1/upload/`.
   - Start separation with `/api/v1/split/stem_separator/` using `stem: "vocals"`, `splitter: "phoenix"`, and MP3 output.
   - Poll `/api/v1/check/` by `task_id`.
   - Download the `back` / `no_vocals` track as the music+SFX bed.
   - Keep the existing Track 89 placement and source-video mute behavior.

2. **Fix the frontend error message**
   - `supabase.functions.invoke` hides real function errors behind `Edge Function returned a non-2xx status`.
   - Update `useBennyRedub.ts` so Music and Redub read the function error body and display the actual backend/LALAL error.
   - This prevents us from flying blind if LALAL returns billing, invalid key, no vocals detected, unsupported file, or rate-limit errors.

3. **Verify after implementation**
   - Confirm the function no longer uses old LALAL endpoints.
   - Confirm Music button now starts the v1 flow and, on success, writes `music_audio_paths` and creates a `Benny (Music)` clip on track 89.
   - If it still fails, the UI should now show the real LALAL reason instead of the generic non-2xx message.