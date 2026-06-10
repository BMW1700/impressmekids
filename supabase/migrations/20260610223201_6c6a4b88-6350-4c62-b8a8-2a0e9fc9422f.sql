
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.safety_audit_log
  ADD COLUMN IF NOT EXISTS prev_hash text,
  ADD COLUMN IF NOT EXISTS row_hash text;

ALTER TABLE public.security_audit_log
  ADD COLUMN IF NOT EXISTS prev_hash text,
  ADD COLUMN IF NOT EXISTS row_hash text;

CREATE OR REPLACE FUNCTION public.compute_audit_row_hash(
  _prev_hash text,
  _payload   jsonb
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions, pg_temp
AS $$
  SELECT encode(
    extensions.digest(
      coalesce(_prev_hash, '') || '|' || coalesce(_payload::text, ''),
      'sha256'
    ),
    'hex'
  );
$$;

REVOKE ALL ON FUNCTION public.compute_audit_row_hash(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compute_audit_row_hash(text, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.safety_audit_log_hash_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _prev text;
  _payload jsonb;
BEGIN
  SELECT row_hash INTO _prev
  FROM public.safety_audit_log
  WHERE row_hash IS NOT NULL
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  _payload := jsonb_build_object(
    'id', NEW.id, 'event_type', NEW.event_type, 'event_data', NEW.event_data,
    'user_id', NEW.user_id, 'drill_session_id', NEW.drill_session_id,
    'alert_id', NEW.alert_id, 'created_at', NEW.created_at
  );

  NEW.prev_hash := _prev;
  NEW.row_hash  := public.compute_audit_row_hash(_prev, _payload);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.safety_audit_log_hash_trigger() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS safety_audit_log_hash_chain ON public.safety_audit_log;
CREATE TRIGGER safety_audit_log_hash_chain
  BEFORE INSERT ON public.safety_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.safety_audit_log_hash_trigger();

CREATE OR REPLACE FUNCTION public.security_audit_log_hash_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _prev text;
  _payload jsonb;
BEGIN
  SELECT row_hash INTO _prev
  FROM public.security_audit_log
  WHERE row_hash IS NOT NULL
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  _payload := jsonb_build_object(
    'id', NEW.id, 'user_id', NEW.user_id, 'user_email', NEW.user_email,
    'user_role', NEW.user_role, 'action_type', NEW.action_type,
    'table_name', NEW.table_name, 'record_id', NEW.record_id,
    'metadata', NEW.metadata, 'created_at', NEW.created_at
  );

  NEW.prev_hash := _prev;
  NEW.row_hash  := public.compute_audit_row_hash(_prev, _payload);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.security_audit_log_hash_trigger() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS security_audit_log_hash_chain ON public.security_audit_log;
CREATE TRIGGER security_audit_log_hash_chain
  BEFORE INSERT ON public.security_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.security_audit_log_hash_trigger();

-- Backfill: temporarily lift immutability to seed historical hashes.
ALTER TABLE public.security_audit_log DISABLE TRIGGER prevent_security_audit_modification;

DO $$
DECLARE
  r RECORD;
  _prev text := NULL;
  _payload jsonb;
BEGIN
  FOR r IN
    SELECT id, event_type, event_data, user_id, drill_session_id, alert_id, created_at
    FROM public.safety_audit_log
    ORDER BY created_at ASC, id ASC
  LOOP
    _payload := jsonb_build_object(
      'id', r.id, 'event_type', r.event_type, 'event_data', r.event_data,
      'user_id', r.user_id, 'drill_session_id', r.drill_session_id,
      'alert_id', r.alert_id, 'created_at', r.created_at
    );
    UPDATE public.safety_audit_log
       SET prev_hash = _prev,
           row_hash  = public.compute_audit_row_hash(_prev, _payload)
     WHERE id = r.id;
    _prev := public.compute_audit_row_hash(_prev, _payload);
  END LOOP;
END $$;

DO $$
DECLARE
  r RECORD;
  _prev text := NULL;
  _payload jsonb;
BEGIN
  FOR r IN
    SELECT id, user_id, user_email, user_role, action_type, table_name, record_id, metadata, created_at
    FROM public.security_audit_log
    ORDER BY created_at ASC, id ASC
  LOOP
    _payload := jsonb_build_object(
      'id', r.id, 'user_id', r.user_id, 'user_email', r.user_email,
      'user_role', r.user_role, 'action_type', r.action_type,
      'table_name', r.table_name, 'record_id', r.record_id,
      'metadata', r.metadata, 'created_at', r.created_at
    );
    UPDATE public.security_audit_log
       SET prev_hash = _prev,
           row_hash  = public.compute_audit_row_hash(_prev, _payload)
     WHERE id = r.id;
    _prev := public.compute_audit_row_hash(_prev, _payload);
  END LOOP;
END $$;

ALTER TABLE public.security_audit_log ENABLE TRIGGER prevent_security_audit_modification;

CREATE OR REPLACE FUNCTION public.verify_audit_chain(_table text)
RETURNS TABLE(broken_id uuid, expected_hash text, found_hash text, broken_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  r RECORD;
  _prev text := NULL;
  _expected text;
BEGIN
  IF _table NOT IN ('safety_audit_log', 'security_audit_log') THEN
    RAISE EXCEPTION 'verify_audit_chain: invalid table %', _table;
  END IF;

  IF _table = 'safety_audit_log' THEN
    FOR r IN
      SELECT id, event_type, event_data, user_id, drill_session_id, alert_id,
             created_at, prev_hash, row_hash
      FROM public.safety_audit_log
      ORDER BY created_at ASC, id ASC
    LOOP
      _expected := public.compute_audit_row_hash(_prev, jsonb_build_object(
        'id', r.id, 'event_type', r.event_type, 'event_data', r.event_data,
        'user_id', r.user_id, 'drill_session_id', r.drill_session_id,
        'alert_id', r.alert_id, 'created_at', r.created_at
      ));
      IF r.row_hash IS DISTINCT FROM _expected OR r.prev_hash IS DISTINCT FROM _prev THEN
        broken_id := r.id; expected_hash := _expected; found_hash := r.row_hash; broken_at := r.created_at;
        RETURN NEXT;
        RETURN;
      END IF;
      _prev := r.row_hash;
    END LOOP;
  ELSE
    FOR r IN
      SELECT id, user_id, user_email, user_role, action_type, table_name, record_id,
             metadata, created_at, prev_hash, row_hash
      FROM public.security_audit_log
      ORDER BY created_at ASC, id ASC
    LOOP
      _expected := public.compute_audit_row_hash(_prev, jsonb_build_object(
        'id', r.id, 'user_id', r.user_id, 'user_email', r.user_email,
        'user_role', r.user_role, 'action_type', r.action_type,
        'table_name', r.table_name, 'record_id', r.record_id,
        'metadata', r.metadata, 'created_at', r.created_at
      ));
      IF r.row_hash IS DISTINCT FROM _expected OR r.prev_hash IS DISTINCT FROM _prev THEN
        broken_id := r.id; expected_hash := _expected; found_hash := r.row_hash; broken_at := r.created_at;
        RETURN NEXT;
        RETURN;
      END IF;
      _prev := r.row_hash;
    END LOOP;
  END IF;

  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_audit_chain(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_audit_chain(text) TO authenticated, service_role;
