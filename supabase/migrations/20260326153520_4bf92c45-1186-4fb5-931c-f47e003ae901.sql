
-- Drop and recreate security_summary with security_invoker
DROP VIEW IF EXISTS public.security_summary;
CREATE VIEW public.security_summary WITH (security_invoker = true) AS
SELECT 'audit_logs'::text AS category,
    count(*) AS total_records,
    max(security_audit_log.created_at) AS last_activity
   FROM security_audit_log
UNION ALL
 SELECT 'aura_access'::text AS category,
    count(*) AS total_records,
    max(aura_access_log.created_at) AS last_activity
   FROM aura_access_log
UNION ALL
 SELECT 'backup_operations'::text AS category,
    count(*) AS total_records,
    max(backup_audit_log.created_at) AS last_activity
   FROM backup_audit_log;
