-- Create cold_storage_backups table to track all backups
CREATE TABLE IF NOT EXISTS public.cold_storage_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name TEXT NOT NULL UNIQUE,
  backup_size_bytes BIGINT NOT NULL,
  tables_included TEXT[] NOT NULL,
  record_count INTEGER NOT NULL,
  backup_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  storage_provider TEXT NOT NULL DEFAULT 'aws_s3',
  storage_location TEXT NOT NULL,
  encryption_method TEXT NOT NULL DEFAULT 'aes-256-gcm',
  backup_type TEXT NOT NULL DEFAULT 'full',
  status TEXT NOT NULL DEFAULT 'completed',
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create backup_audit_log table for audit trail
CREATE TABLE IF NOT EXISTS public.backup_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID REFERENCES public.cold_storage_backups(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  action_details JSONB DEFAULT '{}',
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cold_storage_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies - only admins can manage backups
CREATE POLICY "Only admins can view backups"
  ON public.cold_storage_backups
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can create backups"
  ON public.cold_storage_backups
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can view audit log"
  ON public.backup_audit_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert audit logs"
  ON public.backup_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_backups_timestamp ON public.cold_storage_backups(backup_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_backup_id ON public.backup_audit_log(backup_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.backup_audit_log(created_at DESC);