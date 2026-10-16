# Get YubiLearn on the App Store, step by step

## What's already done
- The iPhone/iPad app project exists. Its app ID is `app.lovable.yubilearn`.
- Mic, speech, and camera permission messages are in place. The privacy file is filled in. Encryption and the Education category are set.
- The app loads its own built files, not the preview site. Apple requires this.
- In-app account deletion exists at `/account/delete`. Apple requires this too.

## What I'll fix in the code when you approve
1. **Sign in with Apple:** Apple rejects apps that offer Google sign-in without "Sign in with Apple." I'll add the Apple button next to Google on the sign-in screens.
2. **Hide sales pages inside the app:** Pricing, "contact sales," and pilot pages are hidden only in the iPhone/iPad app (Apple rule 3.1.1). The website stays unchanged.
3. **Hide test and admin tools inside the app:** Speech Lab, the CMS, and the super admin pages are hidden in the app.
4. **Device setting fix:** Change the old required-device setting (`armv7`) to `arm64`, the current iPhone chip type.
5. **App icon and launch screen:** Create a 1024x1024 app icon and a launch screen from the Benny Bookears art. Put them in `resources/`.
6. **Reviewer demo accounts:** Create one test account each for student, teacher, parent, and admin. Then confirm each one can sign in.
7. **Fix the submission guide:** Update `docs/app-store-submission.md` with the correct app ID, reviewer notes, the privacy label answers, and the login details for the demo accounts.

## What only you can do (in order)
1. **Join the Apple Developer Program** at developer.apple.com/programs. It costs $99 a year, and approval takes from a few hours to 2 days.
2. **Get the code onto your Mac:** Lovable syncs your project to GitHub (BMW1700/impressmekids). On your Mac, run:
   ```bash
   git pull
   npm install
   npx @capacitor/assets generate --ios
   npm run build:ios
   npx cap open ios
   ```
3. **Set up signing in Xcode:** Click the App target, then Signing & Capabilities. Turn on Automatically manage signing and pick your Team. Then add the Sign in with Apple capability.
4. **Test on a real iPhone and iPad:** Plug the device in and press Run. Check each of these:
   - Sign-in works and brings you back to the app.
   - The mic permission prompt appears.
   - Reading a word moves Benny forward.
   - An RPG battle reads sentences.
   - Videos play.
   - Account deletion works.
5. **Take screenshots:** You need three sizes: 6.7" iPhone (1290x2796), 6.5" iPhone (1242x2688), and 13" iPad (2064x2752). The simulator can take them for you. Capture:
   - the choice screen
   - Benny
   - an RPG battle
   - the student dashboard
   - teacher analytics
   - the parent dashboard
6. **Create the app in App Store Connect:** Go to appstoreconnect.apple.com, choose New App, and pick the ID `app.lovable.yubilearn`. Then fill in:
   - the description and keywords, pasted from the guide
   - the privacy label
   - age rating 4+
   - the Kids category off (Kids category adds strict rules, so skip it for now)
   - the reviewer notes and demo logins
7. **Upload and submit:** In Xcode, choose Product, then Archive, then Distribute App, then App Store Connect, then Upload. Test it first through TestFlight, then attach the build and press Submit for Review. Review usually takes 24 to 48 hours.

## Honest risks
- The on-device mic has not been tested yet. Step 4 is the real test, and if the mic glitches there, we fix it before submitting.
- The most common reasons apps get rejected are a missing Apple sign-in, visible pricing links, and demo accounts that don't work. Steps 1, 2, and 6 in my list cover all three.
- Push notifications are not finished. Don't turn them on in App Store Connect.

## Technical notes
- Use `Capacitor.isNativePlatform()` to decide what to hide in the app. The route checks go in `App.tsx`, and the links to remove are in the header, footer, and dashboards.
- Apple sign-in uses the existing `lovable.auth.signInWithOAuth("apple")` and needs the Apple provider turned on in the auth settings.
- `Info.plist`: replace `armv7` with `arm64`.
- Don't add `server.url` to `capacitor.config.ts`.
