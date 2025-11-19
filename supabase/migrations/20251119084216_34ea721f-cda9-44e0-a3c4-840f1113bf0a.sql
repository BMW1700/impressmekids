-- Create clubs table
CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on clubs
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- Create club_members table
CREATE TABLE public.club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(club_id, user_id)
);

-- Enable RLS on club_members
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

-- Create club_posts table
CREATE TABLE public.club_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  post_type TEXT NOT NULL,
  event_date DATE,
  event_time TIME,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on club_posts
ALTER TABLE public.club_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clubs
CREATE POLICY "Students can view all clubs"
ON public.clubs FOR SELECT
USING (true);

CREATE POLICY "Students can create clubs"
ON public.clubs FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Club owners can update their clubs"
ON public.clubs FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Club owners can delete their clubs"
ON public.clubs FOR DELETE
USING (owner_id = auth.uid());

-- RLS Policies for club_members
CREATE POLICY "Students can view club members"
ON public.club_members FOR SELECT
USING (true);

CREATE POLICY "Club owners can add members"
ON public.club_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clubs
    WHERE clubs.id = club_members.club_id
    AND clubs.owner_id = auth.uid()
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Club owners can remove members"
ON public.club_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM clubs
    WHERE clubs.id = club_members.club_id
    AND clubs.owner_id = auth.uid()
  )
  OR user_id = auth.uid()
);

-- RLS Policies for club_posts
CREATE POLICY "Students can view posts in their clubs"
ON public.club_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = club_posts.club_id
    AND club_members.user_id = auth.uid()
  )
);

CREATE POLICY "Club owners and moderators can create posts"
ON public.club_posts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = club_posts.club_id
    AND club_members.user_id = auth.uid()
    AND club_members.role IN ('owner', 'moderator')
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Post creators can update their posts"
ON public.club_posts FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Post creators can delete their posts"
ON public.club_posts FOR DELETE
USING (created_by = auth.uid());