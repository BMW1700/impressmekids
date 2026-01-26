
# Plan: Fix Modal and Battle UI Bottom Cutoff

## Problem
Both the `WordFeedbackOverlay` modal and the main `RPGBattleArena` UI are being cut off at the bottom of the screen. The action buttons ("Hear It", "Try Again", "Skip & Continue") and the "Attack" button below the word reader are not visible.

## Root Cause
1. **WordFeedbackOverlay**: The modal uses `flex items-center justify-center` which tries to vertically center content, but when the modal content is taller than the viewport (especially on smaller screens or when browser toolbars are visible), the top and bottom get clipped because there's no scroll capability.

2. **RPGBattleArena**: The bottom UI section doesn't have a max-height constraint with overflow scrolling, causing content to push below the viewport edge.

## Solution

### Fix 1: WordFeedbackOverlay - Add Scroll Support and Safe Padding
**File**: `src/components/aura/game/rpg/WordFeedbackOverlay.tsx`

| Line | Change |
|------|--------|
| 98 | Change from `flex items-center justify-center` to `flex items-start justify-center overflow-y-auto py-8` |
| 104 | Add `max-h-[90vh]` constraint to modal content and `overflow-y-auto` |

```typescript
// Before (line 98)
className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"

// After
className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 bg-black/60 backdrop-blur-sm"
```

```typescript
// Before (line 104)
className={`relative max-w-md w-full mx-4 p-6 rounded-2xl border-2 ${...}`}

// After - add max-height and my-auto for vertical centering when space allows
className={`relative max-w-md w-full mx-4 p-6 rounded-2xl border-2 my-auto max-h-[90vh] overflow-y-auto ${...}`}
```

### Fix 2: RPGBattleArena Bottom UI - Add Scroll and Max Height
**File**: `src/components/aura/game/rpg/RPGBattleArena.tsx`

| Line | Change |
|------|--------|
| 1978 | Add `max-h-[50vh]` and `overflow-y-auto` to bottom UI section |

```typescript
// Before (line 1978)
<div className="bg-black/50 backdrop-blur-sm border-t border-white/10">

// After - constrain height and enable scrolling
<div className="bg-black/50 backdrop-blur-sm border-t border-white/10 max-h-[50vh] overflow-y-auto">
```

## Technical Details

### Why `items-start` instead of `items-center`?
When using `items-center` in a flex container with `overflow-y-auto`, the browser clips both the top and bottom equally when content overflows. By using `items-start`, we anchor content to the top and allow natural scrolling downward.

### Why `my-auto`?
Adding `my-auto` (margin-y: auto) to the inner modal content allows it to center vertically when there IS enough space, while still allowing scroll when there isn't.

### Why `max-h-[90vh]` / `max-h-[50vh]`?
- 90vh for the modal ensures it never exceeds 90% of viewport height, leaving room for the outer padding
- 50vh for the bottom battle UI ensures the center battle arena (with characters) always has at least 50% of the screen

## Summary of Changes

| File | Lines Changed | Description |
|------|---------------|-------------|
| `src/components/aura/game/rpg/WordFeedbackOverlay.tsx` | 2 | Add scroll support and height constraints to modal |
| `src/components/aura/game/rpg/RPGBattleArena.tsx` | 1 | Add max-height and scroll to bottom UI section |

**Estimated Impact**: 3 lines modified
