-- Update get_directory_teachers to filter by district
CREATE OR REPLACE FUNCTION public.get_directory_teachers()
RETURNS TABLE(id uuid, full_name text, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.email
  FROM profiles p
  WHERE p.role = 'teacher'
    AND (
      -- If user has a district, only show teachers from same district
      p.district_id = (SELECT district_id FROM profiles WHERE id = auth.uid())
      OR
      -- If user has no district, show nothing (or could show all for backwards compat)
      (SELECT district_id FROM profiles WHERE id = auth.uid()) IS NULL
    )
  ORDER BY p.full_name;
$$;

-- Update get_directory_admins to filter by district
CREATE OR REPLACE FUNCTION public.get_directory_admins()
RETURNS TABLE(id uuid, full_name text, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.email
  FROM profiles p
  WHERE p.role = 'admin'
    AND (
      p.district_id = (SELECT district_id FROM profiles WHERE id = auth.uid())
      OR
      (SELECT district_id FROM profiles WHERE id = auth.uid()) IS NULL
    )
  ORDER BY p.full_name;
$$;

-- Update get_teacher_classrooms to verify admin is in same district as teacher
CREATE OR REPLACE FUNCTION public.get_teacher_classrooms(p_teacher_id uuid)
RETURNS TABLE(id uuid, name text, join_code text, created_at timestamp with time zone, student_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_district text;
  v_teacher_district text;
BEGIN
  SET LOCAL row_security = off;
  
  -- Get the requesting user's district
  SELECT district_id INTO v_admin_district FROM profiles WHERE id = auth.uid();
  
  -- Get the teacher's district
  SELECT district_id INTO v_teacher_district FROM profiles WHERE id = p_teacher_id;
  
  -- If admin has a district, verify teacher is in same district
  IF v_admin_district IS NOT NULL AND v_admin_district != v_teacher_district THEN
    RETURN; -- Return empty result if districts don't match
  END IF;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.join_code,
    c.created_at,
    COUNT(cs.student_id) as student_count
  FROM classrooms c
  LEFT JOIN classroom_students cs ON cs.classroom_id = c.id
  WHERE c.teacher_id = p_teacher_id
  GROUP BY c.id, c.name, c.join_code, c.created_at
  ORDER BY c.created_at DESC;
END;
$$;

-- Update get_classroom_students_admin to verify classroom is in admin's district
CREATE OR REPLACE FUNCTION public.get_classroom_students_admin(p_classroom_id uuid)
RETURNS TABLE(student_id uuid, full_name text, email text, joined_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_district text;
  v_classroom_teacher_district text;
BEGIN
  SET LOCAL row_security = off;
  
  -- Get the requesting user's district
  SELECT district_id INTO v_admin_district FROM profiles WHERE id = auth.uid();
  
  -- Get the classroom's teacher's district
  SELECT p.district_id INTO v_classroom_teacher_district
  FROM classrooms c
  JOIN profiles p ON p.id = c.teacher_id
  WHERE c.id = p_classroom_id;
  
  -- If admin has a district, verify classroom teacher is in same district
  IF v_admin_district IS NOT NULL AND v_admin_district != v_classroom_teacher_district THEN
    RETURN; -- Return empty result if districts don't match
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id as student_id,
    p.full_name,
    p.email,
    cs.joined_at
  FROM classroom_students cs
  JOIN profiles p ON p.id = cs.student_id
  WHERE cs.classroom_id = p_classroom_id
  ORDER BY p.full_name;
END;
$$;

-- Update get_student_classrooms_admin to verify student is in admin's district
CREATE OR REPLACE FUNCTION public.get_student_classrooms_admin(p_student_id uuid)
RETURNS TABLE(classroom_id uuid, classroom_name text, join_code text, teacher_name text, joined_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_district text;
  v_student_district text;
BEGIN
  SET LOCAL row_security = off;
  
  -- Get the requesting user's district
  SELECT district_id INTO v_admin_district FROM profiles WHERE id = auth.uid();
  
  -- Get the student's district
  SELECT district_id INTO v_student_district FROM profiles WHERE id = p_student_id;
  
  -- If admin has a district, verify student is in same district
  IF v_admin_district IS NOT NULL AND v_admin_district != v_student_district THEN
    RETURN; -- Return empty result if districts don't match
  END IF;
  
  RETURN QUERY
  SELECT 
    c.id as classroom_id,
    c.name as classroom_name,
    c.join_code,
    p.full_name as teacher_name,
    cs.joined_at
  FROM classroom_students cs
  JOIN classrooms c ON c.id = cs.classroom_id
  JOIN profiles p ON p.id = c.teacher_id
  WHERE cs.student_id = p_student_id
  ORDER BY cs.joined_at DESC;
END;
$$;

-- Update get_student_parents_admin to verify student is in admin's district
CREATE OR REPLACE FUNCTION public.get_student_parents_admin(p_student_id uuid)
RETURNS TABLE(parent_id uuid, parent_name text, parent_email text, approved boolean, approved_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_district text;
  v_student_district text;
BEGIN
  SET LOCAL row_security = off;
  
  -- Get the requesting user's district
  SELECT district_id INTO v_admin_district FROM profiles WHERE id = auth.uid();
  
  -- Get the student's district
  SELECT district_id INTO v_student_district FROM profiles WHERE id = p_student_id;
  
  -- If admin has a district, verify student is in same district
  IF v_admin_district IS NOT NULL AND v_admin_district != v_student_district THEN
    RETURN; -- Return empty result if districts don't match
  END IF;
  
  RETURN QUERY
  SELECT 
    pa.id as parent_id,
    pa.full_name as parent_name,
    pa.email as parent_email,
    psl.approved,
    psl.approved_at
  FROM parent_student_links psl
  JOIN parent_accounts pa ON pa.id = psl.parent_id
  WHERE psl.student_id = p_student_id
  ORDER BY psl.approved_at DESC;
END;
$$;