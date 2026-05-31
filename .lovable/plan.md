# Brutally Honest App Store Readiness Audit

## TL;DR
**Code is ~90% ready. You are NOT ready to submit today.** Every remaining blocker is *outside* the React/Supabase codebase — it lives in Xcode, in App Store Connect, and in unshipped marketing assets. Don't let anyone tell you "just hit submit" — you would get rejected in <24h on at least 3 separate guidelines.

---

## ✅ What's actually done (verified in the repo)

| Area | Status | Evidence |
|---|---|---|
| `capacitor.config.ts` clean (no `server.url`) | DONE | `webDir: 'dist'`, ATS-safe |
| Self-service account deletion ≤3 taps | DONE | `/account/delete` route + SettingsMenu link + `self-delete-account` edge fn |
| Sign in with Apple wired | DONE | Lovable Cloud managed OAuth, button on signin + signup |
| Info.plist required-keys documented | DONE | `docs/ios-info-plist-additions.md` |
| Submission docs (nutrition label, reviewer notes, screenshots) | DONE | `docs/app-store-submission.md` |
| Privacy Policy covers COPPA + audio | DONE | `src/pages/PrivacyPolicy.tsx` |
| No third-party ad SDKs | DONE | Only Sentry (declarable as Crash/Performance) |
| RPG + Castle Swarm gameplay | SHIPPABLE | Closed in earlier Phase A/B |

---

## 🔴 Hard blockers — will get rejected if you submit without these

### 1. Native iOS project doesn't exist yet
- `ios/` folder is missing. You have never run `npx cap add ios`.
- Until it exists, none of the Info.plist keys, Sign in with Apple entitlement, or icon assets can be installed.
- **Owner: you, on a Mac with Xcode 15+.**

### 2. App icon + splash are still default Capacitor purple
- `resources/icon.png` and `resources/splash.png` don't exist.
- Default-looking icon is a documented Guideline 4.0 rejection ("Design — Minimum Functionality / incomplete appearance").
- Need: 1024×1024 branded icon (no alpha, no rounded corners — Apple masks), 2732×2732 splash.

### 3. Demo accounts in reviewer notes don't exist in the DB
- `docs/app-store-submission.md` promises `demo-student@nabulearn.com` etc. — these are placeholder strings, no rows in `auth.users`.
- Reviewers WILL try them and reject within hours when login fails.

### 4. App Privacy nutrition label not filled in App Store Connect
- Doc exists; the actual form in App Store Connect is empty until you fill it. Sentry presence means you must declare **Crash Data** and **Performance Data** as collected-but-not-linked.

### 5. Screenshots don't exist
- Zero screenshots in the repo. Required sizes: 6.7" iPhone, 6.5" iPhone, 13" iPad. Apple rejects submissions with missing or low-quality screenshots.

---

## 🟡 Soft blockers — high rejection risk, fixable in 1–2h of code

### 6. Sentry data collection isn't disclosed to the user pre-init
- We init Sentry before any consent prompt. For Kids-adjacent apps and COPPA users, Apple reviewers increasingly flag this.
- Fix: gate `Sentry.init` behind a "send anonymous crash reports" toggle defaulted ON for adults / OFF for under-13 accounts, OR scrub user_id from Sentry context for under-13.

### 7. Microphone prompt copy isn't user-tested on a real device
- The string in `NSMicrophoneUsageDescription` is good, but you've never actually seen it render in iOS. Apple sometimes rejects for vague mic copy. Verify on TestFlight before final submit.

### 8. Sign in with Apple — Apple Developer console domain config
- The Lovable-managed flow generates a Supabase callback URL. You still need to register `nabulearn.com` + the Supabase callback URL in Apple Developer Console → Services ID → Sign in with Apple → Configure, or first-tap will 404.

### 9. Push notifications declared in plugins but no APNs key uploaded
- `@capacitor/push-notifications` is installed and `PushNotifications` is in `capacitor.config.ts`. If you ship with push code but no APNs key in Apple Developer Console + Supabase, first push will silently fail and reviewers who notice will flag it.

### 10. Sign in with Clever button still rendered
- Reviewer testing without a Clever account will tap it and hit a CSRF state error. Either hide on iOS native build or make it gracefully no-op with explanatory toast.

---

## 🟢 Nice-to-have polish (not blockers, but recommended)

- Add a visible "Parents" link on the landing page (Kids Category alignment, even though we're NOT in Kids Category).
- Add a "What's new" / version notes string before each TestFlight build.
- Add a TestFlight beta cycle of ≥5 real users for ≥3 days before production submission. Skipping this is the single biggest predictor of rejection.
- Run `npx cap doctor` after `cap add ios` to catch missing platform pieces.

---

## Brutally honest verdict

**Earliest realistic submission date: 5–7 days from today**, assuming a Mac is available.

Why not today:
- Items 1, 2, 3, 5 are *physical artifacts* (Xcode project, icon files, DB rows, PNGs). No amount of code shipping fixes them.
- Items 6–10 are 1-day of code work but they touch native behavior, so you need a real device to verify.

Anyone who tells you "we can ship tomorrow" is either lying or hasn't been through App Review. The codebase is genuinely ready; the *submission package* is not.

---

## Proposed Phase D (what I'd do in build mode, in priority order)

1. **Seed demo accounts** via a one-shot edge function or migration so reviewer credentials actually work.
2. **Wrap Sentry init** in a consent gate + scrub PII for under-13 sessions.
3. **iOS-aware feature flags** — hide Clever button on Capacitor native to remove a known failure path.
4. **Generate branded `resources/icon.png` + `resources/splash.png`** (via imagegen) so they're ready for `npx capacitor-assets generate` the moment you have a Mac.
5. **Write `docs/PRE_SUBMISSION_RUNBOOK.md`** — exact ordered checklist of every Xcode click + App Store Connect field + Apple Developer Console step, with screenshots.

What I CANNOT do for you, ever:
- Run Xcode
- Upload an APNs key
- Fill out the App Privacy form
- Capture screenshots on a real iPhone
- Pay the $99 Apple Developer fee

**Approve Phase D and I'll execute items 1–5 in one pass. Items requiring a Mac are yours.**
