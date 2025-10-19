-- ============================================
-- CRITICAL SECURITY FIXES FOR SCHOOL LICENSING
-- ============================================

-- 1. FIX DISTRICT DATA EXPOSURE (Remove public access)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view districts" ON public.districts;

-- Create authenticated-only policy for districts
CREATE POLICY "Authenticated users within district can view" 
ON public.districts 
FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT district_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- 2. RESTRICT TEACHER ACCESS TO PARENT DATA
-- ============================================
-- Drop overly permissive ALL policy on parent_student_links
DROP POLICY IF EXISTS "Teachers can view and approve links for their students" ON public.parent_student_links;

-- Replace with specific SELECT and UPDATE policies
CREATE POLICY "Teachers can view links for their students" 
ON public.parent_student_links 
FOR SELECT 
TO authenticated
USING (
  student_id IN (
    SELECT cs.student_id
    FROM classroom_students cs
    JOIN classrooms c ON c.id = cs.classroom_id
    WHERE c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can update links for their students" 
ON public.parent_student_links 
FOR UPDATE 
TO authenticated
USING (
  student_id IN (
    SELECT cs.student_id
    FROM classroom_students cs
    JOIN classrooms c ON c.id = cs.classroom_id
    WHERE c.teacher_id = auth.uid()
  )
);

-- Drop overly permissive ALL policy on parent_access_requests
DROP POLICY IF EXISTS "Teachers can manage requests for their classrooms" ON public.parent_access_requests;

-- Replace with specific SELECT and UPDATE policies
CREATE POLICY "Teachers can view requests for their classrooms" 
ON public.parent_access_requests 
FOR SELECT 
TO authenticated
USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can update requests for their classrooms" 
ON public.parent_access_requests 
FOR UPDATE 
TO authenticated
USING (teacher_id = auth.uid());

-- 3. ADD CONSENT VERIFICATION FOR AURA RECORDS
-- ============================================
-- Drop existing teacher policy
DROP POLICY IF EXISTS "Teachers can view AURA records for their classroom students" ON public.aura_records;

-- Create new policy that checks consent
CREATE POLICY "Teachers can view AURA records with consent" 
ON public.aura_records 
FOR SELECT 
TO authenticated
USING (
  profile_id IN (
    SELECT cs.student_id
    FROM classroom_students cs
    JOIN classrooms c ON c.id = cs.classroom_id
    WHERE c.teacher_id = auth.uid()
  )
  AND (
    -- Allow if student has no parent (legacy data)
    NOT EXISTS (
      SELECT 1 FROM parent_student_links psl
      WHERE psl.student_id = aura_records.profile_id
      AND psl.approved = true
    )
    OR
    -- Or if parent has given consent
    EXISTS (
      SELECT 1 FROM parent_consents pc
      WHERE pc.student_id = aura_records.profile_id
      AND pc.aura_recording_consent = true
    )
  )
);

-- 4. RESTRICT PARENT ACCESS TO FINALIZED GRADES
-- ============================================
-- Drop existing parent policy
DROP POLICY IF EXISTS "Parents can view their children's assignment submissions" ON public.assignment_submissions;

-- Create new policy that only shows graded submissions
CREATE POLICY "Parents can view graded submissions" 
ON public.assignment_submissions 
FOR SELECT 
TO authenticated
USING (
  student_id IN (
    SELECT psl.student_id
    FROM parent_student_links psl
    JOIN parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = auth.uid()
    AND psl.approved = true
  )
  AND status IN ('graded', 'completed')
);

-- 5. ADD PARENT ACCOUNT SELF-ACCESS PROTECTION
-- ============================================
-- Ensure parents can only access their own account data
CREATE POLICY "Parents can view their own account only" 
ON public.parent_accounts 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- 6. ADD VISIBILITY CONTROL FOR TEACHER NOTES
-- ============================================
-- Add a column to control note visibility (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teacher_student_notes' 
    AND column_name = 'visible_to_student'
  ) THEN
    ALTER TABLE public.teacher_student_notes 
    ADD COLUMN visible_to_student boolean DEFAULT false;
  END IF;
END $$;

-- Update existing student access policy to respect visibility flag
DROP POLICY IF EXISTS "Students can view notes about themselves" ON public.teacher_student_notes;

CREATE POLICY "Students can view visible notes about themselves" 
ON public.teacher_student_notes 
FOR SELECT 
TO authenticated
USING (
  student_id = auth.uid()
  AND visible_to_student = true
);

-- 7. ENSURE USER_ROLES TABLE HAS PROPER POLICIES
-- ============================================
-- Make sure user_roles is properly secured
DROP POLICY IF EXISTS "Service role can manage all roles" ON public.user_roles;

CREATE POLICY "Service role can manage all roles" 
ON public.user_roles 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 8. CREATE FUNCTION TO SAFELY CHECK USER ROLE
-- ============================================
-- Update the existing has_role function to be more efficient
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;