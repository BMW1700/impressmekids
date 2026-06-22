## What's actually broken

Both panels DO change `flex-grow` to 68 on hover — the math is symmetric. The reason the right side *looks* like it isn't expanding:

- **Benny panel** uses `max-w-2xl` (672px) and the video fills the full container width, so when the panel grows wider, the video grows with it and you clearly see it expand.
- **RPG panel** uses `max-w-xl` (576px) — narrower cap. When its panel grows from 45% → 68% of the screen, the inner content stays locked at 576px and just gets more empty side-padding. The panel *is* wider, you just can't tell because nothing inside it stretches.

So it's not a bug, it's a content-width mismatch.

## My recommendation: keep the expansion, AND go heavier on the blur

You asked me to pick. I'd do **both**, because each one fixes a different problem:

1. **Fix the RPG expansion so it's actually visible** — match Benny's content cap, so when the panel grows, the content visibly grows with it.
2. **Crank the inactive-side blur way up** so the focused side really wins the screen. Right now `blur-[2px] brightness-[0.55]` is too polite — it reads as "slightly faded" instead of "out of focus." Push it to near-invisible.

Combined effect: hover Benny → Benny visibly expands AND RPG nearly disappears. Hover RPG → same thing in reverse. Fully symmetric, much more dramatic.

## Changes (file: `src/pages/ModeSelect.tsx`)

### 1. Make RPG content width match Benny's
- Change the RPG panel's inner wrapper from `max-w-xl` → `max-w-2xl` (line 267).
- This alone makes the right side's expansion visible.

### 2. Heavier blur + fade on the inactive side
Update `inactiveFx()` (lines 98–102):
- From: `blur-[2px] brightness-[0.55] md:scale-[0.98]`
- To: `blur-[8px] brightness-[0.25] opacity-40 md:scale-[0.96]`
- Reduced-motion fallback: `opacity-30` (no blur, no scale — just fade).

This makes the non-hovered side read as clearly "not the focus" — almost ghosted. Still clickable, still visible enough that you know the door exists, but it stops competing for attention.

### 3. Slightly stronger active lift (optional polish)
Update `activeFx()`:
- From: `md:scale-[1.015]`
- To: `md:scale-[1.02]` — tiny bit more confident.

### 4. Keep everything else
- Flex weights stay 55/45 neutral → 68/32 hover. Symmetric.
- 140ms hover-intent delay stays (prevents flicker on quick mouse passes).
- 700ms transition stays.
- Touch / mobile stacked layout unchanged.
- Header, copy, audience sub-labels, CTAs, routes — all untouched.

## Files touched
- `src/pages/ModeSelect.tsx` — bump RPG `max-w-xl` → `max-w-2xl`, strengthen `inactiveFx`, nudge `activeFx`.

## Not touching
Backend, routes, copy, the Pre-K Stats button, video components, BennyVideoHero, RPGShowcase.

Approve and I'll build it.