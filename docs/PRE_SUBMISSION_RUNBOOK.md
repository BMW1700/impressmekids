# NabuLearn — Pre-Submission Runbook (iOS App Store)

This is the **exact ordered checklist** to take NabuLearn from the current
repo state to a submitted App Store build. Every step has a clear owner.
Anything labeled **YOU** requires a Mac with Xcode 15+ and an active
Apple Developer Program membership ($99/yr).

Estimated total time: **6–10 hours of focused work**, spread over 2–5 days
(TestFlight propagation + Apple review queue).

---

## Phase 1 — Seed reviewer demo accounts (one-time, ~5 min)

**Owner: anyone with platform-admin login.**

1. Sign in to the production NabuLearn web app as a platform admin.
2. From the browser devtools console (or use `curl` with your JWT), call:

   ```js
   const { data } = await window.supabase.functions.invoke('seed-demo-accounts');
   console.log(data);
   ```

3. Verify the response shows `status: "created"` or `status: "updated"` for all three:
   - `demo-student@nabulearn.com` / `DemoStudent2026!`
   - `demo-teacher@nabulearn.com` / `DemoTeacher2026!`
   - `demo-parent@nabulearn.com`  / `DemoParent2026!`

4. **Smoke test:** open an incognito window, log in as each demo account, confirm dashboard loads.

**If this step fails, STOP.** Reviewers will reject within 24h.

---

## Phase 2 — Apple Developer Console setup (~30 min)

**Owner: YOU. Requires Apple Developer login.**

### 2.1 Create App ID
- https://developer.apple.com → Certificates, IDs & Profiles → Identifiers → `+`
- Type: **App IDs → App**
- Bundle ID (explicit): `app.lovable.8b261911409a4a0485943e15f3d59496`
- Capabilities (check all that apply):
  - **Sign in with Apple** ✓
  - **Push Notifications** ✓
  - **Associated Domains** ✓ (for universal links)

### 2.2 Sign in with Apple — Services ID
- Identifiers → `+` → **Services IDs**
- Description: `NabuLearn Sign in with Apple`
- Identifier: `app.lovable.nabulearn.signin` (any reverse-DNS string)
- Enable **Sign in with Apple** → Configure:
  - Primary App ID: select the App ID from 2.1
  - Domains: `nabulearn.com`, `sjigkjwkgovculkovcjy.supabase.co`
  - Return URLs: `https://sjigkjwkgovculkovcjy.supabase.co/auth/v1/callback`

### 2.3 APNs key (for push notifications)
- Keys → `+` → name "NabuLearn APNs"
- Enable **Apple Push Notifications service (APNs)**
- Download the `.p8` file (only available once — store securely)
- Note the Key ID + Team ID

### 2.4 Provisioning profile
- Profiles → `+` → **App Store** distribution
- Select the App ID, your distribution certificate, click Generate

---

## Phase 3 — App Store Connect setup (~45 min)

**Owner: YOU.**

### 3.1 Create the app record
- https://appstoreconnect.apple.com → Apps → `+`
- Platform: iOS
- Name: `NabuLearn`
- Primary language: English (U.S.)
- Bundle ID: pick the App ID from 2.1
- SKU: `nabulearn-ios-1`

### 3.2 Fill App Information
- Subtitle: `AI-Powered Literacy for K-12`
- Category — Primary: **Education** | Secondary: **Productivity**
- Age rating: complete the questionnaire (answer "None" to everything → 4+)
- Privacy Policy URL: `https://nabulearn.com/privacy-policy`

### 3.3 Fill App Privacy (CRITICAL)
Use the table in `docs/app-store-submission.md` § 2. Declare:
- Email address — App functionality / account — Linked — No tracking
- Name — App functionality — Linked — No tracking
- User ID — App functionality, analytics — Linked — No tracking
- Audio recordings — App functionality, product personalization — Linked — No tracking
- Coarse usage data — Product personalization, analytics — Linked — No tracking
- Crash data — App functionality — **Not** linked — No tracking
- Performance data — App functionality — **Not** linked — No tracking

### 3.4 Upload screenshots
Required device sizes (PNG, no transparency):
- 6.7" iPhone — 1290×2796
- 6.5" iPhone — 1242×2688
- 13" iPad — 2064×2752

Capture 6 scenes (see `docs/app-store-submission.md` § 8).

### 3.5 Reviewer notes + demo accounts
- Paste the full block from `docs/app-store-submission.md` § 7 verbatim into App Review Information.

---

## Phase 4 — Build the iOS project locally (~1 hour)

**Owner: YOU. On a Mac.**

```bash
git pull
npm install
npm run build              # produces dist/
npx cap add ios            # creates the ios/ folder (one-time)
npx cap sync ios
```

### 4.1 Edit `ios/App/App/Info.plist`
Add the four keys from `docs/ios-info-plist-additions.md`:
- `NSMicrophoneUsageDescription`
- `NSSpeechRecognitionUsageDescription`
- `NSCameraUsageDescription`
- `ITSAppUsesNonExemptEncryption` = `false`
- `LSApplicationCategoryType` = `public.app-category.education`

Verify:
```bash
plutil -p ios/App/App/Info.plist | grep -E 'Usage|Category|Encryption'
```

### 4.2 Add branded icon + splash
```bash
npm install -g @capacitor/assets
npx capacitor-assets generate --ios
```
This reads `resources/icon.png` (1024×1024) and `resources/splash.png` (already in the repo) and writes the full iOS asset catalog.

### 4.3 Open Xcode
```bash
npx cap open ios
```

In Xcode:
- Signing & Capabilities → select your Team
- `+ Capability` → **Sign in with Apple**
- `+ Capability` → **Push Notifications**
- `+ Capability` → **Background Modes** → check "Remote notifications"

### 4.4 Upload APNs key to Lovable Cloud
- Open the Lovable Cloud backend → Edge Function Secrets
- Add `APNS_KEY_P8` = contents of the `.p8` from Phase 2.3
- Add `APNS_KEY_ID` and `APNS_TEAM_ID`

---

## Phase 5 — TestFlight cycle (~3 days minimum)

**Owner: YOU.**

1. In Xcode: Product → Archive
2. Distribute App → App Store Connect → Upload
3. Wait 10–30 min for App Store Connect to finish processing
4. In App Store Connect → TestFlight → add internal testers (yourself + 4 others)
5. **Test on real devices for at least 3 days:**
   - Sign in with email/password
   - Sign in with Apple — verify round-trip works
   - Sign in with Google
   - Grant mic permission — verify the custom copy renders
   - Run an AURA reading session end-to-end
   - Receive at least one push notification
   - Open the gear icon → Delete my account → confirm full deletion
   - Re-create the demo account via `seed-demo-accounts` after the test

**If any step fails, fix and re-archive. Do NOT submit until all 7 work.**

---

## Phase 6 — Submit for review (~10 min, then 24–48h wait)

**Owner: YOU.**

1. App Store Connect → your app → `+ Version` → pick the TestFlight build
2. Verify all metadata + screenshots are present (red dots = missing)
3. Export Compliance: select "No, my app does not use such algorithms" (matches `ITSAppUsesNonExemptEncryption = false`)
4. Content Rights: "No, it does not contain, show, or access third-party content"
5. Advertising Identifier: **No** (we do not use IDFA)
6. Click **Add for Review** → **Submit to App Review**

Review typically takes 24–48h. If rejected, the rejection message will cite a specific guideline. Address it, bump the version build number, re-upload, re-submit.

---

## Common rejection reasons + pre-emptive fixes

| Guideline | Risk | Mitigated by |
|---|---|---|
| 2.5.2 — JavaScript code download | HIGH if `server.url` leaks | `capacitor.config.ts` clean ✅ |
| 4.0 — Design / incomplete | MEDIUM if default icon | `resources/icon.png` shipped ✅ |
| 4.8 — Sign in with Apple | HIGH if missing | Wired ✅ |
| 5.1.1(v) — Account deletion | HIGH if missing | `/account/delete` ≤3 taps ✅ |
| 5.1.4 — Kids data | MEDIUM if Sentry leaks PII | Sentry stripped of email/name ✅ |
| 2.1 — Crashes on launch | HIGH if untested | TestFlight cycle (Phase 5) |
| 4.3 — Spam / duplicate | LOW | Original product |

---

## When something goes wrong

- **Sign in with Apple fails with "invalid_client"**: domain/return URL in Phase 2.2 wasn't propagated. Wait 1h and retry. Apple's edge takes time.
- **Push notification fails silently**: APNs key wasn't uploaded to Lovable Cloud, or the Background Modes capability wasn't checked.
- **Reviewer says "could not find delete account flow"**: clearly state in Phase 3.5 reviewer notes "Settings (gear icon, top-right) → Delete my account".
- **App rejected for "minimum functionality"**: usually means the icon looks default or the app crashes on first launch. Re-record screen-capture of a successful AURA session and resubmit.

---

## Final go/no-go gate

You are ready to submit when ALL of these are true:

- [ ] Phase 1 demo accounts log in successfully on production
- [ ] Phase 2 Apple Developer steps complete + Services ID propagated
- [ ] Phase 3 App Store Connect record has no red dots
- [ ] Phase 4 archive builds in Xcode with zero signing warnings
- [ ] Phase 5 TestFlight: all 7 smoke tests pass on a real iPhone AND a real iPad
- [ ] You have a clear-headed 30-minute window to handle a rejection ping

If any box is empty, do NOT submit. The cost of a rejection is 24–48h of lost calendar time per cycle.
