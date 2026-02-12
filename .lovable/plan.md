

# Fix Magic & Items Submenus -- Pop Up as Centered Overlay

## Problem
The Magic and Items submenus use `absolute bottom-full` positioning, which causes them to fly off the top of the screen on desktop since the command menu sits near the bottom of the viewport.

## Solution
Change the submenus from absolute-positioned children of the command menu to **fixed-position centered overlays** on the screen. This way they always appear in the middle of the viewport (like a modal), fully visible on both desktop and mobile.

## Changes

### File: `src/components/aura/game/rpg/RPGCommandMenu.tsx`

1. **Spell submenu container (line 96):** Change from `absolute bottom-full left-0 mb-2 z-20` to `fixed inset-0 z-50 flex items-center justify-center bg-black/50` -- this creates a centered modal overlay with a dark backdrop.

2. **Item submenu container (line 111):** Same change as above.

3. Add a click handler on the backdrop so clicking outside closes the menu (already handled by `onClose` prop).

### Result
- Submenus appear centered on screen as overlays, always fully visible
- Works on both mobile and desktop
- Dark backdrop makes them easy to read and dismissible
- Desktop layout unchanged otherwise

