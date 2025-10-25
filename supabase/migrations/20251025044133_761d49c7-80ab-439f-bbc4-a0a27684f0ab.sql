-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_teacher_classrooms(uuid);
DROP FUNCTION IF EXISTS get_classroom_students_admin(uuid);
DROP FUNCTION IF EXISTS get_student_classrooms_admin(uuid);
DROP FUNCTION IF EXISTS get_student_parents_admin(uuid);
DROP FUNCTION IF EXISTS get_all_teachers();
DROP FUNCTION IF EXISTS get_all_students();
DROP FUNCTION IF EXISTS get_all_admins();

-- Add RLS policies for admin access to all tables
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
      ON profiles FOR SELECT
      TO authenticated
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'classrooms' 
    AND policyname = 'Admins can view all classrooms'
  ) THEN
    CREATE POLICY "Admins can view all classrooms"
      ON classrooms FOR SELECT
      TO authenticated
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'classroom_students' 
    AND policyname = 'Admins can view all classroom students'
  ) THEN
    CREATE POLICY "Admins can view all classroom students"
      ON classroom_students FOR SELECT
      TO authenticated
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'parent_student_links' 
    AND policyname = 'Admins can view all parent links'
  ) THEN
    CREATE POLICY "Admins can view all parent links"
      ON parent_student_links FOR SELECT
      TO authenticated
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Helper function: Get all teachers with classroom count
CREATE FUNCTION get_all_teachers()
RETURNS TABLE(
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
BEGIN
  SET LOCAL row_security = off;
  
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
  GROUP BY p.id, p.email, p.full_name, p.created_at
  ORDER BY p.full_name;
END;
$$;

-- Helper function: Get all students with counts
CREATE FUNCTION get_all_students()
RETURNS TABLE(
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
BEGIN
  SET LOCAL row_security = off;
  
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
  GROUP BY p.id, p.email, p.full_name, p.created_at
  ORDER BY p.full_name;
END;
$$;

-- Helper function: Get all admins
CREATE FUNCTION get_all_admins()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.created_at
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'admin'::app_role
  ORDER BY p.full_name;
END;
$$;

-- Helper function: Get teacher's classrooms
CREATE FUNCTION get_teacher_classrooms(p_teacher_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  join_code text,
  created_at timestamptz,
  student_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  
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

-- Helper function: Get classroom students (admin view)
CREATE FUNCTION get_classroom_students_admin(p_classroom_id uuid)
RETURNS TABLE(
  student_id uuid,
  full_name text,
  email text,
  joined_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  
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

-- Helper function: Get student's classrooms (admin view)
CREATE FUNCTION get_student_classrooms_admin(p_student_id uuid)
RETURNS TABLE(
  classroom_id uuid,
  classroom_name text,
  join_code text,
  teacher_name text,
  joined_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  
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

-- Helper function: Get student's parents (admin view)
CREATE FUNCTION get_student_parents_admin(p_student_id uuid)
RETURNS TABLE(
  parent_id uuid,
  parent_name text,
  parent_email text,
  approved boolean,
  approved_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  
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