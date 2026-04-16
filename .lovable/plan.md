

## Brutally Honest Status — P0 + P1 Round

**Did this round land cleanly? Yes, mostly. One real gap remains, and one P0 from last round still needs verification.**

### What actually shipped ✅

1. **`cleanup-orphan-student` edge function** — Solid. Hard-refuses non-synthetic emails, verifies via `getUserById` before `deleteUser`, registered in `config.toml` with `verify_jwt = false`. Correct shape.
2. **`confirm-student-account` edge function** — Still good from last round. Double-validates synthetic domain on both the request payload AND the DB record before flipping `email_confirm`.
3. **`config.toml`** — Both functions registered with `verify_jwt = false`. Correct, since both are called pre-session during signup.
4. **`Auth.tsx` / `GameAuth.tsx`** — Now catches Postgres `23505` and shows "Student ID already in use" toast. Calls `cleanup-orphan-student` if `confirm-student-account` fails. Good.

### What's still broken or unverified ⚠️

1. **🔴 Global auto-confirm — STILL not verified in code I can read.** The previous summary says I "disabled `auto_confirm_email` via tool call," but `supabase/config.toml` has no `[auth]` block. Cloud auth settings live outside the repo. Until I actually read the live Cloud auth config, I cannot prove teacher/parent email verification is back ON. **This is the same regression risk as last round — must be confirmed before pilot.**

2. **🟡 Race-window orphan still possible.** The flow is: `signUp()` → DB trigger inserts profile → client calls `confirm-student-account`. If the trigger fails (e.g. unique violation on `student_id` from a TOCTOU race), the cleanup path catches it. **But** if `signUp()` succeeds, profile inserts cleanly, then the user closes the tab before `confirm-student-account` runs, you get an unconfirmed orphan that the cleanup function will never be called for. Low frequency, but real for K-5 kids on flaky school WiFi.

3. **🟢 Still no district/school association** for Student ID accounts (deferred P1 from prior rounds — flagging again).

4. **🟢 Still no rate limiting / captcha** on Student ID brute-force (deferred P2).

### Recommended fixes this loop

| Priority | Fix | Where |
|---|---|---|
| 🔴 P0 | Read live Cloud auth config and explicitly assert `auto_confirm_email = false`. If still ON, disable it. | runtime config check |
| 🟡 P1 | Move auto-confirm into a DB trigger on `auth.users` insert that fires for `@student.nabulearn.internal` emails — eliminates the close-tab orphan window | new migration |
| 🟢 P2 (defer) | District/school association on Student ID signup | next round |

### Recommendation

**Do not ship to a real school until P0 #1 is verified.** The auto-confirm setting is the single largest risk — if it's still ON globally, every teacher/parent signup is bypassing email verification. The DB-trigger approach for P1 is a one-migration fix that closes the orphan race permanently. Approve and next default loop verifies auth config first, then ships the trigger, then we go back to multiplayer PvP.

