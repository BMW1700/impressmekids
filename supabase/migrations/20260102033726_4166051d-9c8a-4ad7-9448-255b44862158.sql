-- Ensure RLS is enabled
ALTER TABLE public.club_posts ENABLE ROW LEVEL SECURITY;

-- Allow the club owner (teacher) to create announcements/posts for their club
DROP POLICY IF EXISTS "Club owners can create announcements" ON public.club_posts;
CREATE POLICY "Club owners can create announcements"
ON public.club_posts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1
    FROM public.clubs c
    WHERE c.id = club_posts.club_id
      AND c.owner_id = auth.uid()
  )
);
