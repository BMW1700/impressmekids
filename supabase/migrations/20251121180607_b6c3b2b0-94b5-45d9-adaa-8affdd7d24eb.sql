-- Create function to cleanup district data before deletion
CREATE OR REPLACE FUNCTION public.cleanup_district_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clear district_name from profiles where district_id matches
  UPDATE public.profiles
  SET district_name = NULL
  WHERE district_id = OLD.id;
  
  -- Delete district_admins entries for this district
  DELETE FROM public.district_admins
  WHERE district_name = OLD.name;
  
  -- Log the deletion
  RAISE NOTICE 'Cleaned up district data for district: % (ID: %)', OLD.name, OLD.id;
  
  RETURN OLD;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS cleanup_district_on_delete ON public.districts;

-- Create trigger to run cleanup before district deletion
CREATE TRIGGER cleanup_district_on_delete
  BEFORE DELETE ON public.districts
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_district_data();

-- Add documentation comment
COMMENT ON TRIGGER cleanup_district_on_delete ON public.districts IS 
'Automatically cleans up denormalized district data from profiles and district_admins tables when a district is deleted. Ensures complete data removal while preserving user accounts.';