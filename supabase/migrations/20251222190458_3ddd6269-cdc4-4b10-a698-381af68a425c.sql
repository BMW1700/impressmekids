-- Clean up duplicate policies on aura_records for clarity
-- Keep only the cleaner policies

-- Remove older/redundant student policies (keep the new ones)
DROP POLICY IF EXISTS "Students can view their own AURA records" ON public.aura_records;
DROP POLICY IF EXISTS "Students can insert their own AURA records" ON public.aura_records;

-- Remove the consent-based teacher policy since we now have a simpler one
DROP POLICY IF EXISTS "Teachers can view AURA records with verified consent" ON public.aura_records;