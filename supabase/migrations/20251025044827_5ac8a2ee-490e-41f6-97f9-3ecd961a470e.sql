-- Fix admin user role
UPDATE public.user_roles
SET role = 'admin'::app_role
WHERE user_id = '0005272f-5bb6-4a9c-b0fd-ac8554f509b7'
  AND role = 'student'::app_role;

-- Update profiles table for consistency
UPDATE public.profiles
SET role = 'admin'::user_role
WHERE id = '0005272f-5bb6-4a9c-b0fd-ac8554f509b7'
  AND role = 'student'::user_role;