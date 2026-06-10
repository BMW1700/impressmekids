-- aura_records: block writes from COPPA-blocked students
DROP POLICY IF EXISTS coppa_block_writes ON public.aura_records;
CREATE POLICY coppa_block_writes
ON public.aura_records
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (NOT public.is_coppa_blocked(auth.uid()));

DROP POLICY IF EXISTS coppa_block_updates ON public.aura_records;
CREATE POLICY coppa_block_updates
ON public.aura_records
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (NOT public.is_coppa_blocked(auth.uid()))
WITH CHECK (NOT public.is_coppa_blocked(auth.uid()));

-- reading_sessions: same pattern
DROP POLICY IF EXISTS coppa_block_writes ON public.reading_sessions;
CREATE POLICY coppa_block_writes
ON public.reading_sessions
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (NOT public.is_coppa_blocked(auth.uid()));

DROP POLICY IF EXISTS coppa_block_updates ON public.reading_sessions;
CREATE POLICY coppa_block_updates
ON public.reading_sessions
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (NOT public.is_coppa_blocked(auth.uid()))
WITH CHECK (NOT public.is_coppa_blocked(auth.uid()));

-- assignment_submissions: student-authored work
DROP POLICY IF EXISTS coppa_block_writes ON public.assignment_submissions;
CREATE POLICY coppa_block_writes
ON public.assignment_submissions
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (NOT public.is_coppa_blocked(auth.uid()));

COMMENT ON POLICY coppa_block_writes ON public.aura_records IS
  'COPPA defense-in-depth: blocks reading-audio writes from under-13 students without parental consent. Layered on top of permissive ownership policies.';
