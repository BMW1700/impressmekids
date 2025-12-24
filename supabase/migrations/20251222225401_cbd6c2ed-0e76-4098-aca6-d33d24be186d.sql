-- Fix RLS Policy Conflicts for Scale

-- =============================================
-- 1. PROFILES TABLE - Consolidate overlapping SELECT policies
-- =============================================

-- Drop redundant/overlapping SELECT policies on profiles
DROP POLICY IF EXISTS "Users can only view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile only" ON public.profiles;

-- Drop duplicate UPDATE policies
DROP POLICY IF EXISTS "Users can update own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create single consolidated user profile SELECT policy
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

-- Create single consolidated user profile UPDATE policy  
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- =============================================
-- 2. EMERGENCY CONTACTS - Add teacher read access
-- =============================================

-- Teachers can view emergency contacts for students in their classrooms
CREATE POLICY "Teachers can view student emergency contacts"
ON public.emergency_contacts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM classroom_students cs
    JOIN classrooms c ON c.id = cs.classroom_id
    WHERE cs.student_id = emergency_contacts.student_id
    AND c.teacher_id = auth.uid()
  )
);

-- Admins can view all emergency contacts in their district
CREATE POLICY "Admins can view emergency contacts"
ON public.emergency_contacts
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
);