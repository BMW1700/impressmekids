
-- Phase C: user_roles indexing + helper function hardening
-- Mark RLS helper functions PARALLEL SAFE so Postgres can use them in parallel workers,
-- and refresh planner stats on user_roles + helper-referenced tables.

-- 1. has_role and all hot SECURITY DEFINER helpers -> PARALLEL SAFE
ALTER FUNCTION public.has_role(uuid, public.app_role) PARALLEL SAFE;
ALTER FUNCTION public.get_parent_id(uuid) PARALLEL SAFE;
ALTER FUNCTION public.is_classroom_student(uuid, uuid) PARALLEL SAFE;
ALTER FUNCTION public.is_parent_of_student(uuid) PARALLEL SAFE;
ALTER FUNCTION public.is_parent_of_student(uuid, uuid) PARALLEL SAFE;
ALTER FUNCTION public.is_teacher_of_classroom(uuid) PARALLEL SAFE;
ALTER FUNCTION public.is_teacher_of_student(uuid) PARALLEL SAFE;
ALTER FUNCTION public.is_teacher_of_student(uuid, uuid) PARALLEL SAFE;
ALTER FUNCTION public.parent_has_aura_consent(uuid) PARALLEL SAFE;
ALTER FUNCTION public.can_parent_view_classroom(uuid, uuid) PARALLEL SAFE;
ALTER FUNCTION public.admin_can_view_classroom(uuid, uuid) PARALLEL SAFE;

-- 2. Refresh planner stats so the existing indexes are picked up immediately
ANALYZE public.user_roles;
ANALYZE public.parent_accounts;
ANALYZE public.parent_student_links;
ANALYZE public.classroom_students;
ANALYZE public.classrooms;

-- 3. Lower autovacuum/analyze thresholds on user_roles so stats stay fresh under load
ALTER TABLE public.user_roles SET (
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_scale_factor = 0.05
);
