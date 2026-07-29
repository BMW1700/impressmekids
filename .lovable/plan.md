# App Store Native iOS Prep — What I will implement here vs. what you run on your Mac

## Goal

Move YubiLearn from "web app with Capacitor config" to "iOS project ready to open in Xcode and build." This does NOT include submitting to Apple; it removes the error-prone manual config steps before that point.

## What I will do in this environment (no Xcode needed)

### 1. Generate and commit the iOS platform folder

Run `npx cap add ios` in the project. This produces the `ios/` directory containing the Xcode workspace skeleton. Since `@capacitor/ios` is already installed, this is a file-generation step, not a compile. I will commit the result so you do not need to re-run it on your Mac.

### 2. Add iOS Info.plist usage strings

Insert the required review strings into the generated `ios/App/App/Info.plist`:

- `NSMicrophoneUsageDescription` — child-facing copy explaining mic use for reading practice.
- `NSSpeechRecognitionUsageDescription` — on-device speech recognition.
- `NSCameraUsageDescription` — worksheet/assignment photo capture.
- `LSApplicationCategoryType` = `public.app-category.education`.
- `ITSAppUsesNonExemptEncryption` = `false`.

### 3. Add a native iOS audio-session plugin

Create a custom Capacitor plugin in `src/lib/native/ios-audio-session` that sets the iOS `AVAudioSession` category to `playAndRecord` with `defaultToSpeaker` and `mixWithOthers`. This is the single most likely on-device blocker: RPG mode needs the mic open while also playing WebAudio spectacle sounds. Without this, the native speech recognizer may grab exclusive audio access and the battle will feel broken or silent. The plugin is registered in `capacitor.config.ts` and initializes once on app launch.

### 4. Add npm scripts to `package.json`

```json
"cap:ios": "npx cap add ios 2>/dev/null || true; npx cap sync ios",
"sync:ios": "npx cap sync ios",
"open:ios": "npx cap open ios",
"build:ios": "npm run build && npx cap sync ios"
```

This makes the standard workflow one command: `npm run build:ios`, then `npm run open:ios` on your Mac.

### 5. Add a post-sync Info.plist patch script

Create `scripts/patch-ios-plist.js` and wire it to run after `npx cap sync`. This re-applies the usage strings and category keys every time Capacitor regenerates iOS config, so the manual plist edits are never accidentally lost.

### 6. Verify PWA manifest and head metadata are still correct

Ensure `public/site.webmanifest`, `public/apple-touch-icon.png`, and `index.html` head tags are present for users who install via Safari instead of the App Store. This is a no-op if already present, but is checked as part of the same prep pass.

## What you must do on a Mac (I cannot run this here)

1. `git pull` then `npm install`.
2. `npx cap open ios` → Xcode.
3. In Xcode, select the **App** target → **Signing & Capabilities** → add:
   - **Sign in with Apple**
   - **Push Notifications** (if you want push later)
   - **Background Modes** → **Remote notifications** (if push is enabled)
4. Choose your Apple Developer team for signing.
5. Connect a physical iPad or iPhone, hit **Run** (`Cmd+R`), or choose **Product → Destination** for a simulator.
6. Run a full RPG battle: verify mic prompt, voice advances combat, haptics fire, and spectacle audio plays.
7. If that passes: **Product → Archive**, then **Distribute App → App Store Connect**.

## What I will not touch

- I will not upload anything to App Store Connect.
- I will not generate final icon/splash assets from a placeholder — `resources/icon.png` and `resources/splash.png` already exist.
- I will not change `capacitor.config.ts` except to register the new audio-session plugin and keep `limitsNavigationsToAppBoundDomains: false` (required for OAuth).

## Verification after my pass

- `npm run build:ios` should complete without errors in this environment (it builds the web assets and syncs native dependencies; it does NOT compile Swift).
- `plutil -p ios/App/App/Info.plist` should show the five required keys.
- The new plugin file should appear in the iOS project tree under the Capacitor plugins section.