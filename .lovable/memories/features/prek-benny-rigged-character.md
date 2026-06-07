---
name: Pre-K Benny Rigged Character
description: Two-layer (head + body) rigged Benny PNGs for Mario-like independent motion in Pre-K Nabu adventures
type: feature
---
Benny the Pre-K mascot is rigged from TWO same-canvas 1024x1024 PNGs:
- `src/assets/benny-rig-head.png.asset.json` — head + ears, alpha-feathered below the collar
- `src/assets/benny-rig-body.png.asset.json` — body + tail + legs + collar, alpha-feathered above the collar

Both layers stack with `position:absolute; inset:0` and reconstruct the puppy perfectly (feather band overlaps so no seam).

Rendered by `src/components/BennyRigged.tsx`, which takes a `pose` prop (`idle | look | talk | cheer | sad | hop | bark`). Head transform-origin = `54% 53%` (base of neck). Body transform-origin = `50% 100%` (feet planted). All motion is Framer Motion keyframes — no new keyframes in index.css.

Used inside `NabuScene.tsx` via `BennySvgImage` for `celebrate` and `sad` moods (wrapped in `<foreignObject>` so it lives inside the SVG stage). Idle still uses the sprite sheet — sprite walk-cycle is higher fidelity than the rig for that pose.

DO NOT replace the idle path with the rig — sprite-sheet idle is intentional and Safari-friendly.
