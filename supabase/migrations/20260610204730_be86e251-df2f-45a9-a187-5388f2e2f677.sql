
ALTER TABLE public.school_settings
  ADD COLUMN IF NOT EXISTS school_mode_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pseudonymize_ai_requests boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS audio_retention_days integer NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS data_retention_months integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS disable_session_replay_for_students boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  requester_role text NOT NULL CHECK (requester_role IN ('parent','teacher','admin','district_manager')),
  subject_user_id uuid NOT NULL,
  scope text NOT NULL DEFAULT 'full' CHECK (scope IN ('full','progress_only','audio_only')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','failed','expired')),
  file_path text,
  file_expires_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

GRANT SELECT, INSERT, UPDATE ON public.data_export_requests TO authenticated;
GRANT ALL ON public.data_export_requests TO service_role;

ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "der_select_own_or_admin" ON public.data_export_requests
  FOR SELECT TO authenticated
  USING (
    requester_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "der_insert_parent" ON public.data_export_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND requester_role = 'parent'
    AND EXISTS (
      SELECT 1 FROM public.parent_student_links psl
      WHERE psl.parent_id = public.get_parent_id(auth.uid())
        AND psl.student_id = data_export_requests.subject_user_id
        AND psl.approved = true
    )
  );

CREATE POLICY "der_insert_teacher" ON public.data_export_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND requester_role = 'teacher'
    AND public.has_role(auth.uid(), 'teacher'::app_role)
    AND EXISTS (
      SELECT 1
      FROM public.classroom_students cs
      JOIN public.classrooms c ON c.id = cs.classroom_id
      WHERE c.teacher_id = auth.uid()
        AND cs.student_id = data_export_requests.subject_user_id
    )
  );

CREATE POLICY "der_insert_admin" ON public.data_export_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "der_update_own" ON public.data_export_requests
  FOR UPDATE TO authenticated
  USING (requester_id = auth.uid())
  WITH CHECK (requester_id = auth.uid());

CREATE TRIGGER trg_der_updated_at
  BEFORE UPDATE ON public.data_export_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_der_requester ON public.data_export_requests(requester_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_der_subject ON public.data_export_requests(subject_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_der_status ON public.data_export_requests(status) WHERE status IN ('pending','processing');

DROP POLICY IF EXISTS "Anyone can view question images" ON storage.objects;

CREATE POLICY "qimg_read_classroom_members" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'assignment-question-images'
    AND (
      EXISTS (
        SELECT 1 FROM public.classrooms c
        WHERE c.teacher_id = auth.uid()
          AND c.id::text = split_part(name, '/', 1)
      )
      OR EXISTS (
        SELECT 1 FROM public.classroom_students cs
        WHERE cs.student_id = auth.uid()
          AND cs.classroom_id::text = split_part(name, '/', 1)
      )
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );
