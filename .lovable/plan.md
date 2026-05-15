## Move battle showcase below the mode buttons on `/` (ModeSelect)

**File:** `src/pages/ModeSelect.tsx`

**Current order:**
1. RPGShowcase (battle demo)
2. "Welcome to NabuLearn" heading
3. School Mode + Game Mode buttons

**New order:**
1. "Welcome to NabuLearn" heading
2. School Mode + Game Mode buttons
3. RPGShowcase (battle demo) — directly underneath the buttons

**Change:** Move the `<motion.div>` wrapper containing `<RPGShowcase variant="hero" />` (lines 75–82) from before the heading to after the buttons grid (after line 139, before the closing `</main>`). Add a top margin (`mt-12 sm:mt-16`) so the showcase sits clearly below the buttons.

No other changes — copy stays "Every metric tracked.", no new components, no logic touched.