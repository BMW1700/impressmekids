

## Plan: Landing Page Credibility Fixes + Dual Student ID Login

### Part 1: Landing Page (immediate, 3 files)

**`src/components/Header.tsx` line 71**
- Change `"The Science of Reading"` to `"AI-Powered Literacy"`

**`src/components/landing/ResearchSection.tsx` lines 77-81**
- Remove `"Simple View of Reading"` badge
- Remove `"Science of Reading Aligned"` badge
- Add `"Adaptive Phoneme Progression"` badge
- Keep: Bloom's Taxonomy, CMU Pronouncing Dictionary, Q-Learning Reinforcement

**Update memory** to record these branding decisions.

---

### Part 2: Dual Login — Student ID Tab

Add a **Student ID** tab alongside the existing **Email** login on both auth pages. This gives schools the FERPA/COPPA-safe option while keeping email login fully functional for teachers, parents, and existing students.

**How it works:**

```text
Sign In screen:
┌─────────────────────────────────────┐
│  [Email]  [Student ID]              │  ← new tab row
├─────────────────────────────────────┤
│  Email tab: existing flow (unchanged)
│  Student ID tab:                    │
│    Student ID: [________] (8 digits)│
│    Password:   [________]           │
│    [Sign In]                        │
└─────────────────────────────────────┘

Sign Up screen:
┌─────────────────────────────────────┐
│  Role selector: Student | Parent | Teacher | Admin
│  IF Student selected:               │
│    [Email]  [Student ID]  ← tab row │
│    Student ID tab:                  │
│      Full Name: [________]          │
│      Student ID: [________]         │
│      Password: [________]           │
│      District: [dropdown]           │
│      [Create Account]               │
└─────────────────────────────────────┘
```

- **Synthetic email**: When a student uses their ID (e.g. `12345678`), the system internally maps it to `12345678@student.nabulearn.internal` for Supabase Auth. Students never see this.
- **Sign-in**: Same mapping — enter ID + password, system constructs the synthetic email and calls `signInWithPassword`.
- **Existing accounts**: Students who already signed up with real email continue using the Email tab. No disruption.
- **Non-student roles**: Parent/Teacher/Admin always use the Email tab (no Student ID option shown).

**Files to modify:**

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Add Student ID sub-tabs on sign-in and sign-up (when role=student). Add `loginMode` state. Synthetic email helper. |
| `src/pages/game/GameAuth.tsx` | Same dual tab for Game Mode login/signup. |
| `src/lib/districtDetection.ts` | Skip domain detection for `@student.nabulearn.internal` synthetic emails. |

**No database migration needed** — `student_id` column already exists on `profiles`. The synthetic email is just a consistent mapping pattern.

**Helper function (shared):**
```typescript
const STUDENT_DOMAIN = 'student.nabulearn.internal';
const isStudentId = (input: string) => /^\d{8}$/.test(input.trim());
const toSyntheticEmail = (studentId: string) => `${studentId}@${STUDENT_DOMAIN}`;
```

**Security notes:**
- `@student.nabulearn.internal` is not a real domain — no email verification is possible (which is correct for K-5 students who shouldn't have email)
- Auto-confirm will need to be enabled for these synthetic emails only, or we handle it via the existing COPPA consent flow
- Password reset for Student ID accounts is handled by teacher/parent (no email-based reset)

