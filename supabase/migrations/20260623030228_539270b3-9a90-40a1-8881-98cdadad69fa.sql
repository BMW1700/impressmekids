-- Phase 2 cleanup: drop duplicate indexes that waste write throughput.
-- Each pair below is byte-identical (same columns, same order, same direction).

-- campaign_battle_sessions(student_id, grade_mode, created_at DESC)
-- Kept: idx_campaign_battle_sessions_student_grade_created
DROP INDEX IF EXISTS public.idx_campaign_battle_sessions_student_mode_created;

-- classroom_students(classroom_id, student_id)
-- Kept: classroom_students_classroom_id_student_id_key (unique constraint)
DROP INDEX IF EXISTS public.idx_classroom_students_classroom_id_student_id;
DROP INDEX IF EXISTS public.idx_classroom_students_classroom_student;

-- student_behavior_stats(student_id)
-- Kept: idx_behavior_stats_student
DROP INDEX IF EXISTS public.idx_student_behavior_stats_student_id;