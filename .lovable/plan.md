
# YubiLearn → App Store: The Full Playbook

Here's the whole thing, in order, with realistic time estimates and exactly who does what. Your total hands-on time is **~6–8 hours of focused work**. Total calendar time is **3–7 days** because Apple's approval queues gate a few steps.

**Reality check on "today":** You cannot be *live* on the App Store today. Apple's enrollment approval alone takes 24–48 hours before you can do anything else. What you CAN do today is knock out every step that doesn't require Apple's servers, so the moment your enrollment approves you sprint to submission in one afternoon.

---

## ⏱ Timeline reality

| Phase | Time on your part | Calendar wait |
|---|---|---|
| Enroll in Apple Developer Program | 15 min | **24–48 hrs approval** |
| Seed reviewer accounts + Cloud config | 15 min | none |
| Apple Developer Console setup | 30 min | ~1 hr propagation |
| App Store Connect record | 45 min | none |
| Mac build + Xcode | 1–2 hrs | none |
| Physical device smoke test | 1 hr | none |
| Screenshots (6 on iPhone, 6 on iPad) | 1 hr | none |
| Archive + submit | 15 min | **24–48 hrs Apple review** |

Fastest realistic path: **3 days end-to-end.**

---

## 🧰 Prerequisites you must have before starting

- **A Mac** running macOS Sonoma or newer with Xcode 15+ installed (free from the Mac App Store)
- **$99 USD** for Apple Developer Program membership
- **A real iPhone AND a real iPad** for testing (simulator is not enough — mic behavior differs)
- **A credit card and phone number** for Apple enrollment
- **Your yubilearn.com admin login** (to run the reviewer-account seeder)
- **Two graphics ready:** 1024×1024 app icon PNG, 2732×2732 splash PNG (I can generate both — see the offer at the bottom)

If you don't have a Mac or the devices, stop reading — nothing else matters until you do.

---

## PHASE 1 — TODAY, from any computer (30 min)

### Step 1 — Enroll in Apple Developer Program ⏰ START THIS FIRST

Go to https://developer.apple.com/programs/enroll

- **Individual** ($99/yr): app listed as "Kama [Last Name]". Faster approval (~24h).
- **Organization** ($99/yr): app listed as "YubiLearn Inc." Requires a **D-U-N-S number** which takes ~2 extra days. Better for schools who Google your app and want to see a company.

**My call: Individual first, migrate to Organization later.** Every hour you wait for D-U-N-S is an hour you're not shipping. You can switch later.

Pay. Wait for the approval email. **Do the rest of Phase 1 while you wait.**

---

### Step 2 — Seed reviewer demo accounts

Apple assigns a reviewer who logs in as a real user. If the login fails, they reject you within 24 hours.

1. Open https://yubilearn.com in a browser
2. Sign in as your platform-admin account
3. Open DevTools console (F12 → Console tab)
4. Paste and run:
   ```js
   const { data } = await window.supabase.functions.invoke('seed-demo-accounts');
   console.log(data);
   ```
5. Confirm the response says `status: "created"` or `"updated"` for all three
6. Open an incognito window and log in as each:
   - `demo-student@yubilearn.com` / `DemoStudent2026!`
   - `demo-teacher@yubilearn.com` / `DemoTeacher2026!`
   - `demo-parent@yubilearn.com` / `DemoParent2026!`
7. If any account fails to load its dashboard — **STOP and tell me.**

---

### Step 3 — Enable Managed Apple Auth in Lovable Cloud

Click the button below → Users → Authentication Settings → Sign In Methods → **Apple** → toggle ON → select **Managed Apple Auth** → Save.

`<presentation-actions><presentation-open-backend>View Backend</presentation-open-backend></presentation-actions>`

That's Phase 1. Now wait for Apple's approval email.

---

## PHASE 2 — When Apple approves your enrollment (30 min in Apple's console)

### Step 4 — Create the App ID
1. https://developer.apple.com → Certificates, IDs & Profiles → Identifiers → `+`
2. Select **App IDs → App → Continue**
3. Description: `YubiLearn`
4. Bundle ID → **Explicit**: `app.lovable.8b261911409a4a0485943e15f3d59496` ← exact string, matches `capacitor.config.ts`
5. Capabilities — check these boxes:
   - ✅ **Sign in with Apple**
   - ✅ **Associated Domains**
   - ⬜ Push Notifications — SKIP (you have push stubbed, not shipping it)
6. Continue → Register

### Step 5 — Create Services ID for Sign in with Apple
1. Identifiers → `+` → **Services IDs**
2. Description: `YubiLearn Sign in with Apple`
3. Identifier: `app.lovable.yubilearn.signin`
4. After creation → click into it → enable **Sign in with Apple** → **Configure**
5. Primary App ID: the one from Step 4
6. Domains and Subdomains:
   ```
   yubilearn.com
   sjigkjwkgovculkovcjy.supabase.co
   ```
7. Return URLs:
   ```
   https://sjigkjwkgovculkovcjy.supabase.co/auth/v1/callback
   ```
8. Save. **Wait ~1 hour** for propagation before testing Sign in with Apple.

---

## PHASE 3 — Create the App Store Connect listing (45 min)

### Step 6 — Create the app record
1. https://appstoreconnect.apple.com → Apps → `+` → New App
2. Platform: **iOS**
3. Name: `YubiLearn`
4. Primary language: English (U.S.)
5. Bundle ID: pick the App ID from Step 4
6. SKU: `yubilearn-ios-1`
7. User Access: Full Access

### Step 7 — App Information tab
- Subtitle: `AI-Powered Literacy for K-12`
- Category — Primary: **Education** · Secondary: **Productivity**
- Privacy Policy URL: `https://yubilearn.com/privacy-policy`
- Content Rights: **No, it does not contain, show, or access third-party content**

### Step 8 — Age Rating questionnaire
Answer **None / No** to everything EXCEPT:
- **Cartoon or Fantasy Violence:** *Infrequent/Mild* (Castle Swarm has cartoon combat)
- **Unrestricted Web Access:** No
- **Gambling / Contests:** No
- **User-Generated Content shared publicly:** No (multiplayer is code-gated + classroom-scoped)

Result: **9+** — perfectly fine, covers ages 2 and up (Apple's floor is 4+ regardless).

### Step 9 — App Privacy label (CRITICAL — get this exactly right)
"App Privacy" section → Get Started. Declare EXACTLY these data types (copy verbatim from `docs/app-store-submission.md` §2):

| Data type | Purpose | Linked to user? | Tracking? |
|---|---|---|---|
| Email address | App functionality, account | Yes | No |
| Name | App functionality | Yes | No |
| User ID | App functionality, analytics | Yes | No |
| Audio recordings | App functionality, product personalization | Yes | No |
| Coarse usage data | Product personalization, analytics | Yes | No |
| Crash data | App functionality | No | No |
| Performance data | App functionality | No | No |

**Third-party tracking: No.**

### Step 10 — Version 1.0 info
- Description: pull from `docs/app-store-submission.md` §3 (I can draft a fresh one if you want)
- Keywords: `literacy, reading, phonics, K-12, AI, teacher, parent, education, dyslexia, fluency`
- Support URL: `https://yubilearn.com/support` (create if missing — a `mailto:` also works)
- Marketing URL: `https://yubilearn.com`

### Step 11 — Reviewer notes + demo credentials
"App Review Information" section. Paste the entire block from `docs/app-store-submission.md` §7 verbatim. It already includes the demo credentials from Step 2 and the exact tap-by-tap path to test account deletion.

---

## PHASE 4 — Build the iOS project on your Mac (1–2 hrs)

### Step 12 — Get the project on your Mac
1. In Lovable, click **GitHub** button (top right) → Export/Connect to a repo
2. On your Mac:
   ```bash
   git clone <your-repo-url> yubilearn
   cd yubilearn
   npm install
   ```

### Step 13 — Drop in branded assets
Put these two files in the repo root:
- `resources/icon.png` — 1024×1024, no transparency, no rounded corners, no alpha channel (Apple auto-rounds)
- `resources/splash.png` — 2732×2732, YubiLearn purple background with centered logo

(If you don't have these ready, I can generate both in build mode — see bottom.)

### Step 14 — Build + add iOS
```bash
npm run build          # produces dist/
npx cap add ios        # creates ios/ folder (one-time only)
npx cap sync ios
```

### Step 15 — Paste the required Info.plist keys
Open `ios/App/App/Info.plist` in any text editor. Paste these inside the top-level `<dict>`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>YubiLearn uses the microphone so your child can read aloud during AURA literacy practice. Audio is processed on-device and only sent to your teacher when you enable recording in Parent Settings.</string>

<key>NSSpeechRecognitionUsageDescription</key>
<string>YubiLearn uses speech recognition to check whether words are read correctly during reading practice. Speech is transcribed on-device whenever possible.</string>

<key>NSCameraUsageDescription</key>
<string>YubiLearn uses the camera only when you choose to scan a worksheet or attach a photo to an assignment.</string>

<key>LSApplicationCategoryType</key>
<string>public.app-category.education</string>

<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

Verify:
```bash
plutil -p ios/App/App/Info.plist | grep -E 'Usage|Category|Encryption'
```
Should print all 5.

### Step 16 — Generate the icon + splash asset catalog
```bash
npm install -g @capacitor/assets
npx capacitor-assets generate --ios
```

### Step 17 — Open in Xcode
```bash
npx cap open ios
```

In Xcode:
1. Select the `App` target
2. **Signing & Capabilities** tab → check **Automatically manage signing** → select your Apple Developer Team from the dropdown
3. Click `+ Capability` → **Sign in with Apple** (Xcode writes the entitlement)
4. Bundle Identifier should already read `app.lovable.8b261911409a4a0485943e15f3d59496` — do not change

---

## PHASE 5 — Test on real devices (1 hr)

### Step 18 — Run on your iPhone
1. Plug iPhone into Mac via USB
2. Trust the computer on the phone
3. In Xcode, select your iPhone as the target device (top bar)
4. Press ▶️ (or `Cmd+R`)
5. On the phone: Settings → General → VPN & Device Management → trust your developer certificate
6. Launch the app

**Verify all 8 items:**
- [ ] Sign in with Apple → completes, returns to app, dashboard loads
- [ ] Sign in with Google → completes, returns to app
- [ ] Sign in with Clever → completes
- [ ] Mic permission prompt appears with your custom copy
- [ ] Benny world 1, level 1: saying the word advances the level
- [ ] Benny retry flow: miss on purpose → Retry → advance
- [ ] Videos play with no black frames or MOV errors in Xcode console
- [ ] Settings gear → Delete my account → completes, kicks you out

### Step 19 — Repeat on your iPad
Same 8 items. iPad is a **required** device family for education apps unless you explicitly exclude it (don't — schools use iPads).

**If any test fails, tell me exactly what happened. Do not proceed until all 16 checks pass.**

---

## PHASE 6 — Capture screenshots (1 hr)

Required device sizes (PNG, no transparency, exact pixel dimensions):
- **6.7" iPhone**: 1290×2796 (iPhone 15 Pro Max) — required
- **13" iPad**: 2064×2752 (iPad Pro 12.9") — required for iPad-supported apps

Capture 6 scenes on each device via **Volume Up + Side Button** (iPhone) or **Top Button + Volume Up** (iPad Pro):

1. **Sign-in screen** with the three provider buttons visible
2. **Student dashboard** with modes and progress
3. **AURA reading session** mid-read (word highlighted)
4. **Castle Swarm gameplay** during combat
5. **Teacher dashboard** with class metrics
6. **Parent dashboard** with a child's fluency chart

Upload all 12 (6 per device) in App Store Connect → your app → 1.0 → Media Manager.

---

## PHASE 7 — Submit for review (15 min hands-on, 24–48 hr Apple wait)

### Step 20 — Archive the build
1. In Xcode top bar, select **Any iOS Device (arm64)** as the target
2. Product menu → **Archive**
3. Wait ~5 min for the archive to build
4. Organizer window opens automatically → select your archive → **Distribute App**
5. Choose **App Store Connect** → **Upload** → follow prompts → Upload

### Step 21 — Wait for processing
- App Store Connect takes 10–30 min to process the build
- Watch for the build to appear under TestFlight → Builds
- Ignore any email saying "missing compliance" — you'll answer that in the next step

### Step 22 — Attach build to version 1.0
1. App Store Connect → your app → **1.0** version page
2. "Build" section → `+` → pick the uploaded build
3. Answer Export Compliance: **No, my app does not use encryption algorithms exempt from EAR**  → matches `ITSAppUsesNonExemptEncryption=false`
4. Content Rights → **No**
5. Advertising Identifier (IDFA) → **No**

### Step 23 — Final review + submit
1. Scroll the version page top-to-bottom: no red dots or missing fields
2. Confirm:
   - Screenshots present for iPhone 6.7" AND iPad 13"
   - Reviewer notes have working demo credentials
   - Privacy label matches your actual data collection
3. **Add for Review** → **Submit to App Review**

**Expected: decision in 24–48 hours.**

---

## PHASE 8 — Handling review results

### If approved 🎉
- You get an email
- App Store Connect → "Release" → **Release this version** (or set to auto-release)
- Live on the App Store worldwide within 1–4 hours

### If rejected
Apple's rejection email cites a specific guideline number. The most likely ones and their fixes:

| Guideline | Meaning | Fix |
|---|---|---|
| 2.1 | Crash on launch | Repro on device, fix, re-archive with bumped build number |
| 4.8 | Sign in with Apple broken | Services ID domains not propagated — wait 1 hr, retest |
| 5.1.1(v) | Account deletion missing | Reviewer couldn't find it — clarify in reviewer notes |
| 5.1.4 | Kids privacy | Extremely unlikely — you strip PII from Sentry already |
| 4.3 | Spam / duplicate | Not possible for you |

Fix → bump build number in Xcode → re-archive → re-upload → re-submit. Each cycle is another 24–48 hours.

---

## 🎁 What I can do for you RIGHT NOW while you enroll in Apple

Say the word and I switch to build mode and knock these out in parallel:

- **A. Generate the 1024×1024 app icon** with YubiLearn branding using premium image gen, save to `resources/icon.png`
- **B. Generate the 2732×2732 splash screen** matching Capacitor's splash config background (`#667eea`), save to `resources/splash.png`
- **C. Apply the two speech-recognition safety fixes** from the runbook (restart delay 120→250ms, 6s per-utterance hard timeout) so device testing doesn't bite you
- **D. Draft the App Store listing description + keywords** ready to paste into Step 10
- **E. Playwright screenshot capture** at exact iPhone 15 Pro Max (1290×2796) and iPad Pro (2064×2752) pixel dimensions across your 6 scenes so you don't have to fumble with real-device screenshots
- **F. All of the above (A + B + C + D + E)**

Tell me which and I go.
