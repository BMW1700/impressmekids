# YubiLearn — App Store Launch Checklist

Follow these steps in order. Anything marked **[MANUAL]** must be done on a Mac
with Xcode + your Apple Developer account; the Lovable agent cannot do it.

---

## 0. Pre-flight (already done in code)

- [x] `@capacitor-community/speech-recognition` installed
- [x] `speechRecognitionManager.ts` routes to native `SFSpeechRecognizer` on iOS
      (emits final result on stop, auto-restarts on `listeningState=stopped`)
- [x] `capacitor.config.ts`: `server` block removed, `limitsNavigationsToAppBoundDomains: false`
- [x] Deep-link handler in `capacitorBootstrap.ts` for OAuth returns
- [x] Sign in with Apple wired in `src/pages/Auth.tsx` (both sign-in + sign-up tabs)
- [x] Account deletion route at `/account/delete` (Apple 5.1.1(v) requirement)

---

## 1. **[MANUAL]** Add the iOS project

```bash
# On your Mac, after `git pull`:
npm install
npx cap add ios
npm run build
npx cap sync ios
```

## 2. **[MANUAL]** Paste Info.plist keys

Open `ios/App/App/Info.plist` and paste the four keys from
[`docs/ios-info-plist-additions.md`](./ios-info-plist-additions.md):

- `NSMicrophoneUsageDescription`
- `NSSpeechRecognitionUsageDescription`
- `NSCameraUsageDescription`
- `LSApplicationCategoryType` = `public.app-category.education`
- `ITSAppUsesNonExemptEncryption` = `false`

Verify:
```bash
plutil -p ios/App/App/Info.plist | grep -E 'Usage|Category|Encryption'
```

## 3. **[MANUAL]** Enable Sign in with Apple capability

Xcode → open `ios/App/App.xcworkspace` → select `App` target →
**Signing & Capabilities** → `+ Capability` → **Sign in with Apple**.

## 4. **[MANUAL]** Generate branded icon + splash

Place `resources/icon.png` (1024×1024) and `resources/splash.png` (2732×2732)
with your YubiLearn branding, then:
```bash
npx @capacitor/assets generate --ios
```

## 5. **[MANUAL]** Configure Apple provider in Lovable Cloud

Cloud → Users → Authentication Settings → Sign In Methods → Apple.
Either use **Managed Apple Auth** (fastest) or paste Team ID / Key ID / Services
ID / .p8 for BYO. Redirect URL is the Supabase callback shown in the dialog.

## 6. **[MANUAL]** Seed reviewer demo accounts

Apple reviewers need working credentials for every gated surface. Create these
manually in your production DB or via superadmin UI:

| Role       | Email                            | Password         | Notes                              |
| ---------- | -------------------------------- | ---------------- | ---------------------------------- |
| Student    | `reviewer.student@yubilearn.com` | `AppleReview!25` | Grade 2, enrolled in demo class    |
| Teacher    | `reviewer.teacher@yubilearn.com` | `AppleReview!25` | Owns "Reviewer Demo" classroom     |
| Parent     | `reviewer.parent@yubilearn.com`  | `AppleReview!25` | Linked to the student above        |
| Admin      | `reviewer.admin@yubilearn.com`   | `AppleReview!25` | School admin for "Reviewer School" |

Paste all four into App Store Connect → App Review Information.

## 7. **[MANUAL]** Physical device smoke test

Run on a real iPhone AND iPad:
```bash
npx cap run ios --target=<device-udid>
```

Verify:
- [ ] Sign in with Google succeeds (returns to app)
- [ ] Sign in with Apple succeeds
- [ ] Sign in with Clever succeeds
- [ ] **Sir Bookears world 1, level 1**: mic prompt appears, saying the word advances
- [ ] **Sir Bookears retry flow**: miss on purpose → tap Retry → say word → advances
- [ ] **Sir Bookears skip flow**: miss twice → Skip button appears → tap advances
- [ ] Level completion registers on world map (star + progress)
- [ ] Videos play smoothly (no black frames, no MOV errors in Xcode console)
- [ ] Account deletion route reachable + completes
- [ ] No crashes in Xcode console

## 8. **[MANUAL]** App Store Connect metadata

Use content from [`docs/app-store-submission.md`](./app-store-submission.md):
- App Privacy label (§2)
- Description, keywords, screenshots (§3-4)
- Reviewer notes with the demo credentials from step 6 (§7)

Ensure **NOT** listed: push notifications, background audio, HealthKit.

## 9. **[MANUAL]** Archive + submit

Xcode → Product → **Archive** → Distribute → App Store Connect → Upload.
In App Store Connect: attach the build → Submit for Review.

**Expected review time:** 24–48 hours.

---

## Known non-blockers (safe to ship)

- Push notifications are stubbed (`usePushNotifications.ts` returns `isSupported: false`) — don't list the capability
- `.mov` asset JSON pointers exist but runtime code only reads `.mp4` variants
- R2 signed URLs live 7 days; re-signed on each hook mount

## If native speech misbehaves on device

Most likely fix: increase the `listeningState=stopped` restart delay in
`speechRecognitionManager.ts` from 120ms to 250ms and add a hard timeout of
6 seconds per utterance in `RPGWordReader.tsx`.
