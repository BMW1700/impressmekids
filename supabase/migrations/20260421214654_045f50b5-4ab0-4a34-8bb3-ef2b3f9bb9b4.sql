-- Create public storage bucket for email assets (logos used inside email templates)
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-assets', 'email-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read policy so email clients can fetch the logo
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read access to email-assets'
  ) THEN
    CREATE POLICY "Public read access to email-assets"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'email-assets');
  END IF;
END $$;