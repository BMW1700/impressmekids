-- Issue #2 Fix: Prevent User Email/Profile Exposure
-- Create public_profiles table for non-sensitive display data

-- Step 1: Create public_profiles table
CREATE TABLE public.public_profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name text NOT NULL,
  avatar_url text,
  grade integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on public_profiles
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Public profiles are viewable by authenticated users (classroom context)
CREATE POLICY "Authenticated users can view public profiles"
ON public.public_profiles FOR SELECT
TO authenticated
USING (true);

-- Users can update their own public profile
CREATE POLICY "Users can update own public profile"
ON public.public_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Users can insert their own public profile
CREATE POLICY "Users can insert own public profile"
ON public.public_profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Step 2: Create security definer function for classroom student info
CREATE OR REPLACE FUNCTION public.get_classroom_student_display_info(
  _classroom_id uuid,
  _requesting_user_id uuid
)
RETURNS TABLE (
  student_id uuid,
  display_name text,
  grade integer,
  avatar_url text,
  joined_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify requesting user is the teacher of this classroom
  IF NOT EXISTS (
    SELECT 1 FROM classrooms
    WHERE id = _classroom_id AND teacher_id = _requesting_user_id
  ) THEN
    RETURN;
  END IF;

  -- Log the access
  INSERT INTO security_audit_log (
    user_id,
    action_type,
    table_name,
    metadata
  ) VALUES (
    _requesting_user_id,
    'SELECT',
    'public_profiles',
    jsonb_build_object(
      'action', 'get_classroom_student_display_info',
      'classroom_id', _classroom_id
    )
  );

  -- Return non-sensitive student display info
  RETURN QUERY
  SELECT 
    pp.id as student_id,
    pp.display_name,
    pp.grade,
    pp.avatar_url,
    cs.joined_at
  FROM classroom_students cs
  JOIN public_profiles pp ON pp.id = cs.student_id
  WHERE cs.classroom_id = _classroom_id
  ORDER BY pp.display_name;
END;
$$;

-- Step 3: Create security definer function for parent to view child info
CREATE OR REPLACE FUNCTION public.get_parent_child_info(
  _parent_user_id uuid,
  _student_id uuid
)
RETURNS TABLE (
  student_id uuid,
  full_name text,
  email text,
  grade integer,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify parent-student relationship is approved
  IF NOT EXISTS (
    SELECT 1 
    FROM parent_student_links psl
    JOIN parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = _parent_user_id 
      AND psl.student_id = _student_id
      AND psl.approved = true
  ) THEN
    RETURN;
  END IF;

  -- Log the access
  INSERT INTO security_audit_log (
    user_id,
    action_type,
    table_name,
    record_id,
    metadata
  ) VALUES (
    _parent_user_id,
    'SELECT',
    'profiles',
    _student_id,
    jsonb_build_object(
      'action', 'get_parent_child_info',
      'student_id', _student_id
    )
  );

  -- Return full profile info for approved parent-child relationship
  RETURN QUERY
  SELECT 
    p.id as student_id,
    p.full_name,
    p.email,
    pp.grade,
    pp.avatar_url
  FROM profiles p
  LEFT JOIN public_profiles pp ON pp.id = p.id
  WHERE p.id = _student_id;
END;
$$;

-- Step 4: Migrate existing data to public_profiles
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
      ELSE 'Student'
    END,
    'Student'
  ) as display_name,
  sp.grade,
  sp.avatar_url
FROM profiles p
LEFT JOIN student_profiles sp ON sp.user_id = p.id
WHERE p.role = 'student'
ON CONFLICT (id) DO NOTHING;

-- Step 5: Create trigger to auto-create public profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_public_profile()
RETURNS trigger
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

CREATE TRIGGER on_profile_created_public_profile
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_public_profile();

-- Step 6: Update profiles RLS policies - keep existing but add audit
-- Note: We keep the existing classroom/parent viewing policies but they should use security definer functions in code
-- The RLS policies act as a safety net, but application code should use the security definer functions

COMMENT ON TABLE public.public_profiles IS 'Non-sensitive public profile information safe for cross-user viewing. Use security definer functions for accessing sensitive profiles table data.';