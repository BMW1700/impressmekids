
-- 1. SCHOOLS: Drop public-readable policy
DROP POLICY IF EXISTS "Anyone can view schools" ON public.schools;

-- Authenticated users can see schools in their district
CREATE POLICY "Authenticated users can view schools in their district"
ON public.schools FOR SELECT TO authenticated
USING (
  user_belongs_to_school(auth.uid(), id)
  OR admin_can_access_school(auth.uid(), district_id)
  OR has_role(auth.uid(), 'admin')
);

-- 2. CLUB_MEMBERS: Drop public-readable policy
DROP POLICY IF EXISTS "Students can view club members" ON public.club_members;

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
DROP POLICY IF EXISTS "Anyone can browse clubs" ON public.clubs;
DROP POLICY IF EXISTS "Students can view all clubs" ON public.clubs;

-- Authenticated users can view clubs (login required)
CREATE POLICY "Authenticated users can view clubs"
ON public.clubs FOR SELECT TO authenticated
USING (true);
