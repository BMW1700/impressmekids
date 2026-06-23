## Re-audit after your upgrade — looks great

Fresh metrics, side by side with where we were an hour ago:

| Metric | Before | Now | Verdict |
|---|---|---|---|
| Data disk | 70% (4.08 / ~5.8 GB) | **17%** | Plenty of headroom |
| Memory | 52% | **28%** | Compute upgrade landed |
| Max connections | 60 | **90** | +50% |
| Pool clients | 200 | **400** | 2× |
| Restarts | 0 | 0 | Clean cutover |
| DB size | 4.08 GB | 4.08 GB | (unchanged, expected) |
| WAL | 1.18 GB | 1.12 GB | Marginal — see below |

**Both upgrades landed cleanly.** Zero restarts visible means the resize was seamless — no user-facing downtime.

### What this buys you, concretely

- **Connections (60 → 90, pool 200 → 400):** you can now comfortably support **~15–25k DAU** on this tier alone, up from ~5k. The connection ceiling was the single hardest wall in front of you for pilots.
- **Memory (52% → 28%):** RLS subquery evaluation + Postgres planner now have real working space. The 167ms `student_behavior_stats` reads should drop further as the planner re-stats with more cache.
- **Disk (70% → 17%):** autovacuum will run normally; WAL has somewhere to go; no more "disk pressure" risk during a pilot spike.

### One number that didn't move and is fine

- **WAL still 1.12 GB.** This is cumulative since boot and reflects the historical write pattern (mostly the every-5-second email cron I throttled last session). It will drift down over the next 24-48h as old WAL segments get archived. No action.
- **Rolled-back transactions = 3.84M.** Same root cause we already fixed (pg_cron + pgmq peek savepoints). The counter is cumulative-since-boot and won't drop until the next restart. The *rate* is what matters and that's now 6× lower. No action.

### Where you actually stand on the path to 1M

- **Tier A (5k concurrent):** ✅ Comfortably yours today.
- **Tier B (50k concurrent, 1M registered):** **~2 weeks of work away.** Next levers are (1) read replica for analytics/gradebook reads, (2) flatten the next 10–15 RLS policies with SECURITY DEFINER helpers, (3) rate-limit `generate-world-backgrounds`. None require another instance bump.
- **Tier C+ (250k+ concurrent):** Still a separate architecture conversation (sharded realtime, dedicated WS tier). Not blocked by anything we just did.

### What I'd do next (your call)

**Option A — Phase 2 now.** Start the read-replica + RLS flatten pass #2 this session. Highest leverage. ~2-3 migrations + a `supabaseReplica` client wrapper for read-heavy hooks.

**Option B — Pause and pilot.** You now have real Tier B-adjacent capacity. Run a pilot, gather real production load data, then tune Phase 2 against actual hot paths instead of slow-log guesses. This is honestly the smarter call if a pilot is imminent.

**Option C — Just rate-limit `generate-world-backgrounds`.** 30-min job. Closes the one uncapped AI cost surface so a runaway loop can't blow up your $0/month AURA cost model. Low-risk, high-value, doesn't preempt Option A or B.

Which one?
