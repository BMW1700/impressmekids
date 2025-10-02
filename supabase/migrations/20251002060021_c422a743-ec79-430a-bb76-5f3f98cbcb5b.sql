-- Create security definer functions to avoid RLS recursion

-- Function to check if user is teacher of a classroom
CREATE OR REPLACE FUNCTION public.is_classroom_teacher(_user_id uuid, _classroom_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classrooms
    WHERE id = _classroom_id
      AND teacher_id = _user_id
  )
$$;

-- Function to check if user is student in a classroom
CREATE OR REPLACE FUNCTION public.is_classroom_student(_user_id uuid, _classroom_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classroom_students
    WHERE classroom_id = _classroom_id
      AND student_id = _user_id
  )
$$;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Students can view classrooms they're in" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers can view students in their classrooms" ON public.classroom_students;

-- Recreate policies using security definer functions to break circular dependency
CREATE POLICY "Students can view classrooms they're in"
ON public.classrooms
FOR SELECT
USING (public.is_classroom_student(auth.uid(), id));

CREATE POLICY "Teachers can view students in their classrooms"
ON public.classroom_students
FOR SELECT
USING (public.is_classroom_teacher(auth.uid(), classroom_id));