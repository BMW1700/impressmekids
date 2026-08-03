# Finish the Classroom-Scale Rollout

## Plain-English answer to what was just built

Three things changed:

1. **Readings are saved before the AI sees them.** Previously, when a student
   finished reading, the app called the AI service directly. If that service
   was busy (rate limited), the reading was gone. Now the reading is written to
   a database queue first, then a worker picks it up and scores it. A busy AI
   service delays a score; it can no longer destroy a child's work.

2. **Kid-friendly login.** Students can sign in at `/class-login` with a class
   code, a username, and a 6-digit PIN instead of an 8-digit ID or an email.

3. **Sign-in cards.** After a teacher bulk-imports a roster, they get a
   one-time CSV of every student's username and PIN to print and hand out.

## Does this fix the rate limit problem?

Partly. It fixes the **AI scoring** rate limit: 30 kids reading at once now
queue up instead of failing, and the AI calls retry with exponential backoff.

It does **not** yet fix the **auth/login** rate limit — the "whole class on one
school IP" problem. That is a limit on Lovable/Supabase's auth endpoint and
still needs the support-ticket increase.

It also is not finished or tested. The gaps below are what remain.

## What still needs to be done

### 1. Background worker sweep (critical)

Today, queued jobs are only processed while a student's browser is sitting on
the results screen nudging the worker. Pre-K submissions are fire-and-forget,
so those jobs can sit in the queue forever if no browser nudges them.

Add a scheduled sweep that runs the worker every minute regardless of who is
online, plus a retry rule so a job that failed transiently is picked up again
with a growing delay instead of being abandoned.

### 2. Teacher PIN reset in the UI

The `reset-student-pin` backend exists but no teacher-facing button calls it.
Add a "Reset PIN" action on the class roster that shows the new PIN once.

### 3. Route students to the new login

`/class-login` exists but nothing links to it. Add a clear "I'm a student in a
class" entry point on the sign-in screen so kids and teachers can find it.

### 4. End-to-end test on real data

Nothing in this stack has been exercised yet: zero rows exist in either new
table. Run one full pass — import a small roster, sign in as one of those
students, complete a reading, confirm the job completes and the score lands.

### 5. Auth rate-limit ticket

Send the support request for a higher auth rate limit for shared school IPs,
since no code change on our side can raise that ceiling.

## Technical details

- Sweep: `pg_cron` + `pg_net` calling `process-ai-jobs` on a one-minute
  schedule; worker already claims with `FOR UPDATE SKIP LOCKED`, so concurrent
  runs are safe.
- Retry: add a `next_attempt_at` column to `ai_evaluation_jobs`; failed jobs
  under the attempt cap get rescheduled with exponential backoff, and
  `claim_ai_evaluation_jobs` filters on `next_attempt_at <= now()`.
- Files touched: `supabase/functions/process-ai-jobs/index.ts`,
  a migration for the retry column and the RPC, a roster component for the PIN
  reset action, and the sign-in page for the `/class-login` link.
- Deploy the four new edge functions (`queue-ai-evaluation`, `process-ai-jobs`,
  `classroom-login`, `reset-student-pin`) as part of this pass.
