
-- aura-audio: drop overlapping/broken policies
DROP POLICY IF EXISTS "Students can access own AURA audio" ON storage.objects;
DROP POLICY IF EXISTS "Students can read their own audio" ON storage.objects;
DROP POLICY IF EXISTS "Students can read their own audio recordings" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload own AURA audio" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload their own audio" ON storage.objects;
DROP POLICY IF EXISTS "Students can view their own audio" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can access student audio recordings" ON storage.objects;
DROP POLICY IF EXISTS "Teachers access student audio with consent" ON storage.objects;

CREATE POLICY "aura_audio_student_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'aura-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "aura_audio_student_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'aura-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "aura_audio_student_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'aura-audio' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'aura-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "aura_audio_student_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'aura-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "aura_audio_teacher_read_with_consent"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'aura-audio'
    AND EXISTS (
      SELECT 1
      FROM public.classroom_students cs
      JOIN public.classrooms c ON c.id = cs.classroom_id
      JOIN public.parent_consents pc ON pc.student_id = cs.student_id
      WHERE c.teacher_id = auth.uid()
        AND cs.student_id::text = (storage.foldername(storage.objects.name))[1]
        AND pc.aura_recording_consent = true
    )
  );

CREATE POLICY "aura_audio_admin_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'aura-audio'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- assignment-question-images: lock writes to classroom teacher
DROP POLICY IF EXISTS "Teachers can upload question images" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete question images" ON storage.objects;

CREATE POLICY "qimg_teacher_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'assignment-question-images'
    AND public.is_classroom_teacher(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "qimg_teacher_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'assignment-question-images'
    AND public.is_classroom_teacher(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
  WITH CHECK (
    bucket_id = 'assignment-question-images'
    AND public.is_classroom_teacher(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "qimg_teacher_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'assignment-question-images'
    AND public.is_classroom_teacher(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

-- Public buckets: kill broad SELECT (public flag still serves direct URLs)
DROP POLICY IF EXISTS "Anyone can view campaign assets" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to email-assets" ON storage.objects;

-- Tighten 12 service-role write policies (drop USING/CHECK true, scope to service_role)
DROP POLICY IF EXISTS "Service role can only insert audit logs" ON public.security_audit_log;
CREATE POLICY "service_role_insert_security_audit"
  ON public.security_audit_log FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can only insert backup audit logs" ON public.backup_audit_log;
CREATE POLICY "service_role_insert_backup_audit"
  ON public.backup_audit_log FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can only insert aura access logs" ON public.aura_access_log;
CREATE POLICY "service_role_insert_aura_access"
  ON public.aura_access_log FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update consents" ON public.student_signup_consents;
CREATE POLICY "service_role_update_consents"
  ON public.student_signup_consents FOR UPDATE TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert safety audit logs" ON public.safety_audit_log;
CREATE POLICY "service_role_insert_safety_audit"
  ON public.safety_audit_log FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can create verification requests" ON public.account_verification_requests;
CREATE POLICY "service_role_insert_verification_requests"
  ON public.account_verification_requests FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert district managers" ON public.district_managers;
CREATE POLICY "service_role_insert_district_managers"
  ON public.district_managers FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert behavior stats" ON public.student_behavior_stats;
CREATE POLICY "service_role_insert_behavior_stats"
  ON public.student_behavior_stats FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert risk notifications" ON public.risk_alert_notifications;
CREATE POLICY "service_role_insert_risk_notifications"
  ON public.risk_alert_notifications FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert risk history" ON public.student_risk_history;
CREATE POLICY "service_role_insert_risk_history"
  ON public.student_risk_history FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert exercises" ON public.practice_exercises;
CREATE POLICY "service_role_insert_exercises"
  ON public.practice_exercises FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage all roles" ON public.user_roles;
CREATE POLICY "service_role_manage_user_roles"
  ON public.user_roles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- search_path on the 4 flagged functions
ALTER FUNCTION public.delete_email(text, bigint)                      SET search_path = public, pg_temp;
ALTER FUNCTION public.enqueue_email(text, jsonb)                      SET search_path = public, pg_temp;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb)          SET search_path = public, pg_temp;
ALTER FUNCTION public.read_email_batch(text, integer, integer)        SET search_path = public, pg_temp;
