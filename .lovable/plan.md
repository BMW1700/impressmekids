## Problem

In the editor wall-clock timeline, every scene (including the yellow word-card "child speaks" scene) takes up real seconds. That means a clip placed in the second video of a word visually starts much later than the end of the first video clip — and worse, the playback transport happily plays audio while the playhead is sitting inside the yellow card zone. At runtime the card zone is open-ended (we wait for the child), so any audio anchored across that boundary is meaningless.

Word-card scenes should be **zero-width skip zones** on the editor timeline: audio jumps directly from the end of the previous video to the start of the next video, with nothing playing in between.

## Fix Plan

### 1. Treat word-card scenes as zero-duration on the editor timeline
- In `src/lib/preKSceneGraph.ts`, keep `word-card` scenes in the `scenes[]` list (the canvas still renders the yellow column as a thin "skip notch"), but set their effective wall-clock width to `0` in a new field — `nominalDurationSeconds` stays for legacy callers, add `timelineDurationSeconds` that is `0` for `word-card` and equal to `nominalDurationSeconds` otherwise.
- Update `nominalDurationTotal` to sum `timelineDurationSeconds` so the editor's wall-clock length excludes card time.

### 2. Update the resolver so clips can't overlap card scenes
- In `src/lib/preKClipResolve.ts`, switch `buildSpans` to use `timelineDurationSeconds`. Card scenes become zero-width spans whose `start === end` at the boundary between the first and second video.
- Anchors on `word-card` scenes resolve to that single boundary instant; clips anchored to "card start"/"card end" collapse to the same point, which is the intended teleport boundary.
- `findSceneAt` keeps preferring the next non-zero span, so scrubbing never lands inside a card.

### 3. Transport must never play across a card boundary
- In `src/hooks/usePreKAudioTimelineTransport.ts`, when picking the active clip for `playheadSec`, additionally reject any clip whose `[startSec, endSec)` straddles a card boundary AND whose anchor scene is on the opposite side of the playhead. In practice, because card spans are zero-width, a clip's resolved range now lives entirely in one video region; clips authored before this change that visually crossed the yellow zone will get clamped to end at the card boundary.
- Add a clamp step in `resolveClip` for `fixed` and `span-videos` modes: if the resolved `[startSec, endSec]` would cross a card boundary, clamp `endSec` down to that boundary (audio is cut at the teleport point, not continued on the other side).

### 4. Canvas rendering
- In `src/components/superadmin/prek/TimelineCanvas.tsx`, render the word-card column with a fixed small visual width (e.g. 24px "skip notch" with the lightning icon) but use `timelineDurationSeconds` (= 0) for time-to-pixel math for clips. Clips on either side now butt right up against the notch.
- Keep the header label/notch interactive for scrubbing video preview, but scrubbing onto the notch snaps the playhead to the next video's start.

### 5. Preview tick + scrub safety
- In `AudioMixEditor.tsx`, when the preview tick advances `previewTimeRef` past a card boundary, snap it directly to the next video's start (teleport) and call `transport.stopAll()` once at the boundary to guarantee a clean cut.
- Same teleport-snap behavior when the user drags the playhead onto a card notch.

### 6. Validation
- Scenario from the screenshot: clip 1 ends at the end of `word-1-first`; clip 2 starts at the start of `word-1-second`. After the fix, the two clips visually touch across the yellow notch and there is zero audible content over the card region during preview.
- Drag clip 1's right edge past the boundary → it visually clamps at the notch.
- Scrub onto the yellow notch → playhead snaps to start of `word-1-second`, no audio plays.

## Files To Touch
- `src/lib/preKSceneGraph.ts` — add `timelineDurationSeconds`, update totals.
- `src/lib/preKClipResolve.ts` — zero-width card spans, clamp clip ranges at card boundaries.
- `src/hooks/usePreKAudioTimelineTransport.ts` — reject/clamp clips at card boundaries.
- `src/components/superadmin/prek/TimelineCanvas.tsx` — render card column as a fixed-width skip notch decoupled from time math.
- `src/components/superadmin/prek/AudioMixEditor.tsx` — teleport-snap preview tick and scrub across card boundaries.
