

## Fix Plan: Glitchy Backgrounds, Word Echo Double-Count, Power Word Speed

### 3 Issues

**1. Background elements glitching/moving erratically across many worlds**

The `renderSpecialElements()` function in `RPGBattleBackground.tsx` uses `Math.random()` directly inside `style` props in the render body. Every React re-render generates **new random values**, causing elements to teleport, resize, and flicker wildly. This affects ALL special element types: neon signs, void tears, stars, bubbles, crystals, torches, shadows, lava blobs, trees, pillars, banners — every world.

**Fix**: Pre-compute all random values using `useMemo` (like the `particles` array already does). Each special element type gets a memoized array of `{ left, top, width, height, rotation, delay, duration }` so values stay stable across re-renders.

**2. Word Echo counts one spoken word as two echoes**

The 500ms cooldown prevents rapid-fire, but browser speech recognition keeps sending the **same interim transcript** repeatedly over 500ms+. Say "day" once: at t=0 it matches echo 1, at t=600 the same ongoing transcript matches echo 2. The cooldown isn't enough — we need to detect that it's the **same utterance**.

**Fix**: Track `lastMatchedTranscriptRef` — the transcript text that triggered the last match. If the current transcript still contains only the same text (hasn't changed meaningfully), skip. Only allow a new match when the transcript has genuinely changed (new words added, or `isFinal` resets it). Also increase cooldown to 1200ms to require a clear pause between echoes.

**3. Power Word emoji/definition popup rises too fast**

The `RPGWordPowerUp.tsx` animation has `duration: 0.4` for enter and exit. Users can't read the word/definition before it disappears.

**Fix**: Increase enter duration to 0.8s, exit duration to 0.6s, making the popup linger longer and float up more slowly.

---

### Files to Edit

1. **`src/components/aura/game/rpg/RPGBattleBackground.tsx`** — Memoize all random values in `renderSpecialElements` for every element type (neon, void, crystals, bubbles, torches, shadows, lava, trees, pillars, banners, clouds). ~10 element types, each gets a `useMemo` array.

2. **`src/components/aura/game/rpg/RPGWordEcho.tsx`** — Add `lastMatchedTranscriptRef` tracking, increase cooldown to 1200ms, require transcript change before allowing echo 2.

3. **`src/components/aura/game/rpg/RPGWordPowerUp.tsx`** — Slow down enter/exit animation durations.

