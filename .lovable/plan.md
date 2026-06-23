# Tier 1 scale work — shipped 2026-06-23

## What landed

### Migration
- Dropped 3 duplicate indexes on `assignment_submissions` (`idx_assignment_submissions_assignment_id`, `idx_submissions_assignment_id`, `idx_submissions_student_id`). Three byte-identical copies of the same `(assignment_id)` index plus a redundant `(student_id)` index were updated on every write for zero read benefit.
- Added `idx_assignment_submissions_student_created (student_id, created_at DESC)` — exact match for the "student's recent submissions" PostgREST shape, slow query #12 family (~62ms mean × 1100 calls).
- `ANALYZE` on `assignment_submissions`, `student_behavior_stats`, `classroom_students`, `classrooms`, `attendance_records`, `parent_student_links`, `parent_accounts` so planner stops using stale stats after Phase 1's RLS-helper rewrite.
- `ALTER ROLE authenticator SET work_mem = '16MB'` (was default 4MB). 1.55 TB of temp-bytes spilled to disk since boot came from this — joins on the classroom embed family were hashing to disk.

### Code
- `RPGOnlineCoopBattle.tsx`: `POLL_MS` 2000 → **15000**. Realtime postgres_changes is primary; this was an unconditional belt-and-suspenders reconcile that ran the whole game.
- `RPGOnlinePvPBattle.tsx`: `POLL_MS` 1000 → **5000**. Only fires while waiting on peer's turn, but at 1 Hz it was needlessly chatty.
- `RPGMultiplayerLobby.tsx`: lobby fallback poll 2000 → **10000**. Realtime UPDATE catches guest joins; polling is just for missed events.
- `useCalendarData.ts`: replaced the `classroom_students → classrooms → profiles` LATERAL embed (slow query #4 — 108ms mean × 1397 calls) with three indexed `.in()` lookups joined in JS.
- `useParentCalendarData.ts`: same treatment on the lighter `classroom_students → classrooms` embed.

## What I did NOT do this session
- **RPC for the classroom embed family.** Splitting into two `.in()` lookups gets ~80% of the win without a new SECURITY DEFINER surface. We can graduate to an RPC if the slow log shows the split version still hot.
- **`student_behavior_stats` policy consolidation.** Helpers are correctly wired (verified via `pg_policy`); the 167ms is likely planner stats, which `ANALYZE` just refreshed. Re-pull `slow_queries` after pilot traffic before touching policies.
- **Rollback investigation.** 3.84M rolled-back txns since boot are almost certainly `pgmq` peek savepoints + `pg_cron` `process-email-queue`, not app code. Will revisit only if temp_files keeps climbing.

## Expected impact (to be measured)
- Multiplayer DB chatter: **-85%** on `multiplayer_rooms` SELECTs once realtime carries the load.
- Calendar load latency: **-50 to -70%** on the embed path (two indexed scans beat one LATERAL join + 2 nested LATERALS).
- Sort spill to disk: should drop sharply from 16MB work_mem — temp_bytes growth slows.
- Write throughput on `assignment_submissions`: ~3× fewer index updates per write.

## Concurrency ceiling estimate (post-Tier 1)
~**5,000–10,000** active users before tail latency goes red, up from ~1,500–3,000. Burst page-load tolerance ~2,000 simultaneous logins.

## Next checkpoint
Re-pull `db_health` + `slow_queries` after the first real classroom session. The numbers from this session reflect 26-user dogfood traffic, not pilot conditions. Tier 2 (read replica + CDN) waits for pilot data to identify which read hooks actually need a replica.
