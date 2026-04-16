

## Brutally Honest Status

**Did everything work perfectly? No. It compiles, but there are real gaps.**

### What actually works ✅
1. **Landing page branding** — `Header.tsx` tagline + `ResearchSection.tsx` badges are correctly updated. Clean.
2. **Build error** — fixed (missing `}` on the ternary close at line 1314).
3. **Auth.tsx Student ID flow logic** — sign in, sign up, district skip, verification skip, profile `student_id` write, navigate to dashboard. All wired correctly.
4. **GameAuth.tsx** — dual login wired with the same pattern.
5. **`districtDetection.ts`** — synthetic domain bypass is correct.
6. **Memory** — both new memory files written.

### What is broken or sloppy ⚠️

1. **Auto-confirm email is now enabled globally.** I flipped `auto_confirm` ON so synthetic student emails could log in immediately. **Side effect: every new teacher and parent signup now also skips email verification.** That breaks the existing security model where teachers/parents must verify their email before pending-verification review. This is a real regression, not a nitpick.

2. **No DB constraint preventing Student ID collisions.** Two students can pick the same 8-digit ID and the second signup will fail with a confusing "user already exists" Supabase Auth error instead of a clear "that ID is taken" message. The `profiles.student_id` column has no UNIQUE constraint enforced at signup time.

3. **Student ID signup has no district association.** Student ID accounts are created with no `district_id` and no `school_id`. That means teachers in a school will not see those students in their roster — Student ID kids exist in a void. For a real pilot you need either a teacher-issued invite code or a district picker even on the Student ID tab.

4. **Password rules are weak for K-5.** Min length 6, no display of "ask your teacher if you forget." Realistic K-5 students will lock themselves out and there's no teacher-side reset UI yet.

5. **No rate limiting on Student ID guesses.** Anyone can brute-force 8-digit IDs against `signInWithPassword` since there's no captcha or lockout. With ~100M ID space + a known password pattern, this is exploitable.

### What needs to happen next (proposed fixes)

| Priority | Fix | File(s) |
|---|---|---|
| 🔴 P0 | Revert global auto-confirm; instead handle Student ID confirmation via a SECURITY DEFINER edge function that auto-confirms only synthetic emails | Supabase config + new edge fn |
| 🔴 P0 | Add UNIQUE index on `profiles.student_id` and pre-check before signup with friendly error | migration + Auth.tsx |
| 🟡 P1 | Require teacher-issued **class join code** OR district pick on Student ID signup so kids land in the right roster | Auth.tsx + migration for `class_codes` table |
| 🟡 P1 | Teacher-side "Reset Student Password" button in classroom roster | new component + edge fn |
| 🟢 P2 | Add captcha or per-IP rate limit on Student ID sign-in | edge fn or Supabase auth hook |

### Recommendation
Do not ship Student ID login to a real school until P0 items are fixed. The auto-confirm regression alone could let an attacker create a fake teacher account that skips verification. Everything else (landing page, dual UI, memory) is solid and can ship today.

If you approve, next default-mode loop fixes the two P0 items first, then we go back to multiplayer PvP.

