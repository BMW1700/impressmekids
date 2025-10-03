-- Create tournament_questions table to link tournaments with selected questions
CREATE TABLE public.tournament_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  sequence INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX idx_tournament_questions_tournament ON public.tournament_questions(tournament_id);
CREATE INDEX idx_tournament_questions_question ON public.tournament_questions(question_id);

-- Enable RLS
ALTER TABLE public.tournament_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournament_questions
-- Teachers can insert questions for their tournaments
CREATE POLICY "tq_insert"
ON public.tournament_questions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    JOIN public.classrooms c ON c.id = t.classroom_id
    WHERE t.id = tournament_questions.tournament_id
    AND c.teacher_id = auth.uid()
  )
);

-- Teachers and students can view questions for tournaments they have access to
CREATE POLICY "tq_select_teacher"
ON public.tournament_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    JOIN public.classrooms c ON c.id = t.classroom_id
    WHERE t.id = tournament_questions.tournament_id
    AND c.teacher_id = auth.uid()
  )
);

CREATE POLICY "tq_select_student"
ON public.tournament_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tournament_players tp
    WHERE tp.tournament_id = tournament_questions.tournament_id
    AND tp.profile_id = auth.uid()
  )
);

-- Teachers can delete questions from their tournaments
CREATE POLICY "tq_delete"
ON public.tournament_questions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    JOIN public.classrooms c ON c.id = t.classroom_id
    WHERE t.id = tournament_questions.tournament_id
    AND c.teacher_id = auth.uid()
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_questions;