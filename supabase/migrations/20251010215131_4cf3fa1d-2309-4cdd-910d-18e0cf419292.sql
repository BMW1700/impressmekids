-- Fix function search path for security compliance
DROP TRIGGER IF EXISTS update_parent_consents_updated_at ON public.parent_consents;
DROP FUNCTION IF EXISTS update_parent_consents_updated_at();

CREATE OR REPLACE FUNCTION update_parent_consents_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_parent_consents_updated_at
  BEFORE UPDATE ON public.parent_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_consents_updated_at();