

## The Real Situation (NabuLearn, not FlyFit)

### What's actually configured

- **App custom domain:** `nabulearn.com` ✅
- **Auth email domain configured in Lovable Cloud:** ❌ none for nabulearn.com — the only one in your workspace is `notify.flyfitfashion.com` from your other project, which is irrelevant here
- **Resend API key:** ✅ present (`RESEND_API_KEY`)
- **Existing Resend usage:** 9 edge functions sending directly via raw `fetch` or the Resend SDK — `send-safety-alert`, `report-emergency`, `send-risk-alerts`, `send-phoneme-report`, `send-drill-notification`, `request-data-restoration`, `send-substitute-access-email`, `send-parent-consent-email`, `send-calendar-notifications`
- **Auth emails (signup confirm, password reset, magic link, etc.):** still going through **Supabase's default sender** → this is the 2-emails-per-hour throttle that bit you on the other project

### The two distinct rate-limit problems

**Problem 1 — Auth emails (the pilot blocker you're worried about)**
Supabase free tier auth sender = **~2-3 emails/hour, hard cap**. The moment a school imports 30 students at once and they each trigger a verification email, signups silently fail. This is exactly what hit you before.

**Problem 2 — Resend transactional emails (lower risk, but real)**
Resend caps at **2 requests/sec, 3000/day on free, 100k/day on Pro**. Your safety alerts and phoneme reports go through Resend directly with no queue, no retry, no batching. A district-wide safety alert blast to 500 parents would hit 429s within the first second and silently lose emails.

---

## The Fix — Two Independent Tracks

### Track A — Kill the auth email rate limit (the urgent one)

Route auth emails off Supabase's default sender entirely by wiring up a custom auth-email-hook on `nabulearn.com`. Once active, auth emails go through your own verified domain — Supabase's 2/hour cap no longer applies.

Steps (autonomous, in order, ~20 min):

1. **Set up sender domain on nabulearn.com.** Open the email setup dialog so you can add `notify.nabulearn.com` (or another subdomain). DNS verification can run in the background — it does not block the rest of the steps.
2. **Set up email queue infrastructure** (idempotent — pgmq queues, retry/backoff, dead-letter, cron job that drains every 5 sec, ~120 emails/min default, scales to 600+/min with a single SQL update).
3. **Scaffold all 6 auth email templates** (signup, magic link, password recovery, invite, email change, reauthentication) — uses the queue-based pattern, not direct send.
4. **Apply NabuLearn branding** to all 6 templates:
   - Primary purple `hsl(270, 70%, 55%)` for buttons
   - Yellow accent `hsl(48, 100%, 60%)` for highlights
   - 16px (1rem) border radius
   - White body background (`#ffffff`)
   - NabuLearn logo from `/public/favicon.png` uploaded to email-assets bucket
   - "AI-Powered Literacy" tone, no edtech jargon
   - System font stack
5. **Deploy auth-email-hook** edge function.
6. **Verify the hook uses the queue pattern** (`enqueue_email` RPC, not `@lovable.dev/email-js`) — re-scaffold with overwrite if needed.
7. **Confirm the `process-email-queue` pg_cron job is active** (every 5 seconds).
8. **Surface a button to monitor DNS verification.**

### Track B — Bulletproof your existing Resend transactional emails

Build one shared utility — `supabase/functions/_shared/resendClient.ts` — that the 9 existing functions use. Handles:
- **Token-bucket throttle** capping outbound at 2 req/sec (Resend's limit)
- **429 retry with `Retry-After` honor**, up to 3 attempts with exponential backoff
- **Bulk batching** — calls Resend's `/emails/batch` endpoint (100 recipients per call) when there are multiple recipients
- **Failure logging** to a new `email_failures` table (admins-only RLS) so failed sends don't vanish silently
- **Bonus:** swap the 2 functions still using `onboarding@resend.dev` test sender to your verified `alerts@nabulearn.com` / `noreply@nabulearn.com`

Refactor the 9 functions to use the shared client (~5 min each).

---

## What does NOT change

- AURA, LexiQuest, multiplayer, RPG — untouched
- Auth flow, RLS, role assignment, COPPA flow — untouched
- Resend stays as your transactional provider — we're not switching, just wrapping it for safety
- Lovable Cloud auth = your auth-email-hook on `nabulearn.com` (separate path from Resend)

---

## Final state after both tracks

| Email type | Path | Throughput |
|---|---|---|
| Auth (signup, reset, magic link, invite, etc.) | nabulearn.com → Lovable queue → email API | ~120/min default, scalable to 600+/min, retry-safe |
| Transactional (safety alerts, phoneme reports, parent emails) | Resend via shared client | 2 req/sec throttled, batched, retry-safe, logged |

**The 2-emails-per-hour Supabase auth cap will no longer apply to NabuLearn.** Bulk student onboarding (30, 100, 500 at once) will work cleanly.

---

## Recommended order

1. **Approve this plan**
2. I ship **Track A (auth emails)** first — this is the actual pilot blocker. ~20 min, fully autonomous, you only need to choose the subdomain and confirm DNS in the setup dialog.
3. Then **Track B (Resend wrapper)** — ~30 min, no user input needed.
4. Then back to **PvP turn-switching verification** (the open thread from before).

