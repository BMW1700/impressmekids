# Brutally Honest Launch Audit + App Store Path

## Verdict

The web app is launch-ready. The iOS app is **not submittable today** — not because of code, but because the Apple-side steps (developer account, Xcode archive, screenshots, App Store Connect listing) haven't been done yet. Everything the repo can control is in place.

### What is actually done (verified in the repo)
- `ios/` project exists (`App.xcodeproj`, `App.xcworkspace`, `Podfile`).
- `capacitor.config.ts` has **no `server.url`** block — required for review (Guideline 2.5.2).
- `Info.plist` already contains microphone, speech recognition, camera usage strings, `ITSAppUsesNonExemptEncryption=false`, education category, and iPad orientations.
- `PrivacyInfo.xcprivacy` privacy manifest is filled in (email, name, user ID, audio, usage, crash).
- `AppDelegate.swift` configures `AVAudioSession` playAndRecord for mic + game audio coexistence.
- Native speech recognition plugin installed; account deletion route `/account/delete` + `self-delete-account` function exist (Guideline 5.1.1(v)).
- Build scripts ready: `npm run build:ios` (build → cap sync → plist patch).
- Security scan: **zero critical findings** — nothing blocks publishing.

### What is genuinely not perfect (honest list)
1. **Publish button stuck on "Updating"** — the deploy either didn't get scheduled or the UI state is stale. Fix: trigger a fresh publish from the agent side.
2. **Security warnings, not blockers** (safe for pilot, must fix before public consumer launch):
   - `rpg_player_ranks` and `duel_stats`: players can write their own rank/win-loss directly (leaderboard forgery).
   - Game economy tables (`campaign_progress`, `player_inventory`, `castle_upgrades`, `daily_login_rewards`, `weekly_challenges`): client can grant itself gold/XP.
   - `public_profiles` has a blanket `USING (true)` read policy — any signed-in user can see every student's display name and grade.
   - `district_managers` DELETE policy is unscoped.
   None of these expose passwords or private records; all are integrity/scoping issues.
3. **Apple-side assets missing**: branded 1024×1024 icon + splash, and the 6 required screenshot sets.
4. **Reviewer demo accounts** must be seeded and verified working before submission.

## What I'll do when you approve

1. Publish the latest build (hero autoplay + Benny Bookears copy) and confirm the deploy is scheduled.
2. Optional but recommended in the same pass: close the two `error`-level security findings by moving rank and duel-stat writes into SECURITY DEFINER RPCs, and tighten the `public_profiles` blanket read policy to the existing scoped classmate/teacher/parent policies.

## Your exact App Store steps (from where we are)

**Step 1 — Apple Developer Program.** developer.apple.com/programs → Enroll → $99/yr. Approval: hours to 2 days.

**Step 2 — On your Mac.**
```bash
git pull
npm install
npm run build:ios      # build + cap sync ios + plist patch
npx cap open ios
```

**Step 3 — Xcode signing.** Select the `App` target → Signing & Capabilities → check "Automatically manage signing" → pick your Team. Then `+ Capability` → **Sign in with Apple**.

**Step 4 — Icon + splash.** Put `resources/icon.png` (1024×1024, no transparency) and `resources/splash.png` (2732×2732) in the repo, then `npx @capacitor/assets generate --ios`.

**Step 5 — Device smoke test.** Run on a real iPhone and a real iPad. Verify: Google/Apple sign-in returns to the app, mic prompt appears in Benny level 1, saying the word advances, retry/skip work, videos play, `/account/delete` completes.

**Step 6 — Screenshots.** 6.7" iPhone (1290×2796), 6.5" (1242×2688), 13" iPad (2064×2752). Capture: mode select, student dashboard, AURA practice, RPG battle, teacher analytics, parent dashboard.

**Step 7 — App Store Connect.** New app → bundle id `app.lovable.yubilearn` → paste metadata, privacy nutrition label, and reviewer notes from `docs/app-store-submission.md`. Seed the four reviewer accounts and paste the credentials.

**Step 8 — Archive & submit.** Xcode → Product → Archive → Distribute App → App Store Connect → Upload. In ASC attach the build → Submit for Review. Typical review: 24–48 hours.

## Technical notes
- Do **not** re-add a `server.url` block to `capacitor.config.ts` before archiving — it fails review.
- Push notifications are stubbed; do not declare that capability in App Store Connect.
- Bundle id in `docs/app-store-submission.md` §1 is stale (`app.lovable.8b26...`); the real one is `app.lovable.yubilearn` from `capacitor.config.ts`. I'll correct the doc.
