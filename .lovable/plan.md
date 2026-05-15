## Goal

Rebuild `RPGShowcase` so it instantly conveys what NabuLearn is: a kid reads words → words turn green → hero launches a power → enemy is hit → enemy retaliates. Loop. No description needed.

## What's wrong today

- Custom inline SVG knight/goblin look amateur next to the real roster.
- No words, no reading mechanic — the visual doesn't communicate "literacy."
- Single-direction loop feels static.

## New design

Three layered scene inside one self-contained component:

```text
┌─────────────────────────────────────────────────────────┐
│  HERO HP ████████░░          ██░░░░░░░░░░░  ENEMY HP    │
│                                                          │
│   [SirValor]    "the"  "brave"  "knight"   [Goblin]      │
│    idle/atk      ░      ✓         ✓         idle/hit     │
│                                                          │
│              ──── fireball ───►                          │
│              ◄──── ice blast ───                         │
│                                                          │
│        ✦ Read to attack · Powered by AURA ✦              │
└─────────────────────────────────────────────────────────┘
```

### Cast (real roster)
- Hero: `SirValor` (default skin) — iconic knight from `characters/SirValor.tsx`
- Enemy: rotates each loop between `GoblinGuard`, `ShadowWraith`, `DrakeTheDragon`, `IceGolem` to feel alive
- All accept `state: 'idle' | 'attacking' | 'hit' | 'victory' | 'defeated'` and `flipX`

### Battle loop (state machine, ~8s/cycle)

1. **Reading phase (2.4s)** — 3 words appear sequentially in the center band, each highlighting yellow then snapping to green with a soft check pulse. Uses themed phrases per enemy ("blast the goblin", "freeze the wraith", "tame the dragon").
2. **Hero windup (0.3s)** — SirValor → `attacking`, slight forward lunge, glow charges around sword.
3. **Hero attack (1.0s)** — `RPGParentAttackVFX` fires `fireball` left→right (existing `direction` + `contained` props).
4. **Enemy hit (0.6s)** — enemy → `hit`, screen shake (transform on inner wrapper), HP bar drops with `framer-motion` width tween, floating "-12" damage number.
5. **Enemy retaliation windup (0.3s)** + **attack (1.0s)** — enemy → `attacking`, fires `ice_blast` right→left.
6. **Hero hit (0.6s)** — SirValor → `hit`, hero HP bar drops, damage number.
7. **Reset (0.4s)** — HP bars regenerate smoothly back to full, words clear, next enemy rotates in via fade+slide. Loop.

Phase machine lives in `useReducer`; `IntersectionObserver` pauses when off-screen; `useReducedMotion` short-circuits to a single static frame (hero + enemy + one frozen fireball + one green word) — no motion at all.

### Word reading sub-component

New small inline piece `ReadingTicker` inside the same file:
- Renders 3 word slots, big rounded chips on a translucent dark band.
- Each word transitions: `unread (white/40)` → `active (yellow ring + scale 1.05)` → `read (emerald-400 + checkmark)`.
- Timing synced to phase 1 (~750ms per word).

### HP bars

- Slim 6px bars top-left (hero) and top-right (enemy), color-coded.
- `motion.div` width animated; brief red flash + shake on damage.
- Numbers hidden — purely visual, no clutter.

### Caption

Single subtle line under the arena: **"Read words → launch powers"** (small, muted, kerned). Removed in `compact` variant.

### Variants

- `variant="hero"` — full 420px stage, all features, caption visible.
- `variant="compact"` — 220px, smaller sprites, no caption, words shown as 2 chips instead of 3, same loop.

### Performance

- Reuses already-bundled character SVGs (zero new asset weight).
- One `RPGParentAttackVFX` instance, one phase timer.
- Paused via `IntersectionObserver` (already in current showcase).
- No WebGL, no R3F, no new deps.

## Files

**Edit**
- `src/components/landing/RPGShowcase.tsx` — full rewrite. Drop the inline `KnightSprite`/`GoblinSprite`. Import real characters. Add `ReadingTicker`, HP bars, enemy rotation, expanded phase machine.

**No changes needed**
- `RPGParentAttackVFX.tsx` — already supports `direction` + `contained`.
- `PremiumHero.tsx`, `ModeSelect.tsx`, `GameDashboard.tsx` — already mount `<RPGShowcase variant="..." />`; the rewrite is drop-in.

## Out of scope

- No new character art, no 3D, no audio, no game logic changes.
- No edits to the actual battle screens — this is landing/dashboard eye-candy only.
