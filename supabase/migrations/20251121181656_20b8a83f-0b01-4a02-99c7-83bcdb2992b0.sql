-- Add is_visible column to districts table
ALTER TABLE public.districts 
ADD COLUMN is_visible boolean NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.districts.is_visible IS 
'Controls whether district appears in account creation dropdown. False hides district from signup without deleting data.';

-- Create index for better query performance
CREATE INDEX idx_districts_is_visible ON public.districts(is_visible) 
WHERE is_visible = true;