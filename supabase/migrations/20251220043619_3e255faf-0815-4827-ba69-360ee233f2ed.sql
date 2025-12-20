-- Create classroom_features table to track enabled toolkit features per classroom
CREATE TABLE public.classroom_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  enabled_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(classroom_id, feature_id)
);

-- Enable RLS
ALTER TABLE public.classroom_features ENABLE ROW LEVEL SECURITY;

-- Teachers can manage features for their own classrooms
CREATE POLICY "Teachers can manage their classroom features"
ON public.classroom_features
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = classroom_features.classroom_id
    AND c.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = classroom_features.classroom_id
    AND c.teacher_id = auth.uid()
  )
);

-- Students can view features for classrooms they're in (to know what's available)
CREATE POLICY "Students can view classroom features"
ON public.classroom_features
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classroom_students cs
    WHERE cs.classroom_id = classroom_features.classroom_id
    AND cs.student_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_classroom_features_classroom_id ON public.classroom_features(classroom_id);