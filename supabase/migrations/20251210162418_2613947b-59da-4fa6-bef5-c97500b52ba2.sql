-- Fix RLS infinite recursion on assignment_groups and assignment_group_members
-- The issue is that these policies reference each other causing infinite recursion

-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Students can view their own groups" ON public.assignment_groups;
DROP POLICY IF EXISTS "Students can view groups for their assignments" ON public.assignment_groups;
DROP POLICY IF EXISTS "Students can view members in their groups" ON public.assignment_group_members;

-- Create a single clean policy for assignment_groups using the existing SECURITY DEFINER function
-- get_student_group_ids already handles this correctly without recursion
CREATE POLICY "Students can view their assignment groups"
ON public.assignment_groups
FOR SELECT
USING (
  id IN (SELECT group_id FROM public.get_student_group_ids(auth.uid()))
);

-- Create a single clean policy for assignment_group_members using inline check
-- This avoids calling functions that query the same table
CREATE POLICY "Students can view their group members"
ON public.assignment_group_members
FOR SELECT
USING (
  group_id IN (SELECT group_id FROM public.get_student_group_ids(auth.uid()))
);