# Rename Benny → Sir Bookears + Trademark Readiness + App Store Steps

## 1. Naming decision (needed for a clean trademark)

Trademarks are strongest when one exact spelling is used consistently everywhere. Two spellings appear in the request: "Sir Bookears" and "Sir Book Ears". This plan standardizes on the one-word form:

**SIR BOOKEARS** — used verbatim, every time, in every user-facing place. No "Benny", no "Bookears" alone, no "Book Ears".

Series tagline directly beneath it: **"A Literary Adventure"**.

## 2. Series title on both main pages

Add a title block above the hero video on:
- `/` mode-select page (Pre-K panel)
- `/for-families`

```text
        SIR BOOKEARS™
      A Literary Adventure
   ─────────────────────────
   [ hero video ]
```

Large display title, small letter-spaced subtitle underneath, using existing design tokens (no new colors). The current line "Meet Benny Bookears as he takes you on an immersive early literacy adventure" becomes "Meet Sir Bookears as he takes you on an immersive early literacy adventure" and sits below the video block.

## 3. Platform-wide rename (user-facing text only)

Every visible "Benny" becomes "Sir Bookears" (or "Sir Bookears'" for possessives) across:
- Pre-K story copy and world/level copy (`src/lib/yubiStoryCopy.ts`) — hero name, help chips, prompts, hints, success messages
- Pre-K adventure data captions (`src/data/preKAdventures.ts`, `preKAdventuresVideo.ts`)
- Landing/marketing pages: `Index.tsx`, `ForFamilies.tsx`, `ModeSelect.tsx`, `PremiumHero.tsx`, `TestimonialSection.tsx`, `AudienceTrifurcation.tsx`, `ForPrincipals.tsx`, `Pricing.tsx`
- Pilot/sales docs pages: `PilotPacket.tsx`, `pilot/QuickStart.tsx`, `pilot/ImagineCoexistence.tsx`, `pilot/FerpaCoppaOnePager.tsx`
- In-game surfaces: `YubiVillage.tsx`, `GameDashboard.tsx`, `YubiScene.tsx`, `YubiAdventure.tsx`, `YubiVideoAdventure.tsx`, `RPGWorldMap.tsx`, `RPGLevelSelect.tsx`, `WordFeedbackOverlay.tsx`, word readers, `PreKStatsButton.tsx`
- Page titles, meta descriptions, and og tags on the Pre-K/family pages
- Admin-facing labels in the Pre-K studio (`RedubStudioPanel`, `BennyVoicePrewarm`, `TimelineCanvas`, `PreKLevelsList`, `SuperAdminDashboard`)

**Not renamed** (internal only, zero user impact, avoids breaking the audio/video pipeline): file names, component names (`BennyDog`, `BennyStanding`, `BennyVideoHero`), variables, asset pointer filenames, DB columns, voice-config keys, and edge-function payload keys.

## 4. Trademark hygiene checklist (implemented in this pass)

- First and most prominent use on each main page carries **™**: "SIR BOOKEARS™".
- Footer legal line added: "Sir Bookears™ is a trademark of YubiLearn. All rights reserved."
- Used as an adjective/proper name for a series, never generically ("the Sir Bookears series of reading adventures"), which strengthens distinctiveness.
- Consistent capitalization and spelling everywhere so the specimen of use is clean when filing.
- Note: filing itself (USPTO TEAS, Class 41 for educational entertainment series and Class 9 for downloadable educational software) is something you do at uspto.gov — I can't file it, but the platform after this change is a valid specimen of use in commerce.

## 5. App Store readiness (current status)

Already done in the repo: `ios/` project exists, no `server.url` in `capacitor.config.ts`, all four Info.plist usage strings present, `PrivacyInfo.xcprivacy` filled, `AVAudioSession` configured in `AppDelegate.swift`, native speech plugin installed, `/account/delete` deletion route live. Security scan currently has **zero critical or error findings** — only warnings.

Remaining work, in order:

1. **Publish the web build** (the stuck "Updating" button) — I trigger this from here after the rename.
2. **Apple Developer Program** — enroll at developer.apple.com/programs ($99/yr, approval hours–2 days).
3. **On your Mac:** `git pull` → `npm install` → `npm run build:ios` → `npx cap open ios`.
4. **Xcode:** target `App` → Signing & Capabilities → automatic signing + your Team → `+ Capability` → Sign in with Apple.
5. **Icon + splash:** add `resources/icon.png` (1024×1024, no transparency) and `resources/splash.png` (2732×2732) using Sir Bookears branding, then `npx @capacitor/assets generate --ios`.
6. **Device test** on a real iPhone and iPad: sign-in returns to app, mic prompt appears in level 1, saying the word advances, retry/skip work, videos play, account deletion completes.
7. **Screenshots:** 6.7" iPhone (1290×2796), 6.5" (1242×2688), 13" iPad (2064×2752) — mode select, student dashboard, AURA practice, RPG battle, teacher analytics, parent dashboard.
8. **App Store Connect:** new app, bundle id `app.lovable.yubilearn`, paste metadata + privacy label + reviewer notes from `docs/app-store-submission.md`, seed the four reviewer accounts.
9. **Archive & submit:** Product → Archive → Distribute → App Store Connect → Upload → Submit for Review (24–48h typical).

## Technical notes
- Rename is copy-only; no game logic, mic pipeline, audio timeline, or DB changes.
- Do not re-add a `server.url` block to `capacitor.config.ts` before archiving.
- Push notifications stay stubbed — do not declare that capability.
- App Store listing copy and `docs/app-store-submission.md` get the Sir Bookears naming too, so the store listing matches the trademark specimen.
