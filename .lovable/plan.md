
# Castle Swarm — Polish + Truth Pass (Phase 2C.5)

Fix the 10 real bugs from the audit and close the credibility gap between the marketing claim ("literacy-driven, game-changing") and the actual code. No new phases (hero classes, leaderboard, skins remain out of scope).

## Goals
1. Every visible mechanic is honest: phonemes are actually phonemes, crits are actually rewards, shield HUD reflects shield state.
2. Spell-Break feels fair on a K-2 iPad and brutal-but-beatable for 6-12.
3. Add audio/visual polish that makes the loop *feel* game-changing without new systems.

## Files

**New:**
- `src/components/aura/game/castle/phonemeMatcher.ts`
  - `wordContainsPhoneme(word, phonemeKey): boolean` — uses existing `getIPAPronunciation` from `src/lib/cmuDictWrapper.ts` to check the actual IPA sequence, not a regex against spelling.
  - Map of phoneme keys → IPA tokens (e.g. `sh → "ʃ"`, `th → ["θ","ð"]`, `ch → "tʃ"`, `ing → ["ɪ","ŋ"]` as adjacent pair, `ow → ["aʊ","oʊ"]` both variants, etc.).
  - Falls back to spelling regex only when CMU lookup misses (unknown word).
- `src/components/aura/game/castle/sfx.ts`
  - Tiny Web Audio API wrapper: `playCrit()`, `playPhonemeHit()`, `playBossLaugh()`, `playChantBroken()`, `playShieldUp()`, `playKnightSummon()`.
  - Single shared `AudioContext`, lazy-init on first user gesture, all sounds synthesized (no asset files). Mute respects existing game mute flag if one exists; otherwise add a simple `sfxEnabled` ref.

**Edited:**
- `src/components/aura/game/castle/wordEconomy.ts`
  1. Replace `DIGRAPH` regex crit with a **rarity-tier** rule: crit only fires when the word contains the *wave's* phoneme OR a CVCe pattern OR ≥7 letters. Drops crit rate from ~60% to ~20%.
  2. Fix **Resolve retrigger**: only emit `"🛡 Resolve!"` and the +25 charge when `sightStreak + 1 === 3`; from streak 4+ continue to add a small +6 (no banner).
  3. Add **damage scaling**: accept optional `waveNumber` in `ScoreCtx`; multiply final `dmg` by `1 + Math.floor(waveNumber / 4) * 0.5` so per-word damage keeps pace with enemy HP curve.
  4. Replace phoneme regex checks with `wordContainsPhoneme(word, ctx.phonemeOfWave.key)` from the new matcher.
  5. Rotate phoneme via `(waveNumber * 7 + dailySeed) % len` instead of `wave % 12` so it isn't memorize-able run-to-run.

- `src/components/aura/game/castle/BossSpellBreak.tsx`
  1. Accept new prop `gradeBand: "K-2" | "3-5" | "6-12"`. Duration becomes `gradeBand === "K-2" ? 7000 : gradeBand === "3-5" ? 6000 : 5000`.
  2. Add **partial-success** result: `onResult(broken: boolean, wordsRead: number)` already exists — caller will reward partial reads (see arena edit).
  3. Add phoneme telegraph: when `phonemeOfWave` is supplied, render a small badge above the cards ("Hunt: /sh/") so kids know what to listen for.
  4. Add WebAudio cue on success (`playChantBroken()`) and failure (`playBossLaugh()`).

- `src/components/aura/game/castle/CastleSwarmArena.tsx`
  1. **HUD sync bug**: after castle damage in main loop, call `setShieldHud(shieldRef.current)` so the shield bar actually depletes on-screen.
  2. **Stale-closure fix**: change main loop `useEffect` deps from `[]` to `[knightStats, mode]`; guard the RAF with a `runningRef` so it isn't spawned twice on dep change.
  3. Pass `gradeBand` and `phonemeOfWave` to `<BossSpellBreak>`.
  4. **Partial-success rewards** in spell-break callback:
     - 0 read → full 12 dmg to castle (current behavior).
     - 1–2 read → 6 dmg + 10 coins.
     - 3 read → 2 dmg + 20 coins + 15% boss HP.
     - 4 read → existing full success (40% boss HP + stun + 25 coins + 20% super).
  5. Pass `waveNumber` to `scoreWord` so damage scales.
  6. Add **boss telegraph**: 700ms before mounting BossSpellBreak, flash a phoneme badge above the boss sprite (`"BOSS CHANT: /sh/"`) — fulfills the plan's promised tell.
  7. Wire `sfx.ts` calls at crit, phoneme hit, knight summon, shield ready.

## Out of scope
Hero class picker (2B), cosmetic banners/skins (2D), daily leaderboard backend, server-side validator, touch-target audit, adaptive ML hooks (`useQLearningUpdate`, `adaptiveStoryRanking`, `cognitiveLoadEstimator`) — these stay for a follow-up phase.

## Verification
- `tsc --noEmit` clean.
- Manual play: reach wave 5 in K-2 mode → spell-break shows 7s timer + "/sh/" badge; reading 2 of 4 words leaves boss alive but gives partial reward and only minor castle damage.
- Crit on a digraph-free word ("apple") no longer fires.
- Sight-word streak of 5 only banners once at the 3rd word.
- Shield bar visibly drains when struck by enemies after charging.
- Audio cues fire (verify Web Audio context resumes on first click).
- FPS stable on 640px iPad viewport (current user's screen).
