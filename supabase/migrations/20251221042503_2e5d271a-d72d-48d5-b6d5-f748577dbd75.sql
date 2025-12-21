-- Drop existing function and recreate with student_id field
DROP FUNCTION IF EXISTS get_all_students();

CREATE FUNCTION get_all_students()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  classroom_count bigint,
  parent_count bigint,
  school_id uuid,
  school_name text,
  student_id text
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
    s.name as school_name,
    p.student_id
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  LEFT JOIN classroom_students cs ON cs.student_id = p.id
  LEFT JOIN parent_student_links psl ON psl.student_id = p.id AND psl.approved = true
  LEFT JOIN schools s ON s.id = p.school_id
  WHERE ur.role = 'student'
    AND (v_admin_district IS NULL OR p.district_id = v_admin_district)
  GROUP BY p.id, p.full_name, p.email, p.school_id, s.name, p.student_id
  ORDER BY p.full_name;
END;
$$;