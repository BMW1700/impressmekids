-- Create table for parent notifications
CREATE TABLE public.parent_phoneme_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id),
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  parent_id UUID NOT NULL REFERENCES public.parent_accounts(id),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id),
  phoneme_data JSONB NOT NULL,
  message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parent_phoneme_reports ENABLE ROW LEVEL SECURITY;

-- Teachers can insert reports for their classrooms
CREATE POLICY "Teachers can create phoneme reports"
ON public.parent_phoneme_reports
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

-- Teachers can view reports they sent
CREATE POLICY "Teachers can view their sent reports"
ON public.parent_phoneme_reports
FOR SELECT
USING (auth.uid() = teacher_id);

-- Parents can view reports sent to them (via parent_accounts)
CREATE POLICY "Parents can view their reports"
ON public.parent_phoneme_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.parent_accounts
    WHERE parent_accounts.id = parent_phoneme_reports.parent_id
    AND parent_accounts.user_id = auth.uid()
  )
);

-- Parents can update read_at on their reports
CREATE POLICY "Parents can mark reports as read"
ON public.parent_phoneme_reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.parent_accounts
    WHERE parent_accounts.id = parent_phoneme_reports.parent_id
    AND parent_accounts.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.parent_accounts
    WHERE parent_accounts.id = parent_phoneme_reports.parent_id
    AND parent_accounts.user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_parent_phoneme_reports_parent ON public.parent_phoneme_reports(parent_id);
CREATE INDEX idx_parent_phoneme_reports_student ON public.parent_phoneme_reports(student_id);
CREATE INDEX idx_parent_phoneme_reports_teacher ON public.parent_phoneme_reports(teacher_id);