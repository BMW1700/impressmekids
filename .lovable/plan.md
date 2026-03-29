

# Fix Plan: Game Mode Play Experience

## Problem
GamePlay.tsx renders AuraPractice directly, which shows school Header/Footer, ClassChallengeCard, ClassroomLeaderboardWrapper, and other school-specific UI. Consumer users see broken/empty school widgets.

## Solution
Add game-mode awareness to AuraPractice so it hides school-specific elements when accessed from `/game/play`.

### 1. Detect game mode in AuraPractice (`src/pages/student/AuraPractice.tsx`)
- Use `useLocation()` to check if path starts with `/game`
- OR accept a `gameMode` prop (passed from GamePlay)
- Set a `const isGameMode = ...` flag

### 2. Conditionally render based on `isGameMode`
When `isGameMode` is true:
- Replace `<Header />` with `<GameHeader />` (the game-mode header component)
- Remove `<Footer />`
- Hide `<ClassChallengeCard>`
- Hide `<ClassroomLeaderboardWrapper>`
- Hide the "Back to Dashboard" button that navigates to `/student-dashboard` — replace with one that goes to `/game/dashboard`
- Keep everything else: RPG, Stories, Reading, Presentations tabs all stay

### 3. Update GamePlay.tsx
- Minimal change — just pass `gameMode` prop or rely on URL detection in AuraPractice

### 4. Verify PhonemeHeatmap props in GameAnalytics
- Read PhonemeHeatmap component to confirm the `students` and `skillVectors` prop shapes match what GameAnalytics provides
- Fix any mismatches

## Files Modified
1. `src/pages/student/AuraPractice.tsx` — add game mode conditional rendering (~15 lines changed across 5 spots)
2. `src/pages/game/GamePlay.tsx` — potentially pass prop
3. `src/pages/game/GameAnalytics.tsx` — fix PhonemeHeatmap props if needed

## What stays untouched
- All RPG battle components, story library, reading flow — zero changes
- Database, RLS policies, auth — all already correct
- GameDashboard, GameAuth, GameHeader — already solid

