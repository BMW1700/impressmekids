

# Fix Tab-Switch Reload Issue - Full Audit Results

## Root Causes Identified

**1. Service Worker causing browser-level reloads**
The `public/sw.js` calls `self.skipWaiting()` on install. When the browser detects a new SW version (which can happen on any navigation or tab return), the new SW activates immediately and the browser may reload controlled pages. The `usePushNotifications.ts` hook re-registers the SW, undoing the hotfix that unregistered it. The hotfix in `main.tsx` only runs once (guarded by localStorage flag), so after the SW gets re-registered by push, the problem returns.

**2. Auth guards that navigate during render (not in useEffect)**
`TeacherDashboard.tsx` (lines 72-80) and `TeacherPersonalResources.tsx` (line 152-154) call `navigate()` directly in the render body, not inside `useEffect`. This is a React anti-pattern. During a Supabase token refresh, if `profile` is momentarily null between re-renders, these components immediately navigate away to `/auth`, making it look like the page "reloaded."

**3. `refetchOnMount: "always"` in QueryClient defaults**
In `src/App.tsx` line 100, `refetchOnMount: "always"` forces every query to refetch whenever a component mounts. Combined with any remounting behavior, this creates visible loading spinners and data flashing that feels like a reload.

## Plan

### Step 1: Kill the Service Worker entirely
- Delete `public/sw.js`
- In `main.tsx`: Remove the localStorage guard (`SW_HOTFIX_KEY`) so SW unregistration runs on EVERY page load unconditionally, cleaning up any lingering workers
- In `usePushNotifications.ts`: Remove the `navigator.serviceWorker.register()` call and `navigator.serviceWorker.ready` calls. The hook will still exist but will be a no-op (returns `isSupported: false`) until push is re-implemented without a SW
- Push notifications will be temporarily disabled. This is the price of stability.

### Step 2: Fix render-time navigation anti-patterns
- **`TeacherDashboard.tsx`**: Move the `if (!user || !profile)` and role/verification checks into the existing `useEffect` or a new one, instead of running them in the render body
- **`TeacherPersonalResources.tsx`**: Same fix - move the `if (!user || !profile)` guard into a `useEffect`
- These are the two files that navigate during render. Other dashboards (Student, Parent, Admin) already use `useEffect` correctly.

### Step 3: Change QueryClient default from `refetchOnMount: "always"` to `false`
- In `src/App.tsx`, change `refetchOnMount: "always"` to `refetchOnMount: false`
- Combined with the existing `staleTime: 2 * 60 * 1000`, data will persist through any minor remounts without triggering visible refetches
- Individual queries can override this if they need fresh data

### Files Modified
1. `public/sw.js` - DELETE
2. `src/main.tsx` - Remove localStorage guard, run SW cleanup unconditionally
3. `src/hooks/usePushNotifications.ts` - Disable SW registration, return unsupported
4. `src/pages/teacher/TeacherDashboard.tsx` - Move auth guard into useEffect
5. `src/pages/teacher/TeacherPersonalResources.tsx` - Move auth guard into useEffect
6. `src/App.tsx` - Change `refetchOnMount` to `false`

