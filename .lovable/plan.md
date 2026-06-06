# Replace Benny Idle with the New Video + Kill the Visible Box

## What the user is seeing

The square outline around Benny in the screenshot is not a CSS border — it's the **current animated WebP's own pixels**. The previous chroma-key pass left a faint mint/teal residue across the full 420×420 frame, so on the scene's mint-green background you can see a square halo where the WebP's "transparent" pixels aren't actually fully transparent. We need to redo the transparency pass on the new, better source video and ship a clean WebP whose non-Benny pixels are 100% alpha=0.

## Plan

### 1. Process the new uploaded video → clean transparent animated WebP

Source: `/mnt/user-uploads/Transparent_Character_Cutout-2.mp4` (2880×2880, H.264, yuv420p, 30fps, ~5s, black background).

Pipeline (Python + ffmpeg, run in `/tmp/`):

1. Extract all 151 frames as PNG at full res via ffmpeg.
2. For each frame, in Python with PIL + numpy + scipy:
   - Compute a luminance map; mark "background" as pixels where luminance < threshold **AND** the pixel is connected (via flood-fill from the four image edges) to the outer black region. This is what protects Benny's black eyes/nose/outline — they're internal black, not edge-connected, so they stay opaque.
   - Use `scipy.ndimage.binary_fill_holes` on the foreground mask so any tiny interior gaps are closed.
   - Feather the mask edge by 1px (erode by 1, then 1px Gaussian blur on alpha) to kill the hard-edge halo without eating Benny's outline.
   - **Hard-zero** alpha everywhere the mask says background — no "almost transparent" pixels at all, which is what was causing the visible square.
3. Downscale each frame from 2880 → 480 with Lanczos (sharper than the old 420), preserving alpha.
4. Re-encode as animated WebP with `img2webp -lossy -q 80 -d 33 -loop 0` (≈30fps, infinite loop). Target final size < 1.5 MB.

### 2. Upload + swap the asset pointer

- `lovable-assets create --file /tmp/benny-idle-v2.webp --filename benny-idle.webp` → write the new pointer to `src/assets/benny-idle.webp.asset.json` (overwriting the existing pointer). Because asset URLs are immutable, this gives a new `asset_id` and bypasses any CDN cache.
- Delete the old asset pointer's stale entry via `delete_asset` on the prior `.asset.json` only after confirming nothing else references it (it's only referenced by `BennyDog.tsx` and `NabuScene.tsx`, both of which we're updating in lockstep).

### 3. Sanity-check `BennyDog.tsx` and `NabuScene.tsx`

No code changes needed in `BennyDog.tsx` — it already points at `@/assets/benny-idle.webp.asset.json`, so swapping the pointer file is enough. Same for `NabuScene.tsx` (`BENNY_SOURCES.idle` → same asset).

Quick audit pass to confirm there is no leftover CSS `border`, `outline`, `box-shadow`, or `background` on the Benny `<img>` wrapper or its parent in the Map scene that could itself draw a square. From the current code (`BennyDog.tsx` lines 119–164), the wrapper is `position: relative` with no border/background, and `<img>` has `objectFit: "contain"` with no background — so once the WebP itself is clean, the box is gone.

### 4. QA before reporting done

- Open the new WebP in `code--view` to visually confirm the corners and edges are fully transparent (checkerboard, not mint).
- Sample 3 frames (0, 75, 150) via ffmpeg + PIL and assert `alpha.min() == 0` at the four corners and `alpha` histogram is bimodal (mostly 0 or 255, very little mid-range). If mid-range alpha > 2% of pixels, tighten the mask and re-encode.
- Spot the running preview on the Map route to visually confirm no square halo.

## Out of scope (explicitly **not** changing)

- Celebrate / sad sprites — still PNG, untouched.
- `BennyDog.tsx` animation logic, blink overlays, tail wag.
- Sir Valor video / SVG / Safari fallback logic — totally separate file, not touched.
- Skin shop, inventory, economy, pricing — untouched.
- Adding video for celebrate/sad — separate future task.

## Risk / open questions

- The new source is still yuv420p with a hard black background (no real alpha channel), so the chroma/luma key is the only way to recover transparency. If Benny himself has very dark shadows near his silhouette edge, the edge-connectivity rule protects them — but if any dark shadow pixel **touches** the border, it'll get keyed out. I'll inspect a mid-clip frame first and raise the luminance threshold conservatively if needed.
- Animated WebP encoder choice: `img2webp` (libwebp) is already on the sandbox path. If it isn't, fall back to `ffmpeg -c:v libwebp_anim` which produces the same format.
