## Goal

Make the battle showcase on the **Game Dashboard** (pic 2) and **ModeSelect** (pic 3) match the polished version on the landing page (pic 1) — with HP bars, "Hero" / "Shadow Wraith" labels, the green word chips, the arena floor glow, and the "Read words → launch powers" caption.

## Why they look different today

Both pages render `<RPGShowcase variant="compact" />`. The `compact` variant intentionally strips:
- HP bars (Hero / enemy)
- The bottom "Read words → launch powers" caption
- Uses smaller character sprites and tighter height (220–260px)

Pic 1 is the `hero` variant — taller stage, full HP bars, caption, larger characters.

## Changes

### 1. `src/pages/game/GameDashboard.tsx`
- Line ~224: change `<RPGShowcase variant="compact" />` → `<RPGShowcase variant="hero" />`
- Surrounding wrapper card may need a small height/padding tweak so the taller showcase sits cleanly above the mode cards (no other layout changes).

### 2. `src/pages/ModeSelect.tsx`
- Line ~81: change `<RPGShowcase variant="compact" />` → `<RPGShowcase variant="hero" />`
- Wrap the showcase in the same dark, rounded container used on the landing page so the purple arena reads correctly against the pink/orange `bg-gradient-hero` (otherwise it bleeds, as in pic 3).
  - Container: `rounded-3xl border border-white/10 bg-[hsl(270_45%_8%)] overflow-hidden shadow-[0_20px_80px_-20px_hsl(270_80%_30%/0.6)]`

### 3. No changes to
- `RPGShowcase.tsx` itself (the hero variant already matches pic 1)
- `GameModeSection.tsx` on the landing page (already correct)
- `LiveAssessmentShowcase.tsx`, `PremiumHero.tsx`, `Index.tsx`

## Out of scope
No new components, no logic changes, no character/VFX edits. Pure presentation swap so all three surfaces (landing Game Mode section, Game Dashboard, ModeSelect) show the same cinematic battle.
