# Phase 2 hardening — executed 2026-06-23

## What shipped

### 1. Pivoted target based on real slow-query data
Pulled `pg_stat_statements` first. The bottleneck wasn't missing RLS helpers — it was an N+1 in `usePriorityStudents` and a handful of duplicate indexes wasting writes. Scrapped the speculative RLS migration; went after measured pain instead.

### 2. Migration — dropped 4 duplicate indexes
- `idx_campaign_battle_sessions_student_mode_created` (duplicate of `_student_grade_created`)
- `idx_classroom_students_classroom_id_student_id` (duplicate of unique constraint)
- `idx_classroom_students_classroom_student` (duplicate of unique constraint)
- `idx_student_behavior_stats_student_id` (duplicate of `idx_behavior_stats_student`)

Each was a byte-identical copy. Postgres was updating all of them on every write for no read benefit. Win: faster writes, smaller table footprint, zero query-plan regressions.

### 3. Killed N+1 in `usePriorityStudents`
Before: for each student in the teacher's classroom, 3 sequential queries (`aura_records`, `student_skill_vectors`, `student_profiles`). For a class of 30 that's ~90 round-trips per dashboard load.

After: 3 batched `.in('student_id', studentIds)` queries → ~3 round-trips regardless of class size. Same scoring logic, same return shape.

This was the **#2 slowest query overall** by total time (15k calls × 13.76ms mean = 208s of DB time). Collapsing it by ~30× translates directly into headroom on the connection pool.

### 4. Locked down `generate-world-backgrounds`
- Now requires `Authorization: Bearer <jwt>` (validated in-code since edge `verify_jwt=false`).
- Validates caller has `super_admin` role in `user_roles`.
- Hard-capped to 5 AI generations per invocation (`MAX_GENERATIONS_PER_CALL`).

Before: anyone with the function URL could trigger Lovable AI Gateway image generation for any world missing a background. After: only super_admin, and a runaway loop can burn at most 5 generations before exiting.

## What I deferred and why

- **Read replica wrapper.** Real architecture change (separate client, query routing rules, staleness handling for gradebook reads). Current connection saturation is comfortably below cap — no urgency. Better to design this post-pilot against real read/write ratios.
- **More SECURITY DEFINER RLS helpers.** Not in the slow log. Doing them now is guessing.
- **More RPC replacements for embed joins.** The classroom embed (#4 slowest) is a real candidate, but the N+1 fix above buys more headroom for less risk. Park it; revisit after pilot data.

## Files changed
- `supabase/migrations/<timestamp>_phase2_drop_duplicate_indexes.sql` (new)
- `src/hooks/usePriorityStudents.ts` (N+1 → batched)
- `supabase/functions/generate-world-backgrounds/index.ts` (auth + cap)

## Next checkpoint
Re-pull `db_health` and `slow_queries` after the pilot starts. Real traffic will surface the next hot path; chasing it now is darts.
