-- Multi-District Architecture for SaaS Model
-- Enables multiple school districts to use the platform with isolated data

-- Add district tracking columns to profiles FIRST
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_domain TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district_id UUID;

-- Create districts table (each school district is a tenant)
CREATE TABLE IF NOT EXISTS public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  email_domains TEXT[] NOT NULL DEFAULT '{}',
  logo_url TEXT,
  primary_contact_email TEXT,
  subscription_tier TEXT DEFAULT 'pilot',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Now add the foreign key constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_district 
FOREIGN KEY (district_id) REFERENCES public.districts(id) ON DELETE SET NULL;

-- Enable RLS on districts
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

-- Districts are publicly viewable (for signup flow)
CREATE POLICY "Anyone can view districts"
ON public.districts FOR SELECT
USING (true);

-- Only district admins can update their district
CREATE POLICY "District admins can update their district"
ON public.districts FOR UPDATE
USING (
  id IN (
    SELECT district_id FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- District admins can insert districts
CREATE POLICY "District admins can create districts"
ON public.districts FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for fast email domain lookups
CREATE INDEX IF NOT EXISTS idx_districts_email_domains ON public.districts USING GIN(email_domains);

-- Create index for district lookups on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_district_id ON public.profiles(district_id);

-- Add updated_at trigger for districts
CREATE TRIGGER update_districts_updated_at
  BEFORE UPDATE ON public.districts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Update handle_new_user to support Google OAuth and district assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_text TEXT;
  final_role user_role;
  user_email TEXT;
  email_domain TEXT;
  matched_district_id UUID;
BEGIN
  -- Get email and extract domain
  user_email := NEW.email;
  email_domain := split_part(user_email, '@', 2);
  
  -- Check if email domain matches any district
  SELECT id INTO matched_district_id
  FROM public.districts
  WHERE email_domain = ANY(email_domains)
  LIMIT 1;
  
  -- Get the role from metadata, default to 'student'
  user_role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  -- Validate and safely cast to enum
  CASE user_role_text
    WHEN 'teacher' THEN final_role := 'teacher'::user_role;
    WHEN 'student' THEN final_role := 'student'::user_role;
    WHEN 'admin' THEN final_role := 'admin'::user_role;
    WHEN 'parent' THEN final_role := 'parent'::user_role;
    ELSE final_role := 'student'::user_role;
  END CASE;
  
  -- Insert into profiles table with district info
  INSERT INTO public.profiles (id, email, full_name, role, signup_domain, district_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    final_role,
    email_domain,
    matched_district_id
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Seed Allentown School District as first customer
INSERT INTO public.districts (name, slug, email_domains, subscription_tier, primary_contact_email)
VALUES (
  'Allentown School District',
  'allentown-sd',
  ARRAY['allentownsd.org']::TEXT[],
  'pilot',
  'admin@allentownsd.org'
)
ON CONFLICT (slug) DO NOTHING;