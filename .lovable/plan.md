
# Scale Readiness — Honest Audit (2026-06-23, post Phase 2)

## TL;DR

- **Today's healthy concurrency ceiling: ~1,500–3,000 active users** on a single Cloud instance before tail-latency goes red. Burst page-load tolerance: ~500–1,000 simultaneous logins.
- **1M concurrent is not a single-instance problem.** It is an architecture problem. No amount of indexes or RLS helpers gets you there. It requires read replicas, edge caching, table partitioning, and a realtime fan-out layer that doesn't exist yet.
- **We did real work this session** (Phase 1 RLS helpers, Phase 2 N+1 kill + duplicate-index drop + edge-function rate-limit) but the slow log still shows the same #1 offender at 167ms mean. The fixes haven't fully landed in the plan cache and three high-impact items are still open.

## Current health snapshot

```text
Connections:      15 / 90        (17% — comfortable)
PgBouncer pool:    1 / 400       (idle)
Memory:           28%            (comfortable)
Data disk:        17% of 4 GB    (comfortable)
WAL:              1024 MB        (stable, post cron-throttle)
Restarts:         0              (clean)
Deadlocks:        1              (noise)
Cache hit ratio:  99.996%        (excellent — working set fits in RAM)
```

That's the green column. Now the red column:

```text
Rolled-back txns since boot:   3,842,067   (UNCHANGED — pgmq peek savepoints + cron)
Temp bytes spilled to disk:    1.55 TB     (queries sorting/hashing beyond work_mem)
Temp files created:            439,202     (same root cause)
multiplayer_rooms by-id reads: 944,110     (0.08 ms each — a polling loop, not realtime)
user_roles seq scans:          4,776,376   (planner correctly ignoring index on 26 rows;
                                            becomes hot at ~10K rows, not now)
```

## Slow query reality check — what Phase 2 did and did not fix

| # | Query | Calls | Mean | Status |
|---|-------|------:|-----:|--------|
| 1 | `student_behavior_stats` by `student_id` | 1,445 | **167 ms** | Phase 1 helpers shipped, **plan not improving** — likely policy not rewritten or stats stale |
| 2 | `classroom_students.classroom_id` by student | 15,136 | 14 ms | Acceptable per-call, dominated by call volume |
| 3 | `campaign_battle_sessions` by student+grade | 3,522 | 48 ms | Index exists; sort on `created_at DESC` is OK |
| 4 | `classroom_students` ← classrooms ← profiles embed | 1,397 | **108 ms** | PostgREST LATERAL — **still not converted to RPC** |
| 5 | Same embed (different columns) | 752 | 165 ms | Same family |
| 7 | Same embed (another columns) | 443 | 250 ms | Same family |
| 8 | `assignments` ← classrooms + submissions embed | 814 | 143 ms | New offender; same RPC fix |
| 9 | `student_behavior_stats` partial select | 531 | **191 ms** | Same RLS hot path as #1 |
| 10 | `attendance_records` by `classroom_id = ANY(...)` | 441 | 214 ms | Missing composite index `(student_id, classroom_id)` |
| 11 | `multiplayer_rooms` by id | **944,110** | 0.08 ms | Polling loop in some hook — should be realtime |
| 13 | `assignments.max_attempts` solo lookup | 3,159 | 15 ms | Should be cached client-side per-assignment |

**Honest read:** Phase 2 killed the N+1 in `usePriorityStudents` and dropped duplicate indexes — both real wins for write throughput and teacher dashboards. But the **#1 slow query is unchanged**, the **classroom embed family (#4, #5, #7, #8) is the dominant total-time consumer**, and we have a **previously-unidentified polling loop** smashing `multiplayer_rooms` at ~1M calls.

## Concurrency math — where the ceiling actually is

Back-of-envelope, with current numbers:

```text
Mean query time across hot paths:  ~50 ms
Queries per active user per minute: ~10 (mix of dashboard + heartbeat + writes)
=> ~8 QPS per 1000 active users

PgBouncer pool 400 transactions, ~25 ms held => ~16,000 QPS theoretical ceiling
Real-world derate (locks, RLS subqueries, planner stalls): ~40%
=> Sustainable ~6,400 QPS
=> ~800 fully-engaged active users at once with current query mix
=> Or ~3,000 light-touch users (parents checking, students idle in a story)

Burst (simultaneous logins/page-loads):
  Each login = ~12 queries within 2 sec = 6 QPS for 2 sec
  Headroom => ~1,000 logins/sec ceiling before queue forms
```

**Translation:** A pilot of 5–10K students with normal classroom usage patterns (peak 30–60 min/day) is comfortable. **A single school assembly of 1,000 kids hitting refresh at the same minute** would already produce visible lag on the slow-query offenders above.

**1M concurrent is roughly 300–1,000× the ceiling depending on workload mix.**

## Why "just buy a bigger instance" only gets you 5–10×

Lovable Cloud instance upgrades scale CPU and RAM linearly. They do **not**:

- Add read replicas (every read still hits the primary)
- Cache cross-user reads (every student fetches their own classroom row from the DB)
- Fan out realtime channels (Realtime is per-project, not per-instance)
- Partition hot tables (write contention on `reading_sessions` and `safety_audit_log` will eventually serialize)
- Reduce egress to clients on big payloads

A bigger instance buys 5–10× headroom on **CPU-bound** queries. The current bottleneck is **query design and RLS subqueries**, not raw CPU.

## The honest roadmap to 1M concurrent

### Tier 1 — Finish the in-database work (gets us to ~10K concurrent)
*Total: ~12 engineering hours. No architecture changes.*

1. **Diagnose why `student_behavior_stats` 167 ms didn't improve.** Pull policy DDL after Phase 1, run `EXPLAIN (ANALYZE, BUFFERS)` against the actual normalized query. Either the helper isn't wired into the policy that fires, or `ANALYZE` was never run. ~1 hr.
2. **Replace the classroom embed family with one `get_student_classrooms_with_teacher` RPC.** Slow rows #2, #4, #5, #7 collapse into one indexed function call. Update `useStudentDashboardData`, `useStudentClassroomIds`, and the gradebook hooks to call `.rpc()` instead of `.from('classroom_students').select('classroom_id, classrooms(...)')`. ~3 hr.
3. **Same treatment for `assignments` embed (#8) — `get_classroom_assignments_with_status` RPC.** ~2 hr.
4. **Add composite indexes** `attendance_records(student_id, classroom_id, date)` and `assignment_submissions(student_id, created_at DESC)`. ~30 min.
5. **Find and kill the `multiplayer_rooms` polling loop.** 944K calls at 0.08 ms is 75 seconds of pure DB time. Something is `select()`-ing room state on a timer instead of using the broadcast channel. Likely candidate: an effect cleanup that didn't unsubscribe, or a legacy polling fallback. ~1 hr.
6. **Bump `work_mem` from default 4 MB → 16 MB session-level on PostgREST role** (or via `ALTER ROLE authenticator SET work_mem = '16MB'`). 1.5 TB temp-spill is sorts that should fit in RAM. ~15 min.
7. **Locate the rollback source.** Tail the `email_send_state` CASE and pgmq peeks — confirm it's just the cron/pgmq pattern, not an app-side retry loop. If it's only system, leave it; if it's app, fix the upsert. ~1 hr.

After Tier 1: ceiling moves to ~5,000–10,000 concurrent active users.

### Tier 2 — Read replica + edge cache (gets us to ~100K concurrent)
*Total: ~3 engineering days. Architecture change.*

1. **Lovable Cloud read replica** (when available) or self-managed Postgres logical replica. Add a `supabaseReplica` client. Route the 10 hottest read-only hooks (gradebook, leaderboards, dashboards, story library) to the replica. Writes and reads-after-write stay on primary.
2. **Cloudflare in front of static reads.** `reading_library`, `prek_worlds`, `prek_levels`, `learning_standards`, `behavior_categories`, `phonics_*` — these are global, low-cardinality, change-rarely. Cache at CDN with a 5-minute TTL, invalidate on write via a tiny edge function. Removes 30–40% of DB reads.
3. **Per-user dashboard payload cached at edge** (KV / Workers Cache) with a 30-second TTL, keyed by `auth.uid()`. A class refreshing in unison hits cache, not DB.
4. **Realtime sharding plan.** Audit channel topology: presence channels per classroom (30K classrooms × 25 students = 750K presence slots) will exceed default tier. Move presence to client-only heartbeats with a single per-school broadcast channel.

After Tier 2: ceiling ~50,000–100,000 concurrent.

### Tier 3 — Horizontal & partitioning (path to 1M)
*Total: ~3–4 engineering weeks. Major.*

1. **Partition by `school_id` (or `district_id`).** `reading_sessions`, `safety_audit_log`, `aura_records`, `campaign_battle_sessions`, `assignment_submissions` — declarative range/list partitioning. Lets us prune scans and eventually shard writes per-district to separate primaries.
2. **Move realtime out of Postgres LISTEN/NOTIFY entirely.** Use a dedicated channel layer (Ably, Cloudflare Durable Objects, or a self-hosted NATS) for multiplayer/tournament/presence. Realtime then scales independently from DB.
3. **Write queues for non-blocking paths.** Behavior records, audit logs, aura streaming — into a managed queue (Cloud Tasks / SQS / pgmq via a worker pool), consumed in batches. Removes write-contention spikes during class assemblies.
4. **District-level read sharding.** At 100K+ DAU, each district gets its own connection pool and replica. RLS already scopes to district — sharding becomes mechanical.
5. **Per-tier capacity plan + load test.** k6 or Artillery scenarios for: morning-bell login storm, mid-class story-write burst, end-of-day analytics pull. Capture P50/P95/P99 at each tier.

After Tier 3: 500K–1M concurrent is on the table, with cost dominated by the DB cluster and realtime fan-out.

## What I want to do this session (if you approve)

Just **Tier 1, items 1–6**. Concrete, measurable, ~10 hours of focused work. Each one has a slow-query row that should visibly drop afterward. No architecture changes, no new vendors, no risk to the pilot timeline.

I'd skip item 7 (rollback investigation) unless the temp-file count keeps climbing — the rollback ratio looks like normal pgmq/cron behavior, not an app bug.

After Tier 1 ships, we re-pull `db_health` + `slow_queries`, post a measured before/after, and then decide whether to schedule Tier 2 (read replica + CDN) before or after the first paid pilot. My honest recommendation: **Tier 2 happens between pilot and full launch, not before pilot** — pilot traffic will tell us which hooks actually need a replica.

**Tier 3 is post-launch revenue work.** Don't pre-build sharding for users you don't have.

## Files I'd touch in Tier 1

- New migration: `attendance_records` + `assignment_submissions` composite indexes; `ALTER ROLE authenticator SET work_mem`; one RLS policy rewrite on `student_behavior_stats` if EXPLAIN confirms it's stale.
- New migration: `get_student_classrooms_with_teacher` and `get_classroom_assignments_with_status` SECURITY DEFINER functions, GRANT EXECUTE to authenticated.
- Edited hooks: `src/hooks/useStudentDashboardData.ts`, `src/hooks/useStudentClassroomIds.ts`, `src/hooks/useStudentGradebook.ts`, `src/hooks/useDueToday.ts`, and the `multiplayer_rooms` consumer (need to grep — likely `src/hooks/useMultiplayerRoom*` or a tournament hook).
- Updated `SCALE_READINESS_AUDIT.md` with measured before/after.

Want me to proceed with Tier 1?
