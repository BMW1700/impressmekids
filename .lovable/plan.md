# Castle Swarm Defense — Build Plan

A new top-level mode alongside Campaign and RPG Battle: a tower-defense / horde-survival hybrid where **reading is the primary weapon**. Enemies rush a castle in waves; reading words and short story passages fires powers, summons knights, and charges supers that can eventually break the enemy castle.

Shipped in **3 phases**. Phase 1 is a real, playable vertical slice in ~1 build cycle. Phases 2 and 3 only happen after Phase 1 proves the loop is fun.

---

## Strategic framing (the honest version)

- This is the most defensible product idea in the lineup. Nobody owns "action-arcade reading defense." Worth building.
- Distribution win comes from **shareable moments**, not from the mode existing. Wave-survived recap card with stats screenshot-ready is built in from day one.
- Reading must stay the *most powerful action* in the game. Summons and taps are secondary. Story-reading charges screen-clearing supers. If the kid can win by spamming buttons, the design has failed.
- Ship single-player Endless first. Parent-vs-kid PvP is Phase 3 — it's the marketing clip, but it's the hardest engineering and should not block launch.

---

## Phase 1 — Vertical slice (ship first)

Goal: prove the core loop is fun in 60 seconds of play.

**Game mode**
- New mode: **Castle Swarm Defense**, accessible from the AURA mode dashboard alongside RPG Battle
- Single map: classic castle on the right, enemies spawn from the left
- One enemy type to start: goblin runner (reuse `MiniGoblin.tsx`)
- 5 hand-tuned waves + start of Endless after Wave 5
- One playable hero (Sir Valor for K-5, Agent X for 6-12), respects existing grade_mode / theme

**Reading mechanics (the star)**
- **Word bar** at top: a queue of words from the active story flows by; reading one aloud (Web Speech, reusing existing recognizer) fires the hero's basic attack at the front enemy
- **Story passages**: every ~20 seconds a 1-2 sentence passage appears. Reading it cleanly charges the **Super Meter**. Full super = screen-clearing AoE.
- **Power words** (already in `VocabularyTracker`): reading one summons a Mini-Knight ally that walks right and engages enemies (reuse `MiniGoblin.tsx` style, recolor)

**Hero powers** (reuse from RPG)
- 3 powers mapped from existing spell list: fireball (line damage), ice (slow + damage), lightning (chain). Cooldown-based, no MP.

**Castle state**
- Castle HP bar. Enemy reaches castle → damage. HP zero → game over with stats recap.

**Shareable moment (distribution lever)**
- On wave clear AND on game over: **"Wave Survived" card** — final wave, words read, accuracy, knights summoned, longest streak. One-tap "Download / Share" button. PNG export via existing canvas patterns. This is non-negotiable for Phase 1.

**Persistence**
- Coins earned feed existing `player_inventory` (grade_mode scoped)
- High score per character in a new `castle_swarm_runs` table

---

## Phase 2 — Depth (after Phase 1 validates)

- 4 more enemy types: skeleton, orc brute (tank), bat (flying, ignores knights), goblin shaman (heals others)
- Wave variety: boss waves every 5, mixed-comp waves
- Enemy castle on the left side. Player knights advance and chip its HP; destroying it ends the run with a big bonus (the "win" condition for the leveled campaign track)
- **Leveled Campaign track**: 20 fixed levels, each its own map + enemy mix + final enemy castle. Three-star rating per level. Unlocks new powers and skins.
- **Endless mode** unlocked after campaign Level 5. Global leaderboard scoped by grade_mode.
- Knight upgrades purchasable with coins (HP, damage, summon cap)
- Daily challenge wave with fixed seed → fair leaderboard

---

## Phase 3 — Multiplayer (the viral hook)

- **Parent-vs-Kid PvP**: parent controls enemy spawns and special abilities, kid defends. Reuse `RPGOnlinePvPBattle` realtime sync infrastructure.
- **Co-op**: two heroes, one castle. Reuse `RPGOnlineCoopBattle` patterns.
- Spectator-friendly camera + an auto-generated highlight clip at end of match (the actual social-media asset).

---

## Technical details

**New files (Phase 1)**
- `src/components/aura/game/castle/CastleSwarmArena.tsx` — main game loop, the new file equivalent to `RPGBattleArena.tsx` but scoped
- `src/components/aura/game/castle/CastleHero.tsx` — hero sprite at right edge of castle, reuses `RPGCharacter` with `skinVariant`
- `src/components/aura/game/castle/SwarmEnemy.tsx` — enemy unit with HP, speed, lane position; wraps `MiniGoblin`
- `src/components/aura/game/castle/MiniKnight.tsx` — friendly summon
- `src/components/aura/game/castle/WordRiver.tsx` — scrolling word queue at top
- `src/components/aura/game/castle/StoryPassagePrompt.tsx` — periodic 1-2 sentence prompt that charges super
- `src/components/aura/game/castle/CastleHUD.tsx` — castle HP, super meter, power cooldowns, wave counter
- `src/components/aura/game/castle/WaveDirector.ts` — pure module that emits spawn events for a given wave/time
- `src/components/aura/game/castle/WaveSurvivedCard.tsx` — shareable recap PNG
- `src/pages/game/CastleSwarmDefense.tsx` — route entry
- `src/hooks/useCastleSwarmRun.ts` — run state, score, persistence

**Existing pieces reused**
- Speech recognition: `speechRecognitionManager`, word match rules already used by `RPGWordReader`
- Powers: spells from `RPGSpellMenu` and effects in `RPGSpellEffects`
- Currency: `gameEconomy.ts`, `usePlayerInventory` (grade_mode scoped per existing memory)
- Theming: `useGameTheme` (classic vs agent), grade_mode split logic
- Vocabulary: `VocabularyTracker` power-word detection

**Routing**
- New route `/game/castle-swarm` gated by existing auth/profile flow
- Mode select tile on the AURA dashboard (where RPG Battle lives today)

**Data model (Phase 1 migration)**
- `castle_swarm_runs`: `user_id`, `grade_mode`, `character_id`, `wave_reached`, `words_read`, `accuracy`, `knights_summoned`, `enemy_castle_hp_dealt`, `coins_earned`, `ended_reason` (win/loss/quit), `created_at`
- RLS: user can select/insert their own rows; teacher/parent visibility follows existing AURA consent pattern in memory
- Per-user high-score view computed in SQL, not duplicated

**Tick loop**
- 30fps `requestAnimationFrame` loop in `CastleSwarmArena`; `useRef` for all volatile counters (enemy positions, HP, cooldowns) per existing ref-based counter memory. Only commit to React state at wave boundaries and for HUD-visible values throttled at ~10hz.

**Anti-cheese rules**
- Tap-only damage capped at ~15% of total damage budget for any wave; the other 85% must come from reading. If kid stops reading, run dies. Enforced in `WaveDirector` damage budget.

---

## What's out of scope for Phase 1

- Enemy castle, advancing knights
- Skins / cosmetics specific to this mode (uses existing default hero skins)
- Leveled campaign — Endless starts after a 5-wave tutorial arc
- Leaderboards
- Multiplayer
- New enemy types beyond the goblin
- New pets integration (pets ignored in Phase 1 to keep scope)

These come back in Phase 2 / 3.

---

## Decision point before I start building

1. **Approve the 3-phase split**, or do you want me to attempt more in Phase 1?
2. **Start with classic theme (K-5) only**, or build both classic + agent variants from the jump?
3. **Endless-first vs leveled-first**: I recommend the 5-wave tutorial then Endless for Phase 1. OK?

Once you confirm, I'll start on Phase 1 — the migration + the new arena component + the shareable recap card.
