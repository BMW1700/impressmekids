# Prove Full Redub lands every clip in the right spot

## Honest status today
- The fix that cuts each clip's own audio before redubbing is in, and its unit tests pass. A real Full Redub has NOT been run on food/drink since then, so "perfect" is not proven yet.
- The "Add Track" button does not place redubs. It only adds an empty row. Redub clips are saved straight onto the Benny (Redub) row, pinned to each video's start, so they should sit under the original audio without you clicking anything.
- Two things can still put a clip in the wrong spot: overlapping crops (Word 1 second runs into Word 2), and a crop with no end point (Word 3 first). Level Health now flags both, but it does not fix them for you.

## What I'll do
1. **Run a real Full Redub on food/drink** after fixing its two bad crops, then check every clip: one box per clip, its own audio, starting at that video's start, right under the original waveform, and the same length as the cropped video.
2. **Placement test:** add an automated check that a redubbed clip starts at its video's start on the timeline for any crop: no crop, start-only, end-only, both, and shared-video levels.
3. **Fix the fragile "already cut" detection:** right now it guesses from clip length. I'll save a clear "cut to its own window" flag on each redub instead, so later auto-alignment can't shift it.
4. **Block the bad cases before spending credits:** if crops overlap or have no end point, Full Redub stops and tells you which clip to fix.
5. Do the same check on one more affected level (colors) and report the results in plain words.

## Technical details
- Add `source_pre_cut boolean` to `prek_level_audio_clips`. Set it in `prek-clip-redub` / `prek-clip-music-extract` when `clipIsPreTrimmed`. Use it in `preKAlignAudioToTrim.ts` and `preKLevelIntegrity.ts`, and keep the length heuristic only as a fallback for older rows.
- Add a pre-flight check in `useBennyRedub.ts` that calls `findSharedSourceIssues`.
- Add a resolver test in `preKClipResolve` / `preKTimelineFrameResolver` for anchor = scene start at offset 0 under each kind of crop.
