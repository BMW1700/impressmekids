# YubiLearn — App Store Submission Pack

Use this document as the source of truth for the App Store Connect submission.

## 1. App metadata

- **Name:** YubiLearn
- **Subtitle:** AI-Powered Literacy for K-12
- **Primary category:** Education
- **Secondary category:** Productivity
- **Age rating:** 4+ (no objectionable content)
- **Kids Category:** No (we serve mixed K-12 + teachers/parents, and we have
  parent-managed accounts rather than a self-contained kids experience)
- **Bundle ID:** `app.lovable.yubilearn`
- **Encryption (ITSAppUsesNonExemptEncryption):** `false` (HTTPS only, no
  custom crypto)

## 2. App Privacy nutrition label

Declare the following collected data types. All are linked to the user.

| Data type | Used for | Linked? | Tracking? |
|---|---|---|---|
| Email address | App functionality, account | Yes | No |
| Name | App functionality | Yes | No |
| User ID | App functionality, analytics | Yes | No |
| Audio recordings (AURA) | App functionality, product personalization | Yes | No |
| Coarse usage data | Product personalization, analytics | Yes | No |
| Crash data | App functionality | No | No |
| Performance data | App functionality | No | No |

**Tracking across apps:** No. YubiLearn does not include third-party ad SDKs
or cross-app tracking.

## 3. Required iOS permission strings

See `docs/ios-info-plist-additions.md`. The four required keys:

- `NSMicrophoneUsageDescription`
- `NSSpeechRecognitionUsageDescription`
- `NSCameraUsageDescription`
- `ITSAppUsesNonExemptEncryption = false`

## 4. Account deletion (Guideline 5.1.1(v))

In-app, user-initiated deletion is available from the gear icon (Settings
menu) → **Delete my account** → confirmation → final destructive confirm.
This route is **≤3 taps** from any authenticated screen.

- **Route:** `/account/delete`
- **Edge function:** `self-delete-account`
- **Behavior:** cascades deletion across every user-scoped table, then
  removes the `auth.users` row and invalidates the session.

## 5. Sign in with Apple (Guideline 4.8)

Implemented via Lovable Cloud managed Apple OAuth. The "Sign in with
Apple" button appears on both the sign-in and sign-up tabs of `/auth`,
alongside Google and Clever.

## 6. Capacitor build hygiene

`capacitor.config.ts` no longer contains a `server.url` block, so the
archive bundles assets from `dist/` (required for review — Guideline
2.5.2).

For local hot-reload during development on a physical device, see the
commented snippet in `capacitor.config.ts`. Always remove before archiving.

## 7. Reviewer notes (paste into App Store Connect)

```
YubiLearn is a literacy practice app for K-12 students, with separate
experiences for students, parents, teachers, and school admins.

DEMO ACCOUNTS:
- Student: demo-student@yubilearn.com / DemoStudent2026!
- Teacher: demo-teacher@yubilearn.com / DemoTeacher2026!
- Parent:  demo-parent@yubilearn.com  / DemoParent2026!

To test the core literacy experience:
1. Sign in as the student account.
2. Tap "AURA Practice" on the dashboard.
3. Grant the microphone prompt — required for reading evaluation.
4. Read the highlighted words aloud; the app evaluates fluency on-device.

To test account deletion:
1. Sign in.
2. Tap the gear icon (top right) → "Delete my account".
3. Type DELETE and confirm.

Microphone usage: speech is processed on-device for word matching.
Audio is only transmitted to teachers when a parent has explicitly
enabled "AURA Recording Consent" in Parent Settings.

The app complies with COPPA: accounts for children under 13 require
verified parental consent before activation.

No third-party advertising SDKs are included.
```

## 8. Screenshot checklist

Provide screenshots for these sizes (PNG, no transparency):

- **6.7" iPhone (1290×2796)** — required
- **6.5" iPhone (1242×2688)** — required
- **13" iPad (2064×2752)** — required (we support iPad)
- **5.5" iPhone (1242×2208)** — optional but recommended for older devices

Capture these scenes:
1. Mode select / landing
2. Student dashboard
3. AURA reading practice (mid-session)
4. RPG castle defense gameplay
5. Teacher analytics dashboard
6. Parent dashboard

## 9. Pre-submission checklist

- [ ] `capacitor.config.ts` has no `server` block
- [ ] All four Info.plist keys present (`plutil -p ios/App/App/Info.plist`)
- [ ] Sign in with Apple capability enabled in Xcode
- [ ] Branded icon + splash replace defaults (`npx capacitor-assets generate`)
- [ ] Delete account works from a fresh install in ≤3 taps
- [ ] No `console.log` of PII in production bundle
- [ ] Archive builds without warnings
- [ ] App Privacy form filled out in App Store Connect (Section 2 above)
- [ ] Reviewer notes pasted (Section 7)
- [ ] Demo accounts seeded and reachable
