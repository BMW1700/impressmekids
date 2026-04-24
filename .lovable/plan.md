
## Recommendation right now

Use a **hybrid fix immediately**:
- **Lovable Emails for onboarding/auth emails**
- **Keep Resend temporarily for the existing specialized school emails until each one is verified or migrated**

That is the brutally honest best move for your current need: **bulk onboarding a whole school without getting blocked by Resend Free**.

## Brutally honest status right now

### What is proven working
- `send-test-email` works to a real Gmail inbox from `noreply@nabulearn.com`
- `nabulearn.com` works on Resend
- `notify.nabulearn.com` is also already verified for Lovable Emails

### What is not “perfect”
1. **Resend is on the Free plan**, but `_shared/resendClient.ts` is currently coded for **10 req/sec**, not 2. That is wrong for the actual account.
2. **Bulk onboarding is not actually ready**:
   - `bulk-create-students` hard-stops at **100 students per request**
   - it creates users **sequentially**
   - it **does not send any onboarding email at all**
   - the UI text saying students will receive email instructions is false today
3. Only the test email is live-proven. The other Resend functions share the same client, but they are not all individually proven.

## Exact limits today

### Resend Free
- **2 requests/sec**
- **100 emails/day**
- **3,000 emails/month**

### Your current code
- `sendEmail(...)`: safe ceiling should be **2 emails/sec**
- `sendBulkEmails(...)`: can batch up to **100 recipients per API call**, so burst math looks high, but **the real blocker is still 100 total emails/day on Free**
- `bulk-create-students`: **100 users max per request**, not hundreds
- current import loop is **not “all at once”**; it is one user at a time inside the function

## Exact answer to “how many users can sign on at one time?”

The only exact code-enforced number I can prove right now is:

- **100 users per bulk import submission**
- and even those 100 are **created sequentially**, not instantly
- and they are **not fully onboarded**, because no real password-setup/invite message is sent

So the honest answer is: **right now you do not have a true whole-school bulk onboarding system**. You have a partial account-creation tool with a 100-row cap.

## Why I recommend Lovable for onboarding right now

Because your urgent problem is **mass onboarding**, and Resend Free is the wrong tool for that:
- 100/day is a hard blocker
- even if Resend works technically, Free is too small for a school launch
- Lovable already has a verified sender subdomain in this project
- Lovable’s queue-based email system is a better fit for onboarding bursts than keeping school onboarding tied to a Free-tier third-party account

## What I will implement

### Phase 1 — make the current system honest and safe
1. **Fix Resend Free-tier configuration**
   - change the token bucket back to **2 req/sec**
2. **Fix the stale `admin@meapphq.com` log string**
3. **Fix the misleading bulk import UI copy**
   - remove the false promise that students already receive email instructions

### Phase 2 — build real bulk onboarding
4. **Replace the current one-shot 100-row import with chunked bulk onboarding**
   - automatically split CSV imports into safe chunks
   - process hundreds of rows in sequence with progress reporting
   - keep per-row success/failure results
   - make retries possible without duplicating already-created users
5. **Add a real onboarding path after account creation**
   - for users with email: send proper setup/reset instructions through Lovable Emails
   - for student accounts where email is not the right model: support the existing Student ID flow instead of forcing email-based onboarding
6. **Make bulk onboarding idempotent**
   - prevent duplicate sends
   - prevent duplicate account creation when a chunk is retried

### Phase 3 — switch the urgent onboarding traffic to Lovable
7. **Scaffold the built-in email pipeline already available on `notify.nabulearn.com`**
   - app email sender
   - branded auth email hook if needed
   - queue-backed delivery
8. **Use that pipeline for onboarding-related emails**
   - password setup / invite / reset style onboarding
   - not the current Resend Free path

### Phase 4 — keep or migrate the existing Resend functions deliberately
9. **Leave the existing Resend school-operation emails in place short-term**
   - phoneme reports
   - safety alerts
   - drill notifications
   - substitute access
   - restoration requests
10. After onboarding is stable, choose one of two clean end states:
   - **Option A: keep Resend only for those specialty emails**
   - **Option B: migrate them to Lovable too and remove Resend completely**

## What this gets you

After implementation:
- you can onboard **hundreds of users in one admin workflow**
- you are no longer blocked by **Resend Free’s 100/day ceiling** for onboarding
- bulk onboarding becomes a **real system**, not just account creation with missing follow-through
- the biggest student cohort can use **Student ID onboarding** where that is the better school workflow
- adult accounts and email-based accounts get a proper queued email setup flow

## Success criteria

I will consider this done only when all of these are true:
1. A CSV with **hundreds of users** can be processed in chunks without manual babysitting
2. Every imported row gets a clear outcome: created, skipped, or failed
3. Email-based users receive a real onboarding/setup path
4. Student-ID-based users can sign in without depending on mass email sends
5. Resend is no longer the gating factor for bulk school onboarding
6. The project no longer has misleading onboarding copy or mismatched rate-limit code

## Final recommendation

**Do not bet whole-school onboarding on Resend Free.**
The brutally honest best move is:
- **switch onboarding/auth traffic to Lovable now**
- **keep Resend only as a temporary side system until we decide whether to fully migrate or upgrade it later**

That gives you the fastest path to onboarding a school of hundreds without hitting the wrong bottleneck.
