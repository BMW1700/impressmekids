-- Step 1: Drop RLS policies that depend on district_id
DROP POLICY IF EXISTS "District admins can update their district" ON public.districts;
DROP POLICY IF EXISTS "Authenticated users within district can view" ON public.districts;
DROP POLICY IF EXISTS "District admins can view district requests" ON public.account_verification_requests;
DROP POLICY IF EXISTS "District admins can update district requests" ON public.account_verification_requests;

-- Step 2: Drop old UUID district_id columns and constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_district_id_fkey;
ALTER TABLE public.account_verification_requests DROP CONSTRAINT IF EXISTS account_verification_requests_district_id_fkey;

DROP INDEX IF EXISTS idx_profiles_district_id;
DROP INDEX IF EXISTS idx_account_verification_requests_district_id;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS district_id;
ALTER TABLE public.account_verification_requests DROP COLUMN IF EXISTS district_id;

-- Step 3: Create new TEXT district_id columns
ALTER TABLE public.profiles 
ADD COLUMN district_id TEXT;

ALTER TABLE public.account_verification_requests 
ADD COLUMN district_id TEXT NOT NULL;

-- Step 4: Add foreign key constraints to districts(district_code)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_district_id_fkey 
FOREIGN KEY (district_id) REFERENCES public.districts(district_code) ON DELETE SET NULL;

ALTER TABLE public.account_verification_requests 
ADD CONSTRAINT account_verification_requests_district_id_fkey 
FOREIGN KEY (district_id) REFERENCES public.districts(district_code) ON DELETE CASCADE;

-- Step 5: Recreate indexes
CREATE INDEX idx_profiles_district_id ON public.profiles(district_id);
CREATE INDEX idx_account_verification_requests_district_id ON public.account_verification_requests(district_id, status);

-- Step 6: Recreate RLS policies with TEXT district_id
CREATE POLICY "District admins can update their district"
ON public.districts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.district_admins da
    JOIN public.profiles p ON p.id = da.user_id
    WHERE da.user_id = auth.uid()
    AND p.district_id = districts.district_code
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.district_admins da
    JOIN public.profiles p ON p.id = da.user_id
    WHERE da.user_id = auth.uid()
    AND p.district_id = districts.district_code
  )
);

CREATE POLICY "Authenticated users within district can view"
ON public.districts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.district_id = districts.district_code
  )
);

CREATE POLICY "District admins can view district requests"
ON public.account_verification_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.district_admins da
    JOIN public.profiles p ON p.id = da.user_id
    WHERE da.user_id = auth.uid()
    AND p.district_id = account_verification_requests.district_id
  )
);

CREATE POLICY "District admins can update district requests"
ON public.account_verification_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.district_admins da
    JOIN public.profiles p ON p.id = da.user_id
    WHERE da.user_id = auth.uid()
    AND p.district_id = account_verification_requests.district_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.district_admins da
    JOIN public.profiles p ON p.id = da.user_id
    WHERE da.user_id = auth.uid()
    AND p.district_id = account_verification_requests.district_id
  )
);

-- Step 7: Update handle_new_user() function to use district_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role_text TEXT;
  final_role app_role;
  final_user_role user_role;
  user_email TEXT;
  email_domain TEXT;
  matched_district_code TEXT;
BEGIN
  user_email := NEW.email;
  email_domain := split_part(user_email, '@', 2);
  
  SELECT district_code INTO matched_district_code
  FROM public.districts
  WHERE email_domain = ANY(email_domains)
  LIMIT 1;
  
  user_role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  CASE user_role_text
    WHEN 'teacher' THEN 
      final_role := 'teacher'::app_role;
      final_user_role := 'teacher'::user_role;
    WHEN 'student' THEN 
      final_role := 'student'::app_role;
      final_user_role := 'student'::user_role;
    WHEN 'admin' THEN 
      final_role := 'admin'::app_role;
      final_user_role := 'admin'::user_role;
    WHEN 'parent' THEN 
      final_role := 'parent'::app_role;
      final_user_role := 'parent'::user_role;
    ELSE 
      final_role := 'student'::app_role;
      final_user_role := 'student'::user_role;
  END CASE;
  
  INSERT INTO public.profiles (id, email, full_name, role, signup_domain, district_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    final_user_role,
    email_domain,
    matched_district_code
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, final_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Step 8: Update update_user_district() function to accept TEXT
CREATE OR REPLACE FUNCTION public.update_user_district(p_user_id uuid, p_district_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot update another user district';
  END IF;
  
  UPDATE public.profiles
  SET district_id = p_district_id
  WHERE id = p_user_id;
END;
$function$;