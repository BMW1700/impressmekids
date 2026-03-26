-- Fix audit log INSERT policies - drop {public} versions
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.backup_audit_log;
DROP POLICY IF EXISTS "Service role can insert safety audit logs" ON public.safety_audit_log;

CREATE POLICY "Service role can insert safety audit logs"
ON public.safety_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);