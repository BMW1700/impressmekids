## Fixes to the Redub + Music automation

### 1. Music clip should not pause on word cards
In `supabase/functions/prek-clip-music-extract/index.ts` inside `ensureMusicClip`, change:
```ts
pause_on_word_card: true,
```
to
```ts
pause_on_word_card: false,
```
Background music/SFX should keep playing under word cards; only the redubbed voice should duck. Also backfill any existing music clips already inserted:
```sql
UPDATE prek_level_audio_clips
SET pause_on_word_card = false
WHERE source_kind = 'music';
```

### 2. LALAL polling: longer deadline + real error surfacing
In `prek-clip-music-extract`:
- Bump poll deadline from `5 * 60 * 1000` to `8 * 60 * 1000`.
- On timeout, include the last `entry` JSON in the error response so we can see whether LALAL was stuck in `progress`, silently missing `back_track`, or in an unknown state.
- On non-terminal states, log `state` + `progress` every ~20s (not every 4s) so logs stay readable.

### 3. Basic retry on transient upstream errors
Wrap the ElevenLabs Isolation, STS, and LALAL upload/split/check `fetch` calls with a small retry (2 attempts, 1.5s backoff) only on 5xx / network errors. 4xx stays fatal.

### 4. Unify CORS import (cosmetic)
`prek-clip-music-extract` currently uses `npm:@supabase/supabase-js@2/cors`. Change to:
```ts
import { corsHeaders } from "../_shared/cors.ts";
```
to match `prek-clip-redub` and the rest of the codebase.

### 5. Deploy
Redeploy `prek-clip-music-extract` after the edits so the running function picks up the new pause/poll/retry behavior.

### Not doing (call out explicitly)
- **Not** deduping the raw-MP4 download across the two functions. Small waste, not worth the coordination complexity.
- **Not** switching to an async job pattern for LALAL yet. Only needed once clip length regularly exceeds ~5 min.
- **Not** parallelizing scenes in `runFullAuto`. Serial keeps you off ElevenLabs/LALAL rate limits.

### Verification after implementation
1. Run **Full auto** on a level with 2+ clips.
2. Confirm:
   - Redub clip appears on track 90, music clip appears on track 89 directly beneath it.
   - Source video audio auto-muted.
   - Word card mid-scene: **redub pauses, music keeps playing** underneath.
   - Both waveforms render in the RedubStudioPanel rows.
3. Force a failure (temporarily bad LALAL key) and confirm the row shows the real LALAL error, not "timed out."
