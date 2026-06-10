
DROP POLICY IF EXISTS "Students can upload audio responses" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload audio to their assignments" ON storage.objects;

CREATE POLICY "assignment_audio_user_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'assignment-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "assignment_audio_user_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'assignment-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'assignment-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "assignment_audio_user_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'assignment-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
