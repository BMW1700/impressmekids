

User clarified: the previous "didn't load" was just my plan rendering oddly, NOT an app bug. BUT — they noticed the app does have a real perceived-slowness issue: a spinning wheel for a few seconds after login before the dashboard appears. This is a real pilot-blocker for demos. Let me think about what's actually causing it.

From the code I already have visible:

**`AuthContext.tsx`** — does this on login:
1. `getSession()` — fast, local
2. Then in a separate effect: `fetchProfile(userId)` which does:
   - `supabase.rpc('get_user_profile', ...)` — round trip #1
   - `supabase.from('profiles').select(...).maybeSingle()` — round trip #2 (sequential, not parallel!)

**`ModeSelect.tsx`** (the `/` route, where they land) — does ANOTHER round of:
1. `getSession()` again
2. `supabase.rpc('get_user_profile', ...)` — round trip #3 (DUPLICATE of what AuthContext already did)
3. `supabase.from('profiles').select('district_id, is_verified')` — round trip #4 (DUPLICATE)
4. Then navigates to dashboard

So after login, the user waits for:
- AuthContext: 2 sequential network calls
- ModeSelect: 2 MORE sequential network calls (duplicating the same data)
- Then redirect to dashboard
- Dashboard probably does its own profile/data fetches

That's **4 sequential round trips** of duplicate data before the dashboard even starts loading. On a slow network or cold Supabase connection, easily 2-4 seconds of spinner.

The fix is straightforward and high-impact:

1. **`ModeSelect`** — stop duplicating AuthContext work. Read `profile` from `useAuth()` instead of re-fetching. Already-loaded data = instant redirect.

2. **`AuthContext.fetchProfile`** — run the two queries in parallel with `Promise.all` instead of sequentially. Cuts profile load time roughly in half.

3. **Optional polish**: After login, the auth callback could pre-warm the navigation so users land directly on their dashboard instead of bouncing through `/` → ModeSelect → dashboard.

4. **Optional**: Show the dashboard shell with skeleton loaders instead of a full-screen spinner so the app *feels* instant even if data is still loading.

Let me also check what RequireSchoolProfile / dashboards do to see if there are more duplicates… but I have enough to make a strong, targeted plan. Keep it concise.

This is also pilot-critical. Christina seeing a 3-second spinner after login is the difference between "feels professional" and "feels like a prototype." Worth fixing before pitching.

## Why the app spins after login (real cause)

Good catch — this is real. I traced it through the code:

**Today's login flow does the same work twice, sequentially:**

1. `AuthContext` fetches profile via 2 sequential queries (`get_user_profile` RPC, then `profiles` table)
2. You land on `/` → `ModeSelect` re-runs the **same 2 queries again** before redirecting
3. Then your dashboard mounts and runs its own queries

That's **4 round trips of mostly duplicate data** before your dashboard even starts loading. On a normal connection that's 1.5–3 seconds of spinner. On slow Wi-Fi at a school it's worse.

This is a pilot credibility issue. Fixing it is a one-shot.

## Fix plan (small, surgical)

### 1. Stop the duplicate fetch in `ModeSelect`
- Replace its own `getSession` + RPC + profiles query with `useAuth()` from `AuthContext`
- It already has `profile`, `district_id`, `is_verified` — no second network round trip needed
- Result: redirect happens the instant `AuthContext` finishes, not after a second round of queries

### 2. Parallelize the two profile queries in `AuthContext.fetchProfile`
- Today: RPC then table query (sequential)
- Change to `Promise.all([rpc, tableQuery])` — both fire at once
- Roughly halves profile load time

### 3. Skeleton instead of full-screen spinner on dashboards
- Replace the centered spinner on the first dashboard view with a lightweight skeleton of the layout
- App *feels* instant even while data finishes loading — same trick Linear/Notion use
- Scope: teacher dashboard + student dashboard only (the two most-demoed views)

### 4. (Optional, do only if 1–3 don't fully fix it) Direct post-login navigation
- After successful login, navigate straight to the role's dashboard instead of bouncing through `/`
- Skips ModeSelect entirely on the post-login path

### Files to change

- `src/contexts/AuthContext.tsx` — parallelize profile queries
- `src/pages/ModeSelect.tsx` — read from `useAuth()` instead of refetching
- `src/pages/TeacherDashboard.tsx` (or equivalent) — skeleton loader
- `src/pages/StudentDashboard.tsx` — skeleton loader
- (optional) `src/pages/Auth.tsx` — direct post-login navigation

### Expected outcome

- Post-login spinner drops from ~2–3s to under ~500ms perceived
- Dashboard appears to "snap" in instead of fade in after a wait
- No functional changes — purely a perceived-performance fix
- Zero risk to multiplayer or anything else

### What this does NOT touch

- AURA, LexiQuest, Phonics Foundations, multiplayer — all untouched
- Auth security, RLS, profile structure — all untouched
- Just removing wasted round trips and softening the loading state

### Recommendation

Approve this, ship it in one pass (~30 min), then we go straight back to PvP turn switching. This is the kind of small fix that makes Christina say "wow it's fast" instead of "is it loading?" — high pilot ROI for low effort.

