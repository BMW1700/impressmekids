-- Add game_player to user_role enum (profiles.role uses this)
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'game_player';

-- Update handle_new_user to recognize game_player
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
    WHEN 'game_player' THEN
      final_role := 'game_player'::app_role;
      final_user_role := 'game_player'::user_role;
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