

## Brutally Honest Audit: 4 New Features

### What's Actually Working

1. **Battle Mode Selector** — PvP and Co-op cards are properly added and wired. Routing in `RPGBattleArena.tsx` correctly redirects to dedicated components. This is solid.

2. **Word Ninja Minigame** — Physics engine, speech recognition, slice detection, bomb hazards, combo system, timer — all implemented and wired into the battle phase rotation. This looks functional.

3. **Parent Controls** — 6 ability cards with cooldowns, damage types, and minigame triggers. Clean UI. Works.

4. **PvP Battle** — Turn-based flow, setup screen with name inputs, HP bars, kid reads words, parent picks abilities, mini-games trigger correctly. Functional.

5. **Co-op Battle** — Dual heroes, turn switching, enemy attacks, setup screen. Functional.

---

### What's Broken or Missing

#### BUG 1: Victory Arena is NOT wired in anywhere
`RPGVictoryArena.tsx` exists as a component but is **never imported or rendered** outside its own file. It's dead code. Nobody will ever see it. It needs to be triggered after world-completion victories — but that hookup was never done.

#### BUG 2: PvP stale closure on `kidCorrectWords`
Line 124 of `RPGPvPBattle.tsx`: `if ((kidCorrectWords + 1) % 5 === 0)` — this reads `kidCorrectWords` from the closure, but `setKidCorrectWords` is async. The turn-switch logic will fire at the wrong time (off by one or skipped entirely). Same class of bug we just fixed in Fireball Defense.

#### BUG 3: PvP stale closure on `kidStreak`
Line 115: `const streakBonus = Math.min(kidStreak, 5) * 2` — reads stale `kidStreak` from callback closure. First correct word always gets 0 streak bonus regardless of actual streak.

#### BUG 4: Co-op stale closure on `currentStreak`
Line ~108 in `RPGCoopBattle.tsx`: `const damage = 8 + Math.min(currentStreak, 5) * 2` — same stale closure issue. Streak bonus is always one word behind.

#### BUG 5: Co-op stale closure on player HP for turn switching
Lines 120-123: `const nextHp = nextPlayer === 1 ? player1Hp : player2Hp` reads from the closure, not current state. If a player just took damage, the stale HP might still show them alive when they're dead.

#### BUG 6: Parent "requiresReading" abilities don't actually require reading
The `requiresReading` flag is displayed as a badge on the ability card, but there's no code that makes the parent actually read a word. Fireball and Lightning Strike say "Read a word for bonus damage" but just deal flat damage when clicked. It's cosmetic-only.

#### ISSUE 7: Victory Arena has no connection to game flow
Even after wiring it in, there's no existing "world completion" detection that would trigger it. We need to identify where world victories happen and add the arena as an optional reward step.

---

### Fix Plan

| Fix | File | Change |
|---|---|---|
| Wire Victory Arena into post-battle flow | `RPGBattleArena.tsx` | Import and render `RPGVictoryArena` after world-completion victories |
| Fix PvP stale closures | `RPGPvPBattle.tsx` | Use refs for `kidCorrectWords` and `kidStreak` |
| Fix Co-op stale closures | `RPGCoopBattle.tsx` | Use refs for `currentStreak`, `player1Hp`, `player2Hp` |
| Make parent reading abilities functional | `RPGPvPBattle.tsx` | Add a "parent reads word" phase before dealing bonus damage |
| Wire Victory Arena trigger | `RPGBattleArena.tsx` | Detect world-final enemy defeat, show arena before `onComplete` |

All fixes are surgical — refs to eliminate stale closures (same pattern we used for Fireball Defense), plus routing logic for the Victory Arena.

