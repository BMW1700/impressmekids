## Castle Swarm Defense — Major Overhaul

Brutal honesty: the current build feels flat. Empty black field, tiny emoji castles, recycled `MiniGoblin` tinted with CSS filters, a one-shot continuous mic that often mis-hears "the", enemy HP that barely grows, and the same orange/amber gradient as RPG mode so users can't visually tell them apart. This plan fixes all of it.

### 1. New visual identity (no more RPG twin)
- **Theme color**: shift Castle from amber/rose to a **deep crimson + steel** identity (`from-rose-700 via-red-800 to-slate-900`, accent `gold-400`). RPG keeps amber/orange.
- Update entry card in `AuraPractice.tsx` + `StoryLibrary.tsx` + `GameDashboard.tsx` to the new crimson/steel gradient with a chainmail-textured icon tile instead of plain 🏰 emoji.
- Arena background: layered parallax — stormy sky gradient, distant mountain silhouettes (SVG), midground torch-lit battlements, foreground stone ground with subtle perspective lines. Replaces today's flat `from-slate-950` field.

### 2. Grander castles (2.5D, not emoji)
- Replace 🏯/🏰 emoji in `EnemyCastle.tsx` and the player castle slot with new **SVG castle components** (`PlayerCastle.tsx`, `EnemyKeep.tsx`):
  - Multi-tier stone keep, crenellations, flapping banner, animated torch flames (CSS keyframes), drawbridge.
  - Scale ~3× current size, anchored to ground plane with a soft shadow.
  - Damage states: cracks appear at 66%/33% HP, smoke wisps when below 25%.
- Player castle gets blue banner (classic) / cyan circuit banner (agent K-12 theme).

### 3. Better character models (still cheap, no 3D engine)
- New `SwarmEnemySprite.tsx` with **dedicated SVG per enemy** (no more `MiniGoblin` + hue filter):
  - Goblin: green hunched grunt with club
  - Skeleton: bone warrior with rusty sword
  - Orc (boss): hulking brute, 1.8× scale, glowing red eyes
  - Bat: animated wing flap loop, sine-wave vertical bob
  - Shaman: hooded figure with glowing orb, pulse halo when healing
- Subtle walk-cycle (2-frame body bob + foot offset via CSS).
- Optional "somewhat 3D" feel via CSS `transform: perspective(600px) rotateX(8deg)` on the battlefield ground + slight scale-with-depth as enemies advance (no Three.js — keeps perf and $0 cost intact).

### 4. Mic parity with RPG mini-games (the big functional fix)
- **Current**: arena uses raw `speechManager` continuous mode → laggy, mis-hears short words like "the", no auto-advance, no echo retry.
- **New**: replace with the same `RPGWordReader` component (`mode="fast"`, `enableEchoRetry`, `compact`) used by `RPGOneWordReader`. This brings:
  - Fast auto-advance after each word
  - Built-in echo retry and homophone tolerance
  - Visual mic state matching RPG mini-games
  - Larger, easier-to-hit short-word tolerance
- Refactor `CastleSwarmArena` word loop to feed a sliding `wordList` window to `RPGWordReader` and consume its `onResult(correct, spoken, idx)` for the attack-front-enemy action. Passage/super-charge mode stays on a separate `speechManager` tap only when a long passage is shown.
- Remove the bottom "READ ALOUD TO ATTACK / the / Talk" custom UI — `RPGWordReader` replaces it.

### 5. Proper enemy HP scaling (the difficulty fix)
Today: `hpBonus = Math.floor(n/3)` in campaign and capped at 8 in endless — orcs barely outlast goblins.
New scaling in `WaveDirector.ts` + campaign branch:
- **Endless**: `hpBonus = Math.floor(overflow * 0.8)` (no cap until wave 20, then soft cap 20).
- **Per-enemy multiplier**: `finalHp = (baseHp + hpBonus) * (1 + wave * 0.12)` rounded.
- **Boss wave**: orc HP = `baseHp * 4 + wave * 2` and gains a damage-resist halo for first 2 hits.
- **Composition**: introduce a 4th tier "Armored Orc" at wave 10+ (skeleton-style ignore-slow + 2× HP).
- Visible HP bar gets a number label so kids see the wall climbing.

### 6. Juice & polish
- Hit flash + tiny knockback on enemy when word is read correctly
- Screen-shake on castle damage (reuse `useScreenShake`)
- Coin burst sprite on wave clear (reuse `RPGCoinDrop` pattern)
- Boss intro: 1.2s zoom + name banner ("⚔️ ORC WARLORD")
- Power buttons (fireball/ice/lightning) get cooldown radial sweep and a satisfying particle pop
- Pause sheet (already exists) gets a Mic Sensitivity slider that pipes into `RPGWordReader`

### 7. Files (frontend only — no DB, no other modes touched)
**Edit**
- `src/components/aura/game/castle/CastleSwarmArena.tsx` — swap mic, theme colors, integrate new sprites/castles, HP scaling, juice
- `src/components/aura/game/castle/WaveDirector.ts` — new HP formula + Armored Orc tier
- `src/components/aura/game/castle/SwarmEnemy.tsx` — delegate to new sprite component
- `src/components/aura/game/castle/EnemyCastle.tsx` — replace emoji with SVG keep
- `src/components/aura/game/castle/CastleCampaignSelect.tsx` — crimson/steel theme
- `src/components/aura/game/castle/enemyTypes.ts` — add `armored_orc`, retune baseHp
- `src/pages/student/AuraPractice.tsx`, `src/components/aura/StoryLibrary.tsx`, `src/pages/game/GameDashboard.tsx` — recolor castle entry cards to crimson/steel

**Create**
- `src/components/aura/game/castle/sprites/SwarmEnemySprite.tsx` (dedicated SVGs)
- `src/components/aura/game/castle/sprites/PlayerCastle.tsx`
- `src/components/aura/game/castle/sprites/EnemyKeep.tsx`
- `src/components/aura/game/castle/ArenaBackground.tsx` (parallax sky/mountains/battlements)

**Untouched (verified)**: RPG mode, AURA reading, LexiQuest, all other features. Zero schema changes.

### 8. Verification
1. Open `/student/aura` → entry card is crimson/steel, visually distinct from RPG card
2. Click Enter Castle → campaign select uses crimson theme, RPG select still orange
3. Start any level → new SVG castles on both sides, parallax background, new enemy sprites with walk cycles
4. Mic feels identical to RPG mini-game (fast auto-advance, echo retry, no laggy "the" mis-hears)
5. By wave 5, enemies clearly tankier (HP bar shows growing numbers); boss orc takes ~5 correct words to kill
6. RPG mode opened separately — unchanged
7. Console clean, no other-mode regressions

### What's NOT in scope
- True 3D / WebGL (rejected — kills perf and $0 cost rule). The CSS perspective tilt gives a 2.5D feel cheaply.
- New backend tables (Phase 2 already wrote `castle_swarm_runs`, `castle_swarm_campaign_progress`, knight upgrades).
- Multiplayer Castle Siege (still deferred).
