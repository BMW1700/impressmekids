
-- Default-seed challenge_settings for every existing and new student profile
INSERT INTO public.challenge_settings (student_id, level, set_by_role)
SELECT p.id, 3, 'system'
FROM public.profiles p
WHERE p.role = 'student'
  AND NOT EXISTS (SELECT 1 FROM public.challenge_settings cs WHERE cs.student_id = p.id);

CREATE OR REPLACE FUNCTION public.seed_challenge_settings_for_student()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'student' THEN
    INSERT INTO public.challenge_settings (student_id, level, set_by_role)
    VALUES (NEW.id, 3, 'system')
    ON CONFLICT (student_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_challenge_settings ON public.profiles;
CREATE TRIGGER trg_seed_challenge_settings
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.seed_challenge_settings_for_student();

-- Enable Realtime so parent slider + teacher override propagate live
ALTER TABLE public.challenge_settings REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'challenge_settings'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_settings';
  END IF;
END $$;
