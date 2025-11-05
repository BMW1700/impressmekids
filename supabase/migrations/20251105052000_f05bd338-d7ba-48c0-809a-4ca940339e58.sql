-- Create function to get student assignment statistics
CREATE OR REPLACE FUNCTION public.get_student_assignment_stats(_student_id UUID)
RETURNS TABLE (
  total_assignments BIGINT,
  completed_assignments BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Count total published assignments in student's classrooms
  -- Count completed submissions (status = 'submitted' or 'graded')
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT a.id) as total_assignments,
    COUNT(DISTINCT CASE 
      WHEN asub.status IN ('submitted', 'graded', 'completed') 
      THEN asub.assignment_id 
    END) as completed_assignments
  FROM classroom_students cs
  JOIN assignments a ON a.classroom_id = cs.classroom_id
  LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id 
    AND asub.student_id = _student_id
  WHERE cs.student_id = _student_id
    AND a.is_posted = true;
END;
$$;