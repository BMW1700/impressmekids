CREATE TABLE public.custom_level_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_role text NOT NULL CHECK (author_role IN ('student','parent','teacher')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  body text NOT NULL CHECK (char_length(body) BETWEEN 50 AND 5000),
  target_kind text NOT NULL CHECK (target_kind IN ('rpg_level','castle_band')),
  world_id int,
  level_id text,
  castle_band text CHECK (castle_band IS NULL OR castle_band IN ('K-5','6-12')),
  classroom_id uuid REFERENCES public.classrooms(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT custom_level_stories_target_check CHECK (
    (target_kind = 'rpg_level' AND world_id IS NOT NULL AND level_id IS NOT NULL AND castle_band IS NULL)
    OR (target_kind = 'castle_band' AND castle_band IS NOT NULL AND world_id IS NULL AND level_id IS NULL)
  )
);

CREATE INDEX custom_level_stories_author_idx ON public.custom_level_stories(author_id);
CREATE INDEX custom_level_stories_rpg_target_idx ON public.custom_level_stories(world_id, level_id) WHERE target_kind = 'rpg_level';
CREATE INDEX custom_level_stories_castle_target_idx ON public.custom_level_stories(castle_band) WHERE target_kind = 'castle_band';
CREATE INDEX custom_level_stories_classroom_idx ON public.custom_level_stories(classroom_id) WHERE classroom_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_level_stories TO authenticated;
GRANT ALL ON public.custom_level_stories TO service_role;

ALTER TABLE public.custom_level_stories ENABLE ROW LEVEL SECURITY;

-- Helper: is the given student visible to the given parent?
CREATE OR REPLACE FUNCTION public.parent_can_see_student(_parent_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parent_student_links
    WHERE parent_id = _parent_id AND student_id = _student_id
  )
$$;

-- Helper: is the given user in the given classroom?
CREATE OR REPLACE FUNCTION public.user_in_classroom(_user_id uuid, _classroom_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classroom_students
    WHERE classroom_id = _classroom_id AND student_id = _user_id
  )
$$;

-- Helper: does the given user own/teach the given classroom?
CREATE OR REPLACE FUNCTION public.user_owns_classroom(_user_id uuid, _classroom_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = _classroom_id AND teacher_id = _user_id
  )
$$;

-- SELECT: author, OR parent's linked child viewing parent's story,
--         OR parent viewing their child's story,
--         OR classroom member viewing teacher's story,
--         OR teacher viewing classroom story they own
CREATE POLICY "Read own or audience custom stories"
ON public.custom_level_stories
FOR SELECT
TO authenticated
USING (
  author_id = auth.uid()
  OR (
    author_role = 'parent'
    AND public.parent_can_see_student(author_id, auth.uid())
  )
  OR (
    author_role = 'student'
    AND public.parent_can_see_student(auth.uid(), author_id)
  )
  OR (
    author_role = 'teacher'
    AND classroom_id IS NOT NULL
    AND (
      public.user_in_classroom(auth.uid(), classroom_id)
      OR public.user_owns_classroom(auth.uid(), classroom_id)
    )
  )
);

CREATE POLICY "Authors insert their own stories"
ON public.custom_level_stories
FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors update their own stories"
ON public.custom_level_stories
FOR UPDATE
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors delete their own stories"
ON public.custom_level_stories
FOR DELETE
TO authenticated
USING (author_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER custom_level_stories_updated_at
BEFORE UPDATE ON public.custom_level_stories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();