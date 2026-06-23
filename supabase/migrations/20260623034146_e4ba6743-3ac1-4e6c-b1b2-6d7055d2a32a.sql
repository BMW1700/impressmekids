
-- Drop duplicate indexes on assignment_submissions (3x assignment_id, 2x student_id)
DROP INDEX IF EXISTS public.idx_assignment_submissions_assignment_id;
DROP INDEX IF EXISTS public.idx_submissions_assignment_id;
DROP INDEX IF EXISTS public.idx_submissions_student_id;

-- Covering index for the "student's recent submissions" path (slow query #12 family)
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_created
  ON public.assignment_submissions (student_id, created_at DESC);

-- Refresh stats so planner picks the new index and re-costs RLS-heavy reads
ANALYZE public.assignment_submissions;
ANALYZE public.student_behavior_stats;
ANALYZE public.classroom_students;
ANALYZE public.classrooms;
ANALYZE public.attendance_records;
ANALYZE public.parent_student_links;
ANALYZE public.parent_accounts;

-- Raise work_mem for the PostgREST role so sorts/hashes stop spilling to disk.
-- 1.55 TB of temp_bytes since boot is from 4MB default work_mem on join-heavy embeds.
ALTER ROLE authenticator SET work_mem = '16MB';
