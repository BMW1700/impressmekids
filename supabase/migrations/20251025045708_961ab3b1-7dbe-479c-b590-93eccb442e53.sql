-- Modify parent_access_requests table to support admin approval
ALTER TABLE public.parent_access_requests
  ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approval_type TEXT DEFAULT 'admin' CHECK (approval_type IN ('teacher', 'admin'));

-- Make classroom_id and teacher_id nullable for admin-only requests
ALTER TABLE public.parent_access_requests
  ALTER COLUMN classroom_id DROP NOT NULL,
  ALTER COLUMN teacher_id DROP NOT NULL;

-- Add RLS policy for admins to view all parent access requests
CREATE POLICY "Admins can view all parent access requests"
ON public.parent_access_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to update parent access requests
CREATE POLICY "Admins can update parent access requests"
ON public.parent_access_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to view all parent-student links
CREATE POLICY "Admins can view all parent-student links"
ON public.parent_student_links
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to insert parent-student links
CREATE POLICY "Admins can insert parent-student links"
ON public.parent_student_links
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to update parent-student links
CREATE POLICY "Admins can update parent-student links"
ON public.parent_student_links
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));