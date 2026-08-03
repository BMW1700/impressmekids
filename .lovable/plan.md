# Rate Limits + 48-Hour App Store Push

## Brutally honest answer to the main question

**Yes — I can fix most of the rate-limit problem in code. You probably do not
need Lovable support to unblock 30 students on one school Wi-Fi.**

Here is the actual mechanism, verified in `supabase/functions/classroom-login/index.ts`:

1. The browser calls our edge function with class code + username + PIN.
   Our own logic is per-student, not per-IP. This part is already safe.
2. On success the function returns a `token_hash`, and then **the student's
   browser** calls hosted Auth `verifyOtp()` directly.
3. Step 3 is the problem. `verifyOtp` hits the hosted Auth verify endpoint
   **from the school's public IP**. Hosted Auth throttles that endpoint per IP.
   Thirty children tapping "Go" in the same minute all land in the same bucket.
   That is the 429 risk — not our PIN code, not the database.

**The fix is ours to make:** do the token exchange *inside the edge function*,
server-side, and hand the finished session back to the browser. The school's IP
then never touches the hosted Auth verify endpoint at all — one student login
becomes one call to our function, and the Auth traffic originates from the
backend, not from thirty iPads behind one NAT.

That single change removes the only per-IP hosted-Auth call in the classroom
path. Support becomes a nice-to-have confirmation, not a blocker.

What code *cannot* fix: hosted admin-API ceilings if we ever hammer them
(bulk import creating hundreds of accounts in a burst) and any global project
limit Lovable applies. Those we mitigate by pacing bulk import and, only if a
real load test still shows 429s, emailing support with timestamps.

## Phase 1 — Kill the rate-limit risk (code)

1. **Server-side session exchange in `classroom-login`.**
   After the PIN check, the function generates the one-time token and
   immediately redeems it server-side, returning `access_token` +
   `refresh_token`. The client calls `setSession()` instead of `verifyOtp()`.
   No hosted-Auth call ever leaves the school network.
2. **Backward-compatible client** in `src/lib/classroomLogin.ts`: use the
   returned session when present, fall back to the old `verifyOtp` path
   otherwise, so nothing breaks mid-deploy.
3. **Jittered retry on 429.** If the function ever returns a throttle, retry
   with exponential backoff plus random jitter (0–1.5s) so a class does not
   retry in lockstep. Show kids "Almost there…" instead of an error.
4. **Pace bulk import.** `bulk-create-students` creates accounts in small
   batches with a short delay and is idempotent on re-run, so a 30-child roster
   import cannot burst the admin API.
5. **Real 429 telemetry.** Log Auth stage, HTTP status, and latency (no names,
   no PINs, no tokens) so we can prove pass/fail instead of guessing.
6. **Retire the dead `ip_bucket`** in `classroom_login_attempts`. It always
   writes `no-ip-collected` and only creates confusion in audits.

## Phase 2 — Prove it with a 30-client test

- One test classroom, 30 disposable students via bulk import.
- 30 concurrent logins from a single egress IP against the published app.
- Three rounds: all at once, spread over 10 seconds, then logout and repeat.
- Pass = 100% success, zero 429s, zero crossed sessions, all land on the right
  student dashboard.
- Only if this fails do we email Lovable support, and then with exact
  timestamps and endpoint names rather than a vague complaint.

## Phase 3 — App Store blockers (verified state)

Confirmed good: `capacitor.config.ts` has no `server.url` (Guideline 2.5.2),
bundle id `app.lovable.yubilearn`, audio session configured in
`AppDelegate.swift`, mic/speech/camera strings present in `Info.plist`,
Sign in with Apple already wired in `src/pages/Auth.tsx`, and
`/account/delete` exists (Guideline 5.1.1(v)).

Must fix before archiving:

1. **`PrivacyInfo.xcprivacy` is missing.** Apple rejects submissions without a
   privacy manifest. Add it declaring UserDefaults and file-timestamp API usage
   and "no tracking".
2. **Apple sign-in parity on the consumer/game login**, not only the school
   auth screen. Apple requires it wherever Google is offered.
3. **Link account deletion from a visible settings surface** so a reviewer can
   reach it in under three taps.
4. **Fix the duplicate React key** in
   `src/components/landing/AudienceTrifurcation.tsx` (live console warning).
5. **Reproduce and fix the Safari/WebKit `EmptyRanges` media exception** before
   TestFlight — it comes from the video/audio player path, and WKWebView is
   Safari.
6. **Seed reviewer demo accounts** and paste the credentials into App Review
   Information.
7. **Confirm no unused capabilities are declared** (push is stubbed — do not
   claim it).

## Phase 4 — Your exact 48-hour sequence

Day 1 (mostly me, then you):

1. I ship Phase 1 and Phase 3 code fixes.
2. You enroll in the Apple Developer Program if not already ($99, can take a
   few hours to approve — start this first, it is the only thing with a queue).
3. Install Xcode from the Mac App Store, open it once, accept the license.
4. Pull the project to your Mac, then `npm install`, `npm run build:ios`,
   `npm run open:ios`.
5. In Xcode: select your Team, confirm bundle id, set display name `YubiLearn`,
   version `1.0.0`, build `1`, add the Sign in with Apple capability.
6. Generate icon and splash from `resources/` with `@capacitor/assets`.

Day 1 evening:

7. Run on a real iPhone: mic permission, a full Pre-K level, a full RPG battle,
   backgrounding mid-session, login, logout, account deletion.
8. Repeat on a real iPad.
9. Run the 30-client login test.

Day 2:

10. Xcode → Any iOS Device → Product → Archive → Distribute → App Store Connect.
11. In App Store Connect: create the app record, fill App Information, App
    Privacy, age rating, category Education, screenshots (6.7" iPhone, 13" iPad),
    reviewer notes plus demo credentials.
12. Attach the build, answer export compliance ("no"), submit for review.

Realistic expectation: submission inside 48 hours is achievable. **Approval** is
Apple's clock — typically 24–48 hours after submission, and a rejection costs a
full cycle. That is why Phase 3 items 1, 2, 3 and 5 are not optional.

## Files this touches

- `supabase/functions/classroom-login/index.ts`
- `supabase/functions/bulk-create-students/index.ts`
- `src/lib/classroomLogin.ts`
- `src/pages/ClassroomLogin.tsx`
- `ios/App/App/PrivacyInfo.xcprivacy` (new)
- `scripts/patch-ios-plist.js`
- consumer/game auth screen (Apple sign-in parity)
- `src/components/landing/AudienceTrifurcation.tsx`
- the Pre-K/RPG media player path for the `EmptyRanges` fix

## Rollback

Every change is additive and feature-flagged by shape: the client keeps the old
`verifyOtp` fallback, bulk import stays idempotent, and the privacy manifest and
UI fixes are inert if reverted. Any single step can be rolled back from History
without touching the database.
