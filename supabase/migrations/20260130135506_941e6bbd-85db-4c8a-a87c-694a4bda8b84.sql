-- Fix infinite recursion in profiles RLS policies
-- The issue: policies on profiles query classrooms/schools, which have policies querying profiles

-- 1. Drop the problematic "Students can view their classroom teachers" policy
-- and recreate it using a SECURITY DEFINER function to break the recursion
DROP POLICY IF EXISTS "Students can view their classroom teachers" ON public.profiles;

-- 2. Create a SECURITY DEFINER function that bypasses RLS to check teacher relationship
CREATE OR REPLACE FUNCTION public.is_teacher_of_student_classroom(_student_id uuid, _teacher_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1
    FROM classrooms c
    JOIN classroom_students cs ON cs.classroom_id = c.id
    WHERE cs.student_id = _student_id
      AND c.teacher_id = _teacher_id
  );
END;
$$;

-- 3. Recreate the policy using the function
CREATE POLICY "Students can view their classroom teachers"
ON public.profiles FOR SELECT TO authenticated
USING (
  is_teacher_of_student_classroom(auth.uid(), id)
);

-- 4. Fix "Admins can update school_id for users in their district" - this queries profiles from profiles
DROP POLICY IF EXISTS "Admins can update school_id for users in their district" ON public.profiles;

-- Create a SECURITY DEFINER function to check admin district access
CREATE OR REPLACE FUNCTION public.admin_can_update_profile_in_district(_admin_id uuid, _profile_district_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_district text;
  is_admin boolean;
BEGIN
  SET LOCAL row_security = off;
  
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _admin_id AND role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RETURN false;
  END IF;
  
  -- Get admin's district
  SELECT district_id INTO admin_district FROM profiles WHERE id = _admin_id;
  
  -- Allow if admin has no district (super admin) or districts match
  RETURN admin_district IS NULL OR admin_district = _profile_district_id;
END;
$$;

-- Recreate the policy using the function
CREATE POLICY "Admins can update school_id for users in their district"
ON public.profiles FOR UPDATE TO authenticated
USING (admin_can_update_profile_in_district(auth.uid(), district_id))
WITH CHECK (admin_can_update_profile_in_district(auth.uid(), district_id));

-- 5. Fix schools policies that query profiles
DROP POLICY IF EXISTS "Admins can view schools in their district" ON public.schools;
DROP POLICY IF EXISTS "Admins can update schools in their district" ON public.schools;
DROP POLICY IF EXISTS "Admins can delete schools in their district" ON public.schools;
DROP POLICY IF EXISTS "Users can view their own school" ON public.schools;

-- Create a SECURITY DEFINER function for admin school access
CREATE OR REPLACE FUNCTION public.admin_can_access_school(_admin_id uuid, _school_district_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_district text;
  is_admin boolean;
BEGIN
  SET LOCAL row_security = off;
  
  -- Check if user is admin or district_manager
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _admin_id AND role IN ('admin', 'district_manager')
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    -- Also check district_admins table
    SELECT EXISTS (
      SELECT 1 FROM district_admins da
      JOIN districts d ON d.name = da.district_name
      WHERE da.user_id = _admin_id AND d.district_code = _school_district_id
    ) INTO is_admin;
  END IF;
  
  IF NOT is_admin THEN
    RETURN false;
  END IF;
  
  -- Get admin's district from profiles
  SELECT district_id INTO admin_district FROM profiles WHERE id = _admin_id;
  
  -- Allow if districts match or admin has no district restriction
  RETURN admin_district IS NULL OR admin_district = _school_district_id;
END;
$$;

-- Recreate school policies using the function
CREATE POLICY "Admins can view schools in their district"
ON public.schools FOR SELECT TO authenticated
USING (admin_can_access_school(auth.uid(), district_id));

CREATE POLICY "Admins can update schools in their district"
ON public.schools FOR UPDATE TO authenticated
USING (admin_can_access_school(auth.uid(), district_id));

CREATE POLICY "Admins can delete schools in their district"
ON public.schools FOR DELETE TO authenticated
USING (admin_can_access_school(auth.uid(), district_id));

-- Create function to check if user belongs to school
CREATE OR REPLACE FUNCTION public.user_belongs_to_school(_user_id uuid, _school_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = _user_id AND school_id = _school_id
  );
END;
$$;

-- Recreate user's own school policy
CREATE POLICY "Users can view their own school"
ON public.schools FOR SELECT TO authenticated
USING (user_belongs_to_school(auth.uid(), id));

-- 6. Fix classrooms "Admins can view all classrooms" policy which queries profiles
DROP POLICY IF EXISTS "Admins can view all classrooms" ON public.classrooms;

-- Create function for admin classroom access
CREATE OR REPLACE FUNCTION public.admin_can_view_classroom(_admin_id uuid, _teacher_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_district text;
  teacher_district text;
  is_admin boolean;
BEGIN
  SET LOCAL row_security = off;
  
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _admin_id AND role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RETURN false;
  END IF;
  
  -- Get districts
  SELECT district_id INTO admin_district FROM profiles WHERE id = _admin_id;
  SELECT district_id INTO teacher_district FROM profiles WHERE id = _teacher_id;
  
  -- Allow if admin has no district (super admin) or districts match
  RETURN admin_district IS NULL OR admin_district = teacher_district;
END;
$$;

-- Recreate the policy
CREATE POLICY "Admins can view all classrooms"
ON public.classrooms FOR SELECT TO authenticated
USING (admin_can_view_classroom(auth.uid(), teacher_id));