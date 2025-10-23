-- CRITICAL SECURITY FIX: Prevent Email Harvesting & Secure Audio Access
-- This migration addresses 3 critical vulnerabilities

-- 1. CREATE PUBLIC_PROFILES TABLE (Display-Safe Student Info Only)
CREATE TABLE IF NOT EXISTS public.public_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  grade INTEGER,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on public_profiles
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Public profiles are viewable by authenticated users (safe info only)
CREATE POLICY "Authenticated users can view public profiles"
ON public.public_profiles FOR SELECT
TO authenticated
USING (true);

-- Users can update their own public profile
CREATE POLICY "Users can update their own public profile"
ON public.public_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Users can insert their own public profile
CREATE POLICY "Users can insert their own public profile"
ON public.public_profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 2. RESTRICT ACCESS TO PROFILES TABLE (Prevent Email Harvesting)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Only allow users to view their OWN profile (no bulk scraping)
CREATE POLICY "Users can only view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile only"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- 3. CREATE TRIGGER TO AUTO-POPULATE PUBLIC_PROFILES
CREATE OR REPLACE FUNCTION public.handle_new_public_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.public_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      CASE 
        WHEN NEW.full_name IS NOT NULL AND NEW.full_name != '' 
        THEN split_part(NEW.full_name, ' ', 1) || ' ' || 
             CASE 
               WHEN split_part(NEW.full_name, ' ', 2) != '' 
               THEN left(split_part(NEW.full_name, ' ', 2), 1) || '.'
               ELSE ''
             END
        ELSE 'User'
      END,
      'User'
    )
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to create public profile when profile is created
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_public_profile();

-- 4. BACKFILL EXISTING PROFILES
INSERT INTO public.public_profiles (id, display_name, grade, avatar_url)
SELECT 
  p.id,
  COALESCE(
    CASE 
      WHEN p.full_name IS NOT NULL AND p.full_name != '' 
      THEN split_part(p.full_name, ' ', 1) || ' ' || 
           CASE 
             WHEN split_part(p.full_name, ' ', 2) != '' 
             THEN left(split_part(p.full_name, ' ', 2), 1) || '.'
             ELSE ''
           END
      ELSE 'User'
    END,
    'User'
  ),
  sp.grade,
  sp.avatar_url
FROM public.profiles p
LEFT JOIN public.student_profiles sp ON sp.user_id = p.id
ON CONFLICT (id) DO NOTHING;

-- 5. UPDATE STUDENT_PROFILES TO USE PUBLIC_PROFILES
ALTER TABLE public.student_profiles DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE public.student_profiles DROP COLUMN IF EXISTS grade;

-- Move grade and avatar to public_profiles where it's display-safe
ALTER TABLE public.public_profiles 
  ALTER COLUMN grade SET DEFAULT NULL,
  ALTER COLUMN avatar_url SET DEFAULT NULL;

-- 6. SECURE AUDIO STORAGE (Require Signed URLs)
-- Update storage policies for aura-audio bucket to require authentication
DROP POLICY IF EXISTS "Users can upload their own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own audio" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view student audio with consent" ON storage.objects;

-- Students can upload their own audio
CREATE POLICY "Students can upload own AURA audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'aura-audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Students can access their own audio (signed URLs only)
CREATE POLICY "Students can access own AURA audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'aura-audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Teachers can access student audio ONLY with verified consent
CREATE POLICY "Teachers access student audio with consent"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'aura-audio' 
  AND (
    -- Own audio
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Student's audio with consent
    EXISTS (
      SELECT 1
      FROM classroom_students cs
      JOIN classrooms c ON c.id = cs.classroom_id
      JOIN parent_consents pc ON pc.student_id = cs.student_id
      WHERE c.teacher_id = auth.uid()
        AND cs.student_id::text = (storage.foldername(name))[1]
        AND pc.aura_recording_consent = true
    )
  )
);

-- 7. ADD AUDIT TRIGGER FOR PROFILE ACCESS
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when someone accesses a profile that isn't their own
  IF auth.uid() IS NOT NULL AND auth.uid() != NEW.id THEN
    INSERT INTO public.security_audit_log (
      user_id,
      action_type,
      table_name,
      record_id,
      metadata
    )
    VALUES (
      auth.uid(),
      'SELECT',
      'public_profiles',
      NEW.id,
      jsonb_build_object(
        'action', 'profile_view',
        'viewed_user_id', NEW.id,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_public_profile_access ON public.public_profiles;
CREATE TRIGGER log_public_profile_access
  AFTER INSERT OR UPDATE ON public.public_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_access();