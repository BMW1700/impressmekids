

# Fix Magic & Items Submenus Being Clipped

## Root Cause

The entire RPG battle arena is wrapped in a container with `overflow-hidden` (line 1776 of `RPGBattleArena.tsx`):

```text
fixed inset-x-0 top-0 h-[100dvh] z-50 overflow-hidden
```

This clips **everything** inside it -- including the `fixed inset-0 z-[9999]` spell and item overlays. Even though they use `fixed` positioning, browsers clip them because their parent has `overflow-hidden` in certain stacking/rendering contexts.

## Solution: React Portal

Render the spell and item overlay menus using **React Portals** (`ReactDOM.createPortal`). This moves them completely outside the battle arena DOM tree and attaches them directly to `document.body`, so they cannot be clipped by any parent container.

## Changes

### File: `src/components/aura/game/rpg/RPGCommandMenu.tsx`

1. Add `import { createPortal } from "react-dom"` at the top.
2. Wrap both the spell submenu overlay and the item submenu overlay in `createPortal(..., document.body)` so they render outside the clipped battle arena container.
3. Keep the existing `fixed inset-0 z-[9999] flex items-center justify-center bg-black/60` styling -- it will now work correctly since the elements are no longer inside the clipped parent.

No other files need to change. The command menu buttons, behavior, and styling all stay the same -- only the rendering target for the overlays changes.

