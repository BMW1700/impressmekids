-- Create a function to validate substitute access
-- This function can be called without authentication
CREATE OR REPLACE FUNCTION public.validate_substitute_access(
  p_email text,
  p_access_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link record;
BEGIN
  -- Find matching link with email and code validation
  SELECT * INTO v_link
  FROM substitute_access_links
  WHERE LOWER(substitute_email) = LOWER(p_email)
    AND access_code = UPPER(p_access_code)
    AND is_active = true
    AND access_start <= now()
    AND access_end >= now();
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Invalid email or access code. Please check your credentials and try again.'
    );
  END IF;
  
  -- Mark as used if not already
  UPDATE substitute_access_links
  SET used_at = COALESCE(used_at, now())
  WHERE id = v_link.id;
  
  -- Return success with classroom info and permissions
  RETURN jsonb_build_object(
    'success', true,
    'classroom_id', v_link.classroom_id,
    'permissions', v_link.permissions,
    'access_end', v_link.access_end,
    'substitute_name', v_link.substitute_name,
    'link_id', v_link.id
  );
END;
$$;