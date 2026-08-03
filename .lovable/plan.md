# Immediate App Store + 30-Student Classroom Plan

## Brutally honest verdict

Stop work on Vertex AI and new features. Vertex is not required for Pre-K, RPG,
consumer/daycare gameplay, authentication, or App Store submission.

The app is close, but **30 simultaneous users on one school network are not yet
proven or guaranteed**:

- Our classroom security is correctly per student, not per IP. Five bad PINs
  lock only that student for 15 minutes.
- Staff bulk provisioning creates students server-side, avoiding 30 children
  hitting public signup together.
- Every classroom PIN login still calls hosted Auth twice: `generateLink()` and
  then `verifyOtp()`.
- Normal email/password signup and login also call hosted Auth directly.
- Lovable’s documentation does not publish the applicable per-IP Auth limits,
  and app code cannot raise hosted Auth limits.
- Available logs show no recent Auth 429s, but no real 30-device test has run.

The solution is: **pre-provision school accounts, obtain written limit
confirmation from Lovable, instrument Auth 429s, and pass a production 30-client
same-IP test before promising schools the issue is solved.**

## Verified current state

### Classroom account creation

1. A teacher/admin imports the roster once.
2. `bulk-create-students` creates confirmed accounts through the admin Auth API.
3. Students receive unique usernames and hashed six-digit PINs.
4. Students use `/class-login`: class code + username + PIN.

For schools, this must be the documented workflow. A class should not use public
self-signup simultaneously.

### Classroom login

- Lockout is stored on each `student_credentials` row, not the school IP.
- `classroom_login_attempts.ip_bucket` is currently inert and defaults to
  `no-ip-collected`; it neither helps nor blocks classroom concurrency.
- The unresolved capacity risk is the hosted Auth `generateLink` + `verifyOtp`
  sequence, not our PIN logic.

### Backend capacity

Current backend health is good: database up, 15/90 connections, 1/400 pool
clients, 30% memory, 17% disk, and no restarts. There is no evidence that a
larger instance is needed. The unknown is hosted Auth policy.

### Vertex / paid AI

- RPG has no Vertex dependency.
- Pre-K submits `freeMode: true`; `analyze-aura` explicitly skips Vertex.
- Core Web Speech and in-house ML/matching remain the gameplay path.
- Vertex only supports optional premium AURA narrative analysis and buried
  teacher generation/OCR tools.
- Do not migrate these tools to another paid provider now. Keep them outside the
  App Store v1 critical path; disable them in v1 if necessary.

## Phase 1 — Make classroom authentication provably safe

### 1. Finish the intended school workflow

- Keep bulk roster provisioning and one-time credential CSV download.
- Add the missing teacher-facing PIN reset control.
- Make roster imports resumable/idempotent with clear per-student results.
- Do not require students to create accounts during class.

### 2. Harden classroom login

- Preserve per-student PIN lockouts; never add an IP-wide classroom lockout.
- Retire the misleading unused `ip_bucket` behavior/index.
- Add non-PII telemetry for Auth stage, status, latency, and 429s.
- Distinguish `generateLink` failures from `verifyOtp` failures.
- Show a specific retry message for hosted Auth throttling.
- Do not hide a persistent 429 behind retries and call it solved.

### 3. Email Lovable support now

> **Subject: Production Auth limit confirmation for 30+ students behind one NAT**
>
> We are launching YubiLearn for classroom use on Lovable Cloud. At least 30
> students must be able to sign in concurrently from one school NAT IP without
> HTTP 429 responses. We pre-provision student accounts server-side. Students
> then use class code, username, and PIN; successful login currently calls
> managed Auth `generateLink`, followed by `verifyOtp`.
>
> Please confirm this project's limits for admin user creation, magic-link
> generation, OTP verification, password grants, and public signup/login,
> including per-IP and hourly limits. Please raise or exempt the project to
> support at least 60 concurrent classroom Auth operations from one NAT IP with
> headroom. Confirm whether token-only `generateLink` calls consume or can be
> blocked by email-send quotas even when no email is sent.
>
> Please provide the applied limits in writing so we can document a production
> readiness test.

Support: https://lovable.dev/support

### 4. Run a controlled 30-client production test

- Create one test classroom and 30 disposable students through bulk import.
- Run 30 logins concurrently from one egress IP against the published app.
- Run three rounds: 30 at once, 30 over 10 seconds, then logout/login again.
- Verify all sessions are valid, student-scoped, and reach the dashboard.
- Record stage/status/latency only—never names, PINs, credentials, or tokens.
- Pass criteria: 100% success, zero 429s, zero data crossover, zero duplicate
  accounts, and no backend saturation.
- If hosted Auth returns 429, send Lovable the timestamp and operation and have
  the platform limit raised before launch.

## Phase 2 — Close App Store blockers in the repository

1. Add `PrivacyInfo.xcprivacy`; it is currently missing.
2. Add Sign in with Apple to the consumer/game login wherever Google is offered,
   not only the buried school Auth screen.
3. Link the existing `/account/delete` page from an obvious authenticated
   settings surface; the route exists but no normal UI link was found.
4. Reproduce and fix the current Safari/WebKit media exception
   `ReferenceError: Can't find variable: EmptyRanges` before TestFlight.
5. Fix the duplicate React key in `AudienceTrifurcation`.
6. Verify display name `YubiLearn`, icon set, splash, bundle ID, version/build,
   permission copy, and iPad orientations.
7. Test native speech, WebAudio, repeated mic use, interruptions, background/
   foreground, logout, deletion, and policy links on real iPhone and iPad.

## Phase 3 — Exact Mac-to-App-Store steps

### Apple and Mac setup

1. Enroll in the Apple Developer Program.
2. Install the latest production Xcode from the Mac App Store.
3. Open Xcode once, accept the license, and install requested components.
4. Install Node.js and CocoaPods if missing.
5. Download/clone this project onto the Mac.

### Build the native app

1. Open Terminal in the project folder.
2. Run `npm install`.
3. Run `npm run build:ios`.
4. Run `npm run open:ios`.
5. In Xcode select the `App` project and target.
6. Under Signing & Capabilities select the Apple developer team.
7. Confirm bundle ID `app.lovable.yubilearn` is registered.
8. Set display name `YubiLearn`, version `1.0.0`, build `1`.
9. Add Sign in with Apple capability if used in the final consumer UI.
10. Confirm microphone, speech, and camera permission text in the built app.

### Device and TestFlight validation

1. Run on a real iPhone and grant mic/speech permissions.
2. Complete Pre-K and RPG sessions with repeated mic starts, app backgrounding,
   interruption, audio playback, and rotation.
3. Repeat on a real iPad.
4. Test signup, Apple/Google login, classroom login, logout, and deletion.
5. Complete the 30-client production Auth test.
6. In Xcode choose Any iOS Device, then Product → Archive.
7. Validate and upload the archive to App Store Connect.
8. Add internal TestFlight testers and run a complete regression pass.

### App Store Connect

1. Create the app record with the matching bundle ID.
2. Add app name, subtitle, description, support URL, privacy-policy URL,
   Education category, age rating, and copyright.
3. Complete App Privacy accurately for account, student, diagnostic, and voice
   data and whether each category is linked to identity.
4. Upload final iPhone and iPad screenshots.
5. Supply review notes and a working reviewer account that exposes the consumer
   experience and mic features.
6. Select the tested build, answer export-compliance questions, and submit.

## Rollback plan

- Keep current email/password and Student ID login as fallbacks during testing.
- Ship authentication hardening separately from game/media changes.
- If the concurrency test fails, keep roster provisioning but do not promote
  classroom PIN login until Lovable raises the limit; preserve all credentials.
- If the native build regresses, do not upload it; restore the last known-good
  native configuration.

## Files expected to change

- `supabase/functions/classroom-login/index.ts`
- `src/lib/classroomLogin.ts`
- `src/pages/ClassroomLogin.tsx`
- `src/components/admin/StudentRoster.tsx`
- `src/components/admin/BulkStudentImport.tsx` (only for resumable reporting)
- `src/pages/game/GameAuth.tsx`
- The authenticated settings/navigation surface for account deletion
- `ios/App/App/PrivacyInfo.xcprivacy`
- Native config only where the final audit proves a correction is needed
- The media-player owner of `EmptyRanges`, after reproduction identifies it
- `src/components/landing/AudienceTrifurcation.tsx`
- Classroom load-test and iOS release verification files

## Definition of ready

- Lovable confirms or raises the Auth limits.
- Published production passes 30 same-IP clients with zero 429s.
- Privacy manifest, Apple login parity, visible deletion, and policy URLs pass.
- `EmptyRanges` and duplicate-key errors are resolved.
- Pre-K/RPG mic and audio pass on real iPhone and iPad.
- Xcode validation and TestFlight regression pass.

Before these checks, “30 students guaranteed” and “App Store ready” would be
claims without evidence.
