-- Create function to handle parent account creation
CREATE OR REPLACE FUNCTION public.handle_parent_profile_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the new profile has role 'parent', create a parent_accounts entry
  IF NEW.role = 'parent' THEN
    INSERT INTO public.parent_accounts (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.full_name)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create parent_accounts when a parent profile is created
DROP TRIGGER IF EXISTS on_parent_profile_created ON profiles;
CREATE TRIGGER on_parent_profile_created
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'parent')
  EXECUTE FUNCTION public.handle_parent_profile_creation();

-- Backfill: Create parent_accounts for existing parent profiles that don't have one
INSERT INTO public.parent_accounts (user_id, email, full_name)
SELECT p.id, p.email, p.full_name
FROM profiles p
LEFT JOIN parent_accounts pa ON pa.user_id = p.id
WHERE p.role = 'parent' AND pa.id IS NULL
ON CONFLICT (user_id) DO NOTHING;