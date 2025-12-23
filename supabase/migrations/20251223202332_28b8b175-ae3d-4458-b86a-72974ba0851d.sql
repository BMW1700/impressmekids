-- Performance indexes for common query patterns
-- These indexes will dramatically speed up the most frequently run queries

-- classroom_students lookups (used in almost every student/parent query)
CREATE INDEX IF NOT EXISTS idx_classroom_students_student_id ON public.classroom_students(student_id);
CREATE INDEX IF NOT EXISTS idx_classroom_students_classroom_id ON public.classroom_students(classroom_id);

-- assignments queries (filtering by classroom + date + posted status)
CREATE INDEX IF NOT EXISTS idx_assignments_classroom_posted ON public.assignments(classroom_id, is_posted);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_classroom_due ON public.assignments(classroom_id, due_date) WHERE is_posted = true;

-- assignment_submissions queries (filtered by student, assignment, or both)
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_assignment ON public.assignment_submissions(student_id, assignment_id);

-- aura_records queries (filtered by profile + date)
CREATE INDEX IF NOT EXISTS idx_aura_records_profile_id ON public.aura_records(profile_id);
CREATE INDEX IF NOT EXISTS idx_aura_records_profile_date ON public.aura_records(profile_id, created_at DESC);

-- behavior_records queries (filtered by student + classroom)
CREATE INDEX IF NOT EXISTS idx_behavior_records_student_id ON public.behavior_records(student_id);
CREATE INDEX IF NOT EXISTS idx_behavior_records_student_classroom ON public.behavior_records(student_id, classroom_id);

-- classroom_announcements queries
CREATE INDEX IF NOT EXISTS idx_announcements_classroom_date ON public.classroom_announcements(classroom_id, created_at DESC);

-- reading_sessions queries
CREATE INDEX IF NOT EXISTS idx_reading_sessions_student_date ON public.reading_sessions(student_id, created_at DESC);

-- word_readings queries (joined via session_id)
CREATE INDEX IF NOT EXISTS idx_word_readings_session_id ON public.word_readings(session_id);

-- student_standard_scores queries
CREATE INDEX IF NOT EXISTS idx_standard_scores_student ON public.student_standard_scores(student_id);

-- attendance_records queries
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance_records(student_id, date DESC);