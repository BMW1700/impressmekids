# Add Track 0 — original video audio waveform

Adds a non-editable lane at the top of the timeline that shows the source video's audio as a waveform, one segment per video scene (Opening, Word N first, Word N second, Closing), aligned exactly to the scene columns above.

## What the user sees

```text
┌────────────── Opening ─────────── │↯│ ── Word 1 first ── │↯│ ── Word 1 second ── ...
│ Video        [▰▰▱▱▰▰▰▱▱▰▰▰]         [▰▰▰▱▰▰▱▱▰▰▰]         [▰▱▱▰▰▰▱▱▰▰▰▰]
│ Track 1      [── clip ──]                    [── clip ──]
│ Track 2                                                  [── clip ──]
│ + Drop here to create a new track
```

- New lane labelled "Video", rendered above Track 1.
- One waveform block per video scene, sitting exactly under its scene-header column (skips card notches, like audio clips do today).
- Visual styling matches existing clip blocks (rounded, bordered, same waveform component) but uses a distinct neutral color (slate/zinc) so it reads as "source", not an editable clip.
- No drag, no resize, no track-change, no delete. Clicking it does nothing (or optionally selects nothing — clears selection).
- Each block shows the video's filename truncated at the bottom edge, same as audio clips.

## Technical details

Files to touch:

1. `src/components/superadmin/prek/TimelineCanvas.tsx`
   - New prop: `videoUrls?: Record<string, string>` (sceneKey → signed mp4 URL).
   - Insert a synthetic lane row at `rowIdx = 0` (before existing track lanes). Adjust `top` math for all subsequent lanes and `canvasHeight` to include it. Update `targetRowIdx` drop-zone math to account for the offset so existing drag-to-track behavior is unchanged (the video lane is never a valid drop target).
   - For each `segs.items` entry where `!isCard`, render a read-only block at `(left, width)` that mounts `<ClipWaveform url={videoUrls[scene.key]} ...>` with `peakStart=0, peakEnd=1`. No pointer handlers.
   - Lane label "Video" on the left, same styling as track name labels.

2. `src/components/superadmin/prek/ClipWaveform.tsx`
   - No changes required. `decodePeaks` already does `fetch + AudioContext.decodeAudioData`, which decodes the audio track out of mp4/mov containers in Chromium and Safari. Cached per-URL, so each video decodes once.
   - If decode fails (rare codec), it silently falls back to the thin baseline — the lane still renders, just flat. That's acceptable for v1.

3. `src/components/superadmin/prek/AudioMixEditor.tsx`
   - Pass `videoUrls={videoUrlsState.videoUrls}` to `<TimelineCanvas>` (already loaded for the preview player).

## Out of scope

- No playback of video audio through the mixer — this lane is purely visual reference.
- No waveform for card scenes (they have no source video, and they're zero-width on the timeline anyway).
- No changes to clip resolution, transport, or scene graph.
