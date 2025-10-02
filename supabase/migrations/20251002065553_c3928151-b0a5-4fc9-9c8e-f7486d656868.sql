-- Step 1: Create secure user roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::text::app_role FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- RLS policy for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Step 2: Fix join classroom bug with security definer function
CREATE OR REPLACE FUNCTION public.join_classroom_by_code(p_join_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_classroom_id UUID;
  v_classroom_name TEXT;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Find classroom by join code
  SELECT id, name INTO v_classroom_id, v_classroom_name
  FROM public.classrooms
  WHERE join_code = UPPER(TRIM(p_join_code));
  
  IF v_classroom_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid join code');
  END IF;
  
  -- Check if already joined
  IF EXISTS (
    SELECT 1 FROM public.classroom_students
    WHERE classroom_id = v_classroom_id AND student_id = v_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_joined', true,
      'classroom_id', v_classroom_id,
      'classroom_name', v_classroom_name
    );
  END IF;
  
  -- Join classroom
  INSERT INTO public.classroom_students (classroom_id, student_id)
  VALUES (v_classroom_id, v_user_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'already_joined', false,
    'classroom_id', v_classroom_id,
    'classroom_name', v_classroom_name
  );
END;
$$;

-- Step 3: Create classroom announcements system
CREATE TABLE public.classroom_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    announcement_type TEXT NOT NULL DEFAULT 'announcement' CHECK (announcement_type IN ('announcement', 'assignment')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.classroom_announcements ENABLE ROW LEVEL SECURITY;

-- RLS policies for announcements
CREATE POLICY "Teachers can create announcements in their classrooms"
ON public.classroom_announcements
FOR INSERT
WITH CHECK (is_classroom_teacher(auth.uid(), classroom_id));

CREATE POLICY "Teachers can view announcements in their classrooms"
ON public.classroom_announcements
FOR SELECT
USING (is_classroom_teacher(auth.uid(), classroom_id));

CREATE POLICY "Students can view announcements in their classrooms"
ON public.classroom_announcements
FOR SELECT
USING (is_classroom_student(auth.uid(), classroom_id));

CREATE POLICY "Teachers can update their own announcements"
ON public.classroom_announcements
FOR UPDATE
USING (teacher_id = auth.uid() AND is_classroom_teacher(auth.uid(), classroom_id));

CREATE POLICY "Teachers can delete their own announcements"
ON public.classroom_announcements
FOR DELETE
USING (teacher_id = auth.uid() AND is_classroom_teacher(auth.uid(), classroom_id));

-- Enable realtime for announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.classroom_announcements;