## Audit finding

The redub is working because it is a `fixed` clip with `pause_on_word_card: true` and server-side trim/tail behavior.

The music/background stem is broken because the extractor creates it as:

```text
duration_mode: fill-scene
pause_on_word_card: false
fade_out_seconds: 0
```

That means the runtime treats music as a looping scene bed, not as a redub-aligned clip. When the video reaches the end, the player sees scene audio still active, holds/freezes the last frame, and the music/background stem can keep playing into the word card.

## Plan

1. **Do not touch redub placement or redub generation.**
   - Leave Track 90 redub logic alone.
   - Leave the redub edge function behavior alone.

2. **Change newly generated music/background clips to behave like the redub lane.**
   - In the music extraction function, place Track 89 clips as scene-bounded one-shots instead of looping `fill-scene` beds.
   - Set music/background clips to `fixed` mode.
   - Set `pause_on_word_card: true`.
   - Set no looping.
   - Store the same source trim metadata used by redub so the stem aligns with the visible video scene.

3. **Make runtime word-card cutoff explicit for background stems.**
   - On word-card start, fade/pause all non-level audio marked `pause_on_word_card`, including fixed music/background clips.
   - Keep persistent level music untouched only if it is truly `fill-level` and not marked to pause.

4. **Remove music/background from freeze-hold eligibility.**
   - The video freeze hold should wait for voice-like redub tails, not for Track 89 background/music stems.
   - `isSceneAudioBusy` will ignore `source_kind: music` / Track 89 so background noise can never force a frozen last frame.
   - Redub can still use its tail hold exactly as it does now.

5. **Lower the hard freeze cap from 3s to 2s.**
   - This matches the redub tail policy and prevents long visible stalls if anything goes wrong.

6. **Repair existing already-generated music clips.**
   - Add a safe backend repair step to update current Track 89 music clips from `fill-scene` / `pause_on_word_card: false` to redub-like `fixed` / `pause_on_word_card: true` / no loop.
   - This matters because changing the extractor only fixes future music runs; your current broken clips need to be corrected too.

## Files to change

- `supabase/functions/prek-clip-music-extract/index.ts`
- `src/hooks/usePreKAudioMixerRuntime.ts`
- `src/components/aura/game/rpg/YubiVideoAdventure.tsx`
- One backend repair query/migration for existing Track 89 music clips

## Expected result

Track 89 will sit under Track 90 visually, but behave like it operationally: when the redub stops/pauses for a word card, the background/music stem stops/pauses too. Track 89 will not keep playing over word boxes and will not cause video freeze holds.