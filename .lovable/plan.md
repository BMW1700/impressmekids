## What's actually broken

Walking through the two screenshots and the code paths:

1. **Dashboard says "Welcome back, Adventurer!" instead of the student's name.** `GameDashboard.tsx` reads `profile?.full_name` from `useAuth()`. The AuthContext profile comes from the `get_user_profile` RPC. When that RPC returns nothing or errors for student-ID logins, `profile` stays `null` and the UI silently falls back to "Adventurer". No console error is surfaced.

2. **All six stat cards show `0`.** `useGameReadingSummary` + the `student_reading_stats` query are gated only on `!!user?.id`. If RLS denies the read (e.g. the row is keyed by `student_id` ≠ `auth.uid()` mapping for that account) the query returns `null` and we silently render zeros. Same for `useCampaignProgress` — it falls back to `DEFAULT_PROGRESS` so gold/XP look like a brand-new account every login.

3. **"Loading your stories…" never resolves in the level dialog.** `CustomStoryChooser` calls `listStoriesForRpgLevel(...)`. The function `throw`s on supabase error, but the chooser only chains `.then().finally()` with no `.catch()`. When the query rejects (RLS denial, schema error, or a hanging request before the session token is attached), the promise rejects, `.then` is skipped, `.finally` clears `loading` — but the *unhandled rejection* is what we're seeing. Worse: if the request is genuinely hanging (token race), `.finally` never fires and the spinner is stuck forever. That matches the screenshot exactly.

4. **"Can't click most levels."** Levels 2+ render locked because `campaignProgress.world_progress` is the `DEFAULT_PROGRESS` fallback (see #2). It's not a click bug — it's the same data-load failure.

So root cause is one theme: **data-fetching code in game mode silently swallows failures and has no visibility, and at least one path hangs forever.** On top of that, AuthContext's profile fetch can return `null` for student accounts and we never retry or log it.

## Fix plan

### 1. Surface failures instead of hiding them
- `CustomStoryChooser.tsx` (lines 52-64): add `.catch` that sets `loading=false`, logs the error, and shows an inline "Couldn't load your custom stories — using the built-in one." message. Add an `AbortController` + 8s timeout so a hanging request can't pin the spinner forever.
- `useCampaignProgress`, `useGameReadingSummary`, the `student_reading_stats` query in `GameDashboard`, and the `profile` query in `AuraPractice`: add `onError` (TanStack v5: `meta: { errorMessage }` + a shared `queryCache.onError`) that `console.error`s with the query key. No UI churn, just observability for the next pass.

### 2. Fix the dashboard "Adventurer" fallback
- `GameDashboard.tsx` line 279: prefer `profile?.full_name` from `useAuth()`, then fall back to `user?.user_metadata?.full_name`, then `user?.email?.split('@')[0]`, then `"Adventurer"`. That covers student-ID accounts whose `profiles.full_name` is empty.
- `AuthContext.fetchProfile`: when the RPC returns `[]` (no profile row), fall back to building a minimal profile from the verification select (which already runs in parallel) so `profile` is never `null` for a signed-in user. Today an empty RPC result silently strands `profile = null`.

### 3. Don't silently render zeros when stats fail to load
- `GameDashboard.tsx` stat grid: thread the query's `error` / `isError` through and, when the query errored, show a small "Couldn't load stats — tap to retry" chip instead of `0`s. Same for `useGameReadingSummary`. This makes the broken-state visible instead of looking like "I logged in but nothing counted."

### 4. Verify the actual data path for Student A
After the fixes above land, the console will tell us which of these is the real culprit:
- `student_reading_stats` RLS denial → fix the SELECT policy (probably needs `student_id = auth.uid()` or a `has_role` check).
- `campaign_progress` empty for this `grade_mode` → call `initializeProgress` on first dashboard load when `progress` is `null`, instead of waiting for the user to start a battle.
- `get_user_profile` RPC returning empty → patched by step 2's fallback.

I'll wire these up in this order and then re-run the dashboard while signed in as Student A to confirm name, stats, and level unlocks all appear, and the story chooser either lists stories or shows the error inline (never an infinite spinner).

## Files to edit

- `src/components/customStories/CustomStoryChooser.tsx` — error handling + timeout
- `src/pages/game/GameDashboard.tsx` — name fallback chain, error chips on stat cards, auto-init campaign progress when null
- `src/contexts/AuthContext.tsx` — fallback profile when RPC returns empty
- `src/hooks/useCampaignProgress.ts` — `onError` logging
- `src/hooks/useGameReadingSummary.ts` — `onError` logging
- `src/pages/student/AuraPractice.tsx` — `onError` logging on the local `profile` query

No schema/RLS changes in this pass — first I want the errors visible so we can target the right policy. If step 4 turns up an RLS denial I'll follow with a focused migration.
