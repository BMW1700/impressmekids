# Run the 30-Client Rate-Limit Test

## Honest status before anything runs

I checked the live backend just now. The test cannot be run yet, and here is why:

- `student_credentials` has **0 rows**. No student has ever been provisioned with a
  username + PIN, so there is nobody to log in as.
- `classroom_login_attempts` has **1 row total, 0 successes**, from 22:32 UTC today.
- `classroom-login` edge logs are empty — the function has never handled real login traffic.

So the honest answer to "is the rate limit fixed": the fix is in the code and it is the
right fix, but **zero real logins have gone through it**. Nobody can claim it is proven
until the test below runs. Running it is a state-changing action (it creates real accounts
and real sessions), which is why it needs your approval first.

## What the test will do

1. **Provision a disposable test class**
   - Create one classroom, e.g. `RATE TEST`, and bulk-import 30 throwaway students through
     the existing `bulk-create-students` function (same path a teacher uses).
   - Capture the 30 username + PIN pairs returned by the import.

2. **Fire 30 concurrent logins from one IP**
   - A script hits the deployed `classroom-login` function 30 times in parallel from a single
     egress IP — the same shape as 30 iPads on one school Wi-Fi.
   - Round A: all 30 at once. Round B: the same 30 spread over 10 seconds. Round C: repeat
     round A after a short pause to check for cumulative throttling.

3. **Record everything**
   - Per request: HTTP status, latency, whether a session came back server-minted
     (the fixed path) or fell back to `token_hash` (the old, IP-exposed path).
   - Then pull `classroom-login` edge logs and count any `link_failed` /
     `server_exchange_failed` entries with status 429.

4. **Verdict**
   - **Pass** = 30/30 succeed, 0 responses with HTTP 429, 0 fallbacks to `token_hash`,
     no crossed sessions. That means the rate-limit problem is fixed and no email to
     support is needed.
   - **Fail** = any 429 or any fallback. You then get the exact timestamps, endpoint, and
     statuses to paste into a support email — which is what actually gets a real answer.

5. **Clean up**
   - Delete the 30 test students and the test classroom so nothing pollutes the pilot data.

## Technical notes

- The script runs from the sandbox with the anon key, calling the deployed function URL
  directly — no local dev server, so it exercises the real production path.
- It never logs PINs, tokens, or emails; only status, stage, and latency.
- Sessions minted during the test are discarded (no `persistSession`).
- Nothing in application code changes. If the test fails, the fix comes in a follow-up.

## What this touches

- Creates and then deletes: 1 test classroom, 30 test students, their credentials.
- Read-only against: `classroom_login_attempts`, `classroom-login` edge logs.
- No schema changes, no changes to existing classes or students.
