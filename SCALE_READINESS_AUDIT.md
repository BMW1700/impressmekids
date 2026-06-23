# Scale Readiness Audit — Path to 1M+ Users

**Date:** 2026-06-23  
**Mode:** All P0 fixes applied. ✅  
**Current health:** DB up, 4.07 GB, memory 52%, disk 57%, 24/60 connections.

## ✅ Shipped this session
- **P0-1**: `idx_user_roles_user_id_role` covering index added (preventive — table is 26 rows today; planner will switch to index scan as it grows).
- **P0-2**: RLS subquery flattening complete. 4 `SECURITY DEFINER` helpers (`is_teacher_of_student`, `is_teacher_of_classroom`, `is_parent_of_student`, `parent_has_aura_consent`) now back 12 hot policies on `student_behavior_stats`, `reading_sessions`, `aura_records`, `campaign_battle_sessions`, `parent_student_links`, `student_reading_stats`. Helpers `REVOKE`d from public, granted only to authenticated + service_role.
- **P0-3**: Rollback source identified and throttled. `process-email-queue` pg_cron job was polling **every 5 seconds** (17,280 invocations/day, 1.09M lifetime `cron.job_run_details` rows — the #1 entry in `pg_stat_statements`) against an effectively empty queue (1 sent, 1 pending app-side). Rescheduled to **every 30 seconds** — 6× less polling load, ≈14,400 fewer cron transactions per day, still feels real-time for outbound email. The 7.23% rollback ratio (3.8M/48.9M over 9 months) is dominated by pg_cron + pgmq peek savepoints, not by app-side retry loops (`email_send_log` shows zero failed/retry rows).
- **Expected impact**: 167ms `student_behavior_stats` mean → sub-10ms once new stats settle; cron-driven WAL/CPU baseline drops 6×.

---

## TL;DR — three things that will break first

1. **`user_roles` table has 4.77M sequential scans since boot.** Every RLS check via `has_role()` hits it. At 1M users this is the single biggest contract risk.
2. **RLS subquery storm.** 165 of 641 public policies use subqueries (`student_id IN (SELECT … FROM parent_student_links JOIN parent_accounts …)`). `student_behavior_stats` reads currently average **167ms** — that's pure RLS overhead, not data volume.
3. **3.8M rolled-back transactions since boot.** Something — almost certainly an upsert path — is constantly failing and retrying. Free perf and cost win once located.

Everything else is yellow, not red.

---

## P0 — Contract Blockers (fix before any pilot scales past 5K students)

### P0-1. `user_roles` missing/unused covering index — *~2 hours*

**Evidence:** `pg_stat_user_tables` shows `user_roles` with `seq_scan = 4,774,688` vs `idx_scan = 445`. Planner is choosing seq scan over the existing index, likely because the unique constraint is `(user_id, role)` but `has_role(_user_id, _role)` filters on both, and stats are stale or the table is small enough that PG ignores the index. At 100K rows the seq scan becomes a CPU floor on every authenticated request.

**Fix:**
- Add `CREATE INDEX idx_user_roles_user_role ON public.user_roles(user_id, role);` if not already present in that exact column order.
- Run `ANALYZE public.user_roles` and verify with `EXPLAIN` that `has_role()` now uses index scan.
- Consider marking `has_role()` as `PARALLEL SAFE` and ensure `STABLE` (memory says it is) — confirm.

### P0-2. RLS subquery flattening on hot tables — *~6 hours*

**Evidence:** Top slow query is `student_behavior_stats` lookup by `student_id = auth.uid()`, 1,445 calls, **mean 167ms, max 4.2s**. Table is 56 KB. The cost is entirely the RLS check, which has FOUR policies including:
```sql
student_id IN (SELECT psl.student_id FROM parent_student_links psl
               JOIN parent_accounts pa ON pa.id = psl.parent_id
               WHERE pa.user_id = auth.uid() AND psl.approved = true)
```
That subquery runs per row evaluated. At 1M parents × 30 students each → table scan of `parent_student_links` + `parent_accounts` on every SELECT.

**Fix pattern:** wrap the subquery in a `SECURITY DEFINER` helper function and call it from the policy (same trick as `has_role`). Apply to:
- `student_behavior_stats` (4 policies)
- `classroom_students` (777K seq scans, 15K calls in slow log)
- `reading_sessions` (parent + teacher policies)
- `aura_records`, `aura_access_log`
- `campaign_battle_sessions`
- `student_reading_stats`

Create helpers: `public.is_parent_of(_student_id uuid)`, `public.is_teacher_of_classroom(_classroom_id uuid)`. Each returns boolean, `SECURITY DEFINER`, `STABLE`, `SET search_path = public`. Indexed lookups only.

**Expected impact:** 10-50× speedup on those reads, removes the per-row planner explosion.

### P0-3. 3.8M rolled-back transactions — *~2 hours to locate, fix varies*

**Evidence:** `pg_stat_database.xact_rollback = 3,811,837` since last restart. Either a client retry loop is hammering a unique-constraint violation, or a trigger is raising. Healthy projects show single-digit thousands.

**Action:**
- Enable `log_min_messages = error` briefly and tail `pg_stat_statements` for failing UPDATEs/INSERTs.
- Likely suspects per memory: atomic stats upsert RPCs without proper `ON CONFLICT`, Q-learning updates (`student_q_tables` has only 4 rows but high update volume).
- Each failed txn is real CPU + WAL bloat. Killing this gives free headroom.

---

## P1 — Will Degrade Under Load (fix in next 2 weeks)

### P1-1. SECURITY DEFINER function exposure — *~3 hours*
107 linter warnings, mostly `0028` / `0029`: SECURITY DEFINER functions executable by `anon` or `authenticated`. Most are intentional (`has_role`, atomic upserts) but each one is an audit-hardening target. Action: review each, `REVOKE EXECUTE FROM anon` where the function should be auth-only, leave intentional public ones documented.

### P1-2. Sequential scans on auth-critical tables — *~4 hours*
- `parent_accounts`: 617K seq scans, 384K idx scans. Index ratio 38% seq — needs covering index on `user_id`.
- `classrooms`: 299K seq scans. Add/verify index on `teacher_id`.
- `parent_student_links`: 152K seq scans. Add composite `(parent_id, approved, student_id)` if missing.
- `tournaments`: 16K seq scans, 12K idx — fine.

### P1-3. PostgREST embedded join inefficiency — *~3 hours*
Slow log row #4: a single `classroom_students → classrooms → profiles` PostgREST embed runs **mean 108ms × 1397 calls = 151s total**. PostgREST is generating a LATERAL nightmare. Replace the high-traffic call sites (likely `useStudentDashboardData`, `useStudentClassroomIds`) with a single `rpc()` to a server-side function that returns the shape directly.

### P1-4. AI cost surface is small but unguarded — *~2 hours*
Only 1 edge function calls Lovable AI Gateway (`generate-world-backgrounds`). **This is a huge positive** — AURA phoneme inference is fully client-side as the memory promised. To protect the $0/month AURA cost model:
- Add a per-user-per-day rate limit on `generate-world-backgrounds` (it's currently uncapped).
- Verify `_shared/pseudonymize.ts` is imported in every function that constructs a prompt (per memory `school-contract-hardening-phase1`).

### P1-5. Realtime channel design unverified — *~4 hours to audit*
`multiplayer_rooms` has 78 rows + 144 KB. Memory says `multiplayer-sync-system` uses monotonic revisions with broadcast — good. But classroom presence and tournament realtime were not measured. At 30K classrooms × 25 students, the default Supabase Realtime tier maxes around 500 concurrent channels — needs sharding plan or polling fallback for presence-only use cases.

---

## P2 — Cost & Operational (fix in next month)

### P2-1. WAL is small (176 MB) and well-managed — no action.
### P2-2. Connection saturation low (24/60 + 1/200 pool) — current sizing handles 10-20× traffic; revisit at 100K DAU.
### P2-3. Data disk 57% used at 4 GB — comfortable. Partition `reading_sessions` and `safety_audit_log` *only after* they cross 10 GB. Don't pre-optimize.
### P2-4. Bundle / iPad performance:
- 82 `React.lazy` calls across 89 routes — code splitting is solid.
- TF.js used only in `src/lib/ml/semanticEmbeddings.ts` and `crossModalTransferNetwork.ts`. Verify both are loaded lazily; on iPad 7 they OOM at ~120 MB if eager.
- Service Worker correctly absent (per memory).

### P2-5. Cold storage backups already exist (`cold_storage_backups`, `check-backup-health`, `restore-cold-storage-backup` functions) — good. Verify the cron is actually running and last success < 24h before pilot.

---

## What is already good (do not touch)

- 56 edge functions, only 1 hits the AI gateway. AURA cost-at-scale model is intact.
- 530+ RLS policies enabled across all user tables.
- Atomic-stats RPCs exist (per memory).
- Service Worker correctly removed.
- COPPA + audit-log chain (SHA-256) in place.
- Pseudonymization layer exists.

---

## Recommended order of attack

1. **P0-1** (user_roles index) — 2h, unblocks everything else.
2. **P0-3** (find the rollback source) — 2h, instant CPU/WAL relief.
3. **P0-2** (RLS helper functions) — 6h, the biggest perf win.
4. **P1-3** (replace embedded joins with RPC) — 3h, removes worst PostgREST path.
5. **P1-2** (covering indexes) — 4h.
6. Everything else in priority order during the next sprint.

**Total P0 work: ~10 engineering hours to remove the three contract-blocking risks.**

Want me to start with P0-1 (the `user_roles` index) and P0-3 (locate the rollback source)? Both are read-mostly investigation, then one small migration each.
