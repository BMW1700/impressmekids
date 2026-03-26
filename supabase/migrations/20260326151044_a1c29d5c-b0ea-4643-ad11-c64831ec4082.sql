-- CRITICAL: Fix district privilege escalation
DROP POLICY IF EXISTS "District admins can create districts" ON public.districts;
DROP POLICY IF EXISTS "District admins can insert their own account" ON public.district_admins;