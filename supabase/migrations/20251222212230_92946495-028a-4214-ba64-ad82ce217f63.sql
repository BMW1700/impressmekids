-- Add checklist_items column to store to-do items as JSONB array
ALTER TABLE public.teacher_journal_entries 
ADD COLUMN IF NOT EXISTS checklist_items JSONB DEFAULT '[]'::jsonb;

-- Create index for faster queries by teacher and date
CREATE INDEX IF NOT EXISTS idx_teacher_journal_entries_teacher_date 
ON public.teacher_journal_entries(teacher_id, entry_date DESC);