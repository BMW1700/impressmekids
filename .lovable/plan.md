# Plan: Fix the blockers, then launch on the App Store

Two parts. Part A is work I do here in Lovable. Part B is the exact click-by-click path you follow on your Mac.

---

## Part A — What I fix here (in this order)

### A1. Database permission blockers (biggest one)
Right now signed-in users get "permission denied" on the internal security helper functions. This silently breaks teacher classrooms, parent dashboards, tournaments, and admin pages.

- Grant execute permission on `has_role`, `is_classroom_teacher`, `get_parent_id`, `get_student_group_ids` (and sweep every other security-definer helper missing it) to signed-in users.
- Verify by querying the permission catalog after the migration, not by assuming.

### A2. Signup can't save a role
New sign-ups fail to write their role, so people finish registration with no access. Fix by moving role assignment into a trusted database trigger/function instead of a browser write, and remove the browser-side insert.

### A3. Challenge Meter never actually saves
Parents and students see a "Saved!" toast but nothing persists.
- Fix the parent rule so it matches through the parent account table (the current rule compares the wrong two IDs, so it never matches anyone).
- Add a rule letting a student write their own row.
- Make the save code read the error back and show a real failure message instead of a fake success.

### A4. Levels that refuse to start
If one audio clip can't be signed, "Tap to begin" stays disabled forever and a child stares at a stuck screen. Fix: add a timeout + skip-on-failure so a missing clip is silently ignored and the level always starts.

### A5. Student recordings that won't play back
New recordings resolve to a storage URL that doesn't exist yet, so playback shows "Could not load audio." Fix: fall back to the original storage location when the new URL is missing, and let normal users trigger the copy (currently only a super admin can).

### A6. File uploads blocked
At least one storage bucket has no upload rule, so avatars / campaign art / Pre-K media fail. Fix: add owner-scoped upload rules to the affected buckets.

### A7. Third-party keys (I'll tell you which ones need your action)
- ElevenLabs key is missing the `audio_isolation` permission → redub fails.
- LALAL key/plan → music extraction fails.
- AWS cold-storage key is invalid → backups are not running.
These are account-side; I'll flag exactly what to change and re-save the keys once you have them.

### A8. Final pre-flight
- Re-run the security scan and the database linter.
- Re-run `npm run build:ios` and confirm the iOS project still patches cleanly.
- Confirm app title, description, and icons are correct for the store listing.

---

## Part B — Your steps, explained like you're five

### Step 0 — What you need first
1. A Mac (any modern MacBook).
2. An **Apple Developer account** — costs **$99/year**. Sign up at developer.apple.com → "Enroll". Takes 1–2 days to approve. **Start this today**, it's the slowest part.
3. **Xcode** — free, from the Mac App Store. It's ~10 GB, so start that download today too.

### Step 1 — Get the code onto your Mac
1. In Lovable, top right, click **GitHub** → **Connect / Export to GitHub**.
2. On your Mac open the **Terminal** app (press `Cmd + Space`, type "Terminal", hit Enter).
3. Type this, then Enter:
   ```text
   git clone <your-github-url>
   cd <your-project-folder>
   npm install
   ```
   ("clone" just means "download a copy.")

### Step 2 — Build the app and put it into the iPhone project
In the same Terminal window:
```text
npm run build:ios
```
This makes the website files and copies them into the iPhone project. You'll run this **every time** you change anything in Lovable (after `git pull`).

### Step 3 — Open Xcode
```text
npx cap open ios
```
Xcode opens. It may say "resolving packages" — let it finish.

### Step 4 — Sign the app (tell Apple it's yours)
1. In Xcode's left sidebar, click the very top blue icon named **App**.
2. Click the **Signing & Capabilities** tab.
3. Check **Automatically manage signing**.
4. Under **Team**, pick your Apple Developer account (click "Add an Account" and log in if it's not listed).
5. Bundle Identifier should already read `app.lovable.yubilearn`. Leave it.

### Step 5 — Add the capabilities the app needs
Still on **Signing & Capabilities**, click **+ Capability** and add:
- **Sign in with Apple** (Apple *requires* this if you offer Google login)
- **Push Notifications** (only if you want parent alerts)
- **Background Modes** → tick **Audio** (keeps the mic alive)

### Step 6 — Test on a real iPad or iPhone
1. Plug the device into the Mac with a cable.
2. On the device: **Settings → Privacy & Security → Developer Mode → On**, then restart it.
3. In Xcode, at the top middle, click the device dropdown and pick your iPad.
4. Press the **▶ Play** button.
5. First launch will fail with "Untrusted Developer" — on the device go to **Settings → General → VPN & Device Management → your name → Trust**. Press Play again.

**Test this checklist on the device:**
- Mic prompt appears and the child's voice is recognized in RPG mode
- Battle sound effects play *while* the mic is on
- Rumble/haptics fire on hits
- Video levels play with the redub + music tracks
- Google / Apple / Clever login all work
- Rotate the iPad — nothing breaks

### Step 7 — Make the store artwork
- **App icon:** one 1024x1024 PNG, no transparency, no rounded corners (Apple rounds it for you).
- **Screenshots:** while running in Xcode's simulator on a 13" iPad Pro, press `Cmd + S` to save shots. You need **at least 3**.
- Write a short description, keywords, and a support URL (your site is fine).

### Step 8 — Create the app record
1. Go to **appstoreconnect.apple.com** → **My Apps** → **+** → **New App**.
2. Platform: iOS. Name: YubiLearn. Bundle ID: pick `app.lovable.yubilearn`. SKU: `yubilearn-001`.

### Step 9 — Upload the build
1. In Xcode top menu: **Product → Destination → Any iOS Device**.
2. **Product → Archive**. Wait (5–15 min).
3. When the Organizer window opens: **Distribute App → App Store Connect → Upload**.
4. Wait ~15 minutes for the build to appear in App Store Connect.

### Step 10 — Fill in the required legal answers (kids apps are strict)
Apple will ask, and you must answer:
- **Age rating** → mark **Made for Kids, 4+** (or 6–8). Once you say "Kids Category," Apple **bans third-party analytics and ads** and requires a **parental gate** in front of any external link or purchase.
- **Privacy Policy URL** — required, must mention COPPA and what you collect from children.
- **App Privacy questionnaire** — declare audio recordings, name, and school data.
- **Encryption** — already answered "No" in your project file.
- **Sign in with Apple** — required because you offer Google sign-in.

> Heads-up, honestly: the **Kids Category parental gate** and the **children's privacy policy** are the two things most likely to get you rejected. I'd add the parental gate in code before you submit if you're going Kids Category.

### Step 11 — TestFlight first (don't skip)
In App Store Connect → **TestFlight** → add your own email → install the app from the TestFlight app on your iPad. Run a real 20-minute session with a kid before submitting.

### Step 12 — Submit
App Store Connect → your app → **Add for Review** → **Submit**. Review takes 1–3 days. If rejected, they tell you exactly why and you fix it and resubmit — that's normal, not a failure.

---

## Technical notes
- Migrations needed: grant execute on security-definer helpers; role-assignment trigger; `challenge_settings` policy correction (join through `parent_accounts`) plus a student insert/update policy; storage bucket insert policies.
- Code changes: error handling in `useChallengeSettings.ts`; readiness timeout in `YubiVideoAdventure.tsx` / `usePreKAudioMixerRuntime.ts`; audio URL fallback in `auraAudioUrl.ts`; relax the super-admin gate on the copy path in `migrate-to-r2`.
- No changes to the iOS project are needed beyond what already exists; `scripts/patch-ios-plist.js` re-applies permission strings after every sync.
- Parental gate (if Kids Category) would be a new small component gating external links and any purchase entry point.
