# Rate Limit Status — Brutally Honest Audit

## Short answer

The classroom-login rate-limit fix **is in the codebase and is the right fix**, but it is
**unverified under real load** and there are two gaps that can still produce 429s in a
classroom. You do **not** need to email support tonight. Whether you email in the morning
should depend on the 30-client test below, not on a guess.

## What is actually fixed (verified in code)

- `supabase/functions/classroom-login/index.ts` now generates the magic-link token **and
  redeems it server-side** with `verifyOtp`, returning `access_token` + `refresh_token`.
- `src/lib/classroomLogin.ts` consumes that session via `setSession()` and only falls back
  to a browser `verifyOtp` if the server did not return a session.
- Retries use exponential backoff **with jitter**, and a student lockout (also a 429) is
  explicitly non-retryable, so a locked child does not spam the endpoint.
- Failure telemetry logs stage, status, and latency with no names, PINs, or tokens.

Net effect: in the classroom path, the school's public IP makes **one** call per student to
our edge function and **zero** calls to hosted Auth.

## What is NOT fixed — the honest gaps

1. **`classroom-login` is missing from `supabase/config.toml`.** Every other function
   declares `verify_jwt`. This one does not, so it runs on the platform default. It works
   today only because the client sends the anon key as a bearer token. That is fragile and
   should be declared explicitly.
2. **No teacher PIN-reset UI.** `supabase/functions/reset-student-pin/index.ts` exists but
   nothing in `src/` calls it. Five wrong PINs locks a child out for 15 minutes with no way
   for the teacher to clear it. In a live demo that reads as "the app is broken."
3. **Self-service signup is still per-IP limited.** `src/pages/Auth.tsx` and
   `src/pages/game/GameAuth.tsx` call `supabase.auth.signUp()` from the browser. Thirty
   people creating accounts at once on one Wi-Fi will still hit the hosted signup throttle.
   The classroom fix does not cover this path — bulk roster provisioning does, and that path
   is fine.
4. **Session refresh still leaves the school network.** Once signed in, every iPad refreshes
   its token directly against hosted Auth. That endpoint is far more permissive than the
   verify endpoint, so it is a low risk, but it is not zero and it is untested at 30 clients.
5. **The fix has never been load-tested.** Recent edge logs for `classroom-login` show only a
   shutdown event — no real login traffic. Right now the claim "the rate limit is fixed" is a
   code-reading conclusion, not a measured one.

## Do we email Lovable support in the morning?

Not first. Sequence it:

1. Run the 30-client test (below).
2. If it passes: no email needed. The problem was ours and it is fixed.
3. If it fails: email support **with** the timestamps, endpoint name, and HTTP statuses from
   the test. That gets a real answer; a vague "we hit rate limits" does not.

## Work to do before the test

1. Declare `classroom-login` (and confirm `reset-student-pin`) in `supabase/config.toml`
   with `verify_jwt = false`.
2. Build the teacher PIN-reset control on the classroom roster screen, wired to the existing
   `reset-student-pin` function: reset PIN, clear lockout, show the new PIN once.
3. Add a small "signing in" throttle guard on the consumer signup screens so a burst of
   self-registrations backs off with jitter instead of erroring.
4. Optional but cheap: surface Auth-stage telemetry (stage, status, ms) in the edge logs for
   the login path so the test produces evidence instead of impressions.

## The 30-client test

- One test classroom, 30 disposable students created through bulk import.
- 30 concurrent logins from a single egress IP against the published app.
- Three rounds: all at once, spread over 10 seconds, then log out and repeat.
- Pass = 100% success, zero 429s, zero crossed sessions, every child lands on their own
  dashboard.
- Record every non-200 with its timestamp and endpoint. That log is the support email if one
  is needed.

## Files this touches

- `supabase/config.toml`
- teacher classroom roster component (PIN reset control)
- `src/pages/Auth.tsx`, `src/pages/game/GameAuth.tsx` (signup backoff)
- `supabase/functions/classroom-login/index.ts` (telemetry only)

No database schema changes. Every item is additive and revertible from History.
