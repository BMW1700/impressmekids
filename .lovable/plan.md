

## Yes — Plan Makes It Match Christina's Mandate Exactly

Christina said: **username must be non-email (no PPI)**. That's exactly what the Student ID flow does and what this plan locks in. Below is what's actually true today and the small gap to close so it's airtight.

### What's already in place (verified in code)

1. **Username = 8-digit Student ID, not email.** `src/lib/studentIdAuth.ts` defines `isStudentId = /^\d{8}$/` and `toSyntheticEmail` maps it to `<id>@student.nabulearn.internal`. That synthetic email is **never shown to the student, never sent to, never collected from them** — it's a Supabase Auth internal key only.
2. **Student ID accounts collect zero PPI.** No real email, no last name required, no birthday in the Student ID branch. The 8-digit ID is school-issued, not personally identifying on its own.
3. **Auto-confirm trigger** (`auto_confirm_synthetic_student`) skips email verification for `@student.nabulearn.internal` addresses — no email is ever actually sent anywhere.
4. **Rate-limit table** stores only the 8-digit ID and a hash bucket — no names, no real emails.

### The 3 small fixes to make Christina's rule airtight

1. **Strip IP collection from edge functions** — `check-student-signin-rate` and `record-student-signin-success` currently read `x-forwarded-for`. IPs aren't student PPI per se, but removing them eliminates the "missing salt" finding and any argument that we collect network identifiers tied to kids. They'll pass a fixed `'none'` bucket to the existing per-Student-ID rate limit (which is the only one that matters for an 8-digit space).
2. **Remove `localStorage` device ID** in `src/lib/studentIdRateLimit.ts` — no persistent client-side identifier on a student device. Cleaner COPPA hygiene.
3. **Audit signup forms** in `src/pages/Auth.tsx` and `src/pages/game/GameAuth.tsx` to confirm the Student ID branch shows **no email field, no last name, no DOB** — only: 8-digit ID + password + optional class code. Add a visible line: "Student accounts use a school-issued ID, not an email. We don't collect personal information."

### What stays (and why it's still compliant)

- Synthetic internal email `<id>@student.nabulearn.internal` — required by Supabase Auth as a primary key; never user-facing, never sent, not PPI under FERPA/COPPA (it's a system identifier, like a row UUID).
- Email signup path for **teachers, parents, admins** — unchanged. Adults can use email; that's standard and compliant.
- Optional class join code — links to teacher roster, not student PPI.

### Files touched (small, surgical)

- `supabase/functions/check-student-signin-rate/index.ts` — drop IP read/hash
- `supabase/functions/record-student-signin-success/index.ts` — drop IP read/hash
- `src/lib/studentIdRateLimit.ts` — drop device-id + localStorage
- `src/pages/Auth.tsx` — confirm Student ID branch is PPI-free, add disclaimer line
- `src/pages/game/GameAuth.tsx` — same audit + disclaimer

### What this does NOT do
- No new secrets, no new RPCs, no schema changes, no new auth flows.
- Doesn't touch teacher/parent email signup.
- After this lands, the answer to Christina is a clean **yes**: students authenticate by school-issued ID only, with zero PPI collected, zero IP logged, zero device fingerprint stored.

