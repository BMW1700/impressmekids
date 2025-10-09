-- Drop existing types if they exist and recreate (to ensure clean state)
DROP TYPE IF EXISTS question_type CASCADE;
DROP TYPE IF EXISTS answer_status CASCADE;

-- Create enum for question types
CREATE TYPE question_type AS ENUM ('question_answer', 'reading_comprehension', 'speaking');

-- Create enum for answer status
CREATE TYPE answer_status AS ENUM ('not_attempted', 'in_progress', 'completed');

-- Modify assignments table to support multi-question format
ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS timer_minutes INTEGER,
ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 1;

-- Create assignment_questions table
CREATE TABLE IF NOT EXISTS public.assignment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  question_type question_type NOT NULL,
  question_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, sequence)
);

-- Enable RLS on assignment_questions
ALTER TABLE public.assignment_questions ENABLE ROW LEVEL SECURITY;

-- RLS policies for assignment_questions
CREATE POLICY "Teachers can create questions in their assignments"
ON public.assignment_questions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assignments
    WHERE assignments.id = assignment_questions.assignment_id
    AND assignments.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can update questions in their assignments"
ON public.assignment_questions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.assignments
    WHERE assignments.id = assignment_questions.assignment_id
    AND assignments.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can delete questions in their assignments"
ON public.assignment_questions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.assignments
    WHERE assignments.id = assignment_questions.assignment_id
    AND assignments.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view questions in published assignments"
ON public.assignment_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.classroom_students cs ON cs.classroom_id = a.classroom_id
    WHERE a.id = assignment_questions.assignment_id
    AND a.status = 'published'
    AND cs.student_id = auth.uid()
  )
);

CREATE POLICY "Teachers can view questions in their assignments"
ON public.assignment_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assignments
    WHERE assignments.id = assignment_questions.assignment_id
    AND assignments.teacher_id = auth.uid()
  )
);

-- Modify assignment_submissions table
ALTER TABLE public.assignment_submissions
ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER,
ADD COLUMN IF NOT EXISTS timer_expired BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- Create assignment_answers table
CREATE TABLE IF NOT EXISTS public.assignment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.assignment_questions(id) ON DELETE CASCADE,
  answer_type question_type NOT NULL,
  answer_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  aura_record_id UUID REFERENCES public.aura_records(id),
  status answer_status NOT NULL DEFAULT 'not_attempted',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(submission_id, question_id)
);

-- Enable RLS on assignment_answers
ALTER TABLE public.assignment_answers ENABLE ROW LEVEL SECURITY;

-- RLS policies for assignment_answers
CREATE POLICY "Students can create their own answers"
ON public.assignment_answers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assignment_submissions
    WHERE assignment_submissions.id = assignment_answers.submission_id
    AND assignment_submissions.student_id = auth.uid()
  )
);

CREATE POLICY "Students can update their own answers"
ON public.assignment_answers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.assignment_submissions
    WHERE assignment_submissions.id = assignment_answers.submission_id
    AND assignment_submissions.student_id = auth.uid()
  )
);

CREATE POLICY "Students can view their own answers"
ON public.assignment_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assignment_submissions
    WHERE assignment_submissions.id = assignment_answers.submission_id
    AND assignment_submissions.student_id = auth.uid()
  )
);

CREATE POLICY "Teachers can view answers for their classroom assignments"
ON public.assignment_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assignment_submissions asub
    JOIN public.assignments a ON a.id = asub.assignment_id
    JOIN public.classrooms c ON c.id = a.classroom_id
    WHERE asub.id = assignment_answers.submission_id
    AND c.teacher_id = auth.uid()
  )
);

-- Create storage bucket for assignment audio
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-audio', 'assignment-audio', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for assignment-audio bucket
CREATE POLICY "Teachers can upload audio to their assignments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-audio'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'teacher'
);

CREATE POLICY "Students can upload audio responses"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-audio'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'student'
);

CREATE POLICY "Users can view their own audio files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-audio'
  AND auth.role() = 'authenticated'
);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_assignment_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assignment_questions_updated_at
BEFORE UPDATE ON public.assignment_questions
FOR EACH ROW
EXECUTE FUNCTION update_assignment_questions_updated_at();

CREATE TRIGGER assignment_answers_updated_at
BEFORE UPDATE ON public.assignment_answers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();