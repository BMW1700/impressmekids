-- Fix: student_profiles doesn't have grade/avatar_url columns
DROP FUNCTION IF EXISTS public.get_students_for_substitute(uuid, uuid);

CREATE FUNCTION public.get_students_for_substitute(
  p_classroom_id uuid,
  p_link_id uuid
)
RETURNS TABLE (
  student_id uuid,
  joined_at timestamptz,
  full_name text,
  email text
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
  
  -- Return students with profile info
  RETURN QUERY
  SELECT 
    cs.student_id,
    cs.joined_at,
    p.full_name,
    p.email
  FROM classroom_students cs
  JOIN profiles p ON p.id = cs.student_id
  WHERE cs.classroom_id = p_classroom_id;
END;
$$;