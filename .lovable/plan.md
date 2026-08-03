# Classroom-Scale Production Readiness — Architecture Audit & Plan

No code changes in this document. This is the audit, the risks, and the proposed work.

## What implementing this actually does

It turns the current product from a **demonstration/pilot app** into a **classroom-safe system** that can survive a school with 30–300 iPads on one network: students log in without email, teachers reset their PINs, AI evaluations cannot be lost because of a rate limit, and the platform logs enough to diagnose problems.

## Is the whole plan necessary? No.

Below is the honest breakdown of what is **essential**, what is **highly recommended**, and what is **optional polish**.

### Tier 1 — Must do before classrooms use it (safety-critical)

| Item | Why it is required | What breaks if you skip it |
|---|---|---|
| Fix bulk-create-students to issue and return PINs | The current function creates Student-ID accounts but throws away the random password. Students cannot sign in. | Bulk-imported accounts are useless. Support burden explodes. |
| Retry/backoff in `_shared/vertexAuth.ts` | Today a transient Google 429/503 makes a reading submission vanish. | A single rate limit or blip loses a child's score/answer. |
| Durable AI job queue (idempotency + state) | Prevents duplicate scoring and lets a submission be retried without losing it. | 50 simultaneous submissions = collisions, lost data, and double rewards. |
| Teacher-scoped student provisioning | Today only admins can bulk-import; teachers must ask admins for every roster. | Pilot deployment is blocked in any real school. |
| Real per-IP + per-username lockout on student login | The current rate limit is fake (`no-ip-collected`) and fails open. | Credential stuffing, class lockouts, and no audit trail. |

### Tier 2 — Should do before scaling (reliability and support)

| Item | Why it matters | What happens if you skip it |
|---|---|---|
| Classroom login flow (class code + username + PIN) | The 8-digit Student-ID route leaks the synthetic email internally and is awkward at scale. | Continue using the current flow; still works but harder to deploy and less secure. |
| Structured ops event logging | Right now you only have console logs and Sentry. You cannot see patterns across 300 devices. | Debugging classroom-wide failures is manual guesswork. |
| Clean up redundant `aura_records` indexes | Four overlapping indexes slow every write. | Performance degrades with volume; no immediate correctness problem. |
| CORS allowlist for privileged functions | Current `*` is wider than needed. | Low actual risk in a school app, but it is flagged in any audit. |
| Session idle timeout for shared devices | Today a session in `localStorage` persists forever. | Another student could pick up an iPad and see the previous student's data. |

### Tier 3 — Nice to have (operational maturity)

| Item | Why it is optional |
|---|---|
| Load-test mode + documented routes | Useful only if you actually run the 35/100/300/50 load tests. Can be added later. |
| Full switch to OpenAI key | Not required; the current Google Vertex key is your own provider. |
| Rollback migration scripts | Important for production, but this backend is small enough that manual rollback is acceptable. |

### Recommended scope

**If you want the pilot safe and deployable:** implement Tier 1 + the Classroom login flow (Tier 2). That is roughly 60% of the file list but removes the real failure modes.

**If you want classroom-scale production:** add Tier 2.

**Tier 3** can be deferred until you have a launch date and a load-testing day.

---


## 1. Current architecture (verified in this repo)

### Authentication
- Supabase auth via `src/integrations/supabase/client.ts` with `persistSession: true`, `autoRefreshToken: true`, storage = `localStorage`.
- `src/contexts/AuthContext.tsx` is the single listener; profile loads via `get_user_profile` RPC plus a direct `profiles` select.
- Students log in one of two ways (`src/pages/Auth.tsx`):
  - real email + password, or
  - **8-digit Student ID** → mapped to a synthetic email `<id>@student.yubilearn.internal` (`src/lib/studentIdAuth.ts`) → `signInWithPassword`.
- Rate limiting: `check-student-signin-rate` / `record-student-signin-success` Edge Functions wrap the DB RPCs `check_student_id_signin_rate` and `record_student_id_signin_success`. Both deliberately pass a constant `'no-ip-collected'` bucket, so **only the per-Student-ID limit (5 fails / 5 min) is live — there is no per-IP limit at all.** Both fail **open** on any error.
- Roles: `user_roles` table + `has_role()`; `claim_initial_role` RPC handles first-role assignment.

### Student provisioning
- `supabase/functions/bulk-create-students/index.ts` (260 lines), called from `src/components/admin/BulkStudentImport.tsx`.
- Uses service role, `email_confirm: true` (no confirmation email for Student-ID accounts), max 500 per call, **sequential `for` loop** — no batching, no concurrency.
- Authorizes on `profiles.role === 'admin'` only — **teachers cannot provision**, and the check reads the legacy `profiles.role` column rather than `user_roles`/`has_role`.
- Generates `tempPassword = crypto.randomUUID().slice(0,12) + 'Aa1!'` and **never returns it or stores it anywhere**. A Student-ID account created through bulk import therefore has a password nobody knows — the account is unusable. This is the single biggest functional gap.

### AI reading evaluation
- **Not on the Lovable AI connector.** All AI runs through `supabase/functions/_shared/vertexAuth.ts` → Google Vertex AI (`gemini-2.5-flash`), authenticated with the `GOOGLE_VERTEX_AI_KEY` service-account secret and `GOOGLE_VERTEX_REGION`.
- Consumers: `analyze-aura`, `generate-teacher-summary`, `generate-question-ai`, `generate-flashcards`, `generate-practice-exercises`, `extract-text-from-image`.
- The Lovable AI Gateway (`LOVABLE_API_KEY`) is only used by the email stack and `generate-world-backgrounds`.
- `analyze-aura` is invoked **synchronously** from five call sites: `AuraPractice.tsx`, `AuraReadingGrader.tsx`, `StudentQuestionView.tsx`, `preKAuraSubmit.ts`, `AuraReadingSection.tsx`. Fire-and-wait, request/response — no job record, no queue.

### Resilience today
- `vertexAuth.ts` has **no retry, no backoff, no 429 handling**.
- `_shared/rateLimiter.ts` exists (Deno KV, fails open) but is not applied to `analyze-aura`.
- Idempotency keys exist only in the email stack and partially in `bulk-create-students`.

### Indexes
- Hot tables are indexed, but `aura_records` carries four overlapping profile indexes (`idx_aura_records_profile_id`, `_profile_created`, `_profile_date`, `_profile_id_created_at`). Redundant indexes slow every write on the busiest table.

---

## 2. Bottlenecks

| # | Bottleneck | Impact at 35–300 concurrent |
|---|---|---|
| B1 | `analyze-aura` is synchronous | 50 simultaneous submissions = 50 held Edge Function invocations, each waiting on Vertex. First to hit the Vertex quota fails and the student's session is lost. |
| B2 | No retry/backoff in `vertexAuth.ts` | A single transient 429/503 becomes a lost score. |
| B3 | Sequential loop in `bulk-create-students` | 300 students ≈ 300 serial admin API calls; likely exceeds the Edge Function wall clock. |
| B4 | Supabase auth rate limits are per-project and partly per-IP | 35 students signing in from one school NAT within 2 minutes can trip auth throttling. Needs a limit raise plus client-side stagger. |
| B5 | Redundant `aura_records` indexes | Write amplification on the highest-volume table. |
| B6 | `AuthContext` issues 2 queries per user on every mount | 300 devices = 600 queries in the same 60-second window. |
| B7 | No per-IP rate limit on Student-ID sign-in | A single script can enumerate 8-digit IDs at full speed. |

---

## 3. Security risks

| # | Risk | Severity |
|---|---|---|
| S1 | Bulk-import temp passwords are generated and discarded — accounts are created that cannot be signed into. | Critical (functional + support burden) |
| S2 | Synthetic email `<id>@student.yubilearn.internal` is constructed **in the browser** and is visible in DevTools/network. The internal identifier is effectively disclosed. | High |
| S3 | Student-ID space is 8 digits with **no per-IP throttle** and a fail-open check. Enumerable. | High |
| S4 | `bulk-create-students` authorizes on `profiles.role`, not `user_roles`/`has_role()` — inconsistent with the rest of the app's role model. | Medium |
| S5 | `corsHeaders` is `Access-Control-Allow-Origin: *` on every function including privileged ones. | Medium |
| S6 | Sessions persist in `localStorage` forever on shared classroom iPads with no idle timeout. | Medium (FERPA exposure) |
| S7 | Fail-open rate limiters mean an outage of the limiter disables the limit entirely. | Medium |

No service-role key or privileged secret was found in `src/` — that part is clean.

---

## 4. Proposed database changes

New tables (each with GRANTs, RLS, and policies):

- **`student_credentials`** — `user_id`, `classroom_id`, `username` (unique per classroom), `pin_hash` (bcrypt/argon2, never plaintext), `pin_set_at`, `must_reset`, `failed_attempts`, `locked_until`. Readable only by the owning teacher/admin; never by students.
- **`ai_evaluation_jobs`** — `id`, `idempotency_key` (unique), `student_id`, `submission_ref`, `payload` (jsonb), `status` (`queued|processing|completed|failed`), `attempts`, `max_attempts`, `last_error`, `locked_until`, `result` (jsonb), timestamps. Realtime enabled so the client subscribes instead of polling.
- **`auth_attempt_log`** — classroom-login attempts, keyed on `classroom_id` + `username` **and** a coarse IP bucket, for a real per-IP limit.
- **`ops_events`** — structured event sink: `event_type`, `severity`, `actor_id`, `context` (jsonb), `created_at`. Covers account creation, login attempts, 429s, queue duration, function errors, upload failures, DB errors, duplicate-job prevention, 402s.

Changes to existing objects:
- Drop the three redundant `aura_records` profile indexes, keep `idx_aura_records_profile_id_created_at`.
- New RPCs: `classroom_login_lookup(class_code, username)` (security definer, returns an opaque auth handle — never the synthetic email), `verify_student_pin`, `reset_student_pin`, `claim_ai_job(worker_id, batch)`, `complete_ai_job`.
- Partial index on `ai_evaluation_jobs (status, created_at) WHERE status IN ('queued','processing')`.

---

## 5. Proposed Edge Function changes

**New**
- `provision-students` — replaces/wraps `bulk-create-students`. Accepts CSV-parsed rows or manual entries, chunked and concurrency-limited (8 at a time), creates auth users with `email_confirm: true`, generates the **PIN** and stores only its hash, and returns a **one-time printable roster** (username + PIN) to the caller. Authorizes via `has_role(admin)` **or** teacher-of-classroom.
- `classroom-login` — takes `{ classCode, username, pin }`, enforces attempt limits and lockout server-side, verifies the PIN hash, and mints a session server-side. The browser never sees the synthetic email.
- `reset-student-pin` — teacher-scoped.
- `enqueue-ai-evaluation` — writes an `ai_evaluation_jobs` row keyed on an idempotency key, returns `{ jobId }` immediately.
- `process-ai-evaluation-queue` — pg_cron-driven worker: claims a bounded batch, calls Vertex, writes results, respects `max_attempts`, moves exhausted jobs to `failed` with the submission preserved.

**Modified**
- `_shared/vertexAuth.ts` — add exponential backoff with full jitter, retry on 429/500/502/503/network/timeout, honor `Retry-After`, hard cap on attempts, never retry 4xx other than 429.
- `_shared/cors.ts` — origin allowlist for privileged functions.
- `analyze-aura` — becomes the worker body called by the queue processor; the direct HTTP path stays only for teacher-initiated one-offs.
- `check-student-signin-rate` — add the real IP bucket, and fail **closed** with a friendly retry message rather than fail open.
- `_shared/` gains `ops.ts` (structured logging) and `retry.ts` (shared backoff helper).

---

## 6. Proposed authentication flow

```text
Teacher/admin                          Server                          Student device
-------------                          ------                          --------------
CSV or manual roster
  -> provision-students  ------------> create auth user (confirmed)
                                       generate 6-digit PIN
                                       store PIN hash only
  <- one-time roster PDF/CSV --------- username + PIN (shown once)

                                                        class code + username + PIN
                                       classroom-login <-------------------------
                                       rate check (username + IP)
                                       lockout check
                                       verify PIN hash
                                       mint session
                                       --------------------------> session tokens only
```

Session policy: keep `persistSession`, add a school-configurable idle timeout stored in `school_settings`; default long-lived so a classroom iPad does not re-auth daily, with an explicit "end of day sign-out" control for shared devices.

---

## 7. Rollback plan

- Every migration ships with a paired down-migration; new tables are additive only, so rollback is `DROP`.
- New Edge Functions are additive. `bulk-create-students` and the direct `analyze-aura` path stay deployed and functional through the transition.
- The queue path sits behind a `school_settings` feature flag (`ai_queue_enabled`). Flip it off and clients fall back to the synchronous call with zero deploy.
- Classroom login is a new route; the existing Student-ID login stays live until the pilot confirms the new flow.
- Index drops are reversible with a single `CREATE INDEX`.

---

## 8. Test plan

**Functional**
- Provision 35 students from CSV → verify 35 auth users, 35 credential rows, PINs shown exactly once, zero confirmation emails sent.
- Re-run the same CSV → all rows report `skipped`, no duplicates.
- Classroom login happy path, wrong PIN ×N → lockout, teacher reset → success.
- Confirm no synthetic email or auth UUID appears in any network response to a student device.

**Resilience**
- Force 429/500/503 from a stubbed Vertex endpoint; confirm backoff, jitter, attempt cap, and that the submission survives.
- Kill the worker mid-job; confirm the `locked_until` lease expires and the job is re-claimed exactly once.
- Submit the same idempotency key twice; confirm one job, one score.

**Load (test mode)**
- A `LOAD_TEST_MODE` flag gates a seeded synthetic cohort and bypasses only the IP throttle for allowlisted test keys — never in production.
- Documented routes for the four scenarios:
  - 35 users / 1 IP → `POST /functions/v1/classroom-login`
  - 100 users / 1 IP → same, ramped
  - 300 mixed users → `classroom-login` + `provision-students` + authenticated reads
  - 50 simultaneous AI submissions → `POST /functions/v1/enqueue-ai-evaluation`, then poll/subscribe on `ai_evaluation_jobs`
- Pass criteria: zero lost submissions, p95 queue-to-complete under 60s, zero duplicate scores, zero 5xx surfaced to students.

---

## 9. Switching AI providers (OpenAI or your own Google key)

You are **already on your own Google key** — Vertex AI via `GOOGLE_VERTEX_AI_KEY`. The Lovable AI connector is not in the reading-evaluation path.

To move to OpenAI (or a different Google key), exactly these change:
- `supabase/functions/_shared/vertexAuth.ts` — the only provider boundary; swap the token-mint + request body here.
- Secrets: `GOOGLE_VERTEX_AI_KEY`, `GOOGLE_VERTEX_REGION` → `OPENAI_API_KEY`.
- Six consumers only need their model-id string updated: `analyze-aura`, `generate-teacher-summary`, `generate-question-ai`, `generate-flashcards`, `generate-practice-exercises`, `extract-text-from-image`.
- Unaffected: everything on the Lovable gateway (`generate-world-backgrounds`, the email stack).

---

## 10. Files that would be modified

**New**
- `supabase/functions/provision-students/index.ts`
- `supabase/functions/classroom-login/index.ts`
- `supabase/functions/reset-student-pin/index.ts`
- `supabase/functions/enqueue-ai-evaluation/index.ts`
- `supabase/functions/process-ai-evaluation-queue/index.ts`
- `supabase/functions/_shared/retry.ts`
- `supabase/functions/_shared/ops.ts`
- `src/pages/ClassroomLogin.tsx`
- `src/components/admin/RosterProvisioning.tsx`
- `src/hooks/useAiEvaluationJob.ts`
- `src/lib/rosterCsv.ts`
- migrations for the four new tables, the RPCs, and the index cleanup

**Modified**
- `supabase/functions/_shared/vertexAuth.ts`
- `supabase/functions/_shared/cors.ts`
- `supabase/functions/analyze-aura/index.ts`
- `supabase/functions/bulk-create-students/index.ts`
- `supabase/functions/check-student-signin-rate/index.ts`
- `src/components/admin/BulkStudentImport.tsx`
- `src/pages/Auth.tsx`
- `src/lib/studentIdAuth.ts`
- `src/lib/studentIdRateLimit.ts`
- `src/contexts/AuthContext.tsx`
- `src/pages/student/AuraPractice.tsx`
- `src/components/aura/AuraReadingGrader.tsx`
- `src/components/assignments/StudentQuestionView.tsx`
- `src/components/student/sections/AuraReadingSection.tsx`
- `src/lib/preKAuraSubmit.ts`
- `src/App.tsx` (new route)

---

## 11. Suggested build order

1. Retry/backoff + structured logging (`retry.ts`, `ops.ts`, `vertexAuth.ts`) — smallest change, biggest immediate stability win.
2. Durable AI job queue behind the feature flag.
3. Provisioning rewrite with real PIN issuance.
4. Classroom login flow + server-side rate limiting.
5. Index cleanup, CORS tightening, load-test mode.

Steps 1 and 2 alone remove the "a rate limit lost a child's score" failure mode.
