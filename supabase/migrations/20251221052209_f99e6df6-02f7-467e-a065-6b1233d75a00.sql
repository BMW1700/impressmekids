-- Fix the security definer view warning by recreating as SECURITY INVOKER
DROP VIEW IF EXISTS public.districts_public;

CREATE VIEW public.districts_public 
WITH (security_invoker = true)
AS
SELECT 
  district_code,
  name,
  slug,
  is_visible
FROM public.districts
WHERE is_visible = true;

-- Grant anonymous access to the view
GRANT SELECT ON public.districts_public TO anon;
GRANT SELECT ON public.districts_public TO authenticated;