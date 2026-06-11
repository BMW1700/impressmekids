
CREATE POLICY "Authenticated read prek videos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'prek-level-videos');

CREATE POLICY "Super admins upload prek videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'prek-level-videos' AND public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins update prek videos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'prek-level-videos' AND public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (bucket_id = 'prek-level-videos' AND public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins delete prek videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'prek-level-videos' AND public.has_role(auth.uid(), 'super_admin'));
