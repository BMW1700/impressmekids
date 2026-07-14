## Problem

`usePreKAudioTimelineTransport` selects **one** clip per tick across the entire timeline (`desired` is a single object). When Redub (track 90) and Music (track 89) overlap, the later-starting one wins and the other is hard-stopped. Playing Music solo works because there's no competing clip.

## Fix

Change the transport to pick **one clip per track**, not one clip total. Each track that has an active, audible clip at the current playhead should play in parallel.

### Changes in `src/hooks/usePreKAudioTimelineTransport.ts`

1. Replace the single `desired` variable with a `Map<trackIndex, {clip, startSec, endSec}>`.
2. In the clip loop, compare per-track: keep the clip with the greatest `startSec` (tiebreak on `sort_order`) for that track only.
3. Build `desiredIds` from all winning clips.
4. Iterate winners and run the existing start/seek/volume logic per clip (extract into a small inline helper or a loop body).
5. Preserve all current behavior: metadata gating (`st.loaded`), loop handling, drift correction, hard-stop on out-of-window.

No other files change. No schema, no edge functions. Purely a scheduling fix in the editor preview transport.

### Verification

- Open the timeline editor, place overlapping Redub + Music, press Play → both audible.
- Solo/mute per track still works (existing `track.muted` / `soloTrackIndex` checks unchanged).
- Scrubbing still hard-stops stale clips (per-track cleanup preserved).
