

# Plan: Add Mode Selection Page + Move Landing to /school

## Changes

### 1. Create `src/pages/ModeSelect.tsx`
- Full-screen page with app's gradient background
- "Welcome to NabuLearn" large heading
- Two liquid-glass square buttons: "School Mode" (larger, links to `/school`) and "Game Mode" (smaller, placeholder/disabled)
- Move the auth-check redirect logic from `Index.tsx` into this page (logged-in users get redirected from `/` to their dashboard)

### 2. Update `src/pages/Index.tsx`
- Remove the auth redirect logic (lines 55-100ish) — the mode select page handles that now
- Keep everything else exactly the same — this becomes the school mode landing page at `/school`

### 3. Update `src/App.tsx`
- Import `ModeSelect` eagerly
- Route `/` → `ModeSelect`
- Route `/school` → `Index` (the existing landing page, unchanged visually)
- All other routes stay exactly where they are

Zero impact on RPG, AURA, or any existing features. The current landing page just moves from `/` to `/school` with its full content preserved.

