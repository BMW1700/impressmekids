-- =====================================================
-- FINAL SECURITY CLEANUP
-- Drop remaining public role policies on districts and school_settings
-- =====================================================

-- Drop ALL public role policies on districts table
DROP POLICY IF EXISTS "Anyone can view districts" ON public.districts;
DROP POLICY IF EXISTS "Public can view visible districts" ON public.districts;
DROP POLICY IF EXISTS "Districts are viewable by everyone" ON public.districts;
DROP POLICY IF EXISTS "Everyone can view districts" ON public.districts;
DROP POLICY IF EXISTS "Allow public to view visible districts" ON public.districts;

-- Drop ALL public role policies on school_settings table  
DROP POLICY IF EXISTS "Everyone can view school settings" ON public.school_settings;
DROP POLICY IF EXISTS "Public can view school settings" ON public.school_settings;
DROP POLICY IF EXISTS "School settings are viewable by everyone" ON public.school_settings;

-- Ensure authenticated-only policies exist for districts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'districts' 
    AND policyname = 'Authenticated users can view visible districts'
  ) THEN
    CREATE POLICY "Authenticated users can view visible districts"
    ON public.districts
    FOR SELECT
    TO authenticated
    USING (is_visible = true);
  END IF;
END $$;

-- Ensure authenticated-only policy exists for school_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'school_settings' 
    AND policyname = 'Authenticated users can view school settings'
  ) THEN
    CREATE POLICY "Authenticated users can view school settings"
    ON public.school_settings
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;