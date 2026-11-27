# Fix: new redubs are made but hidden from the timeline

## What I found (honest audit, Action/Verb Words level 2)

1. **The redub IS working, and it lands in the right place.** All 8 new voice clips were saved at 11:18 PM tonight, each cut to its own video's crop (e.g. opening 0–3.96s, word 2 first 14.9–18.75s). The purple waveforms in your second screenshot are now different per clip, which proves that.
2. **But you can't see them on the timeline.** The "Benny (Redub)" row on this level was deleted on Nov 25. When you redub, the voice clips are saved onto that deleted row, so they're hidden. Your timeline only shows Benny (Music) and Track 94. Clicking "Add empty track" makes rows 92, 93, 94. It never brings back the Benny voice row, which is why it looked like "Add track doesn't add the redub."
3. **Same problem on Body parts level 2:** 8 voice clips are hidden the same way.
4. **The music is still the old version.** All 8 music clips on this level were made from the whole 34-second video on Nov 25, before the per-clip fix. That's why the blue music waveforms are identical in every box. "Redo changed clips" ignores them because they're older than the fix.
5. **Word 1 first didn't get a new voice tonight.** It still has the voice made on Nov 25. The closing clip has no end point, so its voice runs open-ended.
6. **Most other levels** still have voice and music made from the whole video before the fix (every level except Action/Verb L2). They play, but they can't be checked for crop changes until they're redone.

## The fix

1. **Bring the voice/music row back automatically.** If the Benny (Redub) or Benny (Music) row was deleted, a new redub or music run brings it back instead of hiding the clips.
2. **Repair the two broken levels now.** Restore the Benny (Redub) row on Action/Verb Words L2 and Body parts L2 so tonight's 8 voice clips show up right under the video. I won't touch the "Track 1" row you deleted tonight.
3. **Never hide clips again.** If clips are ever saved on a row that doesn't exist, the timeline shows that row with a "Restore" button instead of hiding them. Level Health also shows a red error, e.g. "8 voice clips are hidden: their row was deleted."
4. **Safer delete.** Deleting the Benny (Redub) or Benny (Music) row will say plainly that all voice/music for the level goes with it.
5. **Flag old whole-video music and voice.** Level Health warns "made from the whole video, redo to match crops." "Redo changed clips" will include those clips, so one click on Action/Verb L2 fixes the 8 music clips and Word 1 first.
6. **Find why Word 1 first was skipped** and fix it, or show the reason in the clip's row.

## How I'll check it
- Open Action/Verb Words L2 in a browser and confirm the Benny (Redub) row shows 8 separate voice boxes, each under its own video.
- Add a test: delete the voice row → run redub save → the row comes back with its clips.
- I won't run real ElevenLabs/LALAL redubs, because they use credits. You'll click "Redo changed clips" once on Action/Verb L2 to rebuild the music.

## Technical details
- `prek-clip-redub` and `prek-clip-music-extract`: replace `upsert(..., ignoreDuplicates)` on `prek_level_audio_tracks` with select-then-`update({deleted_at:null})`/insert for track 90/89. Redeploy both.
- Data repair: `update prek_level_audio_tracks set deleted_at=null` for track_index 90 on levels `dd9af60d…` and `9a26af5b…`.
- `AudioMixEditor`/`TimelineCanvas`: synthesize a placeholder row for any `clips.track_index` without an active track. "Restore" un-deletes or inserts the row.
- `preKLevelIntegrity.ts`: errors for orphaned clips; warnings for redub/music with null `source_trim_start_seconds` on shared-source levels. Feed both into the "Redo changed clips" scene list in `useBennyRedub.ts`.
- Tests next to the existing `src/lib/__tests__/preK*.test.ts` files.
