-- Fix get_classroom_students to exclude teacher from student roster
-- Teachers should not appear in their own classroom's student list

CREATE OR REPLACE FUNCTION public.get_classroom_students(_user_id uuid, _classroom_id uuid)
RETURNS TABLE(student_id uuid, full_name text, email text, grade integer, avatar_url text, joined_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Return students, excluding the teacher
  RETURN QUERY
  SELECT 
    cs.student_id,
    p.full_name,
    p.email,
    pp.grade,
    pp.avatar_url,
    cs.joined_at
  FROM classroom_students cs
  JOIN profiles p ON p.id = cs.student_id
  LEFT JOIN public_profiles pp ON pp.id = cs.student_id
  JOIN classrooms c ON c.id = cs.classroom_id
  WHERE cs.classroom_id = _classroom_id
    AND cs.student_id != c.teacher_id  -- Exclude teacher from student list
  ORDER BY p.full_name;
END;
$function$;