## Brutally honest diagnosis

The current redub system is not perfect yet. I found concrete causes for the exact symptoms:

1. **Editor preview is visually lying on trimmed clips**
   - The timeline audio starts using trimmed audio timing, but the editor video preview seeks as if every source video starts at `0.000s`.
   - For a clip trimmed in at `1.104s`, the preview frame is over a second behind the audio, making the voice seem early even when the waveform looks aligned.

2. **Published player can start audio late because MP3s are only loaded at scene-start**
   - The published mixer creates/starts audio when a scene event fires.
   - On Safari/iOS/mobile, a never-loaded MP3 can take seconds to become playable, so the video starts immediately but redub audio arrives late or appears muted.

3. **Redub tails are being cut too aggressively on trimmed scenes**
   - Auto-redub clips inherit source-video trim-out exactly.
   - If ElevenLabs adds even a small tail on the final word, the runtime can cut the last words even though the editor lane has room.

4. **Preview and published playback still use different engines**
   - Editor preview is playhead-driven.
   - Published player is scene-event-driven.
   - They need to share the same resolved timeline/trim semantics, or they will keep drifting apart.

## Fix plan

1. **Fix editor preview trim math**
   - Update the timeline frame resolver so video preview seeks to `sourceTrimIn + timelineOffset`.
   - This makes the editor preview show the same frame the published player shows.

2. **Make published audio preload before Begin unlocks**
   - Pre-create every overlay audio element once the mix loads.
   - Mark the mixer ready only after signed URLs exist and audio elements have reached metadata/canplay readiness.
   - Keep the “Tap to begin” gate blocked until the mixer is actually ready.

3. **Stop cutting redub tails exactly at trim-out**
   - Keep source `trim_start_seconds` for lip sync.
   - Loosen redub `trim_end_seconds` so the final words can finish, while the video freeze-frame hold handles any small tail.

4. **Deploy the redub backend function**
   - Redeploy `prek-clip-redub` after the tail-cut fix.

5. **Repair existing redub clip rows for the current broken levels**
   - For existing `source_kind='redub'` clips, keep trim-in, but remove or loosen trim-out where it equals source trim-out too tightly.
   - Keep clips as fixed one-shots on Track 90.

6. **Verify with the real level data**
   - Use the current published “Benny Picks a Vegetable” level as the test case.
   - Confirm: Track 90 redubs have signed URLs, source video is muted, preview video respects trims, and published begin is gated until audio is loaded.

## Technical files to change

- `src/lib/preKTimelineFrameResolver.ts`
- `src/hooks/usePreKAudioMixerRuntime.ts`
- `src/components/aura/game/rpg/YubiVideoAdventure.tsx`
- `supabase/functions/prek-clip-redub/index.ts`

## Expected result

The editor preview and published player should no longer disagree because both will respect source trims, the published player will not fire redub audio before it is loaded, and final words will not be hard-cut at source trim-out.