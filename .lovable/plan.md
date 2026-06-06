# Benny + Sir Valor: CSS sprite-sheet animation (Safari-safe)

## What shipped

Both Benny (Pre-K Nabu scenes) and Sir Valor (RPG combat) now animate via CSS
sprite-sheet steps instead of animated WebP / alpha-WebM video. Sprite sheets
composite through the GPU and run identically on every browser including
Safari/iOS, where the previous WebP and WebM approaches stuttered or rendered
a white box.

## Pipeline

1. **Extract** frames from the source MP4s at 420×420 (Valor) / 420×480 (Benny)
   using `ffmpeg -vf scale=...`.
2. **Alpha-key** with PIL + scipy:
   - Benny (dark background): luminance < 30, propagate from border,
     fill holes, 1px erode, 0.8σ Gaussian, hard-zero outside mask.
   - Valor (white background): luminance > 235 AND saturation < 18,
     propagate from border, same fill/erode/feather.
3. **Down-sample** to 30 frames evenly distributed across the source clip
   (Benny 151 → 30, Valor idle/attack 151 → 30, hit 104 → 30).
4. **Crop** Benny frames' bottom 30px of empty padding so feet sit on the
   cell's bottom edge (Valor frames already framed tight, 420×420 kept).
5. **Pack** into a single-row strip PNG (30 cells × 420px wide → 12600×450 for
   Benny, 12600×420 for Valor states). Single row keeps CSS `steps()` clean.
6. **Compress** with `pngquant --quality 60-85 --strip`. Final sizes:
   - benny-idle-sprite.png: 822 KB
   - valor-idle-sprite.png: 694 KB
   - valor-attack-sprite.png: 858 KB
   - valor-hit-sprite.png: 700 KB
7. **Upload** via `lovable-assets create`, write the `.asset.json` pointers.

## Animation

Both characters use the same CSS pattern. Single-row strip means
`background-position-x` walks from `0%` to `-2900%` in `steps(29, end)` —
each step jumps exactly one cell.

- **Benny idle**: 7s loop, walks 0→-2900% in the first 72%, then holds the
  last frame for the remaining 28% (≈2s) before restarting. Reads as
  "breathe → settle → breathe".
- **Valor idle**: 2.5s continuous loop.
- **Valor attack/hit**: `forwards` once, freezes on last frame. The parent
  `useTransientValorMood` reverts to idle after 1.6s (attack) / 1.2s (hit),
  and the layer remounts via React `key` to replay from frame 0 next time.

## Component changes

- `src/components/BennyDog.tsx`: standalone component now stacks an idle
  sprite layer + celebrate/sad PNG layers and crossfades opacity on mood
  changes. Old `benny-idle.webp` import removed.
- `src/components/aura/game/rpg/NabuScene.tsx`: `BennySvgImage` renders the
  idle sprite inside `<foreignObject>` so it stays inside the SVG stage but
  composites through the GPU. Bottom padding of source frames was cropped, so
  the existing `y={-h + 10}` offset puts feet on `GROUND_Y = 380`. Idle
  `motion.g` bobbing removed — the sprite IS the motion.
- `src/components/aura/game/characters/SirValorVideo.tsx`: rewritten to use
  the sprite-sheet stack (one layer per state, crossfade on mood change).
  Old `<video>` element gone. `useTransientValorMood` retained.
- `src/lib/gameEconomy.ts`: `supportsAlphaWebm()` now always returns `true`
  since the realistic Valor works in every browser. Call-sites in
  `RPGCharacter.tsx` and `usePlayerInventory.ts` no longer gate the realistic
  variant on Safari.

## Out of scope

- Other characters (Elara, Princess Ella, goblins) — same sprite-sheet
  treatment available if they hit similar Safari issues, but untouched here.
- Old `benny-idle.webp`, `valor-idle.webm/mp4`, `valor-attack.webm/mp4`,
  `valor-hit.webm/mp4` assets are still on CDN; their `.asset.json` pointer
  files are no longer imported by any component, but kept committed for one
  release cycle in case a published preview references them.
