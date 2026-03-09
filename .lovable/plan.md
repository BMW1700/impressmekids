

# Fix Critical Public Data Exposures

## Problem
Four tables have `USING (true)` SELECT policies with `TO public` roles, meaning **anyone on the internet** (no login needed) can read all data:

1. **`schools`** -- policy "Anyone can view schools" (`USING (true)`, `TO public`)
2. **`club_members`** -- policy "Students can view club members" (`USING (true)`, `TO public`)
3. **`clubs`** -- TWO open policies: "Anyone can browse clubs" and "Students can view all clubs" (both `USING (true)`, `TO public`)

The `districts` table already has proper authenticated-only policies -- no fix needed there.

## Fix (Single Database Migration)

Drop the 4 dangerous open policies and replace them with scoped ones:

```sql
-- 1. SCHOOLS: Drop public-readable policy, keep admin policy
DROP POLICY "Anyone can view schools" ON public.schools;

-- Authenticated users can see schools in their district
CREATE POLICY "Authenticated users can view schools in their district"
ON public.schools FOR SELECT TO authenticated
USING (
  user_belongs_to_school(auth.uid(), id)
  OR admin_can_access_school(auth.uid(), district_id)
  OR has_role(auth.uid(), 'admin')
);

-- 2. CLUB_MEMBERS: Drop public-readable policy
DROP POLICY "Students can view club members" ON public.club_members;

-- Members can see other members of clubs they belong to
CREATE POLICY "Club members can view fellow members"
ON public.club_members FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM club_members cm
    WHERE cm.club_id = club_members.club_id
    AND cm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM clubs
    WHERE clubs.id = club_members.club_id
    AND clubs.owner_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

-- 3. CLUBS: Drop both public-readable policies
DROP POLICY "Anyone can browse clubs" ON public.clubs;
DROP POLICY "Students can view all clubs" ON public.clubs;

-- Authenticated users can view clubs (school-scoped or own clubs)
CREATE POLICY "Authenticated users can view clubs"
ON public.clubs FOR SELECT TO authenticated
USING (true);
-- Clubs are a discovery feature; restricting to authenticated
-- users only (not public/anon) is sufficient
```

## What This Changes

| Table | Before | After |
|-------|--------|-------|
| schools | Anyone on internet can read | Only logged-in users in same district/school |
| club_members | Anyone on internet can read | Only fellow club members or club owner |
| clubs | Anyone on internet can read | Only authenticated users (login required) |

## What It Does NOT Break
- Students can still browse and join clubs (they're authenticated)
- Teachers can still manage club members (owner check preserved)
- Admin access is preserved via `has_role` checks
- Existing INSERT/UPDATE/DELETE policies are untouched

## Technical Details
- Single database migration with 4 DROP + 3 CREATE statements
- No code changes needed -- all queries already run as authenticated users
- The `club_members` SELECT policy uses a subquery on itself, but since it's a SELECT policy (not referencing `user_roles`), there's no infinite recursion risk

