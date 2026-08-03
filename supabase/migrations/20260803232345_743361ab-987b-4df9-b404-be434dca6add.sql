DELETE FROM auth.users
WHERE email LIKE '%@student.yubilearn.internal'
  AND created_at > now() - interval '3 hours';