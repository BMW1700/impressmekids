# Fix Pre-K cropping to behave like real edge trimming

## Confirmed problem

The current implementation is doing the wrong operation for the requested workflow:

- In `TimelineCanvas`, a start-crop deliberately keeps the clip's left edge fixed and moves the right edge left (`rp = endPx - dx`).
- `resolveClip` always uses the original scene anchor as the audible start, then shortens the clip from the total cropped duration.
- Together, those choices remove audio from the source beginning but immediately pull all remaining audio earlier and redraw it inside a shorter block. That is why the waveform looks compressed/moved and why speech can leave the line where it originally belonged.
- End-cropping is already conceptually closer to correct because its left edge remains fixed while only its right edge changes.

## Correct behavior

Use standard non-ripple edge trimming:

- **Crop start:** the left edge follows the handle to the right; the right edge and every surviving waveform feature stay at the same absolute timeline position.
- **Crop end:** the right edge follows the handle to the left; the left edge and surviving waveform stay stationary.
- Cropping changes only the audible window. It must not stretch audio, change playback rate, move the opposite edge, or rewrite the underlying scene alignment baseline.
- Dragging either edge back outward restores previously cropped source audio up to the original source bounds.

## Implementation

1. **Correct the shared timeline bounds**
   - For fixed clips, resolve the visible/audible timeline start as the baseline scene anchor plus `manual_crop_start_seconds / playback_rate`.
   - Resolve the end independently from the original baseline end minus the ending crop.
   - Keep the persisted scene anchor unchanged so the original source-to-scene alignment remains recoverable.

2. **Correct crop-handle geometry**
   - During a start-crop drag, move only the visual left boundary; never pull in the right boundary.
   - During an end-crop drag, move only the right boundary.
   - Clamp both handles against the original uncropped bounds and the minimum clip duration.
   - Keep the discarded-region ghost outside the surviving block rather than overlaying/repacking the kept waveform.

3. **Preserve the waveform's absolute timing**
   - Render only the retained source slice, but map it at the same pixels-per-second scale as before cropping.
   - Ensure recognizable waveform peaks do not stretch or shift when either edge is cropped.
   - Remove the current start-crop preview math that makes the remaining source fill a block anchored at the old left edge.

4. **Make editor and published playback agree**
   - Update editor transport to activate the clip at its corrected cropped timeline start.
   - Update gameplay scene-event playback so a beginning crop adds the equivalent delayed start while seeking to the cropped source bound.
   - Keep hard stop/loop behavior tied to the same shared effective bounds.
   - Keep auto-realignment limited to the baseline trim fields so manual crops still survive Save and Update Live.

5. **Verify the exact failure visually and audibly**
   - Record the left edge, right edge, and identifiable waveform-peak positions before and after each crop.
   - Start-crop: verify only the left edge moves and the right edge/remaining peaks stay pixel-stationary.
   - End-crop: verify only the right edge moves and the left edge/remaining peaks stay pixel-stationary.
   - Undo and drag outward to verify source audio restores without placement drift.
   - Save, Update Live, reopen, and reload to verify persistence.
   - Compare isolated preview, full editor playback, and published gameplay for identical start position, crop bounds, and stop time.
   - Test mouse and iPad pointer interaction, then check build and runtime logs.

## Technical scope

- `src/lib/preKClipResolve.ts`: derive independent cropped timeline start/end from the unchanged baseline anchor.
- `src/components/superadmin/prek/TimelineCanvas.tsx`: fix start-handle drag geometry, source-window rendering, ghost placement, and clamp math.
- `src/components/superadmin/prek/AudioMixEditor.tsx`: keep persistence on `manual_crop_*`, adapting playhead crop calculations to corrected resolved bounds.
- `src/hooks/usePreKAudioTimelineTransport.ts`: consume corrected resolved activation bounds.
- `src/hooks/usePreKAudioMixerRuntime.ts`: delay fixed-clip scene playback by the beginning-crop timeline amount while seeking to the effective source start.
- Add focused regression coverage for start crop, end crop, restore, playback rate, and persistence. No new database columns are required.
