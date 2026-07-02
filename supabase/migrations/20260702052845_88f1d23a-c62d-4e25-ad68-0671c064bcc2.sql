
CREATE TABLE public.r2_migration_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  size BIGINT,
  content_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  r2_key TEXT,
  error TEXT,
  attempts INT NOT NULL DEFAULT 0,
  copied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bucket, path)
);

CREATE INDEX idx_r2_migration_log_status ON public.r2_migration_log(status);
CREATE INDEX idx_r2_migration_log_bucket ON public.r2_migration_log(bucket);

GRANT SELECT ON public.r2_migration_log TO authenticated;
GRANT ALL ON public.r2_migration_log TO service_role;

ALTER TABLE public.r2_migration_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view migration log"
  ON public.r2_migration_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Service role manages migration log"
  ON public.r2_migration_log FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_r2_migration_log_updated_at
  BEFORE UPDATE ON public.r2_migration_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
