-- Add missing columns to reading_library table
ALTER TABLE public.reading_library 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

ALTER TABLE public.reading_library 
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

ALTER TABLE public.reading_library 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for faster queries by creator
CREATE INDEX IF NOT EXISTS idx_reading_library_created_by ON public.reading_library(created_by);

-- Drop existing update/delete policies if they exist
DROP POLICY IF EXISTS "Teachers can update own stories" ON public.reading_library;
DROP POLICY IF EXISTS "Teachers can delete own stories" ON public.reading_library;

-- Create policy for updating stories (only owner can update)
CREATE POLICY "Teachers can update own stories"
ON public.reading_library
FOR UPDATE
USING (created_by = auth.uid());

-- Create policy for deleting stories (only owner can delete)
CREATE POLICY "Teachers can delete own stories"
ON public.reading_library
FOR DELETE
USING (created_by = auth.uid());