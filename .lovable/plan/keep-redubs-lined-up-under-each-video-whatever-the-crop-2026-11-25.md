# Keep redubs lined up under each video, whatever the crop

## Short answer
The fix does not break the flow. A new redub still goes straight onto the Benny voice row, starts exactly when its video starts, and runs for the cropped length. That holds no matter how a clip is cropped:
- **Crop starts at 0, whole file used:** the whole video's audio is sent, same as before.
- **Any other crop (including one long video split into many slots):** only that clip's cropped part is sent. Short parts get silent padding so ElevenLabs accepts them, and playback stops at the real end, so nobody hears the padding.
- **Overlapping crops or crops with no end point** on a shared video: Full auto stops before it spends credits and says which clip to fix.

## The one hole left
If someone (an intern, for example) **changes a clip's crop after it was redubbed**, the redub keeps the old cropped audio. It will still start under the right video, but it can now be the wrong words or the wrong length. Right now nothing warns you about this.

## What I'll build
1. **Remember the crop used for each redub and music track.** When a redub or music track is made, save the crop start and end it was made from.
2. **Level Health warning:** "Crop changed since this redub. Redub this clip again." It shows on the clip and on the Level Health list.
3. **"Redo changed clips" button** next to Full auto. It redubs (and redoes music for) only the clips whose crop changed, so you don't spend credits on the whole level.
4. **Tests for each crop rule:** whole file, start crop, end crop, both edges, a short clip under 5 seconds, a long video shared by many slots, and a crop changed after redub. Each test checks that the redub starts at its video's start, plays for the cropped length, and that the stale warning appears only when the crop really changed.

## What I can't promise without a real run
I haven't run a real Full auto since the short-clip fix, because that uses ElevenLabs/LALAL credits. After this ships, run Full auto once on food/drink to confirm it. Each box should show its own waveform, sitting under its own video.

## Technical details
- Migration: add `source_trim_start_seconds` and `source_trim_end_seconds` (nullable numeric) to `prek_level_audio_clips`.
- `prek-clip-redub` / `prek-clip-music-extract`: accept and save the original crop the client sent, before pre-cut zeroing. Redeploy both.
- `useBennyRedub.ts`: send the original crop alongside the pre-cut fields. Add `redubChangedScenes()` that uses the existing per-scene redub path.
- `preKSharedSource.ts`: add `cropChangedSinceRedub(clip, scene)` with a 0.05s tolerance. Use it in `preKLevelIntegrity.ts` (new `crop-changed-since-redub` warning).
- Existing clips without a saved crop are treated as unknown, not stale, so this won't flood the list with warnings.
- Tests are added to `src/lib/__tests__/preKRedubPlacement.test.ts`.
