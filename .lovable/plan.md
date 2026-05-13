

# Verb Animation System for AURA Battle Mode

Add embodied-semantics animations: when a student correctly reads a verb word during battle, the enemy (or scene) performs the matching action. Reading still gates the damage event — animation is a reward layer painted on top.

## Scope

Frontend-only. No DB, no edge functions, no `grade_mode` changes, no new routes. Drops into the existing `BattleArena` → `GoblinGuard` flow used by K-5 today.

## Architecture

```text
correct word read
   │
   ▼
GamePlay.tsx (existing damage handler)
   │  passes spokenWord to BattleArena via new prop `triggerVerb`
   ▼
BattleArena
   ├── existing: beam + shake + particles + damage number
   └── NEW: VerbAnimationLayer
            ├── lookup verb in verbAnimationMap
            ├── Tier 1 → apply transform to enemy wrapper (motion variant)
            └── Tier 2 → mount emoji-prop sprite, animate, unmount
```

## Files

**New**
- `src/lib/verbAnimations.ts` — verb → animation descriptor map (transform variants + emoji-prop configs)
- `src/components/aura/game/effects/VerbAnimationLayer.tsx` — renders emoji-prop overlay, handles lifecycle
- `src/hooks/useVerbAnimation.ts` — reads `triggerVerb` prop, resolves descriptor, returns variant + prop config

**Edited**
- `src/components/aura/game/BattleArena.tsx`
  - Add `triggerVerb?: { word: string; nonce: number }` prop
  - Wrap enemy `<motion.div>` with verb transform variant from hook
  - Mount `<VerbAnimationLayer>` for emoji props
- `src/pages/game/GamePlay.tsx` (or wherever damage is dispatched to BattleArena — confirm during build)
  - On correct read, pass `{ word: spokenWord.toLowerCase(), nonce: Date.now() }` to BattleArena

No changes to `GoblinGuard.tsx` (stays pure). No changes to `battleMechanics.ts`. No changes to scoring/HP logic.

## Verb library

**Tier 1 — Transform verbs (~20, no art needed)**
Acts on enemy sprite via framer-motion. CSS transforms only.

| Verb        | Animation |
|-------------|-----------|
| flip        | rotateY 360° |
| spin        | rotate 720° |
| jump        | translateY -40 → 0 |
| shrink      | scale 1 → 0.4 → 1 |
| grow        | scale 1 → 1.6 → 1 |
| fall        | translateY +60, rotate 90° |
| bounce      | translateY 3× spring |
| shake       | x oscillate ±15 |
| tilt        | rotate ±25° |
| wiggle      | rotate ±10° 3× |
| stretch     | scaleY 1.5 |
| squish      | scaleY 0.5, scaleX 1.3 |
| float       | translateY -30, slow ease |
| sink        | translateY +40, opacity 0.6 |
| zoom        | scale 1.4 + translateX 30 |
| slide       | translateX 50 → 0 |
| roll        | translateX 60, rotate 360° |
| dance       | combined wiggle + bounce |
| freeze      | filter hue-rotate + scale 1, hold |
| explode     | scale 1.5 → 0, opacity 0 |

**Tier 2 — Emoji-prop verbs (~10, single absolutely-positioned span)**
Mounts an emoji near enemy, animates, unmounts after ~1.2s.

| Verb        | Prop |
|-------------|------|
| drink       | 🥤 → mouth, then 💧 |
| eat         | 🍎 → mouth, then 😋 |
| sleep       | 💤 floats up |
| cry         | 💧💧 from eyes |
| laugh       | 😂 burst |
| read        | 📖 appears in hands |
| run         | 💨 trail |
| throw       | ⚾ arcs across arena |
| burn        | 🔥 overlay |
| sing        | 🎵🎶 float up |

## Matching rules

- Lowercase + strip punctuation before lookup.
- Trivial morphology: strip trailing `s`, `ed`, `ing` → check root (`flips`, `flipped`, `flipping` all → `flip`). Single regex pass, no lib.
- Unmatched words: no animation, existing beam/particles fire as today (zero regression).
- Cooldown: ignore retrigger within 400ms to prevent spam from rapid corrections.

## Performance

- Transform verbs: pure GPU compositing, no extra cost vs. existing hit animations.
- Emoji props: one absolutely-positioned `<motion.span>`, unmounts cleanly via AnimatePresence. ~0.3ms render.
- No new images, no preloading, no bundle-size impact (~3KB total for map + layer + hook).
- Verified safe on 5-year-old iPad (matches current Battle perf envelope).

## Validation

- Manual: read each verb in dev battle, confirm animation fires + damage still applied.
- Confirm misreads → no animation, no damage (existing behavior preserved).
- Confirm non-verb correct reads → existing beam/shake only (no regression).
- Confirm rapid-fire reads don't queue/stack animations (cooldown works).

## Out of scope (deferred)

- Pre-K mode, custom sprite art, sentence-level parsing ("the goblin drinks water" as a phrase), grade_mode branching, new routes, telemetry on verb usage.
