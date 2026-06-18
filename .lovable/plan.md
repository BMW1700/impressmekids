Brutally honest audit:

1. The overlap fix is incomplete.
   - The current mixer only stops sibling clips when a new scene event starts a clip.
   - It does not own one central transport timeline; it reacts to scene edges, so clips that should start inside the current scene after a scrub/preview restart can be missed or left running.
   - `stopAll()` fades instead of hard-stopping immediately, and it reuses the same scheduled fade helper after clearing timers, so there is still a timing window where old audio can remain audible.
   - The editor preview emits only scene start/end events, not true clip start/stop events. That is the wrong architecture for timeline editing.

2. The timeline clip UI is genuinely bad.
   - The waveform is rendered behind the file name and play button in a tiny lane, so it visually collides with text.
   - The filename is still the dominant visual even though the user needs the waveform to be the dominant signal.
   - The clip height is too short for a readable waveform plus controls.

3. The current preview behavior is too fragile.
   - Scrubbing, pressing preview, and dragging clips all call stop/start paths, but there is no single source of truth that says: “at this playhead time, these exact clips should be playing, and no others.”

Plan to fix it properly:

1. Replace editor preview playback with a deterministic timeline transport
   - In `AudioMixEditor`, stop driving audio from scene-edge events for editor preview.
   - Add a preview-only transport that evaluates every clip against `previewTime` on each tick.
   - Rule: if the playhead is inside a clip’s resolved time range, that clip may play; if it is outside, it must be stopped.
   - Rule: within a single track, only the top/current clip is allowed to play. If a second clip becomes active on that same track, the first is hard-stopped immediately.
   - Scrub and reset will hard-stop every audio element synchronously before moving the playhead.

2. Make stopping actually stop
   - Add a hard stop path that immediately pauses, zeros volume/gain, clears timers, clears active IDs, and resets audio elements as needed.
   - Use hard stop for editor preview, scrubbing, pause, reset, clip drag, and preview restart.
   - Keep fades only for runtime/gameplay scene transitions where fades are desirable.

3. Fix clip start offsets correctly
   - When preview begins at 11.2s and a clip started at 10.8s, the audio should start 0.4s into that clip, not from the beginning and not be skipped.
   - Apply trim start and playback speed correctly when setting `audio.currentTime`.
   - Respect trim end and clip duration when deciding active ranges.

4. Rebuild timeline clip visuals
   - Increase lane/clip height enough for a real waveform.
   - Render waveform as the primary visual in a dedicated top/body area.
   - Move filename into a separate footer strip below the waveform so it no longer sits on top of the waveform.
   - Keep the small play button separate from the waveform and prevent it from obscuring peaks.
   - Add a cleaner speed badge only when playback rate is not 1.0x.

5. Prevent isolated clip preview from fighting transport preview
   - When the small clip play button is used, stop the main timeline preview first.
   - Maintain one shared isolated preview audio element so multiple clip preview buttons cannot overlap.

6. Validate after implementation
   - Use the screenshot scenario: one clip near Opening and another near Word 1 on another track.
   - Verify that pressing Preview at the playhead cannot leave the first clip playing when the second starts.
   - Verify scrubbing stops all previous audio immediately.
   - Verify the waveform is visually readable and the filename no longer overlays it.