-- Fix RLS policies to use security definer functions and avoid circular dependencies

-- ============================================
-- ASSIGNMENTS TABLE - Fix circular dependency
-- ============================================

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Teachers can view assignments in their classrooms" ON public.assignments;
DROP POLICY IF EXISTS "Students can view published assignments in their classrooms" ON public.assignments;

-- Recreate teacher policy using security definer function
CREATE POLICY "Teachers can view assignments in their classrooms"
ON public.assignments
FOR SELECT
TO authenticated
USING (public.is_classroom_teacher(auth.uid(), classroom_id));

-- Recreate student policy using security definer function
CREATE POLICY "Students can view published assignments in their classrooms"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  status = 'published' 
  AND public.is_classroom_student(auth.uid(), classroom_id)
);

-- ============================================
-- FLASHCARD_SETS TABLE - Fix circular dependency
-- ============================================

-- Drop existing policies that use EXISTS with classrooms table
DROP POLICY IF EXISTS "Teachers can view flashcard sets" ON public.flashcard_sets;
DROP POLICY IF EXISTS "Teachers can create flashcard sets" ON public.flashcard_sets;

-- Recreate using security definer function
CREATE POLICY "Teachers can view flashcard sets"
ON public.flashcard_sets
FOR SELECT
TO authenticated
USING (public.is_classroom_teacher(auth.uid(), classroom_id));

CREATE POLICY "Teachers can create flashcard sets"
ON public.flashcard_sets
FOR INSERT
TO authenticated
WITH CHECK (public.is_classroom_teacher(auth.uid(), classroom_id));

-- ============================================
-- QUESTION_GROUPS TABLE - Fix circular dependency
-- ============================================

-- Drop existing policies that use EXISTS with classrooms table
DROP POLICY IF EXISTS "Teachers can view groups in their classrooms" ON public.question_groups;
DROP POLICY IF EXISTS "Teachers can create groups in their classrooms" ON public.question_groups;

-- Recreate using security definer function
CREATE POLICY "Teachers can view groups in their classrooms"
ON public.question_groups
FOR SELECT
TO authenticated
USING (public.is_classroom_teacher(auth.uid(), classroom_id));

CREATE POLICY "Teachers can create groups in their classrooms"
ON public.question_groups
FOR INSERT
TO authenticated
WITH CHECK (public.is_classroom_teacher(auth.uid(), classroom_id));