

## Brutal Honest Status — and the Cost/Throughput Math at 100K Users

### Did everything work perfectly?

**Mostly yes, but with three real gaps.** Here's what I actually verified just now:

| Check | Result |
|---|---|
| New `RESEND_API_KEY` accepted by Resend | ✅ Yes |
| Key type | ✅ Restricted "send-only" (correct best practice — limits blast radius) |
| `nabulearn.com` domain verified on the new account | ✅ Yes — DNS verified Apr 23, 2:19 AM via GoDaddy |
| Real test send `noreply@nabulearn.com` → `Matthew.ross433@gmail.com` | ✅ Accepted with message ID `74985806-3fb1-415c-a12f-13218c18282f` |
| Account owner | `admin@nabulearn.com` (NabuLearn-controlled — no more legacy `meapphq.com` dependency) |

**The 3 real gaps still left:**

1. **`send-test-email/index.ts` still hardcodes `onboarding@resend.dev`** as the `from`. It happened to work because Resend's sandbox is always allowed, but it's misleading — it's not actually proving the production sender works. Should be switched to `noreply@nabulearn.com`.
2. **`request-data-restoration/index.ts` still emails the legacy `admin@meapphq.com` address** for COPPA data restoration requests. If you don't read that inbox anymore, restoration requests vanish into a black hole.
3. **The token bucket in `resendClient.ts` is hardcoded to 2 req/sec** (the old free-tier Resend limit). The new account's actual limit may be 10 req/sec (Pro) — leaving us 5× slower than necessary under burst load.

Nothing is broken. But "perfect" it isn't.

---

### Rate limits — what we're actually constrained by

**Resend's published limits (2026):**
- Free: 100 emails/day, 3,000/month, **2 req/sec**
- **Pro ($20/mo): 50,000 emails/month included, 10 req/sec**
- Scale ($90/mo): 100,000/month, 10 req/sec
- Enterprise: custom (millions/month, higher rps)

Our `resendClient.ts` already handles the 2 req/sec ceiling with a token bucket + 429 retry + exponential backoff + bulk batching (100 messages per batch = 1 token). So under a burst we don't drop emails — we queue them in-memory and trickle them out.

**With bulk batching enabled**, throughput math:
- 1 batch = 100 emails = 1 token = ~500ms
- At 2 req/sec → **~12,000 emails/minute** sustained (already plenty)
- At 10 req/sec (Pro) → **~60,000 emails/minute** sustained

---

### Email volume at 100K monthly active users

What actually triggers an email in this codebase, per user per month (realistic estimates):

| Trigger | Edge function | Per user / month |
|---|---|---|
| Parent consent (COPPA, signup-only, under-13 only) | `send-parent-consent-email` | ~0.05 (one-time, ~5% of monthly cohort signing up) |
| Substitute teacher access codes | `send-substitute-access-email` | ~0.001 (rare) |
| Phoneme reports (teacher-initiated) | `send-phoneme-report` | ~2 (one per child every 2 weeks) |
| Risk alerts (struggling students) | `send-risk-alerts` | ~0.5 (one per at-risk student/wk) |
| Calendar reminders (parents) | `send-calendar-notifications` | ~4 (weekly digest) |
| Safety alerts / drills (rare but bulk) | `send-safety-alert`, `send-drill-notification` | ~0.5 (avg 1 drill/2mo, full school blast) |
| Emergency reports (very rare) | `report-emergency` | ~0.01 |
| **Total per user / month** | | **~7 emails** |

**At 100,000 users/month → ~700,000 emails/month**

Note: Supabase Auth confirmation/password-reset emails do NOT go through this Resend account — they go through Lovable's own auth-email pipeline (or Supabase's default if not configured), so they're free and separate from this budget.

---

### Cost at 100K users

| Plan | Included | Overage | Monthly cost @ 700K emails |
|---|---|---|---|
| Resend Pro | 50K emails | $0.40/1K | $20 + (650 × $0.40) = **$280/mo** |
| Resend Scale | 100K emails | $1.00/1K | $90 + (600 × $1.00) = **$690/mo** ❌ worse |
| **Resend Pro w/ negotiated overage** | 50K | typically drops to $0.10–0.20/1K at this volume | **~$85–150/mo** |
| Resend Enterprise (annual contract) | custom | typically ~$0.05/1K all-in | **~$35–50/mo** |

**Cost per 1,000 emails: $0.40 list / $0.10–0.20 actual at scale / $0.05 enterprise.**
**Cost per user per year: ~$0.034 list, ~$0.012 negotiated, ~$0.006 enterprise.**

Against your **$5–7/student/year** revenue model, email is **0.1–0.5% of revenue.** Negligible.

---

### What I want to do next (3 small fixes, ~5 minutes of work)

1. **Fix `send-test-email`** to use `noreply@nabulearn.com` so future tests prove the real sender works
2. **Fix `request-data-restoration`** to email a NabuLearn-owned address (e.g. `admin@nabulearn.com` or a new `coppa@nabulearn.com`) instead of the legacy `meapphq.com` address
3. **Bump `TOKEN_BUCKET_CAPACITY` to 10** in `resendClient.ts` once you confirm the new account is on Pro (otherwise leave at 2 — the throttle is harmless on free)

After that, the system is genuinely production-ready for the pilot and scales cleanly to 100K+ users on a single Resend Pro plan.

### What I am NOT doing
- Not migrating to Lovable Emails (you explicitly chose Resend)
- Not touching auth emails (separate pipeline, working)
- Not touching the 7 production functions that already correctly use `*@nabulearn.com` senders
- Not changing the bulk-batch logic (already optimal)

