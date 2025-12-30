-- Fix campaign_assets table RLS to restrict to admins only
DROP POLICY IF EXISTS "Authenticated users can manage campaign assets" ON public.campaign_assets;

-- Create admin-only policy for campaign_assets table
CREATE POLICY "Only admins can manage campaign assets"
ON public.campaign_assets
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix storage bucket policies for campaign-assets
DROP POLICY IF EXISTS "Authenticated users can upload campaign assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update campaign assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete campaign assets" ON storage.objects;

-- Create admin-only storage policies
CREATE POLICY "Only admins can upload campaign assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-assets' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update campaign assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'campaign-assets' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete campaign assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'campaign-assets' AND public.has_role(auth.uid(), 'admin'::app_role));