-- Drop all existing SELECT policies on classrooms table
DROP POLICY IF EXISTS "Teachers can view their own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Students can view classrooms they're in" ON public.classrooms;

-- Recreate teacher access policy (simple, direct, no function calls)
CREATE POLICY "Teachers can view their own classrooms"
ON public.classrooms
FOR SELECT
TO authenticated
USING (teacher_id = auth.uid());

-- Recreate student access policy (using security definer function to avoid recursion)
CREATE POLICY "Students can view classrooms they're in"
ON public.classrooms
FOR SELECT
TO authenticated
USING (is_classroom_student(auth.uid(), id));