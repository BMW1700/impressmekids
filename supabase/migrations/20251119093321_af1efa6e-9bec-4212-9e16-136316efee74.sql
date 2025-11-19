-- Create classroom_syllabus table
CREATE TABLE IF NOT EXISTS public.classroom_syllabus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL UNIQUE REFERENCES public.classrooms(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  is_posted BOOLEAN NOT NULL DEFAULT false,
  grade_weights JSONB NOT NULL DEFAULT '{"test": 25, "quiz": 25, "homework": 25, "attendance": 25}'::jsonb,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on classroom_id for faster lookups
CREATE INDEX idx_classroom_syllabus_classroom_id ON public.classroom_syllabus(classroom_id);

-- Create trigger for updated_at
CREATE TRIGGER update_classroom_syllabus_updated_at
  BEFORE UPDATE ON public.classroom_syllabus
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Validation trigger for grade_weights
CREATE OR REPLACE FUNCTION public.validate_grade_weights()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  test_weight INTEGER;
  quiz_weight INTEGER;
  homework_weight INTEGER;
  attendance_weight INTEGER;
  total_weight INTEGER;
BEGIN
  -- Extract weights from JSONB
  test_weight := (NEW.grade_weights->>'test')::INTEGER;
  quiz_weight := (NEW.grade_weights->>'quiz')::INTEGER;
  homework_weight := (NEW.grade_weights->>'homework')::INTEGER;
  attendance_weight := (NEW.grade_weights->>'attendance')::INTEGER;
  
  -- Validate each weight is between 0 and 100
  IF test_weight < 0 OR test_weight > 100 THEN
    RAISE EXCEPTION 'Test weight must be between 0 and 100';
  END IF;
  IF quiz_weight < 0 OR quiz_weight > 100 THEN
    RAISE EXCEPTION 'Quiz weight must be between 0 and 100';
  END IF;
  IF homework_weight < 0 OR homework_weight > 100 THEN
    RAISE EXCEPTION 'Homework weight must be between 0 and 100';
  END IF;
  IF attendance_weight < 0 OR attendance_weight > 100 THEN
    RAISE EXCEPTION 'Attendance weight must be between 0 and 100';
  END IF;
  
  -- Validate total equals 100
  total_weight := test_weight + quiz_weight + homework_weight + attendance_weight;
  IF total_weight != 100 THEN
    RAISE EXCEPTION 'Grade weights must sum to 100 percent (currently: %)', total_weight;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_grade_weights_trigger
  BEFORE INSERT OR UPDATE ON public.classroom_syllabus
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_grade_weights();

-- RLS Policies for classroom_syllabus table
ALTER TABLE public.classroom_syllabus ENABLE ROW LEVEL SECURITY;

-- Teachers can manage syllabus in their classrooms
CREATE POLICY "Teachers can manage syllabus in their classrooms"
  ON public.classroom_syllabus
  FOR ALL
  USING (is_classroom_teacher(auth.uid(), classroom_id))
  WITH CHECK (is_classroom_teacher(auth.uid(), classroom_id));

-- Students can view posted syllabus in their classrooms
CREATE POLICY "Students can view posted syllabus"
  ON public.classroom_syllabus
  FOR SELECT
  USING (is_posted = true AND is_classroom_student(auth.uid(), classroom_id));

-- Parents can view posted syllabus for their children's classrooms
CREATE POLICY "Parents can view posted syllabus for children"
  ON public.classroom_syllabus
  FOR SELECT
  USING (
    is_posted = true 
    AND can_parent_view_classroom(auth.uid(), classroom_id)
  );

-- Create storage bucket for classroom syllabus
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'classroom-syllabus',
  'classroom-syllabus',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Teachers can upload syllabus files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'classroom-syllabus' 
    AND auth.uid() IN (
      SELECT teacher_id FROM public.classrooms 
      WHERE id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Teachers can update their syllabus files"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'classroom-syllabus'
    AND auth.uid() IN (
      SELECT teacher_id FROM public.classrooms 
      WHERE id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Teachers can delete their syllabus files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'classroom-syllabus'
    AND auth.uid() IN (
      SELECT teacher_id FROM public.classrooms 
      WHERE id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Teachers can view their syllabus files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'classroom-syllabus'
    AND auth.uid() IN (
      SELECT teacher_id FROM public.classrooms 
      WHERE id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Students can view posted syllabus files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'classroom-syllabus'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT cs.classroom_id::text::uuid
      FROM public.classroom_syllabus cs
      WHERE cs.is_posted = true
      AND is_classroom_student(auth.uid(), cs.classroom_id)
    )
  );

CREATE POLICY "Parents can view posted syllabus files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'classroom-syllabus'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT cs.classroom_id::text::uuid
      FROM public.classroom_syllabus cs
      WHERE cs.is_posted = true
      AND can_parent_view_classroom(auth.uid(), cs.classroom_id)
    )
  );