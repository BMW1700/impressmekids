

## Brutally Honest Final Status — Class Join Codes + Rate Limiting Round

**Did it work? Yes — and I just verified it against the live database, not vibes.**

### Verified against live DB ✅

1. **`redeem_classroom_join_code` RPC is LIVE** — `SECURITY DEFINER`, `search_path = public`, auth-checked (`auth.uid() <> p_student_id` rejected), normalizes code to upper-case, uses `ON CONFLICT DO NOTHING` so re-redeems are idempotent. Correct shape.
2. **`check_student_id_signin_rate` RPC is LIVE** — validates 8-digit format, enforces 10/IP-hash and 5/Student-ID per 5min, pre-records as failed (correct fail-closed pattern). Solid.
3. **`record_student_id_signin_success` RPC is LIVE** — flips the most recent failed attempt to `succeeded=true`. Works.
4. **`cleanup_old_signin_attempts` RPC is LIVE** — purges >1 day old. Good housekeeping; just needs a cron to actually run it.
5. **`auto_confirm_synthetic_student` trigger still LIVE** from prior round — domain-scoped, no regression.
6. **`confirm-student-account` edge function deleted** — `config.toml` no longer references it. Clean removal.
7. **`cleanup-orphan-student` retained** as backup. Correct.

### Real holes still present ⚠️

1. **🟡 `cleanup_old_signin_attempts` is never called.** The function exists but there's no `pg_cron` job or edge schedule wired to it. The `student_id_signin_attempts` table will grow unbounded. Low impact short-term, real impact at scale.
2. **🟡 Device-id rate limit is trivially bypassable.** `studentIdRateLimit.ts` derives the "ip_hash" from `localStorage` device id — clearing storage or opening incognito resets it. The per-Student-ID limit (5/5min) still holds, but the per-device limit is theatrical against a determined attacker. Acceptable for casual abuse, not for real brute-force defense. Real per-IP throttling would need an edge function reading `x-forwarded-for`.
3. **🟢 Class join code is optional with no validation feedback before signup.** A typo'd code silently fails to enroll the student — they end up signed in but in no classroom, with only a toast warning. K-5 kids will miss that toast. Should pre-validate the code via a `peek_classroom_join_code` RPC before submitting signup.
4. **🟢 `student_id_signin_attempts` RLS not verified by me this round.** Need to confirm it's locked to RPC-only access (no direct SELECT/INSERT).

### Honest verdict

**The auth + rostering system is now genuinely pilot-ready.** Students can self-roster via teacher join codes, brute-force is meaningfully slowed (not stopped), and the synthetic-email + DB-trigger combo is clean. You can ship to a friendly pilot district today.

For a real district contract, the device-id bypass and the missing pre-validation toast are the two things to close before signing.

### Recommended next loop (small, fast)

| Priority | Fix | Where |
|---|---|---|
| 🟡 P1 | Add `peek_classroom_join_code` RPC + pre-validate code in signup form before `signUp()` call | new RPC + `Auth.tsx` / `GameAuth.tsx` |
| 🟡 P1 | Verify `student_id_signin_attempts` RLS locks out direct client access | linter + manual check |
| 🟢 P2 | Schedule `cleanup_old_signin_attempts` via `pg_cron` daily | new migration |
| 🟢 P2 | Move per-IP rate limit to an edge function reading `x-forwarded-for` (real IP) | new edge fn |

If you approve, next default loop ships those 4 items in one pass, then we finally go back to multiplayer PvP.

