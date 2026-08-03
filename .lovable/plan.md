# Rate Limits at 30 Accounts on One Wi-Fi — Audit + Close the Last Door

## Brutally honest verdict

**The main door is fixed and measured. One side door is not.**

Verified in code this turn:

- **Main portal (`/game/auth`)** — the door 95%+ of real users walk through — signup and login both
  route through the `player-auth` edge function (`src/pages/game/GameAuth.tsx` lines 364, 432).
  The function is declared `verify_jwt = false` in `supabase/config.toml`. The school's IP calls our
  function; the function calls hosted Auth from its own egress. This is the path that was load-tested
  at 30 concurrent signups + 30 logins + 30 repeat logins with zero 429s.
- **School portal login (`/auth`)** — also routed through `player-auth` (line 879). Fine.

Not fixed:

- **School portal signup (`/auth`)** still calls `supabase.auth.signUp()` directly from the browser
  (`src/pages/Auth.tsx` line 628), and for Student-ID mode follows it with a second direct
  `signInWithPassword()` (line 782). That is **two hosted-Auth calls per child from the school's IP**.
  Thirty teachers/students self-registering through this door in one building can still throttle.
  It has jittered backoff today, which softens the failure but does not remove the per-IP calls.
- **Consent verification page** (`src/pages/ConsentVerification.tsx` line 130) also creates accounts
  with a direct browser `signUp()`. Low volume (one parent at a time), but it is the same pattern.

So: I cannot say "1,000% guaranteed perfect" today, because one signup path still hits hosted Auth
from the classroom IP. After the work below, I can — and it will be measured, not asserted.

## What to build

### 1. Extend `player-auth` to cover school-portal roles
Currently the function only accepts `game_player` and `student`. Widen the role whitelist to include
`teacher`, `parent`, and `admin`, and pass through the extra signup metadata the school portal needs
(district id, school id, verification state) so the server-created user is identical to what the
browser call produces today. Keep the existing student-ID uniqueness check and join-code redemption.

### 2. Route `/auth` signup through `player-auth`
Replace the direct `supabase.auth.signUp()` in `src/pages/Auth.tsx` with `playerSignUp()`, keeping
the existing pre-checks (duplicate student ID, duplicate email) and all post-signup branches
(district verification request, pending-verification redirect, class join code, toasts). Delete the
follow-up `signInWithPassword()` for Student-ID mode — the function already returns a session.
Keep `directSignUpFallback` so nothing breaks if the function is unreachable mid-deploy.

### 3. Route consent-page account creation through `player-auth`
Same swap in `src/pages/ConsentVerification.tsx`, preserving the district profile update and
verification-request steps that run after the account exists.

### 4. Re-run the 30-client test against the school door
Thirty concurrent signups through `/auth` from a single IP, then thirty logins, then thirty repeat
logins. Pass = 100% success, zero 429s, profile and role rows created for all thirty. Delete every
test account afterwards. If anything returns a 429, the timestamps and statuses go straight into a
support ticket.

## What stays a known, accepted risk

- **Token refresh** after sign-in goes browser-to-hosted-Auth. That endpoint's ceiling is far higher
  than the signup endpoint and a 30-iPad class does not approach it. Not worth proxying.
- **Password-reset emails** are per-address rate limited by design. Unchanged.
- **Bulk roster import of hundreds** at once uses the admin API sequentially. Low risk, but the only
  scenario where a support ticket would ever be justified.

## Files this touches

- `supabase/functions/player-auth/index.ts` (role whitelist + metadata passthrough)
- `src/pages/Auth.tsx` (signup path)
- `src/pages/ConsentVerification.tsx` (account creation)
- Temporary test script under `/tmp` — nothing added to the repo

No database schema changes.
