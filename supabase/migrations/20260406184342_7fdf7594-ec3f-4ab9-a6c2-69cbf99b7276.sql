
-- Add grade_mode to reading_sessions
ALTER TABLE public.reading_sessions ADD COLUMN grade_mode text NOT NULL DEFAULT 'k5';

-- Add grade_mode to campaign_progress
ALTER TABLE public.campaign_progress ADD COLUMN grade_mode text NOT NULL DEFAULT 'k5';

-- Add grade_mode to student_reading_stats
ALTER TABLE public.student_reading_stats ADD COLUMN grade_mode text NOT NULL DEFAULT 'k5';

-- Add grade_mode to student_reading_progress
ALTER TABLE public.student_reading_progress ADD COLUMN grade_mode text NOT NULL DEFAULT 'k5';

-- Add grade_mode to campaign_battle_sessions
ALTER TABLE public.campaign_battle_sessions ADD COLUMN grade_mode text NOT NULL DEFAULT 'k5';

-- Add default_grade_mode to profiles
ALTER TABLE public.profiles ADD COLUMN default_grade_mode text NOT NULL DEFAULT 'k5';

-- Validation trigger for grade_mode
CREATE OR REPLACE FUNCTION public.validate_grade_mode()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.grade_mode NOT IN ('k5', '6to12') THEN
    RAISE EXCEPTION 'grade_mode must be k5 or 6to12';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reading_sessions_grade_mode
  BEFORE INSERT OR UPDATE ON public.reading_sessions
  FOR EACH ROW EXECUTE FUNCTION public.validate_grade_mode();

CREATE TRIGGER trg_campaign_progress_grade_mode
  BEFORE INSERT OR UPDATE ON public.campaign_progress
  FOR EACH ROW EXECUTE FUNCTION public.validate_grade_mode();

CREATE TRIGGER trg_student_reading_stats_grade_mode
  BEFORE INSERT OR UPDATE ON public.student_reading_stats
  FOR EACH ROW EXECUTE FUNCTION public.validate_grade_mode();

CREATE TRIGGER trg_student_reading_progress_grade_mode
  BEFORE INSERT OR UPDATE ON public.student_reading_progress
  FOR EACH ROW EXECUTE FUNCTION public.validate_grade_mode();

CREATE TRIGGER trg_campaign_battle_sessions_grade_mode
  BEFORE INSERT OR UPDATE ON public.campaign_battle_sessions
  FOR EACH ROW EXECUTE FUNCTION public.validate_grade_mode();

-- Validation trigger for default_grade_mode on profiles
CREATE OR REPLACE FUNCTION public.validate_default_grade_mode()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.default_grade_mode NOT IN ('k5', '6to12') THEN
    RAISE EXCEPTION 'default_grade_mode must be k5 or 6to12';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_default_grade_mode
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_default_grade_mode();

-- Update campaign_progress unique constraint: per student+mode
ALTER TABLE public.campaign_progress DROP CONSTRAINT campaign_progress_student_id_key;
ALTER TABLE public.campaign_progress ADD CONSTRAINT campaign_progress_student_mode_key UNIQUE (student_id, grade_mode);

-- Update student_reading_stats unique constraint: per student+mode
ALTER TABLE public.student_reading_stats DROP CONSTRAINT student_reading_stats_student_id_key;
ALTER TABLE public.student_reading_stats ADD CONSTRAINT student_reading_stats_student_mode_key UNIQUE (student_id, grade_mode);

-- Update upsert_reading_stats RPC to accept grade_mode
CREATE OR REPLACE FUNCTION public.upsert_reading_stats(
  p_student_id uuid,
  p_words_read integer,
  p_xp_earned integer,
  p_grade_mode text DEFAULT 'k5'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_existing RECORD;
  v_today date := CURRENT_DATE;
  v_new_streak integer := 1;
  v_longest integer := 1;
  v_diff_days integer;
BEGIN
  -- Validate grade_mode
  IF p_grade_mode NOT IN ('k5', '6to12') THEN
    RAISE EXCEPTION 'grade_mode must be k5 or 6to12';
  END IF;

  -- Try to get existing stats for this student+mode
  SELECT * INTO v_existing
  FROM public.student_reading_stats
  WHERE student_id = p_student_id AND grade_mode = p_grade_mode
  FOR UPDATE;

  IF FOUND THEN
    -- Calculate streak
    IF v_existing.last_activity_date IS NOT NULL THEN
      v_diff_days := v_today - v_existing.last_activity_date::date;

      IF v_diff_days = 0 THEN
        v_new_streak := COALESCE(v_existing.current_streak_days, 1);
      ELSIF v_diff_days = 1 THEN
        v_new_streak := COALESCE(v_existing.current_streak_days, 0) + 1;
      ELSE
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
    WHERE student_id = p_student_id AND grade_mode = p_grade_mode;
  ELSE
    INSERT INTO public.student_reading_stats (
      student_id, total_words_read, total_sessions,
      current_streak_days, longest_streak_days,
      xp_points, last_activity_date, grade_mode
    ) VALUES (
      p_student_id, p_words_read, 1, 1, 1, p_xp_earned, v_today, p_grade_mode
    );
  END IF;
END;
$function$;
