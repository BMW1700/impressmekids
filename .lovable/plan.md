## What that "Set Up School Access" page actually is

You're right — we didn't rebuild School Mode. That page (`/school/setup`) is the **one-time gate** for anyone entering the hidden School Mode flow. Its only job is: "pick your role + district" → then hand you off to the correct dashboard:

- teacher → `/teacher/dashboard`
- student → `/student/dashboard`
- parent → `/parent/dashboard`
- admin → `/admin/dashboard`
- district_admin → `/district/dashboard`

If you already have a role + district set on your profile, it auto-redirects and you never see it again. So it's not a "second home page" — it's a router/onboarding step for the school pilot pipeline. All the real School Mode stuff (teacher dashboards, admin dashboards, gradebook, safety, etc.) still lives behind it, untouched from before we hid it.

**Recommendation:** leave that page alone (it's necessary infrastructure for pilots), but stop treating it like a landing page. Teacher dashboards are 100% still there — no need to "bring them back"; they're just gated by role.

---

## The real problem: the Challenge Meter is buried

Looking at pic 2 (RPG dashboard) I can see the `L3` chip we added in the header — good. But on pic 3 (Pre-K Mode / Benny's Village) there's **no Challenge Meter chip at all**, and on both pages tapping it currently routes to `/parent/challenge-settings` which is a parent-only screen. That's wrong for a kid using the app, and it's invisible on Pre-K.

I'll fix that so the meter lives on the pages you actually use.

### Plan

1. **Add the `L{level}` chip to the Pre-K header** (pic 3). Same visual style as the RPG chip, right next to "Benny's Village". Tapping opens the same quick adjust popover as everywhere else — no page navigation.

2. **Convert the header chip into an inline quick-adjust popover** (both RPG and Pre-K). Instead of navigating to `/parent/challenge-settings`, tapping "L3" opens a small popover with:
   - the 1-5 slider
   - live label ("Standard", "Easy", etc.)
   - one-line description of what changes
   - Save button (writes immediately, live via realtime — no refresh)
   - a small "Manage in parent settings →" link for the full page

   This means students, parents, or teachers on the same device can nudge strictness in ~2 seconds from either main page. Full page stays for parents who want the whole story.

3. **Role-aware write behavior** — the popover uses the current signed-in role:
   - parent role → writes `set_by_role='parent'`
   - teacher role → writes `set_by_role='teacher', overridden_by_teacher=true` (matches existing `StudentChallengeOverride` semantics)
   - student → read-only view of current level with a "Ask a grown-up to change this" note (no self-editing, so kids can't crank it to Level 1 to cheese words)

4. **Show the meter on Pre-K Mode summary card too** — under "My Reading Journey" (pic 3), add a small "Challenge: L3 · Standard" row so parents scanning that page see it without hunting for the header chip.

5. **Don't touch School Mode** — teacher dashboards, admin dashboards, and the `/school/setup` gate stay exactly as they are. Nothing to migrate. If you want a link from the main dashboard into a teacher view later ("I'm also a teacher, take me there"), that's a separate small task — flag it and I'll add it, but it's not needed for pilots.

### Files that will change

- `src/components/game/GameHeader.tsx` — swap navigate() for a Popover; hide chip for student role or make read-only.
- `src/components/prek/PreKHeader.tsx` (or wherever the Pre-K top bar lives — I'll locate it in build mode) — add the same chip + popover.
- `src/components/challenge/ChallengeQuickAdjust.tsx` — **new** shared popover component so both headers use one control.
- Pre-K "My Reading Journey" card — add the small "Challenge: L{n}" row.

### Files/behavior that will NOT change

- `/school/setup` and School Mode routing.
- `challenge_settings` table, RLS, realtime hook (`useChallengeSettings`) — all still correct.
- `/parent/challenge-settings` full page — kept as the deep-dive view.
- Reading matcher thresholds and `ChallengeProvider` — already wired at the app root, so any edit from the popover applies live everywhere including Pre-K sessions.

### Brutally honest note

The Challenge Meter is real and wired to the actual speech-matching thresholds — moving the slider does change acceptance in Pre-K, RPG, guided reading, and battle. What was broken was **discoverability**: it was one chip on one page, aimed at a parent-only route. After this change it's a first-class control on both main pages you screenshotted, adjustable in-place, and respecting role.
