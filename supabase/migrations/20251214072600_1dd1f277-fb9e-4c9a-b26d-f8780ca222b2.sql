-- Add WCPM, miscue analysis, prosody metrics, and fluency level columns to reading_sessions
ALTER TABLE public.reading_sessions 
ADD COLUMN IF NOT EXISTS wcpm INTEGER,
ADD COLUMN IF NOT EXISTS fluency_level TEXT CHECK (fluency_level IN ('frustration', 'instructional', 'independent')),
ADD COLUMN IF NOT EXISTS miscue_analysis JSONB,
ADD COLUMN IF NOT EXISTS prosody_metrics JSONB;

-- Add index for fluency level queries (useful for teacher dashboards)
CREATE INDEX IF NOT EXISTS idx_reading_sessions_fluency_level 
ON public.reading_sessions (fluency_level);

-- Add comment for documentation
COMMENT ON COLUMN public.reading_sessions.wcpm IS 'Words Correct Per Minute - WPM minus miscues (substitutions, omissions)';
COMMENT ON COLUMN public.reading_sessions.fluency_level IS 'Reading level: frustration (<90%), instructional (90-96%), independent (97%+)';
COMMENT ON COLUMN public.reading_sessions.miscue_analysis IS 'Full miscue breakdown: substitutions, omissions, insertions, self-corrections';
COMMENT ON COLUMN public.reading_sessions.prosody_metrics IS 'NAEP-style prosody scores: phrasing, expression, smoothness, pace';