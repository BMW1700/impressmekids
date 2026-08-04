# App Store Push — Exact Steps From Here

## Where we actually are

Verified in the repo right now:

- `capacitor.config.ts` has no `server.url` (Apple 2.5.2 safe), bundle id `app.lovable.yubilearn`.
- `ios/` project exists with `AppDelegate.swift`, `Info.plist`, and `PrivacyInfo.xcprivacy` already present.
- `resources/icon.png` and `resources/splash.png` exist.
- Apple sign-in is wired on both auth screens (`src/pages/Auth.tsx`, `src/pages/game/GameAuth.tsx`).
- Account deletion route exists (`/account/delete`) — Apple 5.1.1(v).
- Build scripts exist: `npm run build:ios`, `npm run open:ios`, plus `scripts/patch-ios-plist.js`.
- Rate limits: logins/signups proxy through `player-auth` server-side; auth email cap raised. 30-client test passed.

So the code side is essentially done. What remains is Apple-account and Xcode work, which only you can do on a Mac.

## Remaining code work I do here (short)

1. Reachable deletion link: make sure `/account/delete` is linked from the visible settings menu so a reviewer finds it in under three taps.
2. Fix the duplicate React key warning in `src/components/landing/AudienceTrifurcation.tsx`.
3. Reproduce and fix the WebKit media `EmptyRanges` exception in the Pre-K/RPG video path (WKWebView is Safari, so this must be clean before TestFlight).
4. Confirm we declare no unused capabilities — push is stubbed, so it stays off the App Store Connect list.
5. Seed four reviewer demo accounts (student, teacher, parent, admin) so App Review can sign in.

## Your steps, in order

### Today — start the queue first
1. Enroll in the Apple Developer Program ($99/year) at developer.apple.com. This is the only item with an approval wait (hours to a day). Do it before anything else.
2. Install Xcode from the Mac App Store, open it once, accept the license, let it install components.

### Once code fixes land
3. On your Mac: pull the project, then `npm install`.
4. `npm run build:ios` (builds web, syncs iOS, patches Info.plist).
5. `npx @capacitor/assets generate --ios` to produce icon and splash from `resources/`.
6. `npm run open:ios` to open Xcode.
7. In Xcode target settings: select your Team, confirm bundle id `app.lovable.yubilearn`, set Display Name `YubiLearn`, Version `1.0.0`, Build `1`, and add the **Sign in with Apple** capability.

### Device smoke test (do not skip)
8. Run on a real iPhone: mic permission prompt, one full Pre-K level, one full RPG battle, background/foreground mid-session, login, logout, account deletion.
9. Repeat on a real iPad (mandatory device for us).
10. Sign in with Google, Apple, and Clever each once on device.

### Submit
11. Xcode: Any iOS Device → Product → Archive → Distribute App → App Store Connect → Upload.
12. App Store Connect: create the app record; fill App Information, category Education, age rating, App Privacy answers.
13. Upload screenshots: 6.7" iPhone and 13" iPad.
14. App Review Information: paste the four reviewer demo logins and a short "how to reach each surface" note.
15. Attach the build, answer export compliance ("no"), Submit for Review.

## Realistic timing

Submission within 48 hours is achievable. Approval is Apple's clock — usually 24–48 hours after submission, and a rejection costs a full cycle, which is why the reviewer accounts, deletion link, and media crash fix are not optional.

## Files this touches

- `src/components/SettingsMenu.tsx` (deletion link)
- `src/components/landing/AudienceTrifurcation.tsx` (duplicate key)
- Pre-K / RPG media player path (`EmptyRanges`)
- Reviewer demo accounts (database seed)
