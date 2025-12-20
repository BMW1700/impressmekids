-- Add display_order column for teacher tab reorganization
ALTER TABLE public.classroom_features 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_classroom_features_order 
ON public.classroom_features(classroom_id, display_order);