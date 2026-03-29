

# Game Mode Issues — Honest Assessment & Fix Plan

## What Works
- Routing structure is correct
- ModeSelect page correctly links and redirects
- GameAuth UI is solid
- GameDashboard, GameAnalytics, GameHeader are well-built
- RLS policies for `game_player` were created correctly
- `game_player` was added to `app_role` enum

## What's Broken

### 1. CRITICAL: Signup assigns `student` instead of `game_player`
The `handle_new_user()` trigger has a CASE statement that only handles `teacher`, `student`, `admin`, `parent`. The `ELSE` branch defaults to `student`. So every game mode signup silently becomes a student — they'll never see the game dashboard and will be redirected to the student dashboard.

**Fix:** Update `handle_new_user()` to add a `WHEN 'game_player'` branch. Also add `game_player` to the `user_role` enum (separate from `app_role`) since `profiles.role` uses that type.

### 2. CRITICAL: Post-email-verification role assignment never happens
GameAuth line 65-68 tries to upsert `user_roles` after signup, but only runs when `data.session` exists (auto-confirm). Email confirmation is NOT auto-enabled, so users verify via email, come back, and the upsert code never runs. The trigger fix in #1 solves this since the trigger fires at signup time regardless.

### 3. MODERATE: GamePlay doesn't actually work as a game mode experience
`GamePlay.tsx` just renders `AuraPractice` which has its own student-focused header, classroom navigation, and doesn't consume the `?tab=rpg` query param from the dashboard links. Users always see the default AuraPractice tab, not the RPG they clicked on.

**Fix:** Pass `initialTab` and `gameMode` props to AuraPractice (or wrap it with overrides). Strip school-specific UI when in game mode context.

### 4. MODERATE: RequireAuth redirects to `/auth` (school login)
If a game mode user's session expires while on `/game/dashboard`, they get sent to the school auth page, not `/game/auth`. Confusing for consumer users.

**Fix:** Update RequireAuth to detect game routes and redirect to `/game/auth` instead.

### 5. MINOR: PhonemeHeatmap prop mismatch
GameAnalytics passes `students` and `skillVectors` props to PhonemeHeatmap, but I'd need to verify the component actually accepts data in that shape for a single-user case (it was built for classroom-level display).

## Database Migration Needed
```sql
-- Add game_player to user_role enum (profiles.role uses this)
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'game_player';

-- Update handle_new_user to recognize game_player
CREATE OR REPLACE FUNCTION public.handle_new_user() ...
  WHEN 'game_player' THEN
    final_role := 'game_player'::app_role;
    final_user_role := 'game_player'::user_role;
  ...
```

## Files to Modify
1. **1 migration** — add `game_player` to `user_role` enum + update `handle_new_user()` trigger
2. **`src/pages/game/GamePlay.tsx`** — pass game mode context and initial tab to AuraPractice
3. **`src/pages/student/AuraPractice.tsx`** — accept `gameMode` prop to hide school-specific UI
4. **`src/components/auth/RequireAuth.tsx`** — redirect game routes to `/game/auth`
5. **`src/pages/game/GameAuth.tsx`** — remove the dead upsert code (trigger handles it now)

## Summary
The scaffolding is solid but the signup pipeline is fundamentally broken — no game mode user would actually get the `game_player` role today. That's the #1 fix. After that, the play experience needs polish to actually feel like a consumer product rather than a student dashboard wrapper.

