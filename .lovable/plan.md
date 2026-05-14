## Pre-K Reader: Remove HP Bars + Full-Viewport Layout

### 1. Remove HP bars, keep character reactions

In `src/components/aura/game/rpg/RPGOneWordReader.tsx`:

- Delete the `enemyHp` / `enemyMaxHp` state, the HP bar JSX (heart icon + numeric + gradient bar), and the `damagePerWord` math.
- Delete the floating `-20` damage number.
- Keep and amplify the friendly feedback that already works:
  - Enemy sprite **flinches** (`isTakingDamage` flash) on each correct word.
  - Hero sprite **lunges forward** on attack.
  - Screen **shake** stays.
  - `VerbAnimationLayer` sparkle/emoji on action words stays.
- Replace the floating "-20" with a friendly **"+1 ⭐"** float so kids see positive feedback instead of damage.
- Lesson completion is now driven purely by `RPGWordReader`'s `onBatchComplete` (already the case) — not by HP hitting zero. The "enemy defeated" flying-up animation triggers when `correctCount === items.length` instead of `enemyHp <= 0`.

### 2. Full-viewport layout (match normal mode)

Normal mode (`RPGBattleArena`) renders directly inside `AuraPractice` and owns the full screen with its own internal scroll. Pre-K should do the same.

Changes:

- **`src/pages/student/AuraPractice.tsx`**: when rendering `RPGOneWordReader`, render it the same way `RPGBattleArena` is rendered — directly into the page, not wrapped in the `h-screen overflow-hidden` shell that's squeezing it. Remove the constrained padding wrapper around the Pre-K branch only.
- **`RPGOneWordReader.tsx`**: change root from `w-full h-full min-h-0 overflow-hidden rounded-2xl` to `min-h-screen w-full overflow-y-auto` (mirrors `RPGBattleArena`'s scroll model). Drop the `flex-1 min-h-0 overflow-y-auto` on the inner mic reader container so the whole page scrolls naturally instead of nesting two scroll regions that fight each other at 690×636.
- Increase character sprite sizes back to `lg` (matching the felt presence of normal mode) and bump the word card to `text-6xl sm:text-7xl` since we now have room.
- Top bar (Map / world name / star count) stays sticky at the top like normal mode's header.

### 3. Files touched

- `src/components/aura/game/rpg/RPGOneWordReader.tsx` — remove HP system, switch to full-viewport scroll layout, swap damage number for "+1 ⭐".
- `src/pages/student/AuraPractice.tsx` — render Pre-K reader full-bleed, mirroring how `RPGBattleArena` is mounted.

### 4. Acceptance

- At 690×636 (current preview viewport) nothing is cut off; mic reader and Start Reading button are fully visible.
- No HP numbers anywhere in Pre-K. Character still flinches/sparkles on correct reads.
- Star count in top right still reflects progress (`correctCount / items.length`).
- Lesson completes when all words are read, not when an HP bar hits zero.
- Pink (101) / amber (102) / emerald (103) world themes preserved.
