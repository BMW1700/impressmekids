# Fix redubs copying the same audio into every clip

## Your keys: safe
I only deleted 5 keys that nothing used: Google AI, the old OpenAI key, the Google Cloud project ID and two Google sign-in keys. **ElevenLabs, LALAL, Benny's voice ID, email, video storage, backups and Clever are all still there.**

## What's actually wrong (confirmed in the data)

**food/drink (Level 3)** uses 8 clip slots, but only 2 different video files:
- Opening, Word 1 (both), Word 2 (both) and Word 3 first are the **exact same ~31-second video**, uploaded 6 times. Each slot shows its own part by using a crop (in/out points).
- Closing and Word 3 second are another shared video.

**The redub button ignores those crops.** It sends the **whole video's audio** to ElevenLabs every time. So each of those 6 boxes gets the same full-length redub. That's why every box shows the identical waveform, and why it looks like the opening was copied everywhere.

**Why two clips sometimes end up in one box:** some crops on this level overlap. For example, Word 1 second starts at 6.2s, inside Word 1 first (5.4–8.9s), and runs to 14.8s, past where Word 2 begins. That box really does contain two clips' worth of speech. Word 3 first also has no end point, so it runs to the end of the video.

**It only happens on some levels.** It happens on levels built from one long video instead of separate files per clip. Levels affected now:
- Action/Verb Words L2, Body parts L2, body parts L3 and colors (all 8 slots are one video)
- food/drink and weather/nature L2 (2 videos)
- clothes, foods and Weather/Nature (one pair shared)

Levels with a separate file per clip are fine. That's why it "doesn't happen every time".

## The fix

1. **Redub only the cropped part.** Before redubbing, the editor cuts out exactly that clip's in→out section of audio and sends only that. Each box gets its own short redub, lined up at the start of its clip. The editor's "redub a region" tool already works this way; I'll use it for every redub and for Full auto.
2. **Same for music extraction**, so music boxes don't repeat across clips either.
3. **New Level Health warnings**, shown before you redub:
   - "These clips overlap in the source video" (names the clips and seconds)
   - "This clip has no end point and runs to the end of the video"
   - "These clips share one video file". This one is info only, since shared files are fine once the fix is in.
4. **Re-run the affected levels:** I'll add a "Redo all redubs" button to Level Health for flagged levels. After you fix the overlapping crops, one click redoes them correctly. I won't redo them automatically, because each redo costs ElevenLabs credits and the crops need your eye first.

## What you'll do after
- Open food/drink, fix Word 1 second and Word 3 first crops (Level Health will point at them), then click "Redo all redubs".
- Repeat for the other flagged levels.

## Technical details
- `useBennyRedub.redubScene` / Full auto: when a clip has a trim window or shares its file, decode the source in the browser, slice `[trimIn, trimOut ?? duration]`, encode WAV, upload to `prek-level-audio`, then call `prek-clip-redub` with `sourceBucket` = audio and `clipIsPreTrimmed: true`. Reuse `preKRedubRegion.ts` helpers. Clear stale isolated stems for the scene (they were made from the full file), so isolation runs again on the slice.
- `prek-clip-music-extract`: same pre-sliced input path.
- `preKLevelIntegrity.ts`: overlap / missing-out / shared-file checks, with unit tests for overlap detection.
- Redo button calls the existing per-scene redub with `forceReisolate`.
