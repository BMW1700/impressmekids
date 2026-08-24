# Permanently fix Pre-K audio cropping and placement

## Confirmed failure

This is real, and the current level data proves it:

- The crop action writes to the clip, but the level Save flow immediately calls automatic audio/video realignment. That function rewrites `trim_start_seconds` and `trim_end_seconds`, erasing the manual crop.
- Start-cropping also changes `anchor_scene_key` / `anchor_offset_seconds`. That is incorrect for this workflow: removing broken audio from the beginning should make the clean speech start at the same scene position, not move the whole line later.
- Those bugs combine destructively. The Word 1 first redub now has a `1.30s` anchor offset but its trim was reset to `0`; the second Word 1 redub’s previously confirmed `8.32s` crop-out has been reset to no crop. That exactly explains why “Oh no, a river is in the way…” moved and the discarded garbage returned.
- The Level Health check currently treats any manual audio crop as drift, reinforcing the overwrite behavior.

## Fix

### 1. Separate synchronization from manual cropping

Add dedicated persisted manual crop amounts to each audio clip:

- `manual_crop_start_seconds`: audio discarded after the automatically aligned source start.
- `manual_crop_end_seconds`: audio discarded before the automatically aligned source end.

The existing trim fields remain the automatic video/audio synchronization baseline. Saving or changing video trims may update that baseline, but can no longer erase an editor crop.

### 2. Make crop operations non-ripple edits

- Dragging either crop handle will change only the manual crop amount.
- Cropping the beginning will keep the clip’s scene anchor and timeline start fixed; the clean speech moves to the intended start of that line.
- Cropping the end will keep the clip’s timeline start fixed and shorten only its audible end.
- “Crop start/end to playhead,” numeric crop controls, undo, waveform display, isolated preview, editor transport, and published gameplay will all use one shared effective-bounds calculation.

### 3. Make saving explicit and race-safe

- Await the database update and request the saved row back instead of treating a no-error request as proof of persistence.
- Refresh the editor only after the confirmed row is returned.
- Prevent overlapping reloads from restoring stale clip state after rapid edits.
- Show a clear success/failure result for crop saves; a failed or zero-row update must never look saved.

### 4. Stop automatic systems from destroying editor work

- Update audio/video realignment so it may change only the synchronization baseline and always preserves manual crop amounts.
- Update redub/music generation to initialize manual crops to zero when a clip is newly generated or intentionally regenerated.
- Update Level Health to validate the synchronization baseline separately from manual crop bounds; an intentional crop will no longer be reported as audio drift.

### 5. Repair the damaged Word 1 clips

After the new model is in place:

- Restore the Word 1 first redub to its original scene placement and convert the stranded `1.30s` anchor shift into a `1.30s` beginning crop.
- Restore the previously recorded Word 1 second redub crop-out at `8.32s` (equivalent to discarding the final `5.36s` of its `13.68s` source).
- Leave music placement unchanged unless verification shows it was altered by the same failed edit.

## Verification

Test the exact level and clips that failed:

1. Crop bad audio from the beginning of Word 1 first; verify the clean phrase begins at the same scene boundary and the anchor does not move.
2. Crop Word 1 second to `8.32s`; verify the visible block shortens and isolated preview stops there.
3. Press Save, Update Live, leave the editor, reopen it, and reload the page; verify both crops remain exactly saved.
4. Change a video trim and save; verify synchronization realigns while both manual crops remain intact.
5. Run editor preview and published gameplay; confirm the redub starts on the correct line, ends before the glitched laughter, and matches the same waveform bounds in both paths.
6. Check desktop and iPad pointer handling, plus build/runtime logs.

## Technical notes

- Add the two crop columns through a database migration; retain existing table grants and RLS.
- Centralize effective source bounds so `preKClipResolve`, `TimelineCanvas`, `usePreKAudioTimelineTransport`, and `usePreKAudioMixerRuntime` cannot disagree.
- Update `AudioMixEditor`, `preKAlignAudioToTrim`, `preKLevelIntegrity`, and the redub/music clip writers to follow the separated baseline/crop model.
