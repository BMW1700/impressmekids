# Ship to the App Store — honest status + Step-by-step launch

## Brutally honest read on RPG mode

**Mechanically: yes, it's shippable.** Combat choreography, coach marks, blocking, ultimates, loot, seasons, ranks, haptics, mic watchdog, effects toggle — all wired and verified in prior passes.

**Where it is not "Kirby-level" and honestly won't be before launch:**
- Art is generated/traced assets, not hand-animated sprite sheets. It reads as polished-indie, not first-party Nintendo. That gap costs money and months, not code.
- Audio is procedural WebAudio, not a scored soundtrack. Fine for a pilot demo, thin next to a AAA kids title.
- Long-session variety: the loop is strong for 10–20 minutes. Retention past week two depends on content volume (worlds/stories), not new mechanics.

**Does that block a school sale?** No. Schools buy on literacy outcomes, teacher dashboards, MTSS/DIBELS parity, and privacy paperwork — all of which you have. Parents buy on "my kid asks to play it," and the current loop clears that bar.

**Verdict: stop adding features. Ship. Iterate on art and content after v1 is live.**

## What still needs verifying before submission (I do this)

1. Re-run the security scan and database linter; clear or explicitly waive any remaining findings.
2. Re-run `npm run build:ios` and confirm the iOS project patches cleanly.
3. Confirm the three demo reviewer accounts exist and log in.
4. Confirm delete-account works in ≤3 taps from a fresh install.
5. Confirm app title/description/icons match the store listing doc.

## Part B — Step 1, in full detail

**Goal of Step 1: get an Apple Developer account and Xcode. Nothing else. This is the slowest step, so start today.**

### 1A. Enroll in the Apple Developer Program ($99/year)
1. On your Mac, open Safari and go to `developer.apple.com`.
2. Top right, click **Account**. Sign in with your Apple ID (the one you use on your iPhone is fine).
3. If it asks for two-factor, approve it on your phone.
4. Click **Enroll** (or `developer.apple.com/programs/enroll`).
5. Choose entity type:
   - **Individual / Sole Proprietor** — fastest, approves in ~24–48h. Your personal name shows as the seller.
   - **Organization** — required if you want "YubiLearn Inc." as the seller. Needs a legal entity, a **D-U-N-S number** (free, from Dun & Bradstreet, takes 5–14 days), and a website. Slower.
   - Recommendation: if you have a registered company and want schools to see a company name, do Organization. Otherwise Individual now, convert later.
6. Fill in legal name, address, phone. It must match your government ID.
7. Pay the **$99 USD** with a credit card.
8. Wait for the approval email. Individual is usually 1–2 days; Organization can be 1–3 weeks.

### 1B. Install Xcode (start this download now, in parallel)
1. Open the **App Store** app on your Mac.
2. Search **Xcode**. Click **Get / Install**. It is ~10 GB — leave it running.
3. When done, open Xcode once. Accept the license. Let it install "additional required components" (it will ask for your Mac password).
4. Open Terminal (`Cmd + Space`, type `Terminal`, Enter) and run:
   ```text
   xcode-select --install
   sudo gem install cocoapods
   ```
   Enter your Mac password when asked. CocoaPods is required because the speech-recognition plugin needs it.

### 1C. Add your account to Xcode (after approval email arrives)
1. Xcode menu → **Settings** → **Accounts** tab.
2. Click **+** → **Apple ID** → sign in.
3. Your team should appear as `Your Name (Individual)` or your org name. If it says "Personal Team," enrollment hasn't finished yet — wait.

### 1D. Reserve the app name (do this the day enrollment approves)
1. Go to `appstoreconnect.apple.com` → **My Apps** → **+** → **New App**.
2. Platform **iOS**, Name **YubiLearn**, Primary language English (U.S.), Bundle ID `app.lovable.yubilearn`, SKU `yubilearn-001`.
3. If the name is taken, pick a variant now — names are first-come.

**Tell me when 1A is submitted and Xcode is installed, and I'll walk you through Step 2 (getting the code on your Mac) line by line.**

## Lovable rate limits for whole-classroom use

Separate from the App Store, and worth sending today. Draft to send to `support@lovable.dev`:

> Subject: Rate limit increase for classroom-scale usage — project 8b261911-409a-4a04-8594-3e15f3d59496
>
> Hi Lovable team,
>
> We're piloting YubiLearn (project `8b261911-409a-4a04-8594-3e15f3d59496`) in K-12 classrooms. A single class means 25–35 students hitting the app simultaneously from one school NAT'd IP address, and a school-wide rollout means several hundred.
>
> We need to confirm/raise:
> 1. Any per-IP request limits on the hosted app and on Cloud/Supabase auth endpoints — shared school NAT means all traffic looks like one IP.
> 2. Auth sign-in rate limits (25–35 concurrent sign-ins within ~2 minutes at period start).
> 3. Edge function invocation concurrency and per-minute limits.
> 4. AI Gateway request limits, since reading evaluation runs per-student.
>
> Could you tell us the current limits on our plan, and what's needed to raise them for classroom concurrency? Happy to move to a plan that supports this.
>
> Thanks,
> [your name]

Note: nothing in the app code changes for this — it's an account/limits conversation.

## Technical notes
- No new features. Only verification passes (`build:ios`, security scan, DB linter) and store-listing confirmation.
- `docs/app-store-submission.md` already holds the metadata, privacy nutrition label, and reviewer notes to paste into App Store Connect.
- `docs/app-store-submission.md` currently says **Kids Category: No**. That is the right call — it avoids the parental-gate and no-analytics restrictions. Age rating stays 4+.
- `scripts/patch-ios-plist.js` re-applies the permission strings after every `cap sync`, so Step 2 onward is repeatable.
