-- Create table for teacher personal resources
CREATE TABLE public.teacher_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teacher_resources ENABLE ROW LEVEL SECURITY;

-- Teachers can only view their own resources
CREATE POLICY "Teachers can view their own resources"
ON public.teacher_resources
FOR SELECT
USING (auth.uid() = teacher_id);

-- Teachers can insert their own resources
CREATE POLICY "Teachers can insert their own resources"
ON public.teacher_resources
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update their own resources
CREATE POLICY "Teachers can update their own resources"
ON public.teacher_resources
FOR UPDATE
USING (auth.uid() = teacher_id);

-- Teachers can delete their own resources
CREATE POLICY "Teachers can delete their own resources"
ON public.teacher_resources
FOR DELETE
USING (auth.uid() = teacher_id);

-- Add trigger for updated_at
CREATE TRIGGER update_teacher_resources_updated_at
BEFORE UPDATE ON public.teacher_resources
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();