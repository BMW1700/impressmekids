
# Phase 2 — Final Contract Readiness

Goal: close every remaining gap from the brutally-honest audit so we can sign FERPA/COPPA/SOC 2 school contracts. All user-facing legal/compliance pages will be reachable from **Game Mode** routes (`/game/...`) so they remain live even if School Mode is hidden at ship.

## 1. AI privacy — pseudonymize every LLM call

Wire `supabase/functions/_shared/pseudonymize.ts` into every edge function that sends student data to an LLM. Currently only `generate-teacher-summary` uses it.

Functions to update (scrub PII + alias names + decode on response):
- `generate-question-ai`
- `generate-flashcards`
- `extract-text-from-image`
- `send-phoneme-report`
- `send-risk-alerts`
- `calculate-exercise-effectiveness`
- `analyze-aura/*` (any subfunctions that call Vertex/Gemini)
- `generate-world-backgrounds` (only if it sees student names; otherwise add a scrub pass on any free-text prompt)

For each: import `scrubPII` + `pseudonymizeStudents`, alias names before prompt, call `decode()` on model output, gate behavior on `school_settings.pseudonymize_ai_requests` (already defaults true).

## 2. COPPA consent gate — verified, blocking

- Audit `parent_consents` flow + `send-parent-consent-email`: confirm under-13 accounts cannot read/write any student data until `aura_recording_consent` / `data_use_consent` are TRUE.
- Add an `is_coppa_blocked(user_id)` security-definer helper and reference it from RLS on: `aura_records`, `reading_sessions`, `assignment_submissions`, `student_reading_stats`, `parent_phoneme_reports`.
- Add a frontend `RequireConsent` gate on the student dashboard that hard-blocks usage until a parent has confirmed.
- Verify the existing token-signed consent email + double opt-in.

## 3. Auth hardening

- Turn on **Leaked Password Protection** (HIBP) via `configure_auth`.
- Enforce **MFA** for `teacher`, `admin`, `district_admin`, `parent` roles. Add an `RequireMFA` guard on `/teacher`, `/admin`, `/district`, `/parent` routes. Students/game players unaffected.
- Add server-side MFA-enrollment check in a security-definer function used by the guards.

## 4. Compliance documents (live on Game Mode routes)

Create real, signable templates as pages under `/game/legal/...` so they ship regardless of School Mode visibility:

- `/game/legal/privacy` — full Privacy Policy (FERPA + COPPA disclosures, subprocessor list, data categories, retention, parent rights).
- `/game/legal/terms` — Terms of Service.
- `/game/legal/dpa` — Data Processing Addendum template (downloadable + on-page).
- `/game/legal/subprocessors` — current subprocessor list (Supabase, Vertex AI, Resend, Sentry, Cloudflare, Datadog).
- `/game/legal/security` — public-facing security overview (mirrors `SECURITY_POSTURE.md` without internals).
- `/game/legal/incident-response` — incident response plan summary + 72-hour breach notification commitment.
- `/game/legal/retention` — retention schedule (audio 90d, data 24mo, audit logs 7yr).
- `/game/legal/coppa` — parent rights page + link to existing `/parent/data-privacy` deletion portal.

Footer links added to Game Mode landing + `GameHeader`. School Mode pages link to the same routes.

## 5. SOC 2 evidence pack

- `docs/soc2/access-control.md` — role matrix + RLS philosophy.
- `docs/soc2/change-management.md` — Lovable migration approval flow + git history as evidence.
- `docs/soc2/vendor-management.md` — subprocessor due-diligence checklist.
- `docs/soc2/business-continuity.md` — backup/restore SLA (we already have `cold_storage_backups` + `check-backup-health`).
- `docs/soc2/logging-monitoring.md` — points at `security_audit_log` + `safety_audit_log` (hash-chained) + Sentry + Datadog.
- Update `SECURITY_POSTURE.md` to link the SOC 2 pack.

## 6. Migration prep — Lovable Cloud → Supabase

Create `docs/migration/lovable-to-supabase.md` with:
- Pre-flight checklist (env vars, secrets inventory via `fetch_secrets`, edge function list, storage bucket list, custom domain, auth providers config).
- Step-by-step cutover: claim Supabase project, transfer ownership, re-point `VITE_SUPABASE_URL` + `_PUBLISHABLE_KEY`, re-add secrets, redeploy edge functions, verify RLS + storage policies, re-run security scan + linter.
- Rollback plan.
- Post-migration verification script list (auth flow, student sign-in, parent consent email, AI summary, audio upload).

No actual cutover yet — just the documented plan so when the user pulls the trigger it's pre-flighted.

## 7. Verification

After each block:
- Re-run `security--run_security_scan` + `supabase--linter` — target: still 0 errors, ≤98 documented warns.
- Spot-test one edge function per category with a synthetic student name to confirm pseudonymization.
- Smoke-test `/game/legal/*` routes render.
- Build passes.

## Out of scope

- Actually executing the Lovable→Supabase cutover (documented, not performed).
- Pen-test / external SOC 2 auditor engagement (we're producing the evidence pack they'd consume).
- Any UI redesign of Game Mode.
- Touching School Mode UX.

## Technical notes

- All new RLS helpers will follow the existing `security definer` + `set search_path = public, pg_temp` + revoke-from-public pattern documented in `SECURITY_POSTURE.md`.
- Legal pages will be static React routes with `Helmet` SEO + canonical, lazy-loaded, no backend dependency.
- MFA guard uses `supabase.auth.mfa.listFactors()` client-side + a `has_verified_mfa(uid)` security-definer for RLS checks where needed.
- Pseudonymization wiring is additive — no breaking changes to function signatures.
