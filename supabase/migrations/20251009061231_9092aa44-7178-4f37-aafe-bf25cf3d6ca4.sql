-- AURA Phase 1: Core Tables and RLS Policies

-- 1. AURA Records Table (main analytics & feedback storage)
CREATE TABLE public.aura_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  audio_url TEXT NOT NULL,
  transcript TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'es')),
  
  -- ASR Metrics
  asr_confidence FLOAT NOT NULL CHECK (asr_confidence >= 0 AND asr_confidence <= 1),
  duration_s FLOAT NOT NULL CHECK (duration_s > 0),
  words INTEGER NOT NULL CHECK (words >= 0),
  wpm FLOAT NOT NULL CHECK (wpm >= 0),
  pause_count INTEGER NOT NULL CHECK (pause_count >= 0),
  avg_silence_ms INTEGER NOT NULL CHECK (avg_silence_ms >= 0),
  
  -- AURA Scores (1-5 scale)
  clarity SMALLINT NOT NULL CHECK (clarity >= 1 AND clarity <= 5),
  pace SMALLINT NOT NULL CHECK (pace >= 1 AND pace <= 5),
  confidence SMALLINT NOT NULL CHECK (confidence >= 1 AND confidence <= 5),
  
  -- Feedback & Evidence
  feedback JSONB NOT NULL DEFAULT '[]'::jsonb,
  pronunciation_flags JSONB DEFAULT '[]'::jsonb,
  suggested_exercises JSONB DEFAULT '[]'::jsonb,
  evidence JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  request_id TEXT NOT NULL UNIQUE,
  context_text TEXT,
  grade INTEGER CHECK (grade >= 0 AND grade <= 12),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_aura_records_profile_id ON public.aura_records(profile_id);
CREATE INDEX idx_aura_records_created_at ON public.aura_records(created_at DESC);
CREATE INDEX idx_aura_records_request_id ON public.aura_records(request_id);

-- 2. Processing Failures Log
CREATE TABLE public.aura_processing_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  error_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_aura_failures_created_at ON public.aura_processing_failures(created_at DESC);

-- 3. Curriculum Anchors (word pronunciation targets)
CREATE TABLE public.curriculum_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  canonical_phonemes JSONB NOT NULL,
  grade INTEGER NOT NULL CHECK (grade >= 0 AND grade <= 12),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  anchor_meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_curriculum_anchors_word ON public.curriculum_anchors(word);
CREATE INDEX idx_curriculum_anchors_grade ON public.curriculum_anchors(grade);

-- 4. Student Skill Vectors (personalization data)
CREATE TABLE public.student_skill_vectors (
  student_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  vector JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all AURA tables
ALTER TABLE public.aura_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aura_processing_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skill_vectors ENABLE ROW LEVEL SECURITY;

-- AURA Records Policies
CREATE POLICY "Students can insert their own AURA records"
  ON public.aura_records FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Students can view their own AURA records"
  ON public.aura_records FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Teachers can view AURA records for their classroom students"
  ON public.aura_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classroom_students cs
      JOIN public.classrooms c ON c.id = cs.classroom_id
      WHERE cs.student_id = aura_records.profile_id
        AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access to AURA records"
  ON public.aura_records FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Processing Failures (teachers can see failures for debugging)
CREATE POLICY "Teachers can view processing failures for their students"
  ON public.aura_processing_failures FOR SELECT
  USING (
    profile_id IN (
      SELECT cs.student_id FROM public.classroom_students cs
      JOIN public.classrooms c ON c.id = cs.classroom_id
      WHERE c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage failures"
  ON public.aura_processing_failures FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Curriculum Anchors (public read for all authenticated users)
CREATE POLICY "All authenticated users can view curriculum anchors"
  ON public.curriculum_anchors FOR SELECT
  USING (auth.role() = 'authenticated');

-- Student Skill Vectors
CREATE POLICY "Students can view their own skill vector"
  ON public.student_skill_vectors FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view skill vectors for their students"
  ON public.student_skill_vectors FOR SELECT
  USING (
    student_id IN (
      SELECT cs.student_id FROM public.classroom_students cs
      JOIN public.classrooms c ON c.id = cs.classroom_id
      WHERE c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage skill vectors"
  ON public.student_skill_vectors FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Storage bucket for encrypted audio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'aura-audio',
  'aura-audio',
  false,
  10485760,
  ARRAY['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg']
);

-- RLS for storage bucket
CREATE POLICY "Students can upload their own audio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'aura-audio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Students can read their own audio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'aura-audio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Teachers can read audio for their classroom students"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'aura-audio' AND
    (storage.foldername(name))[1]::uuid IN (
      SELECT cs.student_id FROM classroom_students cs
      JOIN classrooms c ON c.id = cs.classroom_id
      WHERE c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access to audio storage"
  ON storage.objects FOR ALL
  USING (bucket_id = 'aura-audio' AND auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (bucket_id = 'aura-audio' AND auth.jwt() ->> 'role' = 'service_role');