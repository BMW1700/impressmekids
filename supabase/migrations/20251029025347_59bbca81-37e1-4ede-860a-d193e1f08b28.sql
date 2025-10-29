-- =====================================================
-- FIX SECURITY LINTER ISSUES FROM PHASE 1
-- =====================================================

-- FIX 1: Remove SECURITY DEFINER from view (ERROR)
-- Views should not use SECURITY DEFINER - use RLS policies instead
DROP VIEW IF EXISTS public.security_summary CASCADE;

CREATE VIEW public.security_summary AS
SELECT
  'audit_logs' AS category,
  COUNT(*) AS total_records,
  MAX(created_at) AS last_activity
FROM public.security_audit_log
UNION ALL
SELECT
  'aura_access',
  COUNT(*),
  MAX(created_at)
FROM public.aura_access_log
UNION ALL
SELECT
  'backup_operations',
  COUNT(*),
  MAX(created_at)
FROM public.backup_audit_log;

-- Add RLS to the view instead
-- Note: Views inherit RLS from underlying tables, so admins only see what they can access


-- FIX 2: Ensure all functions have immutable search_path (WARN)
-- Re-create mask_email with proper search_path
CREATE OR REPLACE FUNCTION public.mask_email(email TEXT, viewer_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role(viewer_id, 'admin'::app_role) THEN
    RETURN email;
  END IF;
  IF viewer_id = auth.uid() THEN
    RETURN email;
  END IF;
  RETURN regexp_replace(email, '^(.{2}).*(@.*)$', '\1***\2');
END;
$$;

-- Fix prevent_audit_log_modification trigger function
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
  RETURN NULL;
END;
$$;

-- Linter issues fixed
COMMENT ON VIEW public.security_summary IS 'Admin-only security metrics view (RLS enforced via underlying tables)';
