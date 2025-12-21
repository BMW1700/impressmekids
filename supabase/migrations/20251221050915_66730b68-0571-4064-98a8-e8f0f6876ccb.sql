-- Create classroom_join_requests table for pending student join requests
CREATE TABLE public.classroom_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  UNIQUE(classroom_id, student_id)
);

-- Enable RLS
ALTER TABLE public.classroom_join_requests ENABLE ROW LEVEL SECURITY;

-- Students can create join requests
CREATE POLICY "Students can create join requests"
ON public.classroom_join_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

-- Students can view their own requests
CREATE POLICY "Students can view own requests"
ON public.classroom_join_requests
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Teachers can view requests for their classrooms
CREATE POLICY "Teachers can view requests for their classrooms"
ON public.classroom_join_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = classroom_join_requests.classroom_id
    AND c.teacher_id = auth.uid()
  )
);

-- Teachers can update requests for their classrooms
CREATE POLICY "Teachers can update requests for their classrooms"
ON public.classroom_join_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = classroom_join_requests.classroom_id
    AND c.teacher_id = auth.uid()
  )
);

-- Update join_classroom_by_code to create pending requests instead of direct enrollment
CREATE OR REPLACE FUNCTION public.join_classroom_by_code(p_join_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_classroom_id UUID;
  v_classroom_name TEXT;
  v_teacher_id UUID;
  v_user_id UUID;
  v_existing_request TEXT;
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
  
  -- Check if already enrolled
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
  
  -- Check if there's already a pending or denied request
  SELECT status INTO v_existing_request
  FROM public.classroom_join_requests
  WHERE classroom_id = v_classroom_id AND student_id = v_user_id;
  
  IF v_existing_request = 'pending' THEN
    RETURN jsonb_build_object(
      'success', true,
      'pending', true,
      'classroom_id', v_classroom_id,
      'classroom_name', v_classroom_name
    );
  END IF;
  
  -- If previously denied, update to pending again (allow retry)
  IF v_existing_request = 'denied' THEN
    UPDATE public.classroom_join_requests
    SET status = 'pending', requested_at = now(), reviewed_by = NULL, reviewed_at = NULL
    WHERE classroom_id = v_classroom_id AND student_id = v_user_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'pending', true,
      'resubmitted', true,
      'classroom_id', v_classroom_id,
      'classroom_name', v_classroom_name
    );
  END IF;
  
  -- Create new pending request
  INSERT INTO public.classroom_join_requests (classroom_id, student_id, status)
  VALUES (v_classroom_id, v_user_id, 'pending');
  
  RETURN jsonb_build_object(
    'success', true,
    'pending', true,
    'classroom_id', v_classroom_id,
    'classroom_name', v_classroom_name
  );
END;
$$;

-- Function to approve a student join request
CREATE OR REPLACE FUNCTION public.approve_student_join_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_classroom_id UUID;
  v_student_id UUID;
  v_teacher_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get request details
  SELECT r.classroom_id, r.student_id, c.teacher_id
  INTO v_classroom_id, v_student_id, v_teacher_id
  FROM public.classroom_join_requests r
  JOIN public.classrooms c ON c.id = r.classroom_id
  WHERE r.id = p_request_id AND r.status = 'pending';
  
  IF v_classroom_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;
  
  -- Verify user is the teacher
  IF v_teacher_id != v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the classroom teacher can approve requests');
  END IF;
  
  -- Update request status
  UPDATE public.classroom_join_requests
  SET status = 'approved', reviewed_by = v_user_id, reviewed_at = now()
  WHERE id = p_request_id;
  
  -- Add student to classroom
  INSERT INTO public.classroom_students (classroom_id, student_id)
  VALUES (v_classroom_id, v_student_id)
  ON CONFLICT (classroom_id, student_id) DO NOTHING;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to deny a student join request
CREATE OR REPLACE FUNCTION public.deny_student_join_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_classroom_id UUID;
  v_teacher_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get request details
  SELECT r.classroom_id, c.teacher_id
  INTO v_classroom_id, v_teacher_id
  FROM public.classroom_join_requests r
  JOIN public.classrooms c ON c.id = r.classroom_id
  WHERE r.id = p_request_id AND r.status = 'pending';
  
  IF v_classroom_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;
  
  -- Verify user is the teacher
  IF v_teacher_id != v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the classroom teacher can deny requests');
  END IF;
  
  -- Update request status
  UPDATE public.classroom_join_requests
  SET status = 'denied', reviewed_by = v_user_id, reviewed_at = now()
  WHERE id = p_request_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;