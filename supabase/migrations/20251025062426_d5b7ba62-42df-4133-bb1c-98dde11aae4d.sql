-- Remove teachers from classroom_students where they're listed as students in their own classrooms
DELETE FROM public.classroom_students cs
USING public.classrooms c
WHERE cs.classroom_id = c.id 
  AND cs.student_id = c.teacher_id;

-- Update join_classroom_by_code function to prevent teachers from joining their own classrooms
CREATE OR REPLACE FUNCTION public.join_classroom_by_code(p_join_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_classroom_id UUID;
  v_classroom_name TEXT;
  v_teacher_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Find classroom by join code
  SELECT id, name, teacher_id INTO v_classroom_id, v_classroom_name, v_teacher_id
  FROM public.classrooms
  WHERE join_code = UPPER(TRIM(p_join_code));
  
  IF v_classroom_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid join code');
  END IF;
  
  -- Prevent teachers from joining their own classrooms
  IF v_teacher_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Teachers cannot join their own classrooms as students');
  END IF;
  
  -- Check if already joined
  IF EXISTS (
    SELECT 1 FROM public.classroom_students
    WHERE classroom_id = v_classroom_id AND student_id = v_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_joined', true,
      'classroom_id', v_classroom_id,
      'classroom_name', v_classroom_name
    );
  END IF;
  
  -- Join classroom
  INSERT INTO public.classroom_students (classroom_id, student_id)
  VALUES (v_classroom_id, v_user_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'already_joined', false,
    'classroom_id', v_classroom_id,
    'classroom_name', v_classroom_name
  );
END;
$function$;