
-- World backgrounds: kill the broad listing SELECT
DROP POLICY IF EXISTS "World backgrounds are publicly accessible" ON storage.objects;

DO $$
DECLARE
  r record;
  sig text;
  returns_trigger boolean;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname,
           pg_get_function_identity_arguments(p.oid) AS args,
           pg_get_function_result(p.oid) AS result_type
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    sig := format('public.%I(%s)', r.proname, r.args);
    returns_trigger := (r.result_type = 'trigger');

    -- 1. Pin search_path
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', sig);

    -- 2. Revoke from PUBLIC + anon
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', sig);

    -- 3. Grant to authenticated only if it's NOT a trigger function
    IF NOT returns_trigger THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', sig);
    ELSE
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', sig);
    END IF;

    -- service_role always retains access (default), but assert it explicitly
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', sig);
  END LOOP;
END
$$;
