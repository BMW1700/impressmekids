-- First, update the classroom_leaderboard_entry type to include games_played
DROP TYPE IF EXISTS classroom_leaderboard_entry CASCADE;

CREATE TYPE classroom_leaderboard_entry AS (
  student_id UUID,
  student_name TEXT,
  avatar_url TEXT,
  grade INTEGER,
  games_won INTEGER,
  games_played INTEGER,
  assignments_completed INTEGER,
  aura_avg_score NUMERIC,
  total_score INTEGER
);

-- Now recreate the function with the fixed logic
CREATE OR REPLACE FUNCTION public.get_classroom_leaderboard(_classroom_id uuid)
 RETURNS SETOF classroom_leaderboard_entry
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    pp.avatar_url,
    pp.grade,
    COALESCE((sp.stats->>'games_won')::INTEGER, 0) AS games_won,
    COALESCE((sp.stats->>'games_played')::INTEGER, 0) AS games_played,
    COALESCE(
      (SELECT COUNT(*)::INTEGER 
       FROM assignment_submissions asub 
       WHERE asub.student_id = p.id 
       AND asub.status IN ('submitted', 'graded', 'completed')), 
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
      COALESCE((sp.stats->>'games_played')::INTEGER, 0) * 1 +
      COALESCE((sp.stats->>'games_won')::INTEGER, 0) * 2 +
      COALESCE(
        (SELECT COUNT(*)::INTEGER 
         FROM assignment_submissions asub 
         WHERE asub.student_id = p.id 
         AND asub.status IN ('submitted', 'graded', 'completed')), 
        0
      ) * 3
    ) AS total_score
  FROM profiles p
  INNER JOIN classroom_students cs ON cs.student_id = p.id
  LEFT JOIN public_profiles pp ON pp.id = p.id
  LEFT JOIN student_profiles sp ON sp.user_id = p.id
  WHERE cs.classroom_id = _classroom_id
  ORDER BY total_score DESC, aura_avg_score DESC, assignments_completed DESC, games_won DESC, games_played DESC, student_name ASC;
END;
$function$;