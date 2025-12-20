-- Update get_all_teachers to filter by district
DROP FUNCTION IF EXISTS get_all_teachers();
CREATE OR REPLACE FUNCTION get_all_teachers()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  classroom_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_district_id text;
BEGIN
  SET LOCAL row_security = off;
  
  -- Get the district_id of the current admin
  SELECT p.district_id INTO admin_district_id
  FROM profiles p
  WHERE p.id = auth.uid();
  
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.created_at,
    COUNT(c.id) as classroom_count
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  LEFT JOIN classrooms c ON c.teacher_id = p.id
  WHERE ur.role = 'teacher'::app_role
    AND (admin_district_id IS NULL OR p.district_id = admin_district_id)
  GROUP BY p.id, p.email, p.full_name, p.created_at
  ORDER BY p.full_name;
END;
$$;

-- Update get_all_students to filter by district
DROP FUNCTION IF EXISTS get_all_students();
CREATE OR REPLACE FUNCTION get_all_students()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  classroom_count bigint,
  parent_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_district_id text;
BEGIN
  SET LOCAL row_security = off;
  
  -- Get the district_id of the current admin
  SELECT p.district_id INTO admin_district_id
  FROM profiles p
  WHERE p.id = auth.uid();
  
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.created_at,
    COUNT(DISTINCT cs.classroom_id) as classroom_count,
    COUNT(DISTINCT psl.parent_id) FILTER (WHERE psl.approved = true) as parent_count
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  LEFT JOIN classroom_students cs ON cs.student_id = p.id
  LEFT JOIN parent_student_links psl ON psl.student_id = p.id
  WHERE ur.role = 'student'::app_role
    AND (admin_district_id IS NULL OR p.district_id = admin_district_id)
  GROUP BY p.id, p.email, p.full_name, p.created_at
  ORDER BY p.full_name;
END;
$$;

-- Update get_all_admins to filter by district
DROP FUNCTION IF EXISTS get_all_admins();
CREATE OR REPLACE FUNCTION get_all_admins()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_district_id text;
BEGIN
  SET LOCAL row_security = off;
  
  -- Get the district_id of the current admin
  SELECT p.district_id INTO admin_district_id
  FROM profiles p
  WHERE p.id = auth.uid();
  
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.created_at
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'admin'::app_role
    AND (admin_district_id IS NULL OR p.district_id = admin_district_id)
  ORDER BY p.full_name;
END;
$$;