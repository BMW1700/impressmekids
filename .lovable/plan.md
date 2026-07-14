Brutally honest diagnosis: this is not a LALAL/ElevenLabs problem anymore. The generated audio files can be good and perfectly aligned in the editor, but the published runtime is not honoring the same timeline rules.

What is actually broken:

1. Runtime scene events can fire for the wrong scene
- Word-card scenes do not have a video `onPlaying` event.
- The current code can leave a word-card scene queued as “pending”.
- When the next video starts, that stale card event can fire instead of the real video scene.
- Result: redub clips start late, missing, or out of order.

2. Redub clips were saved in the wrong duration mode
- The redub edge function has been saving new redub clips as `fill-scene`.
- `fill-scene` is for looping ambience/music that gets faded/stopped at scene end.
- Benny voice redubs must be one-shot `fixed` clips.
- Result: words get chopped at scene boundaries and freeze-frame tail protection does not apply correctly.

3. Delayed clip timers are not guarded tightly enough
- If a scene changes while an anchor-offset timer is still waiting, the old timer can still fire.
- Result: old audio can interrupt the current scene on the same redub track.

Implementation plan:

1. Fix `YubiVideoAdventure.tsx`
- Emit word-card audio events immediately, because cards do not produce video playback events.
- Only defer video-scene starts until the actual clip’s `onPlaying` event.
- Guard pending scene starts so a stale scene key cannot fire into the next clip.
- On tap-to-begin, explicitly seed the opening scene start so the first redub starts with the first painted frame.

2. Fix `usePreKAudioMixerRuntime.ts`
- Add generation guards to stop/fade timers so an old timer cannot pause a clip that was restarted.
- Add scene-event generation guards so delayed anchor-offset playback cannot fire after the user has advanced to another scene.
- Keep the existing track exclusivity behavior, but prevent stale clips from killing the current clip.

3. Fix `prek-clip-redub` Edge Function
- Save all newly generated Benny redub clips as `fixed`, not `fill-scene`.
- Store the scene duration fallback when available so the editor/runtime have a deterministic clip length until exact audio metadata is edited/probed.

4. Fix the existing broken clips in the database
- Convert existing `source_kind='redub'` clips on track 90 from `fill-scene` to `fixed`.
- Set `duration_seconds` from the matching scene duration where missing.
- Keep music/SFX clips untouched; music can remain `fill-scene`.

5. Verify with the specific broken level
- Check the vegetable level’s track 90 records after migration.
- Confirm runtime no longer has stale word-card pending starts.
- Confirm redub tail hold can now work because redub clips are fixed-mode.

Expected result:
- Published playback follows the same scene order as the editor.
- Benny voice does not randomly mute except for a few words.
- Old scene audio cannot fire over the next scene.
- Final words are not chopped just because the source video cut ends.