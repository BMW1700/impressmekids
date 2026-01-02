-- Add RLS policy to allow club owners to view posts in their clubs
CREATE POLICY "Club owners can view posts in their clubs"
ON public.club_posts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clubs c
    WHERE c.id = club_posts.club_id
    AND c.owner_id = auth.uid()
  )
);