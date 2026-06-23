
# Brutally honest scale audit — where we actually are

I just pulled fresh live metrics off the backend (DB health, slow queries, table stats, edge function inventory, realtime publication list). Here is the unvarnished truth.

## The headline

**1,000,000 total users: achievable on this stack with the work below. Realistic timeline: 4–8 weeks of focused infra work.**

**1,000,000 concurrent users: not achievable on this stack as-built — and not because of one bug, because of architectural ceilings.** A single managed Postgres + Supabase Realtime + Deno Edge has hard limits well below 1M concurrent. Hitting that number means Discord/Twitch-scale architecture: multi-region replicas, sharded realtime fanout, a CDN-cached read path, and a dedicated WebSocket tier. We can absolutely get there — but it is a different project shape, not a tuning pass. I lay out what each tier costs at the bottom.

So: the right question is "**peak concurrent**", not "total users". Most K-12 platforms with 1M total users peak at **30k–80k concurrent** (school-day spikes). That number we *can* hit on this stack. 1M concurrent we can architect toward in phases.

---

## What's already excellent (do not touch)

- **AI cost at scale is intact.** Only 1 of 56 edge functions calls the Lovable AI gateway. AURA phoneme inference is fully client-side. This is the single biggest strategic asset for $5–7/student/year pricing.
- **RLS coverage is real.** 641 policies across the public schema. 136 SECURITY DEFINER functions wrap the recursion-prone checks.
- **Bundle splitting.** 82 `React.lazy` boundaries across 89 routes.
- **Service Worker correctly absent**, COPPA + SHA-256 audit chain in place, pseudonymization layer wired.
- **Just shipped P0-1/P0-2/P0-3**: user_roles covering index, RLS subquery flattening on 6 hot tables, email-queue cron throttled 6×.

## What will break first — ranked by what hits us soonest

### 🔴 Tier 0 — capacity ceilings (hit between 10k and 100k concurrent)

1. **Data disk at 70% used (4.08 GB on a small instance).** Will hit autovacuum-pain territory before we cross 10k DAU. *Action: upgrade Cloud instance disk now.*
2. **WAL is 1.18 GB.** Indicates archive/replication backpressure or under-checkpointed writes. Free perf + crash-recovery time once tuned.
3. **DB compute is the small tier.** 60 max connections, 200 pool clients. Comfortable for ~5k DAU, tight at 20k, broken at 50k. *Action: bump the "Database server" instance size in Cloud → Backend → Advanced settings before pilots scale.*
4. **27 tables published to `supabase_realtime`.** Realtime fanout cost grows with `tables × subscribers × writes`. Many of these (e.g. background admin tables) likely don't need broadcast. *Action: audit and trim to the ~6 that actually drive UI.*
5. **No read replicas.** Every dashboard chart, every gradebook query, every parent view hits primary. Read replicas + a `useQuery` router that sends analytics reads to the replica is the highest-leverage single change for the 50k–200k range.

### 🟠 Tier 1 — query patterns that won't survive 100k DAU

Top offenders in `pg_stat_statements` (raw, post-P0-2):
- `student_behavior_stats` SELECT — **mean 167 ms, max 4.2 s, 1,445 calls**. P0-2 already rewrote its policies; mean should drop to <10 ms once stats refresh.
- `classroom_students` SELECT — **15,136 calls, 13.8 ms mean, 208 s total**. Hot path.
- PostgREST embedded join `classroom_students → classrooms → profiles` — **108 ms × 1,397 calls = 151 s total**. PostgREST generates a LATERAL nightmare. Replace the 3–4 highest-traffic call sites with a single `rpc()` returning the shape directly.
- `campaign_battle_sessions` ordered by `created_at` — **47.8 ms × 3,521 calls**. Needs composite index `(student_id, grade_mode, created_at DESC)`.

### 🟠 Tier 1 — sequential scans on auth-critical tables

Even with our 26 live users, the planner is choosing seq scan on:
- `classroom_students`: **777,801 seq vs 325,606 idx**
- `parent_accounts`: **617,175 seq vs 384,184 idx**
- `classrooms`: **299,513 seq vs 401,722 idx**
- `parent_student_links`: **152,524 seq vs 131,817 idx**

These are tiny tables today (3–7 rows). The planner switches to index scans automatically past ~500–1000 rows, but we should add covering indexes preemptively so the cutover is invisible: `(user_id)` on `parent_accounts`, `(teacher_id)` on `classrooms`, `(parent_id, approved, student_id)` on `parent_student_links`.

### 🟡 Tier 2 — realtime is the architectural ceiling for "concurrent"

Supabase Realtime on Lovable Cloud caps in the low-six-figures of concurrent connections per project. **27 published tables × N concurrent subscribers × write rate** is the cost function. At 100k concurrent students in classrooms, default Realtime will queue + drop messages. Options at that scale, in increasing order of effort:
- Phase A: shard channels by `classroom_id` (not project-wide) and trim publications.
- Phase B: move presence + cursor-style updates to polling RPCs (cheaper than channels).
- Phase C: introduce a dedicated fanout tier (Ably, PubNub, Cloudflare Durable Objects, or self-hosted on Fly) for the tournament + classroom-live paths only.

### 🟡 Tier 2 — edge function cold starts and per-invocation cost

56 functions, all Deno. Cold start ~150–400 ms each. At 1M users:
- High-frequency public-facing functions (`process-email-queue`, `escalation-engine`, `record-student-signin-success`, `submit-answer`, `buzz-in`) need warm-pool reservation or migration to Postgres functions where possible.
- `submit-answer` and `buzz-in` are tournament-critical; latency at 50k concurrent matters more than cost.

### 🟢 Tier 3 — already-fine, monitor only

- Connection pool at 1/200 — fine to 10–20× current traffic.
- Deadlocks: 1 since boot. Excellent.
- Auth throughput is gated by the student-ID rate limiter, which is correctly designed.

---

## The 1M-concurrent reality check

To be brutally honest: nobody runs 1M concurrent on a single Supabase project. The shape that supports it looks like this:

| Tier | Concurrent | What's required | Where we are |
|---|---|---|---|
| A | 5k | Current stack + P0 fixes + disk upgrade | ✅ Reachable today |
| B | 50k | + Read replica, realtime trim, RPC consolidation, covering indexes, Cloud compute bump | 2–4 weeks of work |
| C | 250k | + Sharded realtime fanout, CDN-cached read endpoints (PostgREST cache headers), dedicated tournament service, edge function warm pools | 2–3 months |
| D | 1M+ | + Multi-region read replicas, dedicated WebSocket tier (Ably/PubNub/Durable Objects), Postgres horizontal partitioning of `reading_sessions`/`aura_records`/`safety_audit_log`, request-collapsing edge cache | 6–9 months and a real SRE budget |

Total users ≠ concurrent. If "1M users" means **1M registered accounts with 30–80k peak concurrent during school hours**, we're on Tier B and the plan below gets us there.

---

## Recommended phased plan

### Phase 1 — close the obvious gaps (this sprint, ~2 days)

1. **Bump Cloud instance disk + compute** (`Backend → Advanced settings → Upgrade instance`). 70% disk is the most urgent number.
2. **Add covering indexes** on `parent_accounts(user_id)`, `classrooms(teacher_id)`, `parent_student_links(parent_id, approved, student_id)`, `campaign_battle_sessions(student_id, grade_mode, created_at DESC)`.
3. **Trim `supabase_realtime` publication** from 27 tables to the ~6 that drive live UI.
4. **Replace the `classroom_students→classrooms→profiles` embed** with an `rpc()` to a SECURITY DEFINER function returning the shape directly. Migrate the 3 hottest call sites (`useStudentDashboardData`, `useStudentClassroomIds`, `useStudentOverviewData`).

### Phase 2 — survive 50k concurrent (2–4 weeks)

5. **Add a read replica** and route gradebook/dashboard/analytics reads to it. Implement a `supabaseReplica` client wrapper.
6. **Audit the remaining 165 RLS policies** with nested subqueries; flatten the next 10–15 hot ones with SECURITY DEFINER helpers (extend the P0-2 pattern).
7. **Rate-limit `generate-world-backgrounds`** per-user-per-day to protect the $0/month AI cost guarantee.
8. **Reduce other cron polling**: `escalation-engine`, `check-weather-alerts`, drill cleanup — anywhere the queue is usually empty.
9. **Partition prep**: pick partition keys (likely `created_at` monthly) for `reading_sessions`, `aura_records`, `safety_audit_log`, `aura_access_log` before they cross 10 GB.

### Phase 3 — survive 250k concurrent (6–10 weeks)

10. **Shard Realtime by classroom**: switch broadcast channels from project-wide to `room:classroom_${id}`.
11. **Edge function consolidation**: collapse the 56-function surface to ~30 by merging tournament + match + buzz-in into one stateful function with internal routing.
12. **PostgREST response caching**: add `Cache-Control` headers for read-mostly endpoints (`reading_library`, `learning_standards`, `prek_worlds`, `behavior_categories`). CDN absorbs 80%+ of those reads.
13. **Warm-pool reservation** for tournament-critical functions (`submit-answer`, `buzz-in`, `start-round`).

### Phase 4 — reach Tier D / 1M concurrent (separate roadmap, 6+ months)

14. **Dedicated WebSocket tier** (Ably / PubNub / self-hosted on Fly Durable Objects) for fanout-heavy paths only.
15. **Multi-region read replicas** + geo-routing.
16. **Horizontal sharding** of the biggest write-heavy tables by `school_id` or `district_id`.
17. **Dedicated SRE on payroll.** No project hits Tier D without one.

---

## What I want to do next, in order

If you say go, I will execute **Phase 1** end-to-end (it's the highest leverage and the lowest risk):

- One migration adding the 4 covering indexes.
- One migration trimming `supabase_realtime`.
- One migration creating the `get_student_classroom_context` RPC + swap 3 hooks to use it.
- A short note telling you exactly which buttons to click in **Backend → Advanced settings** to upgrade the instance — I can't click those for you, but I can stage everything else around it.

Phase 2 onward I'll quote per-task; some of those (read replica, sharded realtime) are big enough they deserve their own plan.

**Bottom line:** 1M registered users + ~80k concurrent is a sprint of work away. 1M concurrent is a separate architecture conversation, and I'd rather be honest about that now than promise it on this stack.
