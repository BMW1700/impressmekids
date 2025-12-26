-- Campaign assets table for storing avatar URLs and video URLs
CREATE TABLE public.campaign_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_key TEXT UNIQUE NOT NULL,
  asset_url TEXT,
  asset_type TEXT NOT NULL DEFAULT 'image',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_assets ENABLE ROW LEVEL SECURITY;

-- Anyone can read campaign assets
CREATE POLICY "Anyone can read campaign assets"
ON public.campaign_assets
FOR SELECT
USING (true);

-- Only authenticated users can insert/update (admin check will be in app)
CREATE POLICY "Authenticated users can manage campaign assets"
ON public.campaign_assets
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create storage bucket for campaign assets
INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-assets', 'campaign-assets', true);

-- Storage policies for campaign assets bucket
CREATE POLICY "Anyone can view campaign assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-assets');

CREATE POLICY "Authenticated users can upload campaign assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update campaign assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'campaign-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete campaign assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'campaign-assets' AND auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_campaign_assets_updated_at
BEFORE UPDATE ON public.campaign_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();