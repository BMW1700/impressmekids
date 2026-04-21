

## Verification Report (Track A — Already Shipped) ✅

| Check | Result |
|---|---|
| Domain `notify.nabulearn.com` registered | ✅ Verifying DNS (does not block scaffolding) |
| All 6 branded auth templates exist | ✅ signup, magic-link, recovery, invite, email-change, reauthentication |
| `auth-email-hook` uses queue pattern | ✅ Line 253: `supabase.rpc('enqueue_email', ...)` |
| `process-email-queue` cron job active | ✅ Every 5 seconds, `active=true` |
| NabuLearn purple/yellow + logo applied | ✅ All 6 templates |
| Old `@lovable.dev/email-js` direct-send pattern | ✅ Not present — fully on queue |

**Track A is bulletproof.** Once DNS propagates, Supabase's 2-emails/hour cap is gone. Throughput: ~120/min default, scalable to ~600/min with one SQL update.

---

## Track B — Bulletproof Resend Transactional Wrapper

### What gets built

**1. New shared client: `supabase/functions/_shared/resendClient.ts`**

A single utility every Resend-using function calls. Handles:
- **Token-bucket throttle** capping outbound at **2 req/sec** (Resend's hard limit)
- **429 retry with `Retry-After` honor** — up to 3 attempts, exponential backoff (500ms → 1s → 2s)
- **Bulk batching** — when called with multiple recipients, uses Resend's `/emails/batch` endpoint (100 per call, counts as 1 request)
- **5xx retry** with backoff
- **Failure logging** to new `email_failures` table (admin-only RLS) so failed sends never vanish silently
- **Public surface:** `sendEmail({ from, to, subject, html, ... })` and `sendBulkEmails({ from, recipients[], subject, html })`

**2. New table: `email_failures` (migration)**

```
id uuid PK
recipient_email text
subject text
from_address text
error_code text          -- "429", "422", "network", etc.
error_message text
attempted_at timestamptz
retry_count int
function_name text       -- which edge function tried to send
payload_summary jsonb    -- truncated body for debugging (no PII beyond email)
```

RLS: only `admin` and `district_admin` can SELECT. Service role inserts.

**3. Refactor 9 edge functions to use the shared client**

| Function | Current sender | After |
|---|---|---|
| `send-safety-alert` | `safety@nabulearn.com` | unchanged, wrapped |
| `report-emergency` | `emergencies@nabulearn.com` | unchanged, wrapped |
| `send-risk-alerts` | `alerts@nabulearn.com` | unchanged, wrapped |
| `send-phoneme-report` | `onboarding@resend.dev` ⚠️ | **`reports@nabulearn.com`**, wrapped |
| `send-drill-notification` | `safety@nabulearn.com` | unchanged, wrapped |
| `request-data-restoration` | `onboarding@resend.dev` ⚠️ | **`backups@nabulearn.com`**, wrapped |
| `send-substitute-access-email` | `noreply@nabulearn.com` | unchanged, wrapped |
| `send-parent-consent-email` | `noreply@nabulearn.com` | unchanged, wrapped |
| `send-calendar-notifications` | `notifications@nabulearn.com` | unchanged, wrapped |

The two `onboarding@resend.dev` test senders get swapped to verified `nabulearn.com` addresses as the bonus cleanup you previously flagged.

**4. Bulk-send safety in `send-safety-alert` + `send-drill-notification`**

These two are the actual blast-radius risk (district-wide alerts to 500+ parents). Both currently fire `Promise.all(allUsers.map(... fetch resend))` with no throttle. Refactor to call `sendBulkEmails(recipients[])` once, which internally batches at 100/call and stays under 2 req/sec.

**5. Deploy all 9 refactored functions in one batch.**

### What does NOT change

- AURA, LexiQuest, multiplayer, RPG, auth flow, RLS, COPPA — untouched
- Resend stays the provider — we're wrapping it, not replacing it
- Track A auth email infra — untouched
- The 9 function APIs (callers don't change) — internal refactor only

### Files touched

**New:**
- `supabase/functions/_shared/resendClient.ts`
- `supabase/migrations/<timestamp>_email_failures.sql`

**Modified (9):**
- All 9 `send-*` / `report-*` / `request-*` edge functions

### Final state after Track B

| Email type | Path | Cap | Safety |
|---|---|---|---|
| Auth (signup, reset, etc.) | nabulearn.com → pgmq queue → Lovable Email API | ~120/min default, ~600/min max | TTL, retry, DLQ ✅ |
| Transactional (alerts, reports) | Resend via shared client | 2 req/sec throttled, batched 100/call | Retry, 429 honor, failure log ✅ |

**Bulk safety alert to 500 parents** = 5 batch calls = 2.5 seconds, zero lost emails.

### Estimated time: ~25 min, fully autonomous.

### Confirmation I'll give when done

(a) `email_failures` table created with admin-only RLS  
(b) `resendClient.ts` shipped with throttle + retry + batch  
(c) All 9 functions refactored and deployed  
(d) 2 test-sender addresses swapped to verified nabulearn.com  
(e) Bulk paths (safety-alert, drill-notification) using batch endpoint  
(f) Sample log line you can grep for to verify in production

