-- Fix infinite recursion in assignment group RLS policies
-- Create SECURITY DEFINER function to get student's group IDs without triggering RLS
CREATE OR REPLACE FUNCTION public.get_student_group_ids(_student_id UUID)
RETURNS TABLE(group_id UUID)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT group_id 
  FROM public.assignment_group_members
  WHERE student_id = _student_id;
$$;

-- Drop and recreate the problematic RLS policies using the new function

-- Fix assignment_groups policy
DROP POLICY IF EXISTS "Students can view groups for their assignments" ON public.assignment_groups;
CREATE POLICY "Students can view groups for their assignments"
ON public.assignment_groups
FOR SELECT
TO authenticated
USING (
  id IN (SELECT * FROM public.get_student_group_ids(auth.uid()))
);

-- Fix assignment_group_members policy  
DROP POLICY IF EXISTS "Students can view members in their groups" ON public.assignment_group_members;
CREATE POLICY "Students can view members in their groups"
ON public.assignment_group_members
FOR SELECT
TO authenticated
USING (
  group_id IN (SELECT * FROM public.get_student_group_ids(auth.uid()))
);

-- Add missing INSERT policy for parent_consents to verify approved parent-student relationship
DROP POLICY IF EXISTS "Parents can insert consent for their students" ON public.parent_consents;
CREATE POLICY "Parents can insert consent for their students"
ON public.parent_consents
FOR INSERT
TO authenticated
WITH CHECK (
  parent_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.parent_student_links psl
    JOIN public.parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = auth.uid() 
      AND psl.student_id = parent_consents.student_id 
      AND psl.approved = true
  )
);

-- Add unique constraint to prevent duplicate consent records
ALTER TABLE public.parent_consents 
DROP CONSTRAINT IF EXISTS parent_consents_parent_student_unique;

ALTER TABLE public.parent_consents
ADD CONSTRAINT parent_consents_parent_student_unique 
UNIQUE (parent_id, student_id);