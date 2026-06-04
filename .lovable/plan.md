## Goal
Fix Benny's white/checkerboard background and give him a tiny bit of life (blink + tail wag). Both are easy.

## Steps

1. **Remove background from Benny images**
   - Re-run `imagegen--edit_image` on `benny-idle.png`, `benny-celebrate.png`, `benny-sad.png` with `transparent_background: true` so they become clean transparent PNGs.
   - Re-upload each via `lovable-assets` and overwrite the existing `.asset.json` pointers in `src/assets/`.
   - No code changes needed — `BennyDog.tsx` already renders them as transparent `<img>` with `object-fit: contain`.

2. **Add subtle life to idle pose** (in `src/components/BennyDog.tsx`)
   - Keep the existing gentle 1.8s translateY bounce.
   - Add a CSS-only **blink**: a thin dark overlay across the eye region using a small absolutely-positioned `<span>` with a `scaleY` keyframe (0→1→0) every ~4s, 0.15s duration. Because eye position is baked into the PNG, this is approximate — it reads as a quick shimmer over the eyes rather than true eyelids.
   - Add a CSS-only **tail wag**: since the tail is also baked into the PNG, true tail-only animation isn't possible without a separate tail asset. Two honest options:
     - (a) Skip the tail wag and only do blink (recommended — looks clean).
     - (b) Generate a separate transparent `benny-tail.png` and layer it with a `rotate` keyframe anchored at the tail base. This is more work and requires careful alignment.

## Question for you
For the tail wag, do you want:
- **(a)** Just blink, skip tail wag (fast, clean), or
- **(b)** Generate a separate tail layer so it can actually wag (more setup, may need positional tweaking)?

Once you confirm, I'll switch to build mode and ship it.
