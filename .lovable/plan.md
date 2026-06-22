## My honest pick: Expand + subtle blur (combo)

I tried all four mentally against your real concern ("the pathways are confusing / distracting"):

- **Expand only (75/25):** good, but both sides still compete for attention because both stay sharp.
- **Blur only:** focuses attention, but the panels stay the same size so it doesn't feel as "alive" or rewarding to hover.
- **Full takeover (95/5):** dramatic, but it hides the other door so much it basically becomes a single-panel page — defeats the point of the split.
- **Combo (expand to ~68/32 + blur+dim the inactive side):** the active side clearly wins the screen AND the inactive side stops shouting. Cinematic, focuses the user, still shows both doors exist. **This is the right call.**

So: **combo it is**, tuned conservatively so it feels premium, not jumpy.

---

## Changes

### 1. Remove "Welcome to NabuLearn!"
Delete the centered eyebrow line from the header bar in `src/pages/ModeSelect.tsx`. Header goes back to just logo (left) + Pricing / Sign in / Super Admin shield (right). Cleaner, lets Benny and the RPG headlines own the stage.

### 2. Hover behavior — expand + blur the inactive side

In `src/pages/ModeSelect.tsx`:

- Change the grid from a fixed `grid-cols-[55fr_45fr]` to a **dynamic flex** layout where each panel's `flex-grow` is driven by hover state:
  - Neutral (no hover): `55 / 45` (current default — Benny still gets the slight lead).
  - Hover Benny: `68 / 32`.
  - Hover RPG: `32 / 68`.
- Animate the flex transition with `transition-[flex-grow] duration-700 ease-out` so it glides, doesn't snap.
- On the **inactive** side, apply:
  - `blur-[2px]` (subtle — text still readable so user knows it's there)
  - `brightness-[0.55]` (dims it without going black)
  - `scale-[0.98]` (tiny pull-back, reinforces "you're not focused here")
  - `transition-all duration-500`
- On the **active** side: keep current `scale-[1.02]` lift + full brightness/sharpness.
- Click target stays the whole panel — clicking the dimmed/blurred side still works (no need to "un-blur" first). Hovering it for ~150ms swaps focus.
- Touch / mobile: blur effect disabled (no hover state on touch). Mobile keeps the stacked vertical layout from before. No regression.

### 3. Polish details
- Add a 150ms hover-intent delay before the blur kicks in, so a mouse just passing through doesn't trigger the effect (prevents flicker).
- Reduce motion: respect `prefers-reduced-motion` — skip blur and shrink the expand to 60/40 max.

## Files touched
- `src/pages/ModeSelect.tsx` — remove welcome line; refactor split-screen hover from scale-only to flex-grow + blur/dim on inactive side; add hover-intent delay and reduced-motion guard.

## Not touching
- The audience sub-labels, the Benny CTA (still goes straight into Pre-K), the Pre-K Stats button, the video crop, panel content, fonts, gradients, routes, or anything backend.

Approve and I'll build it.