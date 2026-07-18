
-- A2. Pre-K word taxonomy
ALTER TABLE public.prek_level_words
  ADD COLUMN IF NOT EXISTS phoneme_tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS curriculum_tags jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS category_level int;

CREATE INDEX IF NOT EXISTS prek_level_words_category_idx
  ON public.prek_level_words (category, category_level);
CREATE INDEX IF NOT EXISTS prek_level_words_phoneme_tags_idx
  ON public.prek_level_words USING gin (phoneme_tags);
CREATE INDEX IF NOT EXISTS prek_level_words_curriculum_tags_idx
  ON public.prek_level_words USING gin (curriculum_tags);

-- A3/A4. Approval workflow on prek_levels
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prek_level_status') THEN
    CREATE TYPE public.prek_level_status AS ENUM
      ('draft','ready_for_review','approved','deprecated');
  END IF;
END $$;

ALTER TABLE public.prek_levels
  ADD COLUMN IF NOT EXISTS status public.prek_level_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewer_name text,
  ADD COLUMN IF NOT EXISTS reviewer_credential text,
  ADD COLUMN IF NOT EXISTS deprecated_at timestamptz,
  ADD COLUMN IF NOT EXISTS deprecation_reason text;

UPDATE public.prek_levels
  SET status = 'approved'
  WHERE is_published = true AND status = 'draft';

CREATE OR REPLACE FUNCTION public.sync_prek_level_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    NEW.is_published := true;
    IF NEW.reviewed_at IS NULL THEN NEW.reviewed_at := now(); END IF;
  END IF;
  IF NEW.status = 'deprecated' AND (OLD.status IS DISTINCT FROM 'deprecated') THEN
    NEW.is_published := false;
    IF NEW.deprecated_at IS NULL THEN NEW.deprecated_at := now(); END IF;
  END IF;
  IF NEW.status IN ('draft','ready_for_review') THEN
    NEW.is_published := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_prek_level_status_trg ON public.prek_levels;
CREATE TRIGGER sync_prek_level_status_trg
  BEFORE UPDATE OF status ON public.prek_levels
  FOR EACH ROW EXECUTE FUNCTION public.sync_prek_level_status();

CREATE INDEX IF NOT EXISTS prek_levels_status_idx ON public.prek_levels (status);

-- C2. is_demo flag on classrooms
ALTER TABLE public.classrooms
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS classrooms_is_demo_idx
  ON public.classrooms (is_demo) WHERE is_demo = true;

-- D1. Challenge Meter
CREATE TABLE IF NOT EXISTS public.challenge_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level int NOT NULL DEFAULT 3 CHECK (level BETWEEN 1 AND 5),
  set_by uuid REFERENCES auth.users(id),
  set_by_role text,
  overridden_by_teacher boolean NOT NULL DEFAULT false,
  teacher_override_by uuid REFERENCES auth.users(id),
  teacher_override_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_settings TO authenticated;
GRANT ALL ON public.challenge_settings TO service_role;
ALTER TABLE public.challenge_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students read own challenge settings"
  ON public.challenge_settings FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "parents manage linked child challenge settings"
  ON public.challenge_settings FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.parent_student_links psl
    WHERE psl.parent_id = auth.uid() AND psl.student_id = challenge_settings.student_id
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.parent_student_links psl
    WHERE psl.parent_id = auth.uid() AND psl.student_id = challenge_settings.student_id
  ));

CREATE POLICY "teachers view classroom students challenge settings"
  ON public.challenge_settings FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.classroom_students cs
    JOIN public.classrooms c ON c.id = cs.classroom_id
    WHERE cs.student_id = challenge_settings.student_id AND c.teacher_id = auth.uid()
  ));

CREATE POLICY "teachers override classroom students challenge settings"
  ON public.challenge_settings FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.classroom_students cs
    JOIN public.classrooms c ON c.id = cs.classroom_id
    WHERE cs.student_id = challenge_settings.student_id AND c.teacher_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.classroom_students cs
    JOIN public.classrooms c ON c.id = cs.classroom_id
    WHERE cs.student_id = challenge_settings.student_id AND c.teacher_id = auth.uid()
  ));

CREATE OR REPLACE FUNCTION public.touch_challenge_settings_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS touch_challenge_settings_updated_at_trg ON public.challenge_settings;
CREATE TRIGGER touch_challenge_settings_updated_at_trg
  BEFORE UPDATE ON public.challenge_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_challenge_settings_updated_at();

-- E1. Pilot agreements
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pilot_agreement_status') THEN
    CREATE TYPE public.pilot_agreement_status AS ENUM
      ('draft','sent','under_review','signed','active','expired','cancelled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.pilot_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  district_id uuid REFERENCES public.districts(id) ON DELETE SET NULL,
  contact_name text,
  contact_email text,
  contact_role text,
  status public.pilot_agreement_status NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  signed_at timestamptz,
  activated_at timestamptz,
  expires_at timestamptz,
  msa_url text,
  dpa_url text,
  ny_2d_addendum_url text,
  privacy_summary_url text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pilot_agreements TO authenticated;
GRANT ALL ON public.pilot_agreements TO service_role;
ALTER TABLE public.pilot_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super admins manage pilot agreements"
  ON public.pilot_agreements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "school staff view own school pilot agreements"
  ON public.pilot_agreements FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.school_id = pilot_agreements.school_id
  ));

CREATE OR REPLACE FUNCTION public.touch_pilot_agreements_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS touch_pilot_agreements_updated_at_trg ON public.pilot_agreements;
CREATE TRIGGER touch_pilot_agreements_updated_at_trg
  BEFORE UPDATE ON public.pilot_agreements
  FOR EACH ROW EXECUTE FUNCTION public.touch_pilot_agreements_updated_at();

CREATE INDEX IF NOT EXISTS pilot_agreements_school_idx ON public.pilot_agreements (school_id);
CREATE INDEX IF NOT EXISTS pilot_agreements_district_idx ON public.pilot_agreements (district_id);
CREATE INDEX IF NOT EXISTS pilot_agreements_status_idx ON public.pilot_agreements (status);
