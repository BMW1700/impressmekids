# YubiLearn iPhone/iPad App: App Store Readiness

## Order of work
1. **Now, at the same time as the mic work:** enroll in the Apple Developer Program. Approval can take a few days, so starting early costs nothing.
2. **Next:** finish moving the new speech engine into the live game. Apple's reviewer will play the game, and the mic is the first thing they'll judge. A bad first review slows every resubmission after it.
3. **Then:** the App Store fixes below, followed by testing on a real iPad and submitting.

## Honest answer: are we ready?
Mostly. The app is already set up to become a native app: the iOS project, app ID `app.lovable.yubilearn`, microphone and speech permission text, privacy file, and native speech recognition all exist. Some things still need work before Apple will approve it. Some steps can only happen on your Mac and need your Apple Developer account.

## What I will fix in the project
1. **Device setting:** the app says it needs "armv7", an old chip type. Change it to "arm64" so every current iPhone and iPad can install it.
2. **Sign in with Apple:** Apple requires it when an app offers Google sign-in (rule 4.8). Add an "Sign in with Apple" button next to Google on the sign-in screens.
3. **Account deletion inside the app:** Apple requires users to be able to delete their account from inside the app. Make sure the existing deletion page is reachable from the account and settings menu on the phone, not just from the website.
4. **No outside payment links in the app:** hide the Pricing page and the "contact sales" email links when running as the app, so Apple doesn't flag them (rule 3.1).
5. **Mic hand-off on iPhone:** make the mic checks that already run on the website also run on the phone (permission prompt, recovery when another app takes the mic).
6. **Splash screen and status bar:** match the colors to the current brand instead of the old purple.
7. **Hide test pages:** the Speech Lab and super-admin pages stay hidden in the app build.
8. **Updated checklist:** one up-to-date step-by-step guide for your Mac: pull, `npm install`, `npm run build`, `npx cap sync ios`, open Xcode, archive, upload to TestFlight.

## What only you can do
- Enroll in the Apple Developer Program ($99/year). This is required.
- On a Mac with Xcode: sign the app, turn on the "Sign in with Apple" setting, archive and upload.
- In App Store Connect: screenshots, description, the privacy questions (children's category / COPPA), a demo login for Apple's reviewer, and a support web address.
- Test on a real iPad through TestFlight, especially reading out loud in RPG battles.

## Risks
- Apps for children (Kids Category) get the strictest review. Apple may ask about sign-in for kids, links to outside websites, and data collection. Listing the app under Education rather than Kids is the safer first submission.
- The mic can only be properly tested on a real device.

## Technical details
- `ios/App/App/Info.plist`: change `UIRequiredDeviceCapabilities` to `arm64`.
- Apple OAuth through Lovable Cloud social auth (`lovable.auth.signInWithOAuth("apple")`), with the button shown on `/auth` and `/game/auth`.
- An `isNativeApp()` helper (`Capacitor.isNativePlatform()`) hides pricing, mailto sales links, `/speech-lab` and `/super-admin` routes.
- `capacitor.config.ts`: update the splash `backgroundColor` to the brand token color.
- Update `docs/APP_STORE_LAUNCH_CHECKLIST.md` to be the one source of truth for the steps.
