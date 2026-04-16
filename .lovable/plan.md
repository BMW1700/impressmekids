

## Brutally Honest Status — P0 Fix Round

**Did the P0 fixes land cleanly? Mostly yes. There are still 2 real holes.**

### What actually shipped ✅

1. **`supabase/config.toml`** — `confirm-student-account` registered with `verify_jwt = false`. Correct: the client calls it right after `signUp()` before a session exists.
2. **Edge function `confirm-student-account`** — Solid. Hard-refuses any email not ending in `@student.nabulearn.internal`, double-checks the DB record before flipping `email_confirm`, uses service role correctly. This is the right shape.
3. **Migration `profiles_student_id_unique_idx`** — Partial unique index on `student_id WHERE student_id IS NOT NULL` is the correct pattern (lets existing NULL rows coexist, blocks dupes going forward).
4. **`Auth.tsx` / `GameAuth.tsx`** — Pre-signup `student_id` availability check + post-signup edge function call + auto sign-in are all wired.

### What is still broken or sloppy ⚠️

1. **🔴 Global auto-confirm was NOT actually reverted in code I can see.** The plan said "revert `auto_confirm_email` to false," but `supabase/config.toml` has no `[auth]` block at all — meaning auto-confirm state is whatever the Cloud UI was last set to. If it was flipped ON in the previous loop via the Cloud config tool, **it is still ON unless explicitly toggled OFF**. I need to verify and explicitly disable it. This is the same teacher/parent verification bypass regression as before — not actually fixed.

2. **🟡 Race condition on Student ID uniqueness.** The pre-signup `select` from `profiles` is a TOCTOU check — two students hitting "Sign Up" within the same second can both pass the check, then one will fail at the DB unique index with a raw Postgres error code `23505`. The UI doesn't catch that specific error and translate it. Result: confusing "duplicate key" message instead of "that ID is taken."

3. **🟡 Orphan auth user on failed profile insert.** If `signUp()` succeeds but the profile insert fails (e.g. unique index trips), the `auth.users` row is created but orphaned. The synthetic email is now permanently taken and that Student ID can never be reused. No cleanup path.

4. **🟢 Still no district/school association for Student ID accounts.** Flagged last round as P1, deliberately deferred — flagging again so it's not forgotten.

### Recommended fixes this loop

| Priority | Fix | File(s) |
|---|---|---|
| 🔴 P0 | Verify and explicitly disable global auto-confirm via Cloud auth config tool | runtime config |
| 🟡 P1 | Catch Postgres `23505` on signup → friendly "Student ID already taken" toast | `Auth.tsx`, `GameAuth.tsx` |
| 🟡 P1 | If profile insert fails after signup, call admin delete on the orphan auth user (new edge fn `cleanup-orphan-student`) | new edge fn + Auth flow |

### Recommendation

The edge function and unique index are good. **The auto-confirm regression is the only real ship-blocker** — until I confirm it's OFF, every new teacher/parent signup is still skipping email verification. Approve and I'll verify the auth setting first, then patch the two P1 items, then we go straight to multiplayer PvP.

