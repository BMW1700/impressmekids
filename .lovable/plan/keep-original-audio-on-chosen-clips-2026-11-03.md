# Keep original audio on chosen clips

Right now, once a level has any redub or music, the original video sound is muted for every clip. This adds a per-clip switch so you can unmute the original sound on specific clips (like the one where the wrong character talks) while the rest stay redubbed.

## What you'll see
- In the audio editor, every video clip gets a small speaker toggle: "Original audio: Muted / On".
- Turning it on for a clip plays that clip's original video sound in both the editor preview and the real game.
- For that clip you choose what happens to the redub voice:
  - **Mix both** (original + redub play together), or
  - **Original only** (the redub voice is silenced on that clip; music still plays).
- Clips with original audio on show a clear badge on the timeline.
- Level Health stops flagging those clips as "no redub audio" — it shows "Using original audio" instead.
- Undo works for the toggle like other edits.

## Technical details
- New column on `prek_levels`: `original_audio_scene_keys jsonb default '{}'` mapping scene key -> `"mix" | "original_only"` (additive migration, no data changes).
- `YubiVideoAdventure.tsx`: replace the single `muteSourceVideo` with a per-scene check (current scene key in the map -> unmute video element); for `original_only`, set redub track gain to 0 for that scene in `usePreKAudioMixerRuntime`.
- `TimelinePreviewPlayer.tsx` / `AudioMixEditor.tsx`: same per-scene logic, toggle UI on scene clips, undo entry.
- `preKLevelIntegrity.ts`: skip the `missing-redub` error for scenes in the map.
- Load the map in `preKLevelFromDb.ts`; add a small test for the per-scene mute rule.
