# Castle Swarm — Premium Castle Presentation Pass

Pure visual + positioning polish. **Zero changes** to reading flow, speech recognition, word/sentence logic, damage formulas, enemy spawning, progression, DB, routes, or hooks.

## 1. Background question

You attached `Transparent Character Cutout copy.mp4` — that filename reads like a character cutout, not a battlefield background. I'll **leave the current painted background in place** (the enchanted scene we just installed already has the dark keep on the LEFT and blue castle on the RIGHT, which is what this pass aligns to). If you actually wanted that MP4 used somewhere, tell me where after the plan and I'll handle it as a follow-up.

## 2. Hide the gray placeholder castles

`src/components/aura/game/castle/CastleSwarmArena.tsx`

- Stop rendering `<PlayerCastle />` and `<EnemyCastle />` as visible sprites. The painted castles in the background image become the visual castles.
- Replace them with **invisible anchor zones** at the same screen positions so the existing HP HUD and enemy stop-positions have something to attach to. No gameplay coords change — anchors mirror the current `right-2 bottom-2` / `left-2 bottom-2` rectangles.

## 3. New `CastleAnchor` component

New file: `src/components/aura/game/castle/CastleAnchor.tsx`

A side-aware overlay that sits on top of the painted castle in the background and renders:

- **HP bar + label** (rose for enemy keep, sky/gold for player) positioned just above the painted battlements — readable but not covering art.
- **Damage-state overlay layer** driven by HP percentage:
  - `healthy` (100–70%): no overlay
  - `light` (69–40%): faint crack SVG overlay + one slow rising smoke puff, ~6% dim
  - `heavy` (39–15%): denser cracks + two smoke puffs + amber flicker glow at the gate
  - `critical` (14–0%): heavy cracks + rubble silhouette at base + stronger smoke + red warning pulse on the HP bar
- All overlays are absolutely positioned inside the anchor, `pointer-events-none`, GPU-only transforms (opacity + translate), CSS keyframes — no per-frame React state. Cheap on mobile.

The crack and rubble overlays are inline SVGs (no new binary assets) tinted dark with `mix-blend-multiply` so they read on both castles.

## 4. Castle attack zones (visual stop-point only)

`CastleSwarmArena.tsx`, enemy movement block (lines ~616–632)

- Add two constants: `ENEMY_ATTACK_X = 70` (was 0) and `KNIGHT_ATTACK_X = ARENA_WIDTH - 70` (already used at line 644).
- When `e.x <= ENEMY_ATTACK_X`, instead of immediately setting `e.dying = true`:
  - Clamp `e.x = ENEMY_ATTACK_X` so the sprite stops at the gate (no longer marches off-screen).
  - Apply the **same one-shot castle damage** that already exists today (formula unchanged).
  - Set `e.attackingUntil = now + 1200` and flip a new `e.attacking = true` flag.
  - After `attackingUntil` elapses, set `e.dying = true` exactly as before (cleanup path untouched).
- `SwarmEnemy` gets one new optional prop `attacking?: boolean` — when true it plays a tiny CSS slash/lunge loop (transform-only, ~600ms) and faces the castle. Pure cosmetic.

**Damage totals per enemy are identical to today.** The change is purely how long the sprite lingers and what animation it plays during that linger. Calling this out explicitly because the brief says "don't alter damage formulas" but also "keep dealing damage while attacking" — the solution is: same damage, just visible while it lands.

Knights attacking the enemy keep already stop at `ARENA_WIDTH - 60` (line 644) and tick damage there — they just need the same `attacking` cosmetic flag passed to the knight SVG for a swing loop.

## 5. HP HUD relocation

- Remove the top-bar player castle HP bar duplicate (line ~846–854) **only if** you want a single source of truth. Safer default: **keep the top HUD** (mobile-friendly) and ALSO show the floating label above the castle. I'll keep both — the floating one is the "diegetic" castle label, the top HUD is the always-visible status.
- Enemy keep HP currently has no top-bar entry; it'll live entirely on the `CastleAnchor` floating label, same as today's `EnemyKeep` sprite label.

## 6. Responsiveness

- Anchor uses percentage-based positioning inside the `absolute inset-x-0 top-10 bottom-32` battlefield container (the existing wrapper at line 891) — `left: 4%` / `right: 4%`, width `clamp(120px, 18vw, 200px)`, bottom `8%`. Scales cleanly desktop → iPad → phone.
- HP label uses `text-[11px] sm:text-xs`, bar width `clamp(80px, 14vw, 140px)`.

## 7. Files touched

- `src/components/aura/game/castle/CastleAnchor.tsx` *(new — HP label + damage overlays, side-aware)*
- `src/components/aura/game/castle/CastleSwarmArena.tsx` *(swap PlayerCastle/EnemyCastle render for CastleAnchor; add ENEMY_ATTACK_X + `attacking`/`attackingUntil` lifecycle; pass `attacking` prop to SwarmEnemy)*
- `src/components/aura/game/castle/SwarmEnemy.tsx` *(accept optional `attacking` prop, run a transform-only swing keyframe when true)*
- `src/components/aura/game/castle/EnemyCastle.tsx` and `sprites/PlayerCastle.tsx`, `sprites/EnemyKeep.tsx` — **left in place, no longer imported by the arena**. Safer than deleting in case other screens reference them.

## 8. Untouched (confirmed)

`phonemeMatcher.ts`, `wordEconomy.ts`, `storyRunner.ts`, `WaveDirector.ts`, `campaignLevels.ts`, `enemyTypes.ts`, all hooks (`useCastleCampaign`, `useCastleUpgrades`, `useCastleHeroes`, etc.), `RPGWordReader`, speech recognition, DB writes (`enemy_castle_hp_dealt` etc.), routes, top-HUD currencies, hero summoning, boss spell-break, wave interstitials.

## 9. Performance

- All new visuals are SVG/CSS — no new image downloads, no canvas, no JS animation loops.
- Damage-state thresholds computed once per render from `hp/maxHp`; no extra state churn.
- New enemy `attacking` flag adds one boolean per enemy; no new arrays, no extra render passes.

## What I'll confirm after build

- Painted castles read as the real castles; no gray blocks visible.
- HP bars sit cleanly above each castle and change color/intensity with damage tier.
- Goblins stop at the gate, swing, then despawn — no more passing through the wall.
- Reading panel, speech, word buttons, currencies, wave logic, and DB writes all behave identically.
