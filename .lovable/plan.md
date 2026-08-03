# Brutally Honest Deep Dive: Keep It or Revert?

## 1. "What AI? Everything should be free!"

The reading/speaking analysis does not run on Lovable AI credits. It runs on
**your own Google Cloud Vertex AI account** (`GOOGLE_VERTEX_AI_KEY`,
`gemini-2.5-flash`), called from the `analyze-aura` function. That has always
been true — this change did not add an AI cost. What it added is a queue in
front of that same call.

So: Lovable credits are not the issue. The AI spend is Google's meter, and the
AI rate limit is Google's per-project quota.

## 2. Does this fix the rate limit problem? Partly — and not the one you care most about.

There are two completely separate rate limits, and they are often confused:

| Limit | What breaks | Did this change fix it? |
| --- | --- | --- |
| Google Vertex AI quota (30 kids submit readings at once) | Readings fail and are lost | **Yes.** Readings are now saved to a queue before the AI is called, and retried with backoff. |
| Supabase auth rate limit (30 kids log in from one school IP) | Logins fail | **No.** Nothing in this change raises that ceiling. Only a support-ticket increase does. |

Your main problem — the whole class logging in from one school IP — is
**not** solved by this work, and cannot be solved by code on our side.

## 3. Did it break anything? One real regression.

Verified against the live database: `ai_evaluation_jobs` has **0 rows** and
`student_credentials` has **0 rows**. Nothing here has ever run in production.

The real problem: there is **no scheduled worker**. Confirmed — no cron entry
calls `process-ai-jobs`. Jobs are only processed while a student's browser sits
on the results screen nudging the worker.

- Older kids on the AURA practice screen: fine, their browser nudges the worker.
- **Pre-K submissions are fire-and-forget.** Their jobs get created and then
  nobody ever picks them up. Pre-K reading data silently stops reaching
  analytics and the ML models.

That is a genuine regression versus the old code, and it is why this cannot be
left half-finished.

Three other places still call the AI directly and bypass the queue entirely
(`AuraReadingGrader`, `StudentQuestionView`, `AuraReadingSection`) — they still
lose a submission on a busy AI service.

## 4. Revert or finish?

**Finish, don't revert.** The remaining work is small and contained, and
reverting throws away the one thing that genuinely protects student work.

## Work to complete

1. **Scheduled worker sweep (fixes the Pre-K regression).** `pg_cron` + `pg_net`
   calling `process-ai-jobs` every minute so jobs drain whether or not any
   browser is open. The worker already claims with `FOR UPDATE SKIP LOCKED`, so
   overlapping runs are safe.
2. **Route the three remaining AI call sites through the queue** so no
   submission path can lose data.
3. **One real end-to-end pass**: import a small roster, sign in one of those
   students at `/class-login`, complete a reading, confirm the job row goes
   queued -> completed and the score lands.
4. **Teacher "Reset PIN" button** on the roster — the backend exists, no UI
   calls it, so a kid who forgets a PIN is stuck.
5. **Link `/class-login` from the sign-in screen** — the page exists but nothing
   points to it.
6. **Send the auth rate-limit support ticket.** This is the actual fix for the
   shared-school-IP login problem, and it is the only fix.

## Technical details

- Cron: `cron.schedule('process-ai-jobs-sweep', '* * * * *', ...)` issuing a
  `net.http_post` to the function URL with the anon key.
- Retry column `next_attempt_at` already exists on `ai_evaluation_jobs` and is
  respected by the worker; confirm `claim_ai_evaluation_jobs` filters on it.
- Files touched: a migration for the cron sweep,
  `src/components/aura/AuraReadingGrader.tsx`,
  `src/components/assignments/StudentQuestionView.tsx`,
  `src/components/student/sections/AuraReadingSection.tsx`, a roster component
  for the PIN reset action, and the sign-in page for the `/class-login` link.
