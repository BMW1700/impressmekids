-- PHASE 1 SECURITY FIX: Fix User Email Enumeration Vulnerability
-- Drop overly permissive policy that allows any authenticated user to see all profiles

-- First, create a security definer function to check if two users share a classroom
CREATE OR REPLACE FUNCTION public.is_classmate(_viewer_id uuid, _viewed_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Two users are classmates if they share at least one classroom
  SELECT EXISTS (
    SELECT 1
    FROM classroom_students cs1
    JOIN classroom_students cs2 ON cs1.classroom_id = cs2.classroom_id
    WHERE cs1.student_id = _viewer_id
      AND cs2.student_id = _viewed_id
  )
$$;

-- Drop the existing overly permissive policy on public_profiles
DROP POLICY IF EXISTS "Authenticated users can view public profiles" ON public.public_profiles;

-- Create restrictive policies for public_profiles
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own public profile"
ON public.public_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy 2: Students can view profiles of their classmates
CREATE POLICY "Students can view classmate profiles"
ON public.public_profiles
FOR SELECT
TO authenticated
USING (is_classmate(auth.uid(), id));

-- Policy 3: Teachers can view profiles of students in their classrooms
CREATE POLICY "Teachers can view student profiles in their classrooms"
ON public.public_profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT cs.student_id
    FROM classroom_students cs
    JOIN classrooms c ON c.id = cs.classroom_id
    WHERE c.teacher_id = auth.uid()
  )
);

-- Policy 4: Parents can view profiles of their approved children
CREATE POLICY "Parents can view their children's profiles"
ON public.public_profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT psl.student_id
    FROM parent_student_links psl
    JOIN parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = auth.uid()
      AND psl.approved = true
  )
);

-- PHASE 1 SECURITY FIX: Harden Parent Account Access
-- Update existing policy to only allow access when parent-student link is approved

-- Drop and recreate the policy with approval check
DROP POLICY IF EXISTS "Teachers can view parent accounts for their students" ON public.parent_accounts;

CREATE POLICY "Teachers can view parent accounts for approved students only"
ON public.parent_accounts
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT psl.parent_id
    FROM parent_student_links psl
    JOIN classroom_students cs ON cs.student_id = psl.student_id
    JOIN classrooms c ON c.id = cs.classroom_id
    WHERE c.teacher_id = auth.uid()
      AND psl.approved = true  -- CRITICAL: Only approved links
  )
);

-- Add audit logging trigger for sensitive profile access
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when someone accesses a profile that isn't their own
  IF auth.uid() IS NOT NULL AND auth.uid() != NEW.id THEN
    INSERT INTO public.security_audit_log (
      user_id,
      action_type,
      table_name,
      record_id,
      metadata
    )
    VALUES (
      auth.uid(),
      'SELECT',
      'public_profiles',
      NEW.id,
      jsonb_build_object(
        'action', 'profile_view',
        'viewed_user_id', NEW.id,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;