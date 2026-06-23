## Executing A + C this session (B is "do nothing", so it's automatic)

### Part 1 — Rate-limit `generate-world-backgrounds` (Option C)

Heads-up: the backend has no standard rate-limiting primitive, so this is an **ad-hoc DB-count limit** inside the edge function. You're explicitly approving that tradeoff by saying "do it all."

- Read the existing `generate-world-backgrounds` function.
- Before calling the AI gateway, `SELECT count(*) FROM world_backgrounds WHERE user_id = ? AND created_at > now() - interval '24 hours'`.
- If ≥ 20, return HTTP 429 with a clear message.
- Log the rejection to `email_send_log`-style table? No — just `console.error` is fine; we don't need a new table for this.

### Part 2 — Phase 2 hardening (Option A)

**Migration 1 — Four more SECURITY DEFINER RLS helpers + policy swaps:**
- `is_owner_of_aura_record(_record_id)` → swap into `aura_records` policies
- `is_owner_of_reading_session(_session_id)` → swap into `reading_sessions` parent/teacher policies
- `is_teacher_of_assignment(_assignment_id)` → swap into `assignment_submissions` policies
- `is_parent_recipient_of_notification(_notification_id)` → swap into `parent_notifications` policies
- Pull slow-query data first to confirm these 4 are actually the next hottest. If pg_stat_statements points elsewhere, target those instead.

**Migration 2 — Two more RPC replacements for PostgREST embed joins:**
- `get_teacher_classroom_overview(_teacher_id)` — replaces the `classrooms → classroom_students → profiles` embed used in `useTeacherDashboardData`
- `get_parent_student_summary(_parent_id)` — replaces the `parent_student_links → student_reading_stats` embed used in parent dashboards
- Update the 2 hooks to call `.rpc(...)` instead of the embed.

**Migration 3 — Preemptive covering indexes** on tables flagged in the audit but not yet indexed:
- `idx_assignment_submissions_student_assignment` on `(student_id, assignment_id, status)`
- `idx_parent_notifications_parent_created` on `(parent_id, created_at DESC, read_at)`
- `idx_aura_records_student_created` on `(student_id, created_at DESC)` — only if it doesn't already exist.

**No read replica wrapper this round.** That's a real architecture change (separate client, query routing rules, staleness handling for gradebook reads) and your current connection headroom (16/90 in use) means it's not urgent. I'd rather do it correctly post-pilot with real read/write ratios than guess now. Calling that out so I'm not silently dropping it from the menu.

### Order of operations

1. Pull `slow_queries` to confirm hottest hooks (5 min, read-only).
2. Ship Migration 1 (RLS helpers).
3. Ship Migration 2 (RPCs) — wait for approval before code edits.
4. Edit the 2 hooks to use new RPCs.
5. Ship Migration 3 (indexes).
6. Edit `generate-world-backgrounds` for rate limit.
7. Update `SCALE_READINESS_AUDIT.md` with Phase 2 status.
8. Re-pull `db_health` and report the final picture.

### What you'll be asked to approve

Three migration tool prompts (one per migration). Everything else I just do.

Going now.
