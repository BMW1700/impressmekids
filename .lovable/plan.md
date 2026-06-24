# Pre-K Mode Layout + Benny Redesign

Scope: **only `mapTheme === 'prek'**` in `src/components/aura/game/rpg/RPGWorldMap.tsx`. Classic/Agent modes stay untouched.

## 1. Upload images as CDN assets

- `user-uploads://image-20.png` → `src/assets/prek-bedroom-bg.png.asset.json` (bedroom background)
- `user-uploads://f13d61f5-8662-4f6b-a638-5c961b2d8847_9.37.12_PM.png` → `src/assets/benny-standing.png.asset.json` (Benny standing pose, transparent PNG)

Uploaded via `lovable-assets create --file /mnt/user-uploads/... --filename ...`.

## 2. Background (Pre-K only)

In `RPGWorldMap.tsx`, when `mapTheme === 'prek'`, add an absolutely-positioned background `<img>` at the root of the map container (behind everything, `z-0`), using `prek-bedroom-bg.png`. Apply a subtle dark overlay (e.g. `bg-black/30`) above the image so text + cards remain legible. Existing star/particle background stays for non-prek modes only.

## 3. Reposition "My Reading Journey" (Pre-K only)

- Remove the fixed-left `ReadingProgressPanel` positioning for Pre-K only. Classic/Agent keep their existing fixed-left/mobile layout.
- In Pre-K, render a new **horizontal** Reading Journey strip directly under the Stats button (i.e. after the `PreKStatsButton`, before the Phonics Foundations banner).
- Build a new `<ReadingProgressPanelHorizontal />` component (or pass a `layout="horizontal"` prop into `ReadingProgressPanel`) that renders the same stats (Reading Level bar, WCPM, Accuracy, Words Mastered, Stories Read, View Full Stats) in a single horizontal row spanning the content width.

## 4. Shift content right (Pre-K only)

For Pre-K, the Phonics Foundations banner + the world cards grid + the Reading Journey horizontal strip get a left margin so Benny has room on the left:

- Wrap the Pre-K content column in a container with `lg:ml-[280px] xl:ml-[320px]` (kept `max-w-4xl mx-auto` on smaller breakpoints so phones/tablets stay centered).
- No internal layout changes to the Phonics Foundations card or the 2-column world-card grid — they keep their current formatting, just shifted right.

## 5. Benny on the left (Pre-K only)

Add a new `<BennyStanding />` element absolutely positioned on the left side of the map container, vertically aligned with the level grid, hidden below `lg`:

- `position: absolute; left: 24px; top: ~360px` (roughly under the Reading Journey strip, alongside the worlds).
- Width ~240–280px, transparent PNG.
- Wrapped in framer-motion to apply three idle animations simultaneously:
  - **Head tilt**: rotate body `[0, -4deg, 0, 3deg, 0]` every ~6s (eased, infinite).
  - **Blink**: a thin dark overlay strip on the eye region opacity `[0,0,1,0]` ~every 4s to simulate blinking (cheap; no separate eye sprite needed).
  - **Tail wag**: a CSS-masked tail region rotating `[0, 8deg, -4deg, 0]` ~every 1.2s. Implemented by overlaying a duplicate of the Benny PNG clipped to the tail area on the left, with `transform-origin` at the base of the tail.

Implementation detail: simplest path is one motion.img for the whole body (slow head tilt + occasional whole-frame tilt), plus a second motion.div with the same image masked via `clip-path` over the tail bounding box that wags faster. Eye blink is a small dark `<div>` positioned over the eyes whose opacity pulses. Coordinates of tail/eye clip regions are hand-tuned against the provided PNG.

`prefers-reduced-motion`: respect it — disable all three animations.

## Files changed

- `src/components/aura/game/rpg/RPGWorldMap.tsx` — Pre-K branch gets background image, ml shift, Benny block, and moves ReadingProgressPanel into the inline flow.
- `src/components/aura/game/rpg/ReadingProgressPanel.tsx` — add `layout?: 'vertical' | 'horizontal'` prop and a horizontal render path.
- `src/components/aura/game/rpg/BennyStanding.tsx` — new file, owns the three idle animations.
- `src/assets/prek-bedroom-bg.png.asset.json` — new asset pointer.
- `src/assets/benny-standing.png.asset.json` — new asset pointer.

No backend changes. No changes to Classic or Agent mode layouts.