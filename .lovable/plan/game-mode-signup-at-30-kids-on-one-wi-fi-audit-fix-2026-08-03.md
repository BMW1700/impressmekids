# Game-Mode Signup at 30 Kids on One Wi-Fi — Audit + Fix

## What I actually checked

- `src/pages/game/GameAuth.tsx` and `src/pages/Auth.tsx` — the real entry portals.
- Auth logs for HTTP 429: **zero** so far (nobody has load-tested it yet — no evidence either way).
- `classroom-login` edge logs: empty. `student_credentials`: 0 rows. The roster path is built but unused.

## The honest answer: yes, there is a rate limit, and 30 kids in one room will hit it

Hosted Auth throttles **per public IP**, and a classroom is one public IP. Two separate ceilings apply to the game portal:

**1. Sign-up + sign-in endpoint: ~30 requests per 5 minutes per IP.**
This is the one that bites. Worse, our Student-ID signup makes **two** calls per child:

```text
handle SignUp (Student ID mode)
  -> supabase.auth.signUp()            <- call 1 (hosted Auth, school IP)
  -> supabase.auth.signInWithPassword()<- call 2 (hosted Auth, school IP)
```

30 kids x 2 = 60 hosted-Auth calls in a few minutes from one IP. That blows straight past the ceiling. Roughly the back half of the class gets "Too many signups at once" and stalls. The jittered retry in `authBurstRetry.ts` softens the spike but cannot create headroom that doesn't exist.

**2. Auth email sending: a project-wide hourly cap.**
Email-mode signup sends a confirmation email per child. Student-ID mode does NOT (synthetic email, no `emailRedirectTo`, auto-confirm trigger) — that part is already correct. So: never run a pilot class on email signup.

**What is already safe:** `/class-login` (class code + username + PIN) makes exactly one call to our own edge function and zero hosted-Auth calls from the school IP. That path is immune. It's just not the path the game portal uses.

## The fix: move game-portal auth behind our own edge function

Same pattern that already works for `classroom-login` — the school network talks to our function, our function talks to hosted Auth. The classroom's IP stops being the throttled identity.

1. **New edge function `player-auth`** (`verify_jwt = false`), two actions:
   - `signup`: validate input, `admin.createUser` with auto-confirm, apply `full_name` / `role` / `student_id`, redeem an optional class join code, then mint a session server-side and return `access_token` + `refresh_token`.
   - `login`: perform the password check server-side and return the same session shape.
   Both keep the existing Student-ID uniqueness check and the per-student sign-in rate gate (`check_student_id_signin_rate`) so brute force is still blocked.

2. **Rewire the portals.** `GameAuth.tsx` and `Auth.tsx` call `player-auth` and apply the result with `supabase.auth.setSession()`. Keep `withAuthBurstRetry` around it. Keep a fallback to the current direct `signUp`/`signInWithPassword` if the function returns no session, so nothing breaks mid-deploy.

3. **Kill the double call.** Even on the fallback path, stop calling `signInWithPassword()` right after `signUp()` in Student-ID mode — auto-confirmed signups already return a session. That alone halves the burst.

4. **Raise the auth email hourly cap** to the maximum for email-mode signups (consumer parents, not classrooms).

5. **Point pilots at the right door.** Add a visible "My teacher gave me a class code" link from the game portal to `/class-login`, and make roster provisioning the documented pilot flow. A pre-provisioned class generates zero signups on the day.

## Then prove it

A script fires 30 concurrent signups and 30 concurrent logins from one IP against the deployed functions, records every status + latency, and reports whether any 429 appears and whether any request fell back to the direct hosted-Auth path. Test accounts are deleted afterwards. Pass = 30/30, zero 429s. If it fails, the log becomes the support ticket.

## Remaining honest caveat

Routing auth through edge functions moves the load off the school IP onto our function's egress. That is how `classroom-login` already works and it is the standard mitigation, but the only proof is the 30-client test above. There is also a per-IP token-refresh limit (far more permissive, ~150 per 5 min) that still applies to signed-in iPads; low risk, but the test will surface it.

## Files this touches

- New: `supabase/functions/player-auth/index.ts`
- `supabase/config.toml` (declare the new function)
- `src/pages/game/GameAuth.tsx`, `src/pages/Auth.tsx`
- `src/lib/authBurstRetry.ts` (reuse, no behavior change)

No schema changes. Test accounts are created and deleted by the test only.
