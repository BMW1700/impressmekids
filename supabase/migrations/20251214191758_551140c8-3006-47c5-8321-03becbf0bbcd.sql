-- Add screening passage ID to benchmark assessment periods
ALTER TABLE public.benchmark_assessment_periods 
ADD COLUMN IF NOT EXISTS screening_passage_id TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.benchmark_assessment_periods.screening_passage_id IS 'ID of the standardized screening passage selected for this period';