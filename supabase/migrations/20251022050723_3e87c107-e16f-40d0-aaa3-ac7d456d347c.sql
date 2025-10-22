-- Issue #5 FIX: Strict AURA Consent Enforcement
-- PRINCIPLE: Default DENY, explicit ALLOW
-- Requires explicit parent consent for teacher access to voice recordings

-- Step 1: Drop the policy that depends on the function
DROP POLICY IF EXISTS "Teachers can view AURA records with verified consent" ON public.aura_records;

-- Step 2: Drop the old permissive function
DROP FUNCTION IF EXISTS public.has_aura_consent(uuid, uuid);

-- Step 3: Create new strict consent function
-- Teachers can ONLY view AURA records when:
-- 1. Student is in their classroom
-- 2. Explicit parent_consents record exists
-- 3. aura_recording_consent = TRUE
CREATE OR REPLACE FUNCTION public.has_aura_consent(_student_id uuid, _teacher_id uuid)
RETURNS boolean
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
    WHERE cs.student_id = _student_id
      AND c.teacher_id = _teacher_id
      AND pc.aura_recording_consent = true
  )
$$;

COMMENT ON FUNCTION public.has_aura_consent IS 'FERPA/COPPA compliant: Requires explicit parental consent for teacher access to student voice recordings. Default DENY if no consent record exists.';

-- Step 4: Recreate the policy using the new strict function
CREATE POLICY "Teachers can view AURA records with verified consent"
ON public.aura_records
FOR SELECT
TO authenticated
USING (
  profile_id = auth.uid() 
  OR has_aura_consent(profile_id, auth.uid())
);