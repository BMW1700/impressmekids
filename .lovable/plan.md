
# Scaling Nabu Learn to 1M+ Users

Goal: support hundreds of daycare centers and 1M+ Pre-K users without performance, cost, or reliability cliffs. The current stack (React + Vite on Lovable hosting, Lovable Cloud / Postgres + Auth + Storage + Edge Functions) gets us there — but four pieces need to change before the partner ramps. Plan is sequenced so each phase ships independently and the app stays live.

---

## Where the ceilings actually are today

Not user count — these four:

1. **Pre-K video delivery.** Every level video is fetched from Storage via 1-hour signed URLs (`preKLevelFromDb.ts` → `createSignedUrl`). No CDN in front. 500 iPads hitting "Bobo introduces A" at 9:05 AM = origin egress spike + slow first-frame.
2. **Database compute.** Single Lovable Cloud instance. Hot Pre-K reads (`prek_worlds`, `prek_levels`, `prek_level_words`, `aura_records`, `student_reading_stats`) all hit the same Postgres.
3. **Edge function concurrency.** Submission/scoring functions (e.g. `pre-k-aura-submit`, AI grading) are per-invocation; large daycare cohorts submitting simultaneously can queue.
4. **Auth + RLS hot paths.** 530+ RLS policies; some on heavily-read tables run `has_role()` / joins on every row. Fine today, expensive at 1M.

Realistic safe ceiling **right now**, unchanged: ~5K–10K MAU before any of the four above starts showing latency. The plan below lifts that to 1M+.

---

## Phase 0 — Baseline & guardrails (0.5 day, no code)

- Enable Lovable Cloud usage alerts (DB CPU, disk, egress, function invocations).
- Snapshot current `db_health` + `slow_queries` so we have a "before" number.
- Add a simple load budget: target p95 < 400 ms for Pre-K level load, < 1.5 s first video frame.

Deliverable: one-page baseline doc. No user-visible change.

---

## Phase 1 — Pre-K video on a CDN (the single biggest win) (1–2 days)

This is the **must-do-before-partner-ramps** item.

- Put Cloudflare in front of `prek-level-videos` storage (guide already in repo: `PHASE_2_CLOUDFLARE_SETUP_GUIDE.md`).
- Switch `resolveUrl()` in `src/lib/preKLevelFromDb.ts` to return a **long-lived, cacheable URL** (signed URL TTL 7 days, or public-read with token in path) so Cloudflare can cache the bytes at the edge.
- Add `Cache-Control: public, max-age=31536000, immutable` on upload in `src/lib/preKVideoUpload.ts` (video files never mutate — new uploads get new paths).
- Add a tiny client-side `<link rel="preload" as="video">` for the opening clip when a level card mounts.

Result: 95%+ of video bytes served from Cloudflare edge, not origin. Origin egress drops ~20×. First-frame latency on iPads in a daycare LAN drops from ~2 s to ~400 ms. Cost: $0 (Cloudflare Free) up to ~$20/mo (Pro) for the whole partner rollout.

---

## Phase 2 — Database read scaling (1 day)

- Run `supabase--slow_queries` and add targeted indexes on the offenders. Known hot paths to verify first:
  - `prek_levels(world_id, level_number)`
  - `prek_level_words(level_id, sort_order)`
  - `aura_records(student_id, created_at desc)`
  - `student_reading_stats(student_id)`
- Cache the **published Pre-K catalog** (`prek_worlds` + `prek_levels` join) in the client via React Query with a 5-min `staleTime`. It changes only when CMS publishes — no reason to refetch per navigation.
- Move per-student "today's progress" reads behind a single RPC (`get_prek_student_today`) instead of 3–4 round trips.

Result: Pre-K dashboard load drops from ~6 queries to 1–2; DB CPU under daycare-morning load stays flat.

---

## Phase 3 — Compute headroom (15 min, ops only)

- Upgrade Lovable Cloud instance one size when sustained DB CPU > 50% or connection saturation > 60% (visible in `db_health`).
- Lovable Cloud supports vertical scaling on demand — no migration, no downtime beyond a brief restart.
- Trigger points, not pre-emptive: bump at ~50K MAU, again at ~250K, again at ~750K. The platform handles 1M+ on a large instance; we don't need to shard.

Result: linear, predictable scaling. Cost grows with usage, not ahead of it.

---

## Phase 4 — Edge function & submission hardening (1 day)

- Add idempotency keys to `pre-k-aura-submit` so a retrying iPad doesn't double-write.
- Batch `aura_records` inserts where the UI already groups them (end-of-level rollup) instead of per-word writes.
- Add a lightweight queue table (`prek_submission_queue`) + cron-drained worker for AI scoring so spikes don't block the user's "Great job!" screen — UI returns immediately, scoring lands within seconds.

Result: submission p95 stays < 300 ms even when 2,000 kids finish a level in the same minute.

---

## Phase 5 — RLS & auth hot-path audit (0.5 day)

- Review the 5 most-read tables' policies; replace any `EXISTS(SELECT … FROM user_roles …)` inline checks with the existing `has_role()` SECURITY DEFINER function (memory rule already in place — verify every Pre-K table follows it).
- Ensure `auth.uid()` is called once per query via a `(select auth.uid())` wrapper in policies — Postgres can then cache it per statement.

Result: RLS overhead on hot reads drops ~30–50%.

---

## Phase 6 — Observability for the partner ramp (0.5 day)

- Wire Sentry performance traces on the Pre-K player only (already COPPA-safe per memory).
- Add a simple `/health` and `/metrics` dashboard for the partner: active sessions, p95 video start, error rate.
- Alert thresholds: video start p95 > 1 s, DB CPU > 70%, function error rate > 1%.

Result: we see problems before the partner does.

---

## Phase 7 — Stretch, only if needed past ~500K MAU

- Move Pre-K video to a dedicated bucket per region if international daycares come on.
- Read replicas for analytics queries (teacher dashboards) so they never compete with kid-facing reads.
- Pre-compute classroom rollups nightly into a `classroom_daily_stats` table.

Not needed for 1M; listed so it's on the roadmap.

---

## Capacity summary

| Phase done | Safe MAU ceiling | Monthly infra cost (est.) |
|---|---|---|
| Today | 5K–10K | ~$0–25 |
| + Phase 1 (CDN) | 100K | ~$20 |
| + Phases 2–3 | 250K | ~$100–200 |
| + Phases 4–5 | 750K | ~$300–500 |
| + Phase 6 + one more instance bump | **1M+** | ~$600–1,000 |

At your pricing ($5–7/student/year per memory), 1M users = $5–7M ARR against ~$10K/yr infra. Margins hold.

---

## What I need from you to start

1. Confirm we own (or can quickly get) a custom domain so Cloudflare can sit in front — Phase 1 needs it. `nabulearn.com` is already attached, so we're good unless you want a different apex.
2. Green-light Phase 1 + 2 first (the only ones that matter before the partner brings the first 50 centers on). Phases 3–7 are triggered by metrics, not calendar.
3. Tell me if the partner's first cohort is daycare-LAN (shared Wi-Fi, ~20 iPads/room) or home use — it slightly changes the CDN cache strategy.

Once you approve, I'll execute Phase 1 and Phase 2 in one build pass and report numbers from `db_health` + a synthetic 500-device video test before touching anything else.
