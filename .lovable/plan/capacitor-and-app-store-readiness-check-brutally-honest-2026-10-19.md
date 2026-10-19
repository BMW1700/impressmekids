# Capacitor and App Store readiness check (brutally honest)

## Short answer
The app is wrapped in Capacitor, and most of the setup is correct. But one real problem will probably cause trouble on a real iPhone: **Google and Apple sign-in.** If we don't fix it, Apple's reviewer may hit a broken sign-in and reject the app. The rest is in good shape.

## What's correct (I checked each one)
- The iPhone/iPad app project exists. The app ID is `app.lovable.yubilearn`. Capacitor 8 and all its parts are installed.
- The app runs its own built copy, not the preview website. Apple requires this.
- The mic, speech, and camera permission messages are set. So are the encryption setting, the Education category, arm64, and iPad rotation.
- The privacy file is filled in.
- The phone's audio is set up so the mic and the game sounds can play together.
- Native speech recognition is installed and listed in the iPhone build files.
- The app icon and launch screen are in place (one 1024x1024 icon).
- Pricing, sales, Speech Lab, and super admin pages are hidden inside the app, and pricing links are hidden in the menus.
- There's an "Apple" sign-in button on both sign-in pages, and account deletion is at `/account/delete`.
- Videos load from your backend over the internet, the same as on the website. Nothing gets copied into the app, so the app needs Wi-Fi or data to play videos. Apple allows this.

## What's broken or risky
1. **Sign-in on the phone (blocker).** Google and Apple sign-in send you back to the "current website address." Inside the app, that address is the app itself (`capacitor://localhost`), not yubilearn.com, so after signing in you won't come back into the app. Google also blocks sign-in inside apps unless it opens in the phone's real browser. Student ID and email/password login are not affected.
2. **The Apple sign-in setting is off in Xcode.** You have to add "Sign in with Apple" in Xcode (step 3 of your steps). It isn't there yet.
3. **The speech plugin version is older** (v7, while the rest of Capacitor is v8). It says it supports this, but nobody has tested it on a device yet. The first run on a real iPhone will show whether it works.
4. **Not tested on a real iPhone or iPad at all.** I can't promise "no bugs" until someone runs it on a device. Mic timing on iPad is the most likely problem.
5. **Reviewer demo accounts** still have to be made and checked.

## What I'll fix when you approve
1. **Phone sign-in:** When the app runs on a phone, Google and Apple sign-in open in the phone's real browser and send you back to `https://yubilearn.com/auth`. The app then picks up that sign-in. The website stays exactly the same.
2. **Reviewer login note:** Point Apple's reviewer to Student ID or email login. Those work without the browser hand-off.
3. **Demo accounts:** Make one student, teacher, parent, and admin test account, check that each one signs in, and put the logins in the submission guide.
4. **Update the guide** with this honest checklist, including the Xcode Apple sign-in step.

## What only you can do
Same as before: an Apple Developer account, then on your Mac run `git pull`, `npm install`, `npm run build:ios`, `npx cap open ios`. Then set up signing, add "Sign in with Apple," test on a real iPhone and iPad, take screenshots, archive, and submit.

## Technical notes
- Use `@capacitor/browser` (new plugin) to start OAuth on native. The `appUrlOpen` handler already exists in `capacitorBootstrap.ts`. Add a `yubilearn` URL scheme to Info.plist, and/or set up a universal link for `yubilearn.com/auth`. Close the browser on return and let the auth client restore the session from the URL.
- The redirect target on native becomes `https://yubilearn.com/auth` (it must already be an allowed redirect) instead of `window.location.origin`.
- Add the Browser pod by running `cap sync`.
