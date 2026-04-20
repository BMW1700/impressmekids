

## Brutally Honest Assessment — Did Tier 1 Actually Ship?

### What works ✅

1. **Teacher Phonics Ladder Widget** — wired into `ClassroomDetail.tsx` at line 592, inside the `canViewAsTeacher` Students tab. Teachers will see it. Pulls from the `phonics_foundations_progress` table. Has a real class-summary chip row.
2. **Scope & sequence page** — exists at `/scope-and-sequence`, branded, printable, with a "Download One-Pager PDF" button.
3. **Speech-gated mastery, DB persistence, phonics confusion map** — all from prior steps, still solid.

### What's broken / weak 🚨

1. **PDF generator has a real TypeScript bug.** `src/lib/scopeSequencePdf.ts` lines 23, 71 use `doc.setFillColor(...PRIMARY)` and `setTextColor(...PRIMARY)` with spread syntax on a tuple. jsPDF's overload signatures don't accept spread tuples cleanly — TypeScript will complain ("Expected 1-4 arguments, but got 0"), and even if it compiles, this is fragile. Needs `setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2])`. **The Download PDF button likely throws at runtime today.** This is the single biggest issue — the artifact you hand to a superintendent doesn't generate.

2. **Widget might show for non-teacher viewers.** It's inside `canViewAsTeacher`, which is good — but the widget itself doesn't double-check. Acceptable, but worth noting.

3. **Widget data leak risk.** It calls `.in('student_id', studentIds)` directly — depends entirely on RLS to filter. If RLS misfires for any reason, a teacher could see another classroom's progress. Should add an explicit defensive guard, but not blocking.

4. **No "empty state" copy** when a teacher has students but nobody has started World 0. The widget will render rows of empty circles, which looks broken rather than "nobody has started yet."

5. **Mobile (651px viewport)**. Widget has md: breakpoints — at 651px users see the stacked mobile layout, which is correct. ✓

### What's still missing for "absolutely game-changing"

Be honest: **you're at ~90% pilot-ready.** The remaining 10% is:

- Fix the PDF bug (5 min)
- Add the empty-state message (5 min)
- Add a "Phonics Foundations" certificate students/parents can download on completion (parent-engagement win — 30 min)

Diagnostic placement is still skippable for v1. Christina will be impressed without it.

### My brutal recommendation

**Do this in one focused pass, then go to multiplayer:**

**Fix Bundle (the 10%)**
1. Fix `scopeSequencePdf.ts`:
   - Replace all `setFillColor(...PRIMARY)` / `setTextColor(...COLOR)` calls with explicit `setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2])` form
2. Add empty-state messaging to `TeacherPhonicsLadderWidget.tsx`:
   - When `classSummary.started === 0`, show a subtle "Students haven't started yet — share the Phonics Foundations link from the Game Dashboard" callout instead of grids of empty circles
3. Add a printable **"Phonics Foundations Complete" certificate** triggered when a student masters all 6 stages in `PhonicsFoundations.tsx`:
   - New util `src/lib/phonicsCertificatePdf.ts` (jsPDF, single page, branded)
   - New "Download Certificate" button in the existing completion banner

After this bundle, **multiplayer is unambiguously the right next move** — turn switching first.

### Files to touch

- `src/lib/scopeSequencePdf.ts` — fix spread bug (10 call sites)
- `src/components/teacher/TeacherPhonicsLadderWidget.tsx` — empty-state callout
- `src/lib/phonicsCertificatePdf.ts` — new
- `src/pages/game/PhonicsFoundations.tsx` — wire certificate button into completion banner

### TL;DR

The widget shipped. The page shipped. **The PDF button is almost certainly broken at runtime.** Fix that one bug, polish two small UX rough edges, add a parent-magnet certificate, and you're pilot-perfect. Then multiplayer.

Approve and I'll ship the bundle, then pivot straight to PvP turn switching.

