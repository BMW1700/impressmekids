
CREATE OR REPLACE FUNCTION public.upsert_reading_stats(
  p_student_id uuid,
  p_words_read integer,
  p_xp_earned integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_existing RECORD;
  v_today date := CURRENT_DATE;
  v_new_streak integer := 1;
  v_longest integer := 1;
  v_diff_days integer;
BEGIN
  -- Try to get existing stats
  SELECT * INTO v_existing
  FROM public.student_reading_stats
  WHERE student_id = p_student_id
  FOR UPDATE;

  IF FOUND THEN
    -- Calculate streak
    IF v_existing.last_activity_date IS NOT NULL THEN
      v_diff_days := v_today - v_existing.last_activity_date::date;
      
      IF v_diff_days = 0 THEN
        -- Same day, keep current streak
        v_new_streak := COALESCE(v_existing.current_streak_days, 1);
      ELSIF v_diff_days = 1 THEN
        -- Next day, increment streak
        v_new_streak := COALESCE(v_existing.current_streak_days, 0) + 1;
      ELSE
        -- Gap > 1 day, reset
        v_new_streak := 1;
      END IF;
    END IF;

    v_longest := GREATEST(COALESCE(v_existing.longest_streak_days, 0), v_new_streak);

    UPDATE public.student_reading_stats SET
      total_words_read = COALESCE(total_words_read, 0) + p_words_read,
      total_sessions = COALESCE(total_sessions, 0) + 1,
      current_streak_days = v_new_streak,
      longest_streak_days = v_longest,
      xp_points = COALESCE(xp_points, 0) + p_xp_earned,
      last_activity_date = v_today
    WHERE student_id = p_student_id;
  ELSE
    -- Insert new row
    INSERT INTO public.student_reading_stats (
      student_id, total_words_read, total_sessions,
      current_streak_days, longest_streak_days,
      xp_points, last_activity_date
    ) VALUES (
      p_student_id, p_words_read, 1, 1, 1, p_xp_earned, v_today
    );
  END IF;
END;
$$;
