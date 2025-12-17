-- Create trigger function to auto-add admins to district_admins
CREATE OR REPLACE FUNCTION public.handle_admin_district_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a profile is created or updated with role 'admin'
  IF NEW.role = 'admin' THEN
    -- Insert into district_admins if not already there
    INSERT INTO public.district_admins (user_id, email, full_name, district_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.full_name, 'Admin'),
      COALESCE(NEW.district_name, 'Default District')
    )
    ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      district_name = EXCLUDED.district_name;
  END IF;
  
  -- If role changed away from admin, remove from district_admins
  IF TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role != 'admin' THEN
    DELETE FROM public.district_admins WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_admin_profile_change ON public.profiles;
CREATE TRIGGER on_admin_profile_change
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_district_assignment();

-- Add unique constraint on user_id in district_admins if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'district_admins_user_id_key'
  ) THEN
    ALTER TABLE public.district_admins ADD CONSTRAINT district_admins_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Backfill: Add existing admins to district_admins
INSERT INTO public.district_admins (user_id, email, full_name, district_name)
SELECT 
  p.id,
  p.email,
  COALESCE(p.full_name, 'Admin'),
  COALESCE(p.district_name, 'Default District')
FROM public.profiles p
WHERE p.role = 'admin'
ON CONFLICT (user_id) DO NOTHING;