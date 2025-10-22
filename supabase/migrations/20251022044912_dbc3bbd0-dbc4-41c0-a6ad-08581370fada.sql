-- Issue #2 Fix: Lock down profiles table to prevent cross-user email/name exposure
-- Users can only view their OWN profile directly
-- All other access (teachers viewing students, parents viewing children) must go through security definer functions

-- Drop any permissive policies that allow cross-user viewing
DROP POLICY IF EXISTS "Users can view other profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Parents can view child profiles" ON public.profiles;

-- Restrict SELECT to own profile only
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Users can insert their own profile (for signup)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Add explicit deny for anonymous users
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- Note: All authorized cross-user access (teachers viewing students, parents viewing children)
-- now goes through security definer functions like:
-- - get_parent_child_info()
-- - get_classroom_students()
-- - get_classroom_student_display_info()
-- These functions enforce proper authorization and log access