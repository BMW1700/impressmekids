-- Create assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT NOT NULL DEFAULT 'reading_comprehension',
  passage_text TEXT NOT NULL,
  passage_metadata JSONB DEFAULT '{}',
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignment_submissions table
CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started',
  submitted_at TIMESTAMP WITH TIME ZONE,
  graded_at TIMESTAMP WITH TIME ZONE,
  teacher_feedback TEXT,
  grade NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

-- Create text_highlights table
CREATE TABLE public.text_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  highlighted_text TEXT NOT NULL,
  annotation TEXT,
  color TEXT NOT NULL DEFAULT 'yellow',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_assignments_classroom ON public.assignments(classroom_id);
CREATE INDEX idx_assignments_teacher ON public.assignments(teacher_id);
CREATE INDEX idx_assignment_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student ON public.assignment_submissions(student_id);
CREATE INDEX idx_text_highlights_submission ON public.text_highlights(submission_id);
CREATE INDEX idx_text_highlights_student ON public.text_highlights(student_id);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.text_highlights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignments table
CREATE POLICY "Teachers can create assignments in their classrooms"
ON public.assignments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = assignments.classroom_id
    AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can view assignments in their classrooms"
ON public.assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = assignments.classroom_id
    AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can update their own assignments"
ON public.assignments FOR UPDATE
USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own assignments"
ON public.assignments FOR DELETE
USING (teacher_id = auth.uid());

CREATE POLICY "Students can view published assignments in their classrooms"
ON public.assignments FOR SELECT
USING (
  status = 'published' 
  AND EXISTS (
    SELECT 1 FROM public.classroom_students
    WHERE classroom_id = assignments.classroom_id
    AND student_id = auth.uid()
  )
);

-- RLS Policies for assignment_submissions table
CREATE POLICY "Students can create their own submissions"
ON public.assignment_submissions FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view their own submissions"
ON public.assignment_submissions FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can update their own submissions"
ON public.assignment_submissions FOR UPDATE
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions for their classroom assignments"
ON public.assignment_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.classrooms c ON c.id = a.classroom_id
    WHERE a.id = assignment_submissions.assignment_id
    AND c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can update submissions for grading"
ON public.assignment_submissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.classrooms c ON c.id = a.classroom_id
    WHERE a.id = assignment_submissions.assignment_id
    AND c.teacher_id = auth.uid()
  )
);

-- RLS Policies for text_highlights table
CREATE POLICY "Students can create their own highlights"
ON public.text_highlights FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view their own highlights"
ON public.text_highlights FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can update their own highlights"
ON public.text_highlights FOR UPDATE
USING (student_id = auth.uid());

CREATE POLICY "Students can delete their own highlights"
ON public.text_highlights FOR DELETE
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view highlights for their classroom submissions"
ON public.text_highlights FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assignment_submissions asub
    JOIN public.assignments a ON a.id = asub.assignment_id
    JOIN public.classrooms c ON c.id = a.classroom_id
    WHERE asub.id = text_highlights.submission_id
    AND c.teacher_id = auth.uid()
  )
);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_assignment_submissions_updated_at
  BEFORE UPDATE ON public.assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_text_highlights_updated_at
  BEFORE UPDATE ON public.text_highlights
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();