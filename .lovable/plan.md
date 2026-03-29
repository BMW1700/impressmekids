

# Plan: Allow Substitute Teachers to Bypass School Profile Requirement

## Problem
The `/classrooms/:id` route is inside `<RequireSchoolProfile />`, so substitute teachers (who have no role or district) get redirected to `/school/setup` instead of reaching the classroom. The substitute flow uses `sessionStorage` to store access credentials — no actual Supabase auth account is needed.

## Solution

### 1. Update `src/components/auth/RequireSchoolProfile.tsx`
Add a check: if `sessionStorage` contains a valid `substituteAccess` entry, allow the user through without requiring role + district. This is the same session key the substitute login flow already sets.

```typescript
const substituteAccess = sessionStorage.getItem('substituteAccess');
if (substituteAccess) {
  try {
    const parsed = JSON.parse(substituteAccess);
    // Only allow through if substitute access hasn't expired
    if (parsed.accessEnd && new Date(parsed.accessEnd) > new Date()) {
      return <Outlet />;
    }
  } catch {}
}
```

This check goes right after the loading spinner, before the role/district check. Substitute teachers skip the school profile requirement entirely.

### 2. No other changes needed
- The substitute login flow in `Auth.tsx` already stores the session and navigates to `/classrooms/:id`
- The `RequireAuth` guard handles the broader auth check (substitute teachers may or may not have an account — the flow already works via `sessionStorage`)
- `SchoolSetup.tsx` remains unchanged

## Files Modified
1. `src/components/auth/RequireSchoolProfile.tsx` — add substituteAccess sessionStorage bypass

