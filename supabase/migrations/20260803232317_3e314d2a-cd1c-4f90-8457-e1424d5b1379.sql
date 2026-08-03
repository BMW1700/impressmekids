INSERT INTO public.profiles (id, email, full_name, role, signup_domain)
SELECT u.id, u.email,
       COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
       CASE COALESCE(u.raw_user_meta_data->>'role','student')
         WHEN 'teacher' THEN 'teacher'::user_role
         WHEN 'admin' THEN 'admin'::user_role
         WHEN 'parent' THEN 'parent'::user_role
         WHEN 'game_player' THEN 'game_player'::user_role
         ELSE 'student'::user_role END,
       split_part(u.email, '@', 2)
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
  AND u.email NOT LIKE '%@student.yubilearn.internal'
ON CONFLICT (id) DO NOTHING;

DELETE FROM auth.users
WHERE email LIKE '%@student.yubilearn.internal'
  AND created_at > now() - interval '3 hours';