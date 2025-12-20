-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_all_teachers();
DROP FUNCTION IF EXISTS public.get_all_students();
DROP FUNCTION IF EXISTS public.get_all_admins();

-- Recreate get_all_teachers function with school info
CREATE FUNCTION public.get_all_teachers()
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  classroom_count bigint,
  school_id uuid,
  school_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_district text;
BEGIN
  SELECT district_id INTO v_admin_district FROM profiles WHERE profiles.id = auth.uid();
  
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    COALESCE(COUNT(DISTINCT c.id), 0) as classroom_count,
    p.school_id,
    s.name as school_name
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  LEFT JOIN classrooms c ON c.teacher_id = p.id
  LEFT JOIN schools s ON s.id = p.school_id
  WHERE ur.role = 'teacher'
    AND (v_admin_district IS NULL OR p.district_id = v_admin_district)
  GROUP BY p.id, p.full_name, p.email, p.school_id, s.name
  ORDER BY p.full_name;
END;
$$;

-- Recreate get_all_students function with school info
CREATE FUNCTION public.get_all_students()
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  classroom_count bigint,
  parent_count bigint,
  school_id uuid,
  school_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_district text;
BEGIN
  SELECT district_id INTO v_admin_district FROM profiles WHERE profiles.id = auth.uid();
  
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    COALESCE(COUNT(DISTINCT cs.classroom_id), 0) as classroom_count,
    COALESCE(COUNT(DISTINCT psl.parent_id), 0) as parent_count,
    p.school_id,
    s.name as school_name
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  LEFT JOIN classroom_students cs ON cs.student_id = p.id
  LEFT JOIN parent_student_links psl ON psl.student_id = p.id AND psl.approved = true
  LEFT JOIN schools s ON s.id = p.school_id
  WHERE ur.role = 'student'
    AND (v_admin_district IS NULL OR p.district_id = v_admin_district)
  GROUP BY p.id, p.full_name, p.email, p.school_id, s.name
  ORDER BY p.full_name;
END;
$$;

-- Recreate get_all_admins function with school info
CREATE FUNCTION public.get_all_admins()
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  created_at timestamptz,
  school_id uuid,
  school_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_district text;
BEGIN
  SELECT district_id INTO v_admin_district FROM profiles WHERE profiles.id = auth.uid();
  
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.created_at,
    p.school_id,
    s.name as school_name
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  LEFT JOIN schools s ON s.id = p.school_id
  WHERE ur.role = 'admin'
    AND (v_admin_district IS NULL OR p.district_id = v_admin_district)
  ORDER BY p.full_name;
END;
$$;

-- Add policy for admins to update school_id on profiles in their district
CREATE POLICY "Admins can update school_id for users in their district"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    JOIN user_roles ur ON ur.user_id = admin_profile.id
    WHERE admin_profile.id = auth.uid()
    AND ur.role = 'admin'
    AND (admin_profile.district_id IS NULL OR admin_profile.district_id = profiles.district_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    JOIN user_roles ur ON ur.user_id = admin_profile.id
    WHERE admin_profile.id = auth.uid()
    AND ur.role = 'admin'
    AND (admin_profile.district_id IS NULL OR admin_profile.district_id = profiles.district_id)
  )
);