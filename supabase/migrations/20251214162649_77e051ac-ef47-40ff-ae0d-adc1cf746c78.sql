
-- Table for benchmark assessment periods (Fall, Winter, Spring each year)
CREATE TABLE public.benchmark_assessment_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  period_name TEXT NOT NULL CHECK (period_name IN ('Fall', 'Winter', 'Spring')),
  school_year TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES public.profiles(id)
);

-- Table for individual student benchmark results
CREATE TABLE public.student_benchmark_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  period_id UUID REFERENCES public.benchmark_assessment_periods(id) ON DELETE SET NULL,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  wcpm NUMERIC NOT NULL,
  accuracy_percentage NUMERIC,
  prosody_score INTEGER CHECK (prosody_score >= 1 AND prosody_score <= 4),
  fluency_level TEXT CHECK (fluency_level IN ('independent', 'instructional', 'frustration')),
  benchmark_status TEXT NOT NULL CHECK (benchmark_status IN ('well_below', 'below', 'at', 'above')),
  grade_level INTEGER NOT NULL,
  passage_title TEXT,
  passage_difficulty TEXT,
  miscue_count INTEGER DEFAULT 0,
  self_corrections INTEGER DEFAULT 0,
  words_read INTEGER,
  duration_seconds NUMERIC,
  audio_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.benchmark_assessment_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_benchmark_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for benchmark_assessment_periods
CREATE POLICY "Teachers can manage their classroom periods"
ON public.benchmark_assessment_periods
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = classroom_id AND c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view periods for their classrooms"
ON public.benchmark_assessment_periods
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classroom_students cs
    WHERE cs.classroom_id = benchmark_assessment_periods.classroom_id 
    AND cs.student_id = auth.uid()
  )
);

-- RLS Policies for student_benchmark_results
CREATE POLICY "Teachers can manage benchmark results in their classrooms"
ON public.student_benchmark_results
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = classroom_id AND c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view their own benchmark results"
ON public.student_benchmark_results
FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Parents can view their children benchmark results"
ON public.student_benchmark_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.parent_student_links psl
    JOIN public.parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = auth.uid()
    AND psl.student_id = student_benchmark_results.student_id
    AND psl.approved = true
  )
);

-- Indexes for performance
CREATE INDEX idx_benchmark_periods_classroom ON public.benchmark_assessment_periods(classroom_id);
CREATE INDEX idx_benchmark_periods_active ON public.benchmark_assessment_periods(is_active) WHERE is_active = true;
CREATE INDEX idx_benchmark_results_student ON public.student_benchmark_results(student_id);
CREATE INDEX idx_benchmark_results_classroom ON public.student_benchmark_results(classroom_id);
CREATE INDEX idx_benchmark_results_period ON public.student_benchmark_results(period_id);
CREATE INDEX idx_benchmark_results_date ON public.student_benchmark_results(assessment_date DESC);
