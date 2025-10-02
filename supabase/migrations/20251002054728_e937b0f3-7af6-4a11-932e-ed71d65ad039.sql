-- Fix security linter warnings

-- Fix 1: Add search_path to compute_levenshtein function
CREATE OR REPLACE FUNCTION public.compute_levenshtein(a TEXT, b TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN levenshtein(lower(trim(a)), lower(trim(b)));
END;
$$;

-- Fix 2: Move fuzzystrmatch extension from public to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS fuzzystrmatch CASCADE;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA extensions;

-- Recreate compute_levenshtein with correct reference
CREATE OR REPLACE FUNCTION public.compute_levenshtein(a TEXT, b TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN extensions.levenshtein(lower(trim(a)), lower(trim(b)));
END;
$$;