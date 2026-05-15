ns# Plan: Ship the Safe 3

Tight, low-risk polish pass. Zero new realtime, zero new backend, zero performance hit. Live teacher board is **explicitly deferred** to v1.5 pending real teacher feedback.

## What we're building

### 1. Landing page reorder
Move the most superintendent-relevant proof points above the fold. Lead with outcomes ("every metric tracked, surfaced where it matters"), then product pillars, then social proof. No new sections, just reordering existing blocks.

### 2. Cut the mic chip
Remove the standalone microphone status chip from the battle UI. The mic indicator is already implicit in the speech-active animation; the chip is visual noise on iPad-sized viewports.

### 3. Auto-open recap modal at battle end
When a battle resolves (victory or defeat), automatically open the existing post-battle recap modal instead of requiring a tap. Adds a single state trigger on the existing battle-end effect.

### 4. Cinematic copy pass
Update the "metrics tracked" section copy to: **"Every metric tracked. Surfaced where it matters."** No "coming soon" language anywhere. No promises of live dashboards we haven't shipped.

## What we are NOT building

- **Teacher live board** — deferred. Reasoning: the four-gate architecture is sound but carries a non-zero hiccup risk (presence burst, iPad battery, ~400 lines touching the speech hot path). Revisit in v1.5 once 2–3 pilot teachers explicitly request it.
- No new realtime channels, no new edge functions, no new tables, no feature flags.

## Technical notes

- **Landing reorder**: pure JSX section reordering in the landing page component. No new components.
- **Mic chip removal**: delete the chip JSX + its conditional render guard. Verify the speech-active glow on the player avatar still communicates active listening.
- **Recap auto-open**: in the battle-end `useEffect` that currently sets `phase` to `victory`/`defeat`, also set `recapOpen` to `true`. Existing modal already supports controlled open state.
- **Copy**: string changes only.

## Risk

Effectively zero. All changes are presentational, no hot-path code, no new dependencies, no schema changes, no realtime. Total surface area: ~30–50 lines across 2–3 files.

## Verification

- Visual check landing on mobile + desktop viewports
- Run a battle to victory and to defeat — recap modal should auto-open both times
- Confirm mic chip is gone and speech glow still pulses while listening
