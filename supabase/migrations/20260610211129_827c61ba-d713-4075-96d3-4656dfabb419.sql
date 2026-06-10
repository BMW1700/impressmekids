
DROP POLICY IF EXISTS "Service role can manage world backgrounds" ON storage.objects;
CREATE POLICY "world_bg_service_role_manage"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'world-backgrounds')
  WITH CHECK (bucket_id = 'world-backgrounds');
