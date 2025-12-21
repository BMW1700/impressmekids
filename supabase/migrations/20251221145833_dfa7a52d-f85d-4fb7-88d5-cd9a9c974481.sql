-- Create function to get assignments for substitute teachers
CREATE OR REPLACE FUNCTION public.get_assignments_for_substitute(
  p_classroom_id uuid,
  p_link_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  status text,
  category text,
  assignment_type text,
  due_date timestamptz,
  question_count int,
  timer_minutes int,
  created_at timestamptz,
  is_posted boolean
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
  
  -- Check if substitute has permission to view assignments
  IF NOT (v_permissions->>'view_assignments')::boolean THEN
    RETURN; -- Return empty result set
  END IF;
  
  -- Return assignments
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.status,
    a.category,
    a.assignment_type,
    a.due_date,
    a.question_count,
    a.timer_minutes,
    a.created_at,
    a.is_posted
  FROM assignments a
  WHERE a.classroom_id = p_classroom_id
  ORDER BY a.created_at DESC;
END;
$$;