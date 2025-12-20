-- Fix ambiguous column references in get_teacher_classrooms (output column name 'id' conflicts with unqualified 'id')
CREATE OR REPLACE FUNCTION public.get_teacher_classrooms(p_teacher_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  join_code text,
  created_at timestamp with time zone,
  student_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_district text;
  v_teacher_district text;
BEGIN
  SET LOCAL row_security = off;

  -- Qualify column references to avoid conflict with output column variables
  SELECT p.district_id
    INTO v_admin_district
  FROM public.profiles p
  WHERE p.id = auth.uid();

  SELECT p.district_id
    INTO v_teacher_district
  FROM public.profiles p
  WHERE p.id = p_teacher_id;

  -- If admin has a district, verify teacher is in same district
  IF v_admin_district IS NOT NULL AND v_admin_district != v_teacher_district THEN
    RETURN; -- Return empty result if districts don't match
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.join_code,
    c.created_at,
    COUNT(cs.student_id) as student_count
  FROM public.classrooms c
  LEFT JOIN public.classroom_students cs ON cs.classroom_id = c.id
  WHERE c.teacher_id = p_teacher_id
  GROUP BY c.id, c.name, c.join_code, c.created_at
  ORDER BY c.created_at DESC;
END;
$$;