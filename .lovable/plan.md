# Castle Swarm Defense — Phase 2

Phase 2 has two parts: **(A) fix the 4 Phase 1 bugs** so the base is solid, then **(B) add the Phase 2 gameplay layer** that turns this from a tech demo into a real mode kids will replay.

No other modes will be touched. All work stays inside `src/components/aura/game/castle/`, `src/pages/game/CastleSwarmDefense.tsx`, and one new migration.

---

## Part A — Phase 1 hardening (do first, ~30% of the work)

1. **Stop the game-loop thrash.** Move `castleHp` from React state to a `castleHpRef`. The HUD bar reads from a throttled mirror state updated at ~10 Hz inside the loop. Remove `castleHp` from the loop's `useEffect` deps. Result: a single stable `requestAnimationFrame` from mount → run end.
2. **Kill the stale-closure speech bug.** Mirror `activeWord`, `activePassage`, and the handler logic through refs (per the project's `stale-closure-ref-pattern` memory). The `speechManager.start()` callback reads refs, never closed-over state.
3. **Make wave transitions atomic.** Move wave state to a ref too (`waveRef`), gate the wave-clear check with a `waveTransitioningRef` flag, and only commit `wave` to React state via a throttled HUD setter so the loop never restarts on a wave change.
4. **Replace the SVG-foreignObject PNG export with `html-to-image`** (~10 KB, no canvas-tainting). Already a common dep pattern. Fallback chain: download PNG → Web Share API with the blob → copy text. This is the distribution lever, it has to look good.

---

## Part B — Phase 2 gameplay

### 1. New enemy types (4 more, scaled into the WaveDirector)

| Enemy | Behavior | Visual |
|---|---|---|
| Skeleton | Standard speed, 2 HP, ignores ice slow | Recolored `MiniGoblin` (bone-white + dark eye sockets) |
| Orc Brute | Slow, 6 HP, deals 25 castle damage (vs 10) | Larger MiniGoblin variant, red tint, taller scale |
| Bat | Flying — walks past mini-knights (only hero powers + reading hit it), 1 HP, fast | New tiny SVG sprite, hovering offset |
| Goblin Shaman | Slow, 3 HP, heals 1 HP/sec to nearest non-Shaman enemy | Recolored MiniGoblin, purple cloth, glow on heal |

`WaveDirector.planWave()` returns a `composition: EnemyType[]` array; arena picks from it round-robin per spawn. Boss waves (every 5) spawn 1 Orc Brute alongside the normal mix.

### 2. Enemy castle + advancing knights (win condition)

- Add an enemy castle on the left edge, HP scaled per wave.
- Knights now advance all the way to the enemy castle when no enemy is in range; they deal 1 dmg/sec to the enemy castle while alive there.
- When enemy castle HP reaches 0 → run ends with `'win'`, big coin bonus.
- Surfaces a real win state in the recap card.

### 3. Leveled Campaign track (the 20-level structure)

- New `campaignLevels.ts` defining 20 hand-tuned levels per grade mode (so 40 total). Each level has: name, wave count (5–15), enemy composition override, recommended hero powers, enemy castle HP, 3-star thresholds (survival / accuracy / words-read).
- New screen `CastleCampaignSelect.tsx` — grid of unlocked levels with star ratings, lock icon for not-yet-unlocked.
- Endless mode tile sits next to the campaign; unlocked after campaign level 5.
- Migration: new table `castle_swarm_campaign_progress` (user_id, grade_mode, level_id, stars, best_wave, best_accuracy, completed_at) with RLS user-owns-rows.

### 4. Daily Challenge

- One shared seed per UTC day → identical wave composition for every player.
- Surfaces a "Today's Challenge" tile on the castle dashboard with the player's previous best score.
- Reuses `castle_swarm_runs` table with a new `challenge_seed` text column (nullable).

### 5. Knight upgrades store (uses existing coin economy)

- Three upgrade tracks (HP, damage, summon cap), 5 levels each, exponential cost curve.
- Stored as a small `castle_upgrades` table (user_id, grade_mode, hp_level, dmg_level, cap_level).
- New `CastleUpgradesPanel.tsx` shown from the campaign select screen.
- Reads `player_inventory` coins (grade_mode scoped per existing memory) — no new currency invented.

### 6. UX polish

- **Pause button** (the missing one from Phase 1).
- **Combo meter** in the HUD that visualises the existing `streak` ref so kids feel the streak.
- **Wave-clear interstitial** with 3-second "+coins / +super" rollup before the next wave starts.
- **Pre-game settings sheet**: choose between Campaign Level X, Endless, or Today's Challenge.

---

## Technical details

**New files**
- `src/components/aura/game/castle/enemyTypes.ts` — type definitions, visual data, behavior flags
- `src/components/aura/game/castle/SwarmEnemy.tsx` — replaces inline MiniGoblin render; handles all 5 types
- `src/components/aura/game/castle/EnemyCastle.tsx` — left-side enemy castle with HP bar
- `src/components/aura/game/castle/campaignLevels.ts` — 40 level definitions
- `src/components/aura/game/castle/CastleCampaignSelect.tsx` — level grid
- `src/components/aura/game/castle/CastleUpgradesPanel.tsx` — coin spend UI
- `src/components/aura/game/castle/WaveInterstitial.tsx` — between-wave rollup
- `src/hooks/useCastleCampaign.ts` — campaign progress query/mutate
- `src/hooks/useCastleUpgrades.ts` — upgrades query/mutate

**Modified files (castle folder only, except dashboard tile)**
- `WaveDirector.ts` — adds composition, daily seed RNG, campaign-level mode
- `CastleSwarmArena.tsx` — refactor for ref-based loop, wire to enemy types, enemy castle, upgrades, pause, interstitial
- `WaveSurvivedCard.tsx` — html-to-image export, star result
- `CastleSwarmDefense.tsx` — gains routing between campaign-select / arena
- `GameDashboard.tsx` — single-line edit: badge text "NEW! 20 levels + Endless + Daily Challenge"

**New migration**
- `castle_swarm_campaign_progress` table (per-user, per-level stars + bests, RLS user-owned)
- `castle_upgrades` table (per-user, per-grade-mode upgrade levels, RLS user-owned)
- `castle_swarm_runs`: add nullable `challenge_seed TEXT` column

**Dependency add**
- `html-to-image` (~12 KB) for the share card. Already-vetted, no canvas tainting issues.

**What stays out of Phase 2 (saved for Phase 3)**
- Global leaderboards
- Parent-vs-Kid PvP
- Co-op
- Highlight-clip auto-recording

---

## Decision points before I build

1. **Do A first, then B in the same turn?** I recommend yes — fixing the 4 Phase 1 bugs unblocks every Phase 2 feature anyway. If you'd rather just see new content now, I can skip the hardening but the new features will inherit the loop-thrash bug.
2. **Adding `html-to-image` as a dep — OK?** Tiny, MIT licensed, used by thousands of projects.
3. **20 campaign levels per grade mode — OK?** I can ship 10 each if you want to validate the loop with less content first.

Say the word and I'll start with the hardening, then layer Phase 2 features on top.
