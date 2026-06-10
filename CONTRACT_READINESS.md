# Contract Readiness — Final Status

_Last updated: 2026-06-10 (post-Phase-2)._

This file is the single source of truth for what is shippable today.

## Code/control completeness

| Control | Status | Notes |
|---|---|---|
| RLS on every public table | ✅ | 530+ policies; linter clean of errors. |
| GRANTs on every public table | ✅ | All migrations follow the 4-step pattern. |
| `SECURITY DEFINER` hygiene | ✅ | All 124 functions: `search_path` locked, `anon` revoked, `authenticated`/`service_role` scoped. |
| Storage policies path-scoped | ✅ | `aura-audio`, `assignment-audio`, `assignment-question-images` all scoped to owner / classroom. |
| Sentry student-replay off by default | ✅ | `replaysSessionSampleRate = 0` unless `setStudentMode(false)`. |
| Pseudonymize student PII to LLM | ✅ | Wired into `generate-teacher-summary`, `generate-question-ai`, `generate-flashcards`, `analyze-aura` (both call sites), `extract-text-from-image`. Templated emails (`send-phoneme-report`, `send-risk-alerts`) intentionally use real names — they never touch an LLM. |
| HIBP leaked-password protection | ✅ | Enabled via `configure_auth`. |
| MFA enrollment UI | ✅ | `/account/mfa` page (TOTP enroll + remove). |
| MFA enforcement on privileged routes | ✅ Partial | `RequireMFA` wraps `/admin/*`, `/district/*`, `/security`. Teacher/parent intentionally **not** wrapped yet — wider rollout deferred 14 days to give staff time to enroll without lockout. |
| COPPA RLS restrictive policies | ✅ | `is_coppa_blocked()` hard-blocks INSERT/UPDATE on `aura_records`, `reading_sessions`, `assignment_submissions` for unconfirmed under-13s. |
| COPPA frontend gate | ✅ | `<RequireConsent />` component built (`src/components/auth/RequireConsent.tsx`). **Not yet wrapped on `/student/*` routes** — wrap when ready to hard-enforce (will redirect un-consented students to Game Mode). |
| Game Mode legal pages | ✅ | `/game/legal/{privacy,terms,dpa,subprocessors,security,incident-response,retention,coppa}` all live. |
| SOC 2 evidence pack | ✅ | `docs/soc2/{access-control,change-management,vendor-management,business-continuity,logging-monitoring}.md`. |
| Migration / cutover plan | ✅ | `docs/migration/lovable-to-supabase.md`. |
| Account deletion (COPPA right) | ✅ | `/account/delete` + `process-data-deletion` edge function + parent self-serve at `/parent/data-privacy`. |
| Data export (FERPA right) | ✅ | `data_export_requests` table + parent/teacher/admin self-service. |
| Audit chain verification cron | ⚠️ Deferred | `safety_audit_log` schema does not yet carry a hash column; the documented chain is aspirational. **TODO before SOC 2 Type II clock starts:** add `prev_hash` + `row_hash` columns, backfill, then schedule `verify_audit_chain()` in `pg_cron`. |

## What we can sign today

| Contract size | Status |
|---|---|
| Free pilot / 1 classroom | ✅ Ship. |
| 1–3 schools, paid | ✅ Ship with signed DPA + 14-day MFA grace for staff. |
| Single district, < 10k students | 🟡 Possible — they may accept a SOC 2 Type I letter + roadmap to Type II. |
| Multi-district, $50k+ | 🔴 Requires SOC 2 Type II (Q1 2027 earliest) + external pen-test + cyber liability binder. |

## Offline checklist (legal / business, not engineering)

1. **Sign Student Privacy Pledge 2020** (free) — instant credibility.
2. **Register as SDPC vendor** (Student Data Privacy Consortium) — one-time, $0.
3. **Hire ed-tech privacy attorney** to review DPA template and state addenda (CA SOPIPA, NY Ed Law 2-d, IL SOPPA, CO HB-1130, TX SB-820). Budget $2–4k.
4. **Cyber liability insurance**: $2M minimum aggregate. ~$3–6k/yr at our scale.
5. **E&O insurance**: $1M. ~$1–2k/yr.
6. **Engage CPA firm for SOC 2 Type I** readiness assessment + audit. Budget $15–25k. Type II requires 6-month observation window — kick off now to have a report by Q1 2027.
7. **Commission an external pen-test** (annual). Vendors: Cobalt, Bishop Fox, HackerOne. Budget $8–15k.
8. **Designate a Data Protection Officer** (can be founder for now; document the appointment).
9. **Background checks** on any human with production database access.
10. **Vendor binder**: signed DPAs from Supabase, Google Vertex, Resend, Sentry, Cloudflare, Datadog. Store in `/legal/subprocessor-dpas/`.
11. **Pre-fill HECVAT Lite** (Higher Ed Community Vendor Assessment Toolkit) and the K-12 SDPC questionnaire. Districts will ask.
12. **Incident response runbook** — already drafted in `docs/soc2/`, but print and laminate the on-call escalation tree.
13. **Separate operating bank account** — clean audit trail for contracts.
14. **One-page security overview PDF** — distilled from `SECURITY_POSTURE.md`, addressed to superintendents and IT directors.
15. **Pilot references** — secure 2–3 quotable schools willing to be called by prospective districts.

## What's intentionally not done

- **MFA wrap on `/teacher/*` and `/parent/*`** — would lock out existing pilot staff with no notice. Plan: email all staff, give 14-day grace period, then wrap.
- **`RequireConsent` wrap on `/student/*`** — server-side RLS already hard-blocks the write paths. Frontend wrap is the friendlier UX layer; turn it on when first paid school onboarded so we can verify the parent-consent email flow at scale.
- **`verify_audit_chain()` cron** — schema column work needed first; see above.

## Verdict

**Contract-ready for any pilot or single-school paid deal today.** District-scale ($50k+ multi-school) requires the offline paperwork above and a SOC 2 Type II report — calendar time, not engineering time.

— Generated for President B. M. Weiner, 2026-06-10.
