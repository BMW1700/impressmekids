## What's broken

From the screenshots and code audit, three things are stacking on top of each other on the AURA Reading page:

1. **"Checking your session…" never resolves.** `RequireAuth` reads `isLoading` from `AuthContext`, but the game route is gated until session resolves. If `supabase.auth.getSession()` is slow or the listener fires before the initial `getSession` resolves, users get parked on the "Still loading…" notice.
2. **Empty "header" boxes that just sit there.** Inside `AuraPractice`, `GamificationHeader` and `SmartNotifications` render before `user` is known. Because `AuraPractice` fetches the user with its own `useQuery(['user'])` calling `supabase.auth.getUser()` (separate from `AuthContext`), `user` is `undefined` for the first paint and these two components render empty placeholder bars — exactly the blank rectangles in your screenshots.
3. **Clicking "Enter World Map" (RPG Mode) does nothing.** The RPG render branch in `AuraPractice` is gated on `isRpgMode && rpgView === 'world_map' && user?.id`. When the local `useQuery(['user'])` hasn't resolved (or returns null in game mode), `user?.id` is falsy, so `setIsRpgMode(true)` flips state but the conditional drops through to the default tabs view — the button "does nothing" from the user's perspective. Same root cause applies to the Castle Mode button when it routes into a `/game/*` protected route that's still stuck on RequireAuth.

## Fix plan

### 1. Single source of truth for `user` in `AuraPractice`
- Replace the local `useQuery(['user'])` + `useQuery(['profile', user?.id])` block with values from `useAuth()` (`user`, `profile`, `isLoading`).
- Delete the duplicate `supabase.auth.getUser()` call so we stop racing the centralized listener.

### 2. Gate the page on auth resolution
- While `isLoading` from `AuthContext` is true, render the existing spinner instead of the full layout. This eliminates the flicker where `GamificationHeader` / `SmartNotifications` mount with no user and paint empty bars.
- After `isLoading` resolves, render normally. `GamificationHeader` and `SmartNotifications` will now always receive a real `studentId`.

### 3. Make the RPG/Castle buttons resilient
- In the `onStartRpgMode` handler, if `user?.id` isn't ready yet, show a toast ("Loading your profile…") instead of silently flipping state.
- Loosen the render gate so `isRpgMode && rpgView === 'world_map'` renders the world map shell even if `user?.id` arrives a tick later — pass `user?.id` down and let child components handle the brief loading state. This guarantees the click always produces a visible UI change.

### 4. Quick audit of `RequireAuth` / `AuthContext`
- Confirm the `onAuthStateChange` callback doesn't `await` Supabase calls inside the callback (it doesn't today — profile fetch is in a separate effect — keep it that way).
- Keep the existing "preserve previous profile on transient errors" behavior so tab returns don't blank the UI.
- No schema changes; this is frontend-only.

### Files to edit
- `src/pages/student/AuraPractice.tsx` — swap local user query for `useAuth()`, add `isLoading` gate, guard RPG button.
- (Reference only, no changes expected) `src/contexts/AuthContext.tsx`, `src/components/auth/RequireAuth.tsx`.

### Out of scope
- No backend / RLS changes.
- No design changes to the AURA Reading layout itself.
- The earlier audio-mix editor work is untouched.
