## Backend security hardening — close all 255 scanner findings

Audit pulled fresh results. Findings group like this:

| # | Severity | Finding |
|---|---|---|
| 2 | **error** | Students can overwrite each other's audio submissions; any authenticated user can upload assignment question images |
| 2 | warn | Teacher aura-audio read policy + teacher question-image read policy both reference the wrong column, so teachers actually have no access (broken, not over-permissive) |
| 4 | warn | Storage buckets are public and allow object listing |
| 1 | warn | An RLS policy uses `USING (true)` / `WITH CHECK (true)` on a write path |
| 4 | warn | Postgres functions missing `SET search_path` |
| 118 | warn | `SECURITY DEFINER` functions executable by anon |
| 124 | warn | `SECURITY DEFINER` functions executable by authenticated (broader than needed) |

Everything below is in service of "perfect" FERPA / COPPA / SOC 2 posture. No app feature changes, no UI changes, no Game Mode vs School Mode decision — purely backend hardening.

### Phase 1 — Stop the bleeding (the two `error` findings)

1. Replace the storage policy on the `aura-audio` bucket so students can `INSERT` / `UPDATE` / `DELETE` **only** objects whose first path segment is their own `auth.uid()`. Teachers + admins keep scoped read via `has_role` + classroom membership.
2. Replace the `assignment-question-images` write policies so only the **teacher who owns the classroom** in the path prefix (`<classroom_id>/...`) can write, not "any authenticated user". Keep the existing classroom-member read policy.

### Phase 2 — Fix the two broken teacher-read policies

3. Rewrite the teacher read policy on `aura-audio` to use the correct join (`student_id` → `classroom_students` → `classrooms.teacher_id`) instead of the bad column ref. Same fix on `assignment-question-images` teacher read.

### Phase 3 — Storage buckets

4. Flip all four public buckets that don't need anonymous listing to `public = false`, and drop any `storage.objects` `SELECT USING (true)` policies in favor of path-scoped + role-scoped policies. Each bucket gets a single reviewed read policy; legitimately public assets (e.g. campaign art) stay public but lose the listing privilege.

### Phase 4 — RLS

5. Find the one `USING (true)` / `WITH CHECK (true)` write policy flagged by the linter and replace it with an `auth.uid()` / `has_role()`-scoped predicate. Re-run linter to confirm zero remaining.

### Phase 5 — SECURITY DEFINER cleanup (the bulk of the noise)

6. Enumerate every `SECURITY DEFINER` function in `public`. For each:
   - Add `SET search_path = public, pg_temp` (covers the 4 `function_search_path_mutable` warnings as a side effect).
   - `REVOKE EXECUTE ... FROM PUBLIC, anon` by default.
   - `GRANT EXECUTE ... TO authenticated` **only** for functions explicitly meant for signed-in users (`has_role`, `get_student_classroom_ids`, etc.). Everything else stays callable only by `service_role` (i.e. edge functions).
   - Convert any function that doesn't actually need elevated privileges to `SECURITY INVOKER`.
7. Document which definers are intentionally callable by `authenticated` in `security-memory` so future scans don't re-flag them.

### Phase 6 — Verification & evidence

8. Re-run `security--run_security_scan` and `supabase--linter` until count is 0 (or the only remaining items are documented intentional exceptions written to `security-memory`).
9. Update `mem://compliance/school-contract-hardening-phase1` and `security-memory` with the final posture: which buckets are public, which definers are callable by `authenticated`, and why.
10. Drop a `SECURITY_POSTURE.md` snapshot (counts, date, scope) into the repo so it's reproducible evidence for a SOC 2 Type 1 readiness file.

### Out of scope (intentionally)

- Game Mode vs School Mode product decision — separate conversation.
- Any frontend / UI changes.
- New tables, new auth flows, new edge functions.
- SOC 2 policy documents (DPA, AUP, IR plan) — those are a separate doc track, not code.

### Technical notes

- All changes ship as **one migration per phase** so each one is reviewable and revertable independently.
- No data is touched; only schema/policies/grants/function bodies.
- `service_role` keeps full access throughout so edge functions don't break.
- After Phase 5 the public-facing Data API surface for RPCs shrinks dramatically — if any frontend code calls a definer that we lock down to `service_role`, it will start to 401. We'll inventory `supabase.rpc(...)` calls in the client during Phase 5 and route any legitimate ones through an edge function instead of granting broad `EXECUTE`.

Approving this plan switches to build mode and I start with Phase 1.