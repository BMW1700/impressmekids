# Boss Spell-Break Minigame (Phase 2C)

Turn every 5th wave (boss wave) into a memorable, literacy-driven set-piece. Boss casts a 4-word incantation; the player must read all 4 words aloud in order before a 5-second timer expires. Success stuns the boss and deals heavy damage; failure deals a big hit to the player castle.

## Files

**New:**
- `src/components/aura/game/castle/BossSpellBreak.tsx` — overlay component. Props: `words: string[]`, `durationMs: number`, `onResult: (broken: boolean, wordsRead: number) => void`. Renders a dimmed overlay anchored over the arena, with the 4 words revealed letter-by-letter, a shrinking timer ring, and the current target word highlighted. Reuses `RPGWordReader` in `mode="fast"` so no new mic stack is added.

**Edited:**
- `src/components/aura/game/castle/CastleSwarmArena.tsx`
  - On boss-wave spawn, pause the main loop (`hitStopUntilRef = Infinity` style gate, or a new `spellBreakActive` ref) and mount `<BossSpellBreak>`.
  - Pick 4 words from the current grade band's word pool, biased toward the wave's `phonemeOfWave` so the minigame doubles as targeted phonics practice.
  - On success: deal ~40% of boss max HP, freeze boss for 1.5s (visual stagger), award bonus coins, push a "CHANT BROKEN!" floating banner.
  - On failure: deal 2 HP to player castle (absorbed by Resolve shield if charged), brief screen shake, boss continues advancing.
  - Resume the loop after the overlay unmounts.

**No backend, no schema, no new mic code.**

## Word-selection rules
1. Start from the active wave's grade-band pool (already used by the arena).
2. Filter to 3–7 letter words for readability under time pressure.
3. Prefer 2 of the 4 to contain `phonemeOfWave.match` (so the hunt continues inside the minigame).
4. Shuffle deterministically using the existing daily seed when in Daily Challenge mode so leaderboards stay fair.

## UX details (kid-friendly)
- Boss sprite glows red and the screen edges pulse for ~700ms before the overlay appears — clear "something big is happening" tell.
- Each word card is large, high-contrast crimson-on-parchment, with a pulsing outline on the current target.
- Correctly read word: card flashes gold, shatters, next card becomes active.
- Timer ring goes from cyan → amber → red in the last second.
- On success: gold confetti burst (CSS, not a library) + boss "SHATTERED" text.
- On failure: red shockwave + boss laughs (existing audio hook).

## Verification
- Reach wave 5 (or 10) in Endless. Confirm overlay mounts, mic stays responsive, all 4 words can be read within 5s, success path damages boss, failure path damages castle.
- `tsc --noEmit` clean, no console errors, FPS stable on 640px iPad viewport.

## Out of scope
Hero classes (2B), castle skins/banners (2D), daily leaderboard backend, SFX additions beyond reusing existing hooks.
