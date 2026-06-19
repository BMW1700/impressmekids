## Problem

The preview `<video>` is rendered with native `controls`, so its built-in scrubber and play button operate on the **raw file** (0 → full duration). Setting In = 2.850s doesn't stop the native scrubber from jumping back to 00:00 or playing through the trimmed-off head/tail. The trim bar below is treated as decoration.

## Fix — `src/components/superadmin/prek/VideoTrimEditor.tsx` only

Make the **trim bar the sole transport control**. The raw `<video>` element becomes display-only.

### Changes

1. **Remove native controls.** Drop `controls` from the `<video>`; add `playsInline`, `muted={false}`, and `preload="metadata"`. No native scrubber, no native play button.

2. **Custom Play / Pause button** next to In/Out/Reset:
   - Click Play → if `currentTime < effIn` or `currentTime >= effOut − 0.02`, seek to `effIn` first, then `video.play()`.
   - Click Pause → `video.pause()`.
   - Local `isPlaying` state driven by `onPlay` / `onPause` / `onEnded` events.

3. **Trim bar becomes a clickable scrubber** for the kept region:
   - Clicking anywhere on the bar between the In and Out handles seeks the video to that time. Clicks on the trimmed-away (faded) regions are ignored (or clamp to In/Out).
   - Existing handle-drag behavior keeps working.

4. **Hard clamp during playback** (already partly in place):
   - `onTimeUpdate`: if `currentTime >= effOut − 0.02` → pause + seek back to `effIn`. (Already shipped — keep it.)
   - `onTimeUpdate`: if `currentTime < effIn − 0.05` → seek forward to `effIn`. (New — covers the case where the user changes In while paused before the next play.)
   - `onLoadedMetadata`: seek to `effIn`. (Already shipped — keep it.)

5. **Playhead label** shows time relative to the trimmed window (e.g. `Playhead 0.000s` at In, `Playhead 5.150s` at Out when In=2.85/Out=8.00), so the number matches what a child will actually see at runtime. Keep the absolute In/Out labels as-is.

### Files touched
- `src/components/superadmin/prek/VideoTrimEditor.tsx` only.

### Files NOT touched
- Runtime (`NabuVideoAdventure.tsx`), scene graph, DB — all already enforce trims correctly. This is purely an editor UX fix.

### Out of scope
- Frame-step buttons (◀1f / 1f▶), keyboard shortcuts (J/K/L, [, ]), and waveform-style scrubbing — happy to add in a follow-up if you want NLE-style polish.
