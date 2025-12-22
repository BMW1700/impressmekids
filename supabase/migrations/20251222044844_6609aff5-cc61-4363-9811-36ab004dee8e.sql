-- Create table for storing trained ML model weights
CREATE TABLE public.ml_model_weights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_type TEXT NOT NULL, -- 'cross_modal_network' or 'q_learning_table'
  model_version INTEGER NOT NULL DEFAULT 1,
  weights JSONB NOT NULL, -- Serialized model weights/Q-table
  metadata JSONB, -- Training metadata (examples used, accuracy, etc.)
  is_active BOOLEAN NOT NULL DEFAULT true, -- Current active model
  training_examples_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_ml_model_weights_type_active ON public.ml_model_weights(model_type, is_active);
CREATE INDEX idx_ml_model_weights_type_version ON public.ml_model_weights(model_type, model_version DESC);

-- Enable RLS
ALTER TABLE public.ml_model_weights ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers and admins can read model weights
CREATE POLICY "Teachers and admins can read model weights" 
ON public.ml_model_weights 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);

-- Policy: Only admins can insert/update model weights
CREATE POLICY "Admins can manage model weights" 
ON public.ml_model_weights 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create table for per-student Q-table persistence
CREATE TABLE public.student_q_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  q_table JSONB NOT NULL DEFAULT '{}', -- Serialized Q-values
  total_updates INTEGER NOT NULL DEFAULT 0,
  last_action TEXT, -- Last recommended phoneme
  last_reward NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

-- Create index
CREATE INDEX idx_student_q_tables_student ON public.student_q_tables(student_id);

-- Enable RLS
ALTER TABLE public.student_q_tables ENABLE ROW LEVEL SECURITY;

-- Policy: Students can read/write their own Q-table
CREATE POLICY "Students can manage their own Q-table" 
ON public.student_q_tables 
FOR ALL 
USING (auth.uid() = student_id);

-- Policy: Teachers can read student Q-tables in their classrooms
CREATE POLICY "Teachers can read student Q-tables" 
ON public.student_q_tables 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.classroom_students cs
    JOIN public.classrooms c ON c.id = cs.classroom_id
    WHERE cs.student_id = student_q_tables.student_id
    AND c.teacher_id = auth.uid()
  )
);

-- Create table for ML training job tracking
CREATE TABLE public.ml_training_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL, -- 'cross_modal', 'q_learning', 'full'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  triggered_by UUID, -- User who triggered (null for auto)
  training_data_count INTEGER,
  model_version_created INTEGER,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ml_training_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers and admins can view training jobs
CREATE POLICY "Teachers and admins can view training jobs" 
ON public.ml_training_jobs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_ml_model_weights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_ml_model_weights_updated_at
BEFORE UPDATE ON public.ml_model_weights
FOR EACH ROW
EXECUTE FUNCTION public.update_ml_model_weights_updated_at();

CREATE TRIGGER update_student_q_tables_updated_at
BEFORE UPDATE ON public.student_q_tables
FOR EACH ROW
EXECUTE FUNCTION public.update_ml_model_weights_updated_at();