## Castle Swarm — Realistic Damage FX + Enemies That Hold The Line

Two fixes. Zero changes to reading, speech, word logic, damage formulas, spawning, progression, DB, or routes.

### 1. Reposition + upgrade castle damage FX (`CastleAnchor.tsx`)

**Problem:** the cracks/smoke render in the lower band of the anchor (`top-8 inset-x-0 bottom-0`), which lands on the grass/path in front of the painted castle — looks like marks on the ground, not damage on the wall.

**Fix — positioning:** move the overlay box up onto the actual painted battlements. Anchor box itself moves from `bottom-[8%]` to `bottom-[18%]` and gets taller (`clamp(180px, 28vw, 280px)`). Damage layer becomes `inset-x-[8%] top-[18%] bottom-[42%]` so it covers the stone tower/wall area, not the ground.

**Fix — realism upgrade:**
- **Cracks:** replace the flat-stroke SVG paths with a multi-branch fractal crack network (3–6 jagged main fissures with hair-line offshoots), drawn with two stacked strokes — a dark `#0a0a0a` core plus an inner `#3a2a1a` highlight 0.3px offset — to fake depth. `mix-blend-multiply` stays. Crack density and length scale with tier.
- **Scorch / soot:** add a radial dark wash around impact points (3 per side at light, 6 at heavy, 9 at critical) using `radial-gradient` divs with `mix-blend-multiply`, blurred 4–8px. Reads as charred stone.
- **Battlement chunks missing:** at heavy+, a small SVG silhouette layer punches "bites" out of the top crenellation line (clip-path notches matching the painted castle's silhouette per side).
- **Smoke:** keep CSS `castle-smoke` keyframes but switch to a softer dual-layer puff (inner `slate-900/40` + outer `slate-700/25` blurred) and slow to 4.5–6s for a heavier, drifting feel. 1 puff light / 2 heavy / 4 critical, staggered.
- **Embers (critical only):** 3–4 tiny `#ffb84a` dots with a slow upward float keyframe (`castle-ember`, new in `index.css`) and 0.6 opacity flicker. Adds the "still burning" feel without going arcade.
- **Heat shimmer (critical only):** a single thin `backdrop-filter: blur(1px)` band over the gate area animated with a subtle Y-translate to suggest rising heat.
- **Warning glow:** keep the red radial pulse but soften (lower opacity 0.35, slower 2.4s pulse) so it reads as fire-lit stone rather than a neon ring.
- **Side-aware mirroring:** crack pattern and chunk notches use a `transform: scaleX(-1)` on the right (player) side so damage doesn't look identical on both castles.

All overlays remain `pointer-events-none`, GPU-only (opacity / transform / filter), and tier-gated so a healthy castle renders zero overlay nodes. No new images, no JS animation loops.

### 2. Enemies hold the gate until killed (`CastleSwarmArena.tsx`)

Today: enemy reaches gate → 1 hit → auto-dies after 1.2s. From the prior message: "they should keep attacking when they get to the castle and only die once killed by a hero or by the user's spoken words."

Change:
- Rename `Enemy.attackingUntil` → `nextAttackAt` (same field shape).
- On arrival at `ENEMY_ATTACK_X`: clamp `x`, set `attacking = true`, deal first hit immediately (existing shield→HP formula unchanged), set `nextAttackAt = now + 1200`.
- Each tick while `attacking`: if `now >= nextAttackAt`, deal the same hit again and `nextAttackAt += 1200`. Screen shake on each hit. Enemy never auto-dies.
- Enemy dies only via the existing `hp <= 0` paths: hero projectiles, knight melee, spoken-word damage, fireball/ice/lightning powers. Cleanup filter `!(e.dying && e.hp <= 0)` already handles this.
- `SwarmEnemy`'s `attacking` swing animation already loops; no change there.

### Files touched
- `src/components/aura/game/castle/CastleAnchor.tsx` — reposition overlay onto the wall, rebuild crack/scorch/chunk/smoke/ember FX.
- `src/index.css` — add `castle-ember` keyframe; tune `castle-smoke` timing.
- `src/components/aura/game/castle/CastleSwarmArena.tsx` — swap auto-despawn for repeating gate attacks.

### Untouched
`phonemeMatcher`, `wordEconomy`, `storyRunner`, `WaveDirector`, `enemyTypes`, hero engine, knight logic, boss spell-break, `RPGWordReader`, speech recognition, DB writes, routes, HUD currencies, background image.
