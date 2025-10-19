-- Create security definer function to get classroom details for any authorized user
CREATE OR REPLACE FUNCTION public.get_classroom_detail(_user_id uuid, _classroom_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  join_code text,
  teacher_id uuid,
  created_at timestamptz,
  teacher_name text,
  teacher_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  
  -- Check if user has access (teacher, student, or parent of student)
  IF NOT EXISTS (
    -- Teacher check
    SELECT 1 FROM classrooms c WHERE c.id = _classroom_id AND c.teacher_id = _user_id
    UNION
    -- Student check
    SELECT 1 FROM classroom_students cs WHERE cs.classroom_id = _classroom_id AND cs.student_id = _user_id
    UNION
    -- Parent check
    SELECT 1 FROM classroom_students cs
    JOIN parent_student_links psl ON psl.student_id = cs.student_id
    JOIN parent_accounts pa ON pa.id = psl.parent_id
    WHERE cs.classroom_id = _classroom_id AND pa.user_id = _user_id AND psl.approved = true
  ) THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.join_code,
    c.teacher_id,
    c.created_at,
    p.full_name as teacher_name,
    p.email as teacher_email
  FROM classrooms c
  JOIN profiles p ON p.id = c.teacher_id
  WHERE c.id = _classroom_id;
END;
$$;

-- Create security definer function to get classroom students
CREATE OR REPLACE FUNCTION public.get_classroom_students(_user_id uuid, _classroom_id uuid)
RETURNS TABLE (
  student_id uuid,
  full_name text,
  email text,
  grade integer,
  avatar_url text,
  joined_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  
  -- Check if user has access to this classroom
  IF NOT EXISTS (
    SELECT 1 FROM classrooms c WHERE c.id = _classroom_id AND c.teacher_id = _user_id
    UNION
    SELECT 1 FROM classroom_students cs WHERE cs.classroom_id = _classroom_id AND cs.student_id = _user_id
    UNION
    SELECT 1 FROM classroom_students cs
    JOIN parent_student_links psl ON psl.student_id = cs.student_id
    JOIN parent_accounts pa ON pa.id = psl.parent_id
    WHERE cs.classroom_id = _classroom_id AND pa.user_id = _user_id AND psl.approved = true
  ) THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    cs.student_id,
    p.full_name,
    p.email,
    sp.grade,
    sp.avatar_url,
    cs.joined_at
  FROM classroom_students cs
  JOIN profiles p ON p.id = cs.student_id
  LEFT JOIN student_profiles sp ON sp.user_id = cs.student_id
  WHERE cs.classroom_id = _classroom_id
  ORDER BY p.full_name;
END;
$$;

-- Create security definer function to get teacher's classrooms
CREATE OR REPLACE FUNCTION public.get_teacher_classrooms(_user_id uuid)
RETURNS TABLE (
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
  WHERE c.teacher_id = _user_id
  GROUP BY c.id, c.name, c.join_code, c.created_at
  ORDER BY c.created_at DESC;
END;
$$;