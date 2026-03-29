# Plan: RPG Game Demo + Dashboard Button Updates

## Summary

Create a standalone interactive RPG demo page at `/game/demo` — completely separate from the school demos — and update the Game Dashboard buttons accordingly.

## Changes

### 1. Create `src/pages/game/GameRPGDemo.tsx`

A self-contained interactive demo showcasing the RPG mode, using the same `DemoTourProvider` / `DemoHighlight` / `TourStep` pattern as the existing school demos. It will include:

- **GameHeader** at the top (not school Header)
- **Tour steps** walking through: World Map overview → selecting a world → Level Select → Battle Mode selection → Battle Arena (mock/static) → Victory screen
- **Static mock data** for worlds, levels, enemies, and battle stats — no auth or database required
- **Visual replicas** of RPGWorldMap, RPGLevelSelect, and RPGBattleArena rendered with mock props so the user sees exactly what the real RPG looks like
- **Same interactive tour UI** (bottom bar with prev/next, step indicators, highlighted sections) matching the school demo style
- Themed with game mode colors/gradients (dark background, RPG-style)

### 2. Update `src/pages/game/GameDashboard.tsx`

Change the third mode card:

- Title: "Free Reading" → **"Game Demo"**
- Description: "Try a quick demo of the RPG reading adventure"
- Icon: `Mic` → `Gamepad2`
- Colors: keep green or switch to a purple/gaming gradient
- `onClick`: `navigate('/game/demo')` instead of `/game/play?tab=reading`

### 3. Fix RPG Campaign button — trigger RPG mode from URL

In `src/pages/student/AuraPractice.tsx` (lines 122-128), update the `useEffect` that handles URL params: when `tab=rpg` is detected, call `setIsRpgMode(true)` so clicking "RPG Campaign" from the dashboard actually opens the RPG world map.

### 4. Update `src/App.tsx`

- Import `GameRPGDemo` (lazy)
- Add route: `/game/demo` → `GameRPGDemo` (public, no auth required — it's a demo)

## Files Modified

1. `src/pages/game/GameRPGDemo.tsx` — **new** — standalone RPG demo with tour
2. `src/pages/game/GameDashboard.tsx` — update third card to "Game Demo"
3. `src/pages/student/AuraPractice.tsx` — fix `tab=rpg` to trigger `setIsRpgMode(true)`
4. `src/App.tsx` — add `/game/demo` route

&nbsp;

&nbsp;

***Remeber, the demo for this should be a demo of the RPG game mode. Make sure that this demo is a completely separate demo than the one in the school mode. This demo should have the same type of look, feel, function and interactiveness as the demo in the school mode, but should be completely separate and should be for the RPG mode ONLY.***