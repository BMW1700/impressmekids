## Honest take

Your three asks are all good — they make intent crystal clear and shorten the click-path. The only one I'd tweak slightly is "Welcome to Nabu Learn!!" as a top banner. A loud welcome line above the split competes with the two headlines and pushes the panels below the fold. **Better placement:** small, centered eyebrow text *inside* the header bar (next to the NabuLearn logo or right under it) — still says "Welcome to NabuLearn" prominently, but doesn't steal the stage from Benny / RPG. If you really want it big, we can do a thin banner strip ~40px tall — I'll offer both in the build and you pick after seeing it.

Everything else I fully agree with. Here's the plan.

---

## 1. Audience labels on each panel

Add a second small label under the existing "Ages 2–5 · Pre-K" / "Ages 6–18 · Grades K–12" eyebrows, that becomes more prominent (brighter + slight scale) on hover/tap:

- **Benny panel:** "For daycares, preschools & 2–5 year-olds"
- **RPG panel:** "For K–12 students, at-home learning, schools & districts"

Implementation: a second `<p>` under the eyebrow, opacity `0.6 → 1` and `translate-y` on hover, tied to existing `hover` state. No new components.

## 2. Benny CTA goes straight into Pre-K mode

Currently `Start Benny's adventure → /game` (the dashboard). We change it to land directly in the Pre-K experience.

How Pre-K is entered today: `GameDashboard.handleModeSelect('prek')` calls `setStoredTheme('prek')` then navigates to `/game/play?tab=rpg`. We replicate that on the CTA:

- New click handler on the Benny button: `setStoredTheme('prek')` → if signed in → `navigate('/game/play?tab=rpg')`; if not signed in → `navigate('/game/auth')` (same auth gate the dashboard already uses).
- Reuses the existing `setStoredTheme` helper from `@/lib/gameTheme`. No new routes, no backend.

## 3. "Overall stats" button inside Pre-K mode

Add a small **Stats** button (chart icon + label) to the Pre-K mode header inside `/game/play` when `tab=rpg` + theme is `prek`. Clicking it opens a modal (or navigates to an existing reading-summary view) showing:

- Words mastered
- Levels completed
- Time spent / streak
- Pulled from existing `useGameReadingSummary` / `useReadingSessions` hooks already wired into GamePlay — no new tables.

Exact placement: top-right of the Pre-K mode chrome, next to the existing settings gear (per the Game Header Settings memory). One small icon button, no layout shift.

## 4. "Welcome to NabuLearn" — my recommendation

Add `Welcome to NabuLearn` as a **small centered eyebrow line inside the existing header bar**, under the logo row, in muted white at ~13px:

```text
┌─────────────────────────────────────────────┐
│  NabuLearn               Pricing · Sign in   │
│         Welcome to NabuLearn                 │
└─────────────────────────────────────────────┘
```

If after seeing it you'd rather have a louder banner, we flip one class and it becomes a 40px strip. I think the small version wins because it doesn't fight Benny.

---

## Files touched

- `src/pages/ModeSelect.tsx` — add audience-label sub-line on each panel; change Benny CTA to a click handler that calls `setStoredTheme('prek')` then navigates; add small "Welcome to NabuLearn" line in the header.
- `src/pages/game/GamePlay.tsx` (or whichever component renders the Pre-K mode chrome) — add a **Stats** icon button in the header when theme is `prek`, opening a stats modal. (I'll confirm the exact host component on first read in build mode and only add the button there; no behavior change for non-Pre-K themes.)
- New tiny component `src/components/prek/PreKStatsButton.tsx` — icon button + dialog that reads from the existing reading-summary hooks.

## What I'm NOT changing

- The hover-scale interaction, panel proportions (55/45), gradients, fonts, video crop, AudienceTrifurcation section, footer, routes, or any backend. Just adds the four things above.

Approve and I'll build it.