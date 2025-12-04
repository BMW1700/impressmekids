-- Add publishing and vote tracking columns to reading_library
ALTER TABLE public.reading_library
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS thumbs_up_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS thumbs_down_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS helped_yes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS helped_no_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_reads INTEGER DEFAULT 0;

-- Create story_votes table for tracking individual votes
CREATE TABLE public.story_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.reading_library(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  thumbs_up BOOLEAN,
  helped_learn BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(story_id, student_id)
);

-- Enable RLS on story_votes
ALTER TABLE public.story_votes ENABLE ROW LEVEL SECURITY;

-- Students can view their own votes
CREATE POLICY "Students can view own votes"
ON public.story_votes
FOR SELECT
USING (student_id = auth.uid());

-- Students can insert their own votes
CREATE POLICY "Students can insert own votes"
ON public.story_votes
FOR INSERT
WITH CHECK (student_id = auth.uid());

-- Students can update their own votes
CREATE POLICY "Students can update own votes"
ON public.story_votes
FOR UPDATE
USING (student_id = auth.uid());

-- Teachers/admins can view all votes for analytics
CREATE POLICY "Teachers can view all votes"
ON public.story_votes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);

-- Create indexes for performance
CREATE INDEX idx_story_votes_story_id ON public.story_votes(story_id);
CREATE INDEX idx_story_votes_student_id ON public.story_votes(student_id);
CREATE INDEX idx_reading_library_is_published ON public.reading_library(is_published);
CREATE INDEX idx_reading_library_is_featured ON public.reading_library(is_featured);

-- Function to update vote counts when a vote is cast
CREATE OR REPLACE FUNCTION public.update_story_vote_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the story's vote counts
  UPDATE public.reading_library
  SET 
    thumbs_up_count = (SELECT COUNT(*) FROM public.story_votes WHERE story_id = COALESCE(NEW.story_id, OLD.story_id) AND thumbs_up = true),
    thumbs_down_count = (SELECT COUNT(*) FROM public.story_votes WHERE story_id = COALESCE(NEW.story_id, OLD.story_id) AND thumbs_up = false),
    helped_yes_count = (SELECT COUNT(*) FROM public.story_votes WHERE story_id = COALESCE(NEW.story_id, OLD.story_id) AND helped_learn = true),
    helped_no_count = (SELECT COUNT(*) FROM public.story_votes WHERE story_id = COALESCE(NEW.story_id, OLD.story_id) AND helped_learn = false),
    -- Auto-feature if 10+ thumbs up and 70%+ helped rate
    is_featured = CASE 
      WHEN (SELECT COUNT(*) FROM public.story_votes WHERE story_id = COALESCE(NEW.story_id, OLD.story_id) AND thumbs_up = true) >= 10
        AND (SELECT COUNT(*) FROM public.story_votes WHERE story_id = COALESCE(NEW.story_id, OLD.story_id) AND helped_learn = true)::float / 
            NULLIF((SELECT COUNT(*) FROM public.story_votes WHERE story_id = COALESCE(NEW.story_id, OLD.story_id) AND helped_learn IS NOT NULL), 0) >= 0.7
      THEN true
      ELSE is_featured
    END
  WHERE id = COALESCE(NEW.story_id, OLD.story_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to update counts on vote changes
CREATE TRIGGER update_vote_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.story_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_story_vote_counts();