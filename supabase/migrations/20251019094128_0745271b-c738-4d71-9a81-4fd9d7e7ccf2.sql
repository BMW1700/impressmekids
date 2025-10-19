-- Create security definer function to fetch student classrooms bypassing RLS
CREATE OR REPLACE FUNCTION public.get_student_classrooms(_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  join_code text,
  created_at timestamptz,
  teacher_name text,
  student_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Disable RLS for this function's queries
  SET LOCAL row_security = off;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.join_code,
    c.created_at,
    p.full_name as teacher_name,
    COUNT(DISTINCT cs2.student_id) as student_count
  FROM classroom_students cs
  JOIN classrooms c ON c.id = cs.classroom_id
  JOIN profiles p ON p.id = c.teacher_id
  LEFT JOIN classroom_students cs2 ON cs2.classroom_id = c.id
  WHERE cs.student_id = _user_id
  GROUP BY c.id, c.name, c.join_code, c.created_at, p.full_name;
END;
$$;