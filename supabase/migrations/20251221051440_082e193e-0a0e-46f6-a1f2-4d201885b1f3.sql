-- Function to get pending join requests with student info for a classroom
CREATE OR REPLACE FUNCTION public.get_pending_join_requests(_classroom_id uuid)
RETURNS TABLE(
  id uuid,
  classroom_id uuid,
  student_id uuid,
  status text,
  requested_at timestamptz,
  student_name text,
  student_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify the caller is the teacher of this classroom
  IF NOT EXISTS (
    SELECT 1 FROM classrooms c
    WHERE c.id = _classroom_id AND c.teacher_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    r.id,
    r.classroom_id,
    r.student_id,
    r.status,
    r.requested_at,
    COALESCE(p.full_name, 'Unknown Student') as student_name,
    COALESCE(p.email, '') as student_email
  FROM classroom_join_requests r
  LEFT JOIN profiles p ON p.id = r.student_id
  WHERE r.classroom_id = _classroom_id
    AND r.status = 'pending'
  ORDER BY r.requested_at DESC;
END;
$$;