## What's broken

Two issues in `src/pages/ModeSelect.tsx`:

**1. Benny's headline sits lower than RPG's headline.**
Both panels use `justify-center` on the flex column. Each side's inner content block is centered vertically *based on its own height*. RPG's description paragraph wraps to 3 lines; Benny's wraps to 2. RPG's block is taller → its top edge sits higher. Benny's block is shorter → its top edge sits lower. Result: the eyebrows and H1s no longer line up across the seam.

In the "perfection" screenshot (pic 1 in this message), they happen to align because content heights matched. As soon as either side's copy changes line count, alignment breaks. It's a fragile setup.

**2. Inactive-side animation keeps playing.**
When you hover Benny, the RPG battle showcase keeps animating behind the heavy blur — wasted CPU and arguably distracting peripheral motion. Same the other way: Benny's video keeps looping when you're focused on RPG.

## Fix

### A. Pin both headlines to the same Y (file: `src/pages/ModeSelect.tsx`)

Stop centering the inner content vertically. Anchor it from the top with matching padding on both sides so the eyebrow row always starts at the same offset, regardless of how copy wraps below.

- Change both panels' wrapper class from `justify-center px-6 py-14 md:px-12 md:py-20` to `justify-start px-6 pt-16 pb-14 md:px-12 md:pt-24 md:pb-20`.
- This makes the eyebrow ("AGES 2–5 · PRE-K" / "AGES 6–18 · GRADES K–12") sit at the same Y on both sides, so the headlines below them line up regardless of paragraph length.
- Section keeps `min-h-[calc(100vh-72px)]` so the panels still fill the viewport.

### B. Pause the inactive side's motion on hover

Add a `paused` prop to both showcase components and forward the hover state.

1. **`src/components/landing/BennyVideoHero.tsx`**
   - Accept `paused?: boolean` prop.
   - In a `useEffect` watching `paused`, call `videoRef.current.pause()` when `paused` is true, and `videoRef.current.play().catch(() => {})` when it flips back to false (only if we're in the autoplay branch — leave the tap-to-play branch alone so mobile behavior is unchanged).

2. **`src/components/landing/RPGShowcase.tsx`**
   - Accept `paused?: boolean` prop on the `hero` variant.
   - Thread it down to the internal `useEffect` timers that drive the battle stepper (the `useEffect` hooks at lines 131, 141, 378, 455, 687 — whichever drive the scripted animation). When `paused` is true, early-return from the interval tick (don't advance state); when it flips back, the next tick resumes naturally. No need to clear timers — just skip stepping.
   - Pause any `motion` loops by gating their `animate` props on `!paused` where it's cheap to do so; otherwise leaving Framer's CSS-driven loops running is fine since the heavy blur hides them. Priority is stopping the *stepper* (the part that draws attention through state changes).

3. **`src/pages/ModeSelect.tsx`**
   - Compute `const bennyPaused = hover === "rpg";` and `const rpgPaused = hover === "benny";`.
   - Pass `<BennyVideoHero paused={bennyPaused} />` and `<RPGShowcase variant="hero" paused={rpgPaused} />`.

### C. Leave the blur alone

The current `blur-[20px] brightness-[0.08] opacity-[0.06]` ghost-out is already heavy — you said yourself it looked good. Pausing the motion is the bigger perceptual win than cranking blur further. Skip more blur.

## Not touching

- Flex weights (locked 50/50 — your decision from earlier).
- Copy, CTAs, routes, headers, footer.
- Mobile stacked layout (justify-start works fine stacked too).
- Reduced-motion fallback.

## Files touched

- `src/pages/ModeSelect.tsx` — `justify-center` → `justify-start` + top padding on both panels; pass `paused` props.
- `src/components/landing/BennyVideoHero.tsx` — accept `paused`, pause/play the video element.
- `src/components/landing/RPGShowcase.tsx` — accept `paused`, freeze the battle stepper.

Approve and I'll build it.