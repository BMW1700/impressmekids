-- Create type for leaderboard entry
CREATE TYPE classroom_leaderboard_entry AS (
  student_id UUID,
  student_name TEXT,
  avatar_url TEXT,
  grade INTEGER,
  games_won INTEGER,
  assignments_completed INTEGER,
  aura_avg_score NUMERIC,
  total_score NUMERIC
);

-- Create function to get classroom leaderboard
CREATE OR REPLACE FUNCTION get_classroom_leaderboard(_classroom_id UUID)
RETURNS SETOF classroom_leaderboard_entry
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the requesting user has access to this classroom
  IF NOT (
    is_classroom_teacher(auth.uid(), _classroom_id) OR 
    is_classroom_student(auth.uid(), _classroom_id) OR
    has_role(auth.uid(), 'admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'Access denied to classroom leaderboard';
  END IF;

  RETURN QUERY
  SELECT 
    p.id AS student_id,
    p.full_name AS student_name,
    p.avatar_url,
    p.grade,
    COALESCE((p.stats->>'games_won')::INTEGER, 0) AS games_won,
    COALESCE(
      (SELECT COUNT(*)::INTEGER 
       FROM assignment_submissions asub 
       WHERE asub.student_id = p.id 
       AND asub.status IN ('submitted', 'graded')), 
      0
    ) AS assignments_completed,
    COALESCE(
      (SELECT ROUND(AVG(ar.grade), 1)
       FROM aura_records ar
       WHERE ar.profile_id = p.id
       AND ar.grade IS NOT NULL),
      0
    ) AS aura_avg_score,
    (
      COALESCE((p.stats->>'games_won')::INTEGER, 0) * 10 +
      COALESCE(
        (SELECT COUNT(*)::INTEGER 
         FROM assignment_submissions asub 
         WHERE asub.student_id = p.id 
         AND asub.status IN ('submitted', 'graded')), 
        0
      ) * 5 +
      COALESCE(
        (SELECT ROUND(AVG(ar.grade), 1)
         FROM aura_records ar
         WHERE ar.profile_id = p.id
         AND ar.grade IS NOT NULL),
        0
      ) / 10
    ) AS total_score
  FROM profiles p
  INNER JOIN classroom_students cs ON cs.student_id = p.id
  WHERE cs.classroom_id = _classroom_id
  ORDER BY total_score DESC, aura_avg_score DESC, assignments_completed DESC, games_won DESC, student_name ASC;
END;
$$;