-- Fix PUBLIC_DATA_EXPOSURE: Remove the overly permissive anonymous read policy
-- and create a secure public view with minimal fields for signup

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anonymous users can view districts for signup" ON public.districts;

-- Create a minimal public view for signup that only exposes name and slug
CREATE OR REPLACE VIEW public.districts_public AS
SELECT 
  district_code,
  name,
  slug,
  is_visible
FROM public.districts
WHERE is_visible = true;

-- Grant anonymous access to the view only
GRANT SELECT ON public.districts_public TO anon;

-- The existing authenticated policies remain in place for full access