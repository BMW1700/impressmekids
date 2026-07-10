## Short answer: No — not in 2 days without fixing 3 hard blockers

Capacitor wrapping alone will **not** give you a working App Store build. Here's the brutally honest audit of what will and won't work if you archive today.

---

## 🔴 HARD BLOCKERS (app will not function or will be rejected)

### 1. Web Speech API does not exist in iOS WKWebView
This is the biggest one. Your entire literacy engine — Benny word reading, AURA, RPG spellcasting, retry flow — runs on `window.webkitSpeechRecognition`. **That API is Chrome-only. It does not exist in the WebView Capacitor ships.** On an iPhone/iPad build:
- Benny word cards will never advance (mic never returns a result)
- AURA reading practice will not score anything
- RPG "speak to cast" will do nothing
- Retry button will do nothing (there's nothing to retry against)

Fix: install `@capacitor-community/speech-recognition`, add a platform adapter in `speechRecognitionManager.ts` that routes to the native plugin on `Capacitor.isNativePlatform()`, and keep the Web Speech path for web. Non-trivial but bounded — ~1 day of focused work + device testing.

### 2. `limitsNavigationsToAppBoundDomains: true` will break OAuth
Your `capacitor.config.ts` has this on. Combined with no `server.url`, it restricts WebView navigation to app-bound domains. Google Sign-In, Clever SSO, and Supabase magic-link redirects all bounce through external origins. Without associated-domain entitlements declared for `accounts.google.com`, `clever.com`, and your Supabase auth host, sign-in will fail silently on device.

Fix: either turn the flag off (simpler, still App Store legal) or declare the associated domains. `appUrlOpen` handler is already wired, so once the redirect lands in the app it routes correctly.

### 3. Pre-K videos: MOV files + signed-URL expiry
Your Pre-K asset manifests include `.mov` files. iOS WKWebView plays H.264 MP4 reliably; `.mov` playback is inconsistent depending on codec inside. Also, `usePreKLevelVideoUrls` signs URLs for 7 days — if a kid opens the app after 7 days offline-then-online, the cached scene graph has dead URLs. Web papers over this by re-fetching; native app needs re-sign on session start (already happens on hook mount, so *probably* fine, but worth verifying with an actual archive build).

R2 CDN + signed fallback logic itself is sound and will work on device.

---

## 🟡 SOFT BLOCKERS (will pass review, may embarrass you)

- **Info.plist strings** are documented in `docs/ios-info-plist-additions.md` but must actually be pasted into `ios/App/App/Info.plist` after `npx cap add ios`. Missing mic string = auto-reject.
- **Sign in with Apple** required because you offer Google/Clever. Capability must be enabled in Xcode and wired to Supabase Apple provider. Docs exist; implementation not verified in an ios/ folder yet.
- **Splash + icon assets** — still Lovable defaults unless you've run `npx capacitor-assets generate` with branded source art.
- **Push notifications** — currently a no-op stub. Fine to ship without, but don't advertise it.
- **Demo accounts** in reviewer notes must actually exist and work before you submit.

---

## 🟢 What will actually work out of the box

- Landing page, mode select, navigation, dashboards
- Video playback of the MP4 hero videos and MP4 Pre-K clips
- Supabase reads/writes, RLS, edge functions (network calls are not gated by app-bound domains)
- Account deletion route
- Tap-based interaction (Pre-K skip button, level select, world map, video adventures)
- The crop/save editor for superadmins (not needed on-device anyway)

---

## Realistic 2-day plan to actually ship

**Day 1**
1. Install `@capacitor-community/speech-recognition`; add native adapter in `speechRecognitionManager.ts`; keep web fallback.
2. Set `limitsNavigationsToAppBoundDomains: false` in `capacitor.config.ts` (or add associated domains — flag off is faster).
3. Audit `.mov` references in Pre-K assets/DB rows; replace with MP4 where any exist.
4. `npx cap add ios`, paste Info.plist strings, enable Sign in with Apple capability, generate branded icon/splash.

**Day 2**
5. Physical iPad + iPhone test pass: Benny world 1 full playthrough, retry flow, Google sign-in, Clever sign-in, account deletion.
6. Seed reviewer demo accounts, archive, upload to TestFlight, submit for review.

If speech-recognition adapter slips, you don't ship — because without it the entire product does nothing on iOS.

---

## Technical details

- `capacitor.config.ts`: flip `limitsNavigationsToAppBoundDomains` to `false`; keep `server` block removed.
- `src/lib/speechRecognitionManager.ts`: branch on `Capacitor.isNativePlatform()`; native path uses `SpeechRecognition.start({ language, partialResults: true, popup: false })` and emits the same event shape the web path emits so `RPGWordReader`, `RPGOneWordReader`, and Benny video adventures see no change.
- Pre-K video hook: no code change needed if signed-URL refresh on mount is confirmed working; add a session-start refresh if not.
- `Info.plist`: mic + speech + camera strings from `docs/ios-info-plist-additions.md`.
- App Store Connect: reviewer notes from `docs/app-store-submission.md` §7; App Privacy label from §2.

Want me to switch to build mode and start with the speech-recognition native adapter, since it's the one blocker that actually gates whether the app does anything at all?
