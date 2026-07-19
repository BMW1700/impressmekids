## Why Word 1 part 2's redub is saying "What color is this?"

Two things combine to make this happen, and neither is random — it's fully explainable:

### Root cause 1: STS receives the ENTIRE raw source file, not the trimmed region

`prek-clip-redub` downloads the full source video/audio bytes and sends the entire file to ElevenLabs Speech-to-Speech. The trim window (`sourceTrimStart` / `sourceTrimEnd`) is only used later to place the resulting clip on the timeline — it is NOT used to cut the audio before it's sent to ElevenLabs.

So if Word 1's underlying source video actually contains the phrase "What color is this?" somewhere in it (even outside the trimmed window that the top waveform shows), STS will faithfully reproduce that phrase in Benny's voice. The top waveform in the editor only shows you the trimmed slice, so you're comparing a trimmed source against a full-length redub — and they look/sound like different content.

### Root cause 2: The isolated-stem cache can serve a stale stem

We cache the Voice-Isolated MP3 per `sceneKey` in `prek_levels.redub_isolated_paths` (to save credits on retries). If the source video for that scene key was ever swapped, or another scene sharing a name had its stem cached first, hitting "Redub" again re-uses the stale isolated stem — which is why redubbing again gave the exact same wrong output. It's not random; it's cache reuse.

## The fix

### 1. Cut audio to the trim window BEFORE sending to ElevenLabs
In `prek-clip-redub`, use `ffmpeg` (Deno WASM build) to extract only `[sourceTrimStart, sourceTrimEnd]` from the source video's audio track and send THAT to Voice Isolator + STS. Result: redub matches exactly what the trimmed clip in the editor plays, every time.

Also bust the isolated-stem cache when the source path or trim window changes: store `sourcePath|trimStart|trimEnd` as the cache key instead of just `sceneKey`.

### 2. Delete button under each redub row
Add a small trash icon in `RedubStudioPanel.tsx` next to the "Redub" retry button. Clicking it:
- Soft-deletes the redub clip row on track 90 (`deleted_at = now()`)
- Clears `prek_levels.redub_audio_paths[sceneKey]` and `redub_isolated_paths[sceneKey]`
- Leaves the source video untouched, so the row goes back to "not yet redubbed"

### 3. Manual "redub from a highlighted region" tool
New workflow on the source-audio waveform in `RedubStudioPanel.tsx`:
- Click-drag on the top (source) waveform to draw a highlight region.
- A small "Redub INTO →" dropdown appears listing every scene in the level (`Word 1 – first clip`, `Word 1 – second clip`, `Word 2 – first clip`, …).
- Pick a target scene → we call `prek-clip-redub` with the source path plus explicit `regionStart` / `regionEnd` overrides, and the resulting redub is written to the target scene's redub slot (regardless of which scene the region came from).

This lets you rescue a single busted redub by grabbing the correct phrase from any source clip in the level and routing it into the busted scene, without redoing everything.

### Technical details
- Edge function: add optional `regionStartSeconds` / `regionEndSeconds` to the request body. When present, use ffmpeg-wasm to `-ss regionStart -to regionEnd` the audio track into a temp MP3 in memory before Isolator/STS. Fall back to current behavior when absent.
- Cache key: `redub_isolated_paths` becomes `{ [sceneKey]: { path, sourceKey } }` where `sourceKey = sha1(sourcePath + trimStart + trimEnd + regionStart + regionEnd)`. Mismatch = re-isolate.
- Delete: new small helper `deletePreKRedub(levelId, sceneKey)` in `src/lib/` called from a trash button in `RedubStudioPanel`.
- Region picker: extend the existing top waveform in `RedubStudioPanel` with a drag-to-select overlay (existing waveform component already reports pixel→time). Emit `{ startSec, endSec }` to a new "Send region to scene…" popover.
- Alignment: on region redubs we set the clip's `trim_start_seconds = 0` and `duration_seconds = regionEnd - regionStart`, since the MP3 now IS the exact phrase — no lip-sync offset needed.

### Not touched
Timeline playback, mixer runtime, integrity/health guards, LALAL music path, and Full Auto stay exactly as they are.