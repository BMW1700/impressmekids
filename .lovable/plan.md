# Fix the hero video cropping

## Problem
The landing hero video is 1280x720 (exactly 16:9) and the frame it sits in is also 16:9 — so the full picture would fit perfectly. But the player currently zooms the video to 108% and nudges it up and left. That zoom was added for the old clip to push a watermark out of view, and on the new clip it slices off the top of the sky, cutting into the "Yubi Learn" cloud text.

## The fix
- Remove the 108% zoom and the up/left nudge from the hero video player so the clip renders at its true size, fully in frame.
- Switch the fit mode so nothing is cropped in either direction.
- Slightly thicken the top/bottom cinema bars only if needed for the rounded-corner look; keep them off the cloud text.

## Technical notes
Single file: `src/components/landing/BennyVideoHero.tsx`. Both `<video>` elements (autoplay branch and tap-to-play branch) drop `scale-[1.08] -translate-x-[1.5%] -translate-y-[1.5%]` and use `object-contain` instead of `object-cover`. No other components or logic change.
