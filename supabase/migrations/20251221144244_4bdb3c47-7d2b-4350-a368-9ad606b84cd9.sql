-- Function to get classroom details for substitute teachers
CREATE OR REPLACE FUNCTION public.get_classroom_for_substitute(
  p_classroom_id uuid,
  p_link_id uuid
)
RETURNS TABLE (
  id uuid,
  name text,
  teacher_id uuid,
  join_code text,
  subject text,
  grade int,
  location text,
  meeting_days text[],
  start_time text,
  end_time text,
  schedule_start_date date,
  schedule_end_date date,
  created_at timestamptz,
  permissions jsonb,
  substitute_name text,
  access_end timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the link is valid and active
  IF NOT EXISTS (
    SELECT 1 FROM substitute_access_links sal
    WHERE sal.id = p_link_id
      AND sal.classroom_id = p_classroom_id
      AND sal.is_active = true
      AND sal.access_end >= now()
  ) THEN
    RAISE EXCEPTION 'Invalid or expired substitute access';
  END IF;
  
  -- Return classroom data along with permissions
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.teacher_id,
    c.join_code,
    c.subject,
    c.grade,
    c.location,
    c.meeting_days,
    c.start_time,
    c.end_time,
    c.schedule_start_date,
    c.schedule_end_date,
    c.created_at,
    sal.permissions,
    sal.substitute_name,
    sal.access_end
  FROM classrooms c
  JOIN substitute_access_links sal ON sal.classroom_id = c.id
  WHERE c.id = p_classroom_id
    AND sal.id = p_link_id;
END;
$$;

-- Function to get students for substitute teachers (respects permissions)
CREATE OR REPLACE FUNCTION public.get_students_for_substitute(
  p_classroom_id uuid,
  p_link_id uuid
)
RETURNS TABLE (
  student_id uuid,
  joined_at timestamptz,
  full_name text,
  email text,
  grade int,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_permissions jsonb;
BEGIN
  -- Get and verify permissions
  SELECT sal.permissions INTO v_permissions
  FROM substitute_access_links sal
  WHERE sal.id = p_link_id
    AND sal.classroom_id = p_classroom_id
    AND sal.is_active = true
    AND sal.access_end >= now();
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired substitute access';
  END IF;
  
  -- Check if substitute has permission to view students
  IF NOT (v_permissions->>'view_students')::boolean THEN
    RETURN; -- Return empty result set
  END IF;
  
  -- Return students
  RETURN QUERY
  SELECT 
    cs.student_id,
    cs.joined_at,
    p.full_name,
    p.email,
    sp.grade,
    sp.avatar_url
  FROM classroom_students cs
  JOIN profiles p ON p.id = cs.student_id
  LEFT JOIN student_profiles sp ON sp.id = cs.student_id
  WHERE cs.classroom_id = p_classroom_id;
END;
$$;