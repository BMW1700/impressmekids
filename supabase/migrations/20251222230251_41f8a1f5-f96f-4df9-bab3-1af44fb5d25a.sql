-- =====================================================
-- LOCK DOWN PUBLICLY EXPOSED TABLES
-- Fix reading_library, teacher_office_hours, teacher_game_scores, 
-- school_settings, and districts policies to require authentication
-- =====================================================

-- 1. FIX reading_library - Drop public role policy, keep authenticated
DROP POLICY IF EXISTS "Anyone can view reading library stories" ON public.reading_library;

-- 2. FIX teacher_office_hours - Drop public, create authenticated policies
DROP POLICY IF EXISTS "Anyone can view office hours" ON public.teacher_office_hours;

-- Create policy for authenticated users to view office hours
CREATE POLICY "Authenticated users can view office hours"
ON public.teacher_office_hours
FOR SELECT
TO authenticated
USING (true);

-- 3. FIX teacher_game_scores - Drop public, create authenticated policies
DROP POLICY IF EXISTS "Anyone can view game scores" ON public.teacher_game_scores;

-- Teachers can view their own scores
CREATE POLICY "Teachers can view their own game scores"
ON public.teacher_game_scores
FOR SELECT
TO authenticated
USING (teacher_id = auth.uid());

-- 4. FIX school_settings - Drop public, create authenticated policy
DROP POLICY IF EXISTS "Anyone can view school settings" ON public.school_settings;

-- Authenticated users can view school settings
CREATE POLICY "Authenticated users can view school settings"
ON public.school_settings
FOR SELECT
TO authenticated
USING (true);

-- 5. FIX districts - Drop public role policy
-- Keep the public view (districts_public) for unauthenticated landing page
DROP POLICY IF EXISTS "Anyone can view visible districts" ON public.districts;