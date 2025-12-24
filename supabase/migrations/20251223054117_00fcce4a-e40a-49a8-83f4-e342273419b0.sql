-- Add parent SELECT policies for reading_sessions, aura_records, and word_readings

-- 1) Parents can view reading_sessions for their approved linked students (with consent)
CREATE POLICY "Parents can view linked student reading sessions"
ON public.reading_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.parent_accounts pa
    JOIN public.parent_student_links psl ON psl.parent_id = pa.id
    JOIN public.parent_consents pc ON pc.parent_id = pa.id AND pc.student_id = psl.student_id
    WHERE pa.user_id = auth.uid()
      AND psl.student_id = reading_sessions.student_id
      AND psl.approved = true
      AND pc.aura_recording_consent = true
  )
);

-- 2) Parents can view aura_records for their approved linked students (with consent)
CREATE POLICY "Parents can view linked student aura records"
ON public.aura_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.parent_accounts pa
    JOIN public.parent_student_links psl ON psl.parent_id = pa.id
    JOIN public.parent_consents pc ON pc.parent_id = pa.id AND pc.student_id = psl.student_id
    WHERE pa.user_id = auth.uid()
      AND psl.student_id = aura_records.profile_id
      AND psl.approved = true
      AND pc.aura_recording_consent = true
  )
);

-- 3) Parents can view word_readings for sessions belonging to their approved linked students
CREATE POLICY "Parents can view linked student word readings"
ON public.word_readings
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.reading_sessions rs
    JOIN public.parent_accounts pa ON pa.user_id = auth.uid()
    JOIN public.parent_student_links psl ON psl.parent_id = pa.id AND psl.student_id = rs.student_id
    JOIN public.parent_consents pc ON pc.parent_id = pa.id AND pc.student_id = rs.student_id
    WHERE rs.id = word_readings.session_id
      AND psl.approved = true
      AND pc.aura_recording_consent = true
  )
);