# Scale Readiness Plan: Path to 1M+ Users

Parking the Pre-K banner idea. The visuals are good enough; the scale path is the real risk to pilot contracts.

## Goal

Produce a concrete, prioritized readiness report covering the seven systems most likely to fail between 10K and 1M concurrent users, with fixes ranked by **contract risk × effort**.

## Scope (audit only — no code changes yet)

### 1. Database & RLS hotpaths
- Run `supabase--linter` and `supabase--slow_queries` to surface missing indexes, sequential scans, and recursive RLS.
- Inventory the 530+ RLS policies (per memory) — flag any policy that does a subquery per row instead of using `has_role()` security-definer.
- Check `reading_sessions`, `aura_recordings`, `student_assignment_stats`, `safety_audit_log` for partitioning candidates (these grow per-student-per-day).
- Verify atomic upsert RPCs (per memory: `atomic-stats-and-offline-resilience`) actually have unique constraints behind them.

### 2. Edge function cold starts & cost
- List all deployed edge functions, pull recent logs via `supabase--edge_function_logs`.
- Flag any function calling Lovable AI on every student keystroke (AURA phoneme path is the prime suspect).
- Identify functions that should be client-side (CMU dict lookups, homophone checks) to cut invocations.

### 3. Realtime channels
- Audit multiplayer (`multiplayer-sync-system`), classroom presence, and tournament realtime for per-classroom channel fanout.
- At 1M users / ~30K classrooms, naive presence broadcasting melts. Recommend channel sharding or polling fallback.

### 4. Asset & CDN cost
- Inventory `assignment-question-images`, Pre-K video assets, Benny sprite sheets.
- Verify everything heavy is on Lovable Assets CDN (not Supabase storage egress).
- Check video assets have proper `Cache-Control` and are served as `.mp4` not `.mov`.

### 5. Client bundle & iPad performance
- Measure current bundle size, code-splitting boundaries.
- Per memory (`k5-ipad-as-primary-classroom-device`), iPad 7th gen is the floor — verify TensorFlow.js + Web Speech doesn't OOM.
- Confirm Service Worker stays removed (per memory `service-worker-removal-and-tab-switch-stability`).

### 6. AI cost model
- Per memory (`aura-pricing-model-confirmed`): $5–7/student/year requires $0/month AURA cost at scale.
- Audit every Lovable AI Gateway call site. Anything not strictly needed → kill or move to local ML.
- Verify pseudonymization (`_shared/pseudonymize.ts`) still strips PII before every prompt.

### 7. Auth & onboarding throughput
- Student-ID dual login flow (per memory) — rate limits, brute-force protection at scale.
- Clever SSO edge function under 30K concurrent August-rollout sign-ins.
- COPPA consent flow can't bottleneck on synchronous email sends.

## Deliverable

A ranked findings document with:
- **Severity** (contract-blocker / degradation / cost)
- **Effort** (hours)
- **Recommended fix** (specific file + approach, not vague)
- **Quick wins** section for anything ≤2 hours

## Out of scope (deferred)

- Pre-K hero banners and any other landing/UI polish
- New features
- Marketing copy

## Next step after approval

I run the audit (read-only — `supabase--linter`, `slow_queries`, `edge_function_logs`, asset inventory, bundle analysis) and come back with the ranked findings. You pick which items to fix first.
