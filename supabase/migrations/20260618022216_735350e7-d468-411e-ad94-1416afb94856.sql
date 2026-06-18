
CREATE POLICY "Authenticated read prek audio"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'prek-level-audio');

CREATE POLICY "Super admins upload prek audio"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'prek-level-audio' AND has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins update prek audio"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'prek-level-audio' AND has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (bucket_id = 'prek-level-audio' AND has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins delete prek audio"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'prek-level-audio' AND has_role(auth.uid(), 'super_admin'::app_role));
