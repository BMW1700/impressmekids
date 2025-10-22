-- Issue #2 FINAL FIX: Complete cleanup of profiles table RLS
-- Drop ALL existing SELECT policies that allow cross-user viewing

-- Drop the permissive policies we know exist
DROP POLICY IF EXISTS "Teachers can view student profiles in their classrooms" ON public.profiles;
DROP POLICY IF EXISTS "Students can view teacher profiles in their classrooms" ON public.profiles;
DROP POLICY IF EXISTS "Parents can view student profiles" ON public.profiles;
DROP POLICY IF EXISTS "District admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in same classroom" ON public.profiles;
DROP POLICY IF EXISTS "Classroom members can view each other" ON public.profiles;

-- Drop any other potential SELECT policies
DROP POLICY IF EXISTS "Users can view other profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Now create the ONLY SELECT policy: users can view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Verify UPDATE and INSERT policies are still correct
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Ensure anonymous users are blocked
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);