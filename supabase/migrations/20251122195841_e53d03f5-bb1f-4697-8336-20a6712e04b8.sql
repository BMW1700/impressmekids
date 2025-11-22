-- Add is_posted column to flashcard_sets table
ALTER TABLE public.flashcard_sets 
ADD COLUMN is_posted BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster queries
CREATE INDEX idx_flashcard_sets_posted ON public.flashcard_sets(classroom_id, is_posted);