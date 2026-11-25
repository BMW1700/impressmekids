# Fix repeated redubs on short clips

## What's actually wrong
- Most clips on this level show "Voice Isolation failed — status 400". The server logs say why: ElevenLabs won't clean up audio shorter than 4.6 seconds, and these clips are now cut to 3 to 4 seconds each.
- When a clip fails, its old box from an earlier run stays. Those older boxes are the whole long video, so they all look the same. That's where the repeats come from.
- Add Track does work. It's adding empty rows (Track 92, Track 93 in your screenshot). Redubs never go there. They go on their own Benny voice row, and that row is missing because the redubs failed.

## Fix
1. **Make short clips long enough.** Before a clip goes to ElevenLabs, add silence to the end so it's at least 5 seconds. When the redub comes back, cut the silence off again. Each box still starts where its video starts and lasts as long as the clip.
2. **Throw out the old box when a redub fails.** A failed clip shows a clear error and an empty slot, never an old full-video box that looks like it worked.
3. **Clean up this level.** Clear the leftover full-video boxes and the empty Track 92 and 93 rows on food/drink, so the next Full auto starts clean.
4. **Make Add Track clearer.** Rename it "Add empty track" and add a note that redubs go on the Benny row on their own.
5. **Test it.** Add tests for a 3-second clip getting padded and trimmed back, and for a failed clip leaving no old box behind. Then run Full auto on food/drink once to confirm. This uses some ElevenLabs credits.

## Technical details
- Pad in `uploadTrimmedSourceWav` (`preKRedubRegion.ts`) up to 5.0s and record `padSeconds`. After speech-to-speech, the redub is trimmed to the real length with `source_duration`/out-trim = original length, so it lines up on the timeline.
- `useBennyRedub.ts`: on error, delete or replace that scene's existing clip rows before reporting the failure.
- Music extraction (LALAL) gets the same padding as a safeguard.
