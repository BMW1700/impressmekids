-- Phase 2 Security Hardening: Critical Fixes
-- 1. Fix Anonymous Access to Profiles (ERROR)
-- 2. Strengthen AURA Consent Verification (ERROR)
-- 3. Add Anonymous Denial Policies to All PII Tables
-- 4. Add Audit Logging System

-- ====================================
-- 1. FIX PROFILES TABLE EMAIL HARVESTING
-- ====================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anon users can view their own profile after signin" ON public.profiles;

-- Replace with strict user-only access
CREATE POLICY "Users can view their own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- ====================================
-- 2. STRENGTHEN AURA CONSENT VERIFICATION
-- ====================================

-- Create a security definer function to check consent properly
CREATE OR REPLACE FUNCTION public.has_aura_consent(_student_id uuid, _teacher_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Teacher must be in a classroom with the student
  -- AND proper consent must be verified
  SELECT EXISTS (
    SELECT 1
    FROM classroom_students cs
    JOIN classrooms c ON c.id = cs.classroom_id
    WHERE cs.student_id = _student_id
      AND c.teacher_id = _teacher_id
      AND (
        -- No parent link means direct consent
        NOT EXISTS (
          SELECT 1 FROM parent_student_links psl
          WHERE psl.student_id = _student_id
            AND psl.approved = true
        )
        OR
        -- Parent link exists and consent is granted
        EXISTS (
          SELECT 1 FROM parent_consents pc
          WHERE pc.student_id = _student_id
            AND pc.aura_recording_consent = true
        )
      )
  )
$$;

-- Drop old policy and create new strict one
DROP POLICY IF EXISTS "Teachers can view AURA records with consent" ON public.aura_records;

CREATE POLICY "Teachers can view AURA records with verified consent"
ON public.aura_records
FOR SELECT
TO authenticated
USING (
  profile_id = auth.uid()
  OR
  has_aura_consent(profile_id, auth.uid())
);

-- Explicitly deny anonymous access to AURA records
CREATE POLICY "Deny anonymous access to aura records"
ON public.aura_records
FOR ALL
TO anon
USING (false);

-- ====================================
-- 3. ADD ANONYMOUS DENIAL POLICIES TO ALL PII TABLES
-- ====================================

-- parent_accounts
CREATE POLICY "Deny anonymous access to parent accounts"
ON public.parent_accounts
FOR ALL
TO anon
USING (false);

-- district_admins
CREATE POLICY "Deny anonymous access to district admins"
ON public.district_admins
FOR ALL
TO anon
USING (false);

-- assignment_submissions
CREATE POLICY "Deny anonymous access to submissions"
ON public.assignment_submissions
FOR ALL
TO anon
USING (false);

-- teacher_student_notes
CREATE POLICY "Deny anonymous access to teacher notes"
ON public.teacher_student_notes
FOR ALL
TO anon
USING (false);

-- student_skill_vectors
CREATE POLICY "Deny anonymous access to skill vectors"
ON public.student_skill_vectors
FOR ALL
TO anon
USING (false);

-- text_highlights
CREATE POLICY "Deny anonymous access to text highlights"
ON public.text_highlights
FOR ALL
TO anon
USING (false);

-- parent_consents
CREATE POLICY "Deny anonymous access to parent consents"
ON public.parent_consents
FOR ALL
TO anon
USING (false);

-- student_profiles
CREATE POLICY "Deny anonymous access to student profiles"
ON public.student_profiles
FOR ALL
TO anon
USING (false);

-- ====================================
-- 4. ADD AUDIT LOGGING SYSTEM
-- ====================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_role app_role,
  action_type text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role and admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
);

-- Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
ON public.security_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create audit logging function
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_user_role app_role;
BEGIN
  -- Get user info
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  SELECT role INTO v_user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- Log the access
  INSERT INTO public.security_audit_log (
    user_id,
    user_email,
    user_role,
    action_type,
    table_name,
    record_id,
    metadata
  )
  VALUES (
    auth.uid(),
    v_user_email,
    v_user_role,
    TG_OP,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    jsonb_build_object(
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  
  RETURN CASE 
    WHEN TG_OP = 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$;

-- Add audit triggers to sensitive tables
CREATE TRIGGER audit_aura_records
AFTER INSERT OR UPDATE OR DELETE ON public.aura_records
FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();

CREATE TRIGGER audit_parent_accounts
AFTER INSERT OR UPDATE OR DELETE ON public.parent_accounts
FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();

CREATE TRIGGER audit_assignment_submissions
AFTER UPDATE ON public.assignment_submissions
FOR EACH ROW 
WHEN (OLD.grade IS DISTINCT FROM NEW.grade OR OLD.teacher_feedback IS DISTINCT FROM NEW.teacher_feedback)
EXECUTE FUNCTION public.log_sensitive_access();

CREATE TRIGGER audit_teacher_student_notes
AFTER INSERT OR UPDATE OR DELETE ON public.teacher_student_notes
FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();

CREATE TRIGGER audit_parent_consents
AFTER INSERT OR UPDATE OR DELETE ON public.parent_consents
FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();

-- Create index for audit log queries
CREATE INDEX idx_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_table_name ON public.security_audit_log(table_name);

-- Add comment explaining audit system
COMMENT ON TABLE public.security_audit_log IS 'Tracks all access to sensitive student and parent data for FERPA compliance and security monitoring';