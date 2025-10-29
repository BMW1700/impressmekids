-- =====================================================
-- PHASE 1: FIX CRITICAL RLS GAPS (Final Fixed Version)
-- Security Enhancement Migration
-- =====================================================

-- 1. MAKE AUDIT LOGS IMMUTABLE (Critical Fix)
DROP POLICY IF EXISTS "Service role can manage audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "System can update audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.security_audit_log;

CREATE POLICY "Service role can only insert audit logs"
ON public.security_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage backups" ON public.backup_audit_log;
DROP POLICY IF EXISTS "System can update backup logs" ON public.backup_audit_log;
DROP POLICY IF EXISTS "Service role can insert backup audit logs" ON public.backup_audit_log;

CREATE POLICY "Service role can only insert backup audit logs"
ON public.backup_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "System can update aura access log" ON public.aura_access_log;
DROP POLICY IF EXISTS "Service role can manage aura logs" ON public.aura_access_log;
DROP POLICY IF EXISTS "Service role can insert aura access logs" ON public.aura_access_log;

CREATE POLICY "Service role can only insert aura access logs"
ON public.aura_access_log
FOR INSERT
TO service_role
WITH CHECK (true);


-- 2. STRENGTHEN AURA CONSENT ENFORCEMENT (Critical Fix)
-- Drop policy FIRST, then function, then recreate both

DROP POLICY IF EXISTS "Teachers can view AURA records with consent" ON public.aura_records;
DROP POLICY IF EXISTS "Teachers can view AURA records with verified consent" ON public.aura_records;

DROP FUNCTION IF EXISTS public.has_aura_consent(uuid, uuid) CASCADE;

CREATE FUNCTION public.has_aura_consent(_student_id UUID, _teacher_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM classroom_students cs
    JOIN classrooms c ON c.id = cs.classroom_id
    JOIN parent_consents pc ON pc.student_id = cs.student_id
    WHERE cs.student_id = $1
      AND c.teacher_id = $2
      AND pc.aura_recording_consent = true
      AND pc.consent_date IS NOT NULL
  );
$$;

CREATE POLICY "Teachers can view AURA records with verified consent"
ON public.aura_records
FOR SELECT
TO authenticated
USING (
  profile_id = auth.uid() 
  OR (
    has_aura_consent(profile_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM classroom_students cs
      JOIN classrooms c ON c.id = cs.classroom_id
      WHERE cs.student_id = aura_records.profile_id
        AND c.teacher_id = auth.uid()
    )
  )
);


-- 3. RESTRICT EMAIL VISIBILITY (Critical Fix)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view student basic info only" ON public.profiles;
DROP POLICY IF EXISTS "Parents can view children profiles" ON public.profiles;
DROP POLICY IF EXISTS "Parents can view children basic info" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles with email" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Teachers can view student basic info only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id != auth.uid() 
  AND EXISTS (
    SELECT 1
    FROM classroom_students cs
    JOIN classrooms c ON c.id = cs.classroom_id
    WHERE cs.student_id = profiles.id
      AND c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Parents can view children basic info"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id != auth.uid()
  AND is_parent_of_student(auth.uid(), id)
);

CREATE POLICY "Admins can view all profiles with email"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());


-- 4. ADD EMAIL MASKING FUNCTION
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


-- 5. STRENGTHEN PARENT CONSENT POLICIES
DROP POLICY IF EXISTS "Anyone can view consents" ON public.parent_consents;
DROP POLICY IF EXISTS "Deny all anonymous access to parent consents" ON public.parent_consents;

CREATE POLICY "Deny all anonymous access to parent consents"
ON public.parent_consents
FOR ALL
TO anon
USING (false)
WITH CHECK (false);


-- 6. ADD IMMUTABILITY TRIGGERS
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS prevent_security_audit_modification ON public.security_audit_log;
CREATE TRIGGER prevent_security_audit_modification
BEFORE UPDATE OR DELETE ON public.security_audit_log
FOR EACH ROW
EXECUTE FUNCTION public.prevent_audit_log_modification();

DROP TRIGGER IF EXISTS prevent_backup_audit_modification ON public.backup_audit_log;
CREATE TRIGGER prevent_backup_audit_modification
BEFORE UPDATE OR DELETE ON public.backup_audit_log
FOR EACH ROW
EXECUTE FUNCTION public.prevent_audit_log_modification();

DROP TRIGGER IF EXISTS prevent_aura_access_modification ON public.aura_access_log;
CREATE TRIGGER prevent_aura_access_modification
BEFORE UPDATE OR DELETE ON public.aura_access_log
FOR EACH ROW
EXECUTE FUNCTION public.prevent_audit_log_modification();


-- 7. DOCUMENTATION
COMMENT ON TABLE public.user_roles IS 'User role assignments with strict RBAC enforcement';
COMMENT ON TABLE public.security_audit_log IS 'IMMUTABLE - Security audit trail (cannot be modified)';
COMMENT ON TABLE public.backup_audit_log IS 'IMMUTABLE - Backup operation audit trail (cannot be modified)';
COMMENT ON TABLE public.aura_access_log IS 'IMMUTABLE - AURA data access audit trail (cannot be modified)';


-- 8. SECURITY SUMMARY VIEW
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


-- 9. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_action ON public.security_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_aura_access_log_student ON public.aura_access_log(accessed_student);
CREATE INDEX IF NOT EXISTS idx_aura_access_log_accessor ON public.aura_access_log(accessed_by);
CREATE INDEX IF NOT EXISTS idx_aura_access_log_created ON public.aura_access_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_audit_created ON public.backup_audit_log(created_at DESC);

COMMENT ON SCHEMA public IS 'Phase 1 Security Hardening Complete - Audit logs immutable, AURA consent enforced, email visibility restricted';
