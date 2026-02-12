

# Fix RPG Mode Mobile Layout

## Problems Identified

From the screenshots, there are several critical mobile issues:

1. **Hero characters cut off on the right side** -- Sir Valor is partially hidden off-screen. The battle arena uses `gap-8` and horizontal flex layout that doesn't scale down for mobile.

2. **Command Menu completely hidden on mobile** -- The "Read", "Magic", "Defend", and "Items" buttons use `hidden md:block`, meaning they're invisible on phones. Players can't access spells, defend, or use items.

3. **Party Stats completely hidden on mobile** -- The streak counter, HP bars, and combo indicators also use `hidden md:block`, so players can't see their own stats on mobile.

4. **Quick Block mini-game words overflow** -- The three words ("Sam", "the", "dog") use `px-8 py-6 text-4xl` in a horizontal row, causing the last word to get cut off on narrow screens.

5. **Victory screen stats may be cut off at the bottom** -- The stats grid and Continue button can extend below the visible area.

---

## Plan

### 1. RPGBattleArena.tsx -- Battle Arena Layout (lines 2159-2222)
- Reduce `gap-8` to `gap-2` on mobile (`gap-2 md:gap-8`)
- Scale down the VS indicator on mobile
- Make the character containers use smaller flex proportions on mobile

### 2. RPGBattleArena.tsx -- Show Command Menu on Mobile (line 2264)
- Change `hidden md:block` to always visible
- Add a compact horizontal layout for mobile: show command buttons as a row of small icons instead of a vertical list
- Render a simplified mobile command bar below the word reader when `md` breakpoint is not met

### 3. RPGBattleArena.tsx -- Show Party Stats on Mobile (line 2333)
- Change `hidden md:block` to always visible on mobile
- On mobile, show a compact inline stats bar (HP + streak) instead of the full panel
- Position it above the reading area or as a slim bar

### 4. RPGBattleArena.tsx -- Reading Phase Grid Layout (line 2261)
- Change from `grid-cols-1 md:grid-cols-[200px_1fr_200px]` to a stacked mobile layout
- On mobile: stack as command bar (top) -> word reader (center) -> compact stats (bottom)
- On desktop: keep the existing 3-column layout

### 5. RPGQuickBlock.tsx -- Responsive Word Cards (lines 298-332)
- Reduce padding from `px-8 py-6` to `px-4 py-3` on mobile (`px-4 py-3 md:px-8 md:py-6`)
- Reduce text from `text-4xl` to `text-2xl` on mobile (`text-2xl md:text-4xl`)
- Reduce gap from `gap-4` to `gap-2` on mobile (`gap-2 md:gap-4`)
- Scale down the shield icon overlay accordingly

### 6. RPGQuickBlock.tsx -- Warning Text Responsive (line 230)
- Reduce "INCOMING ATTACK!" text size on mobile from `text-3xl` to `text-xl md:text-3xl`

### 7. RPGBattleArena.tsx -- Victory/Defeat Screens Scrollable
- Add `overflow-y-auto` to the bottom UI section so victory stats and the Continue button are always reachable on mobile

---

## Technical Details

### Files Modified
- `src/components/aura/game/rpg/RPGBattleArena.tsx` -- Main layout fixes (arena, reading grid, command menu visibility, party stats visibility, victory scroll)
- `src/components/aura/game/rpg/RPGQuickBlock.tsx` -- Responsive word cards and text sizing

### Approach
- Use Tailwind responsive prefixes (`md:`) to keep desktop layout unchanged
- On mobile, command menu renders as a horizontal icon row (Read/Magic/Defend/Items)
- On mobile, party stats render as a compact HP bar + streak number inline
- No new components needed -- just responsive adjustments to existing ones

