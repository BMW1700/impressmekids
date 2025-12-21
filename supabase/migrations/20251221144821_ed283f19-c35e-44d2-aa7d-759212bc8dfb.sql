-- Drop and recreate function with correct types
DROP FUNCTION IF EXISTS public.get_classroom_for_substitute(uuid, uuid);

CREATE FUNCTION public.get_classroom_for_substitute(
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
  start_time time,
  end_time time,
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