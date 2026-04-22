

## Brutally Honest Pre-Launch Audit (NabuLearn)

### Email infrastructure ✅ Bulletproof
- `notify.nabulearn.com` — **Verified ✅** (no longer "verifying" — DNS is live)
- `process-email-queue` cron — active, every 5 sec
- All 4 pgmq queues (auth + transactional + 2 DLQs) — clean, length 0
- 9 Resend functions all wrapped via `resendClient.ts` — throttled, retried, batched, logged
- 0 entries in `email_failures` over the last 7 days
- Supabase 2/hour cap is fully bypassed

**Verdict on emails: launch-ready.** No remaining work.

---

### Honest blockers I found that are NOT email-related

I have to be straight with you — there are 2 real security findings flagged by the scanner that block a clean pilot:

**1. 🔴 ERROR — `classroom_students` INSERT policy is too loose**
Any authenticated user who knows a classroom UUID can add themselves. No join-code check, no teacher approval. A curious student could enroll into any classroom in any district. **Pilot blocker.**

**2. 🟡 WARN — `districts.primary_contact_email` exposed to all authenticated users**
Every logged-in user can read every district admin's contact email. Low-severity but a superintendent will see it in any audit.

**3. 🟡 Open thread from prior session — PvP turn-switching verification**
We deferred this when we pivoted to email work. Still not verified.

Everything else (530+ RLS policies, SSVRS, AURA, LexiQuest, COPPA flow, Clever SSO, auth hardening) is solid.

---

### What I recommend BEFORE Capacitor

A focused 30-min hardening pass:
- Tighten `classroom_students` INSERT to require a valid join code OR an approved `classroom_join_requests` row
- Move `districts.primary_contact_email` behind an admin-only column policy (or split into `districts_admin_contacts` table)
- Run the deferred PvP turn-switch smoke test

Then we go mobile.

---

## Mobile Plan — Capacitor Wrap of NabuLearn

### Decision: native Capacitor, not PWA
You've asked for native. Capacitor is the right call because:
- AURA needs reliable mic permissions → native is more permissive than browser
- Push notifications for the parent app (already on the roadmap per memory) require native
- iPad-as-primary-K5-device (per memory) needs proper home-screen install + offline shell
- App Store presence = legitimacy for school district contracts

### What gets built

**Phase M1 — Capacitor scaffold (in Lovable, fully autonomous)**
1. Install `@capacitor/core`, `@capacitor/cli` (dev), `@capacitor/ios`, `@capacitor/android`
2. Create `capacitor.config.ts` with:
   - `appId: app.lovable.8b261911409a4a0485943e15f3d59496`
   - `appName: nabulearn`
   - Hot-reload `server.url` pointing at the Lovable sandbox so you can preview live edits on a real iPad
3. Add native-friendly viewport + safe-area CSS to `index.html`
4. Confirm no Service Worker is registered (already removed per memory — good)

**Phase M2 — Native plugins NabuLearn needs**
Installed and wired in:
- `@capacitor/microphone` + `@capacitor/device` → AURA speech (better than Web Speech permissions on iOS Safari)
- `@capacitor/push-notifications` → parent app push (per existing roadmap)
- `@capacitor/app` → handle deep links for Clever SSO + magic links back into the app
- `@capacitor/preferences` → secure local cache for student session
- `@capacitor/status-bar` + `@capacitor/splash-screen` → branded launch experience
- `@capacitor/keyboard` → fix iPad keyboard issues for K-5 students typing in LexiQuest

**Phase M3 — Auth & deep linking**
- Configure Clever SSO redirect to support `nabulearn://oauth` custom scheme as well as the existing `nabulearn.com` web flow
- Configure auth email magic links to deep-link back into the installed app when present, fall back to web

**Phase M4 — Build artifacts (you do this on your Mac)**
After I ship M1–M3 in Lovable, you take the codebase out and run native builds. Detailed steps below.

---

## Your hands-on steps after I ship M1–M3

You only do this once per dev machine, then `npx cap sync` after every Lovable update.

```text
1. Click "Export to GitHub" in Lovable → push to your repo
2. git clone <your repo> && cd nabulearn
3. npm install
4. npx cap add ios            (Mac + Xcode required)
   npx cap add android        (any OS + Android Studio)
5. npx cap update ios         (or android)
6. npm run build
7. npx cap sync               (run this after every Lovable pull)
8. npx cap run ios            (launches simulator/device)
   npx cap run android
```

Whenever you make changes in Lovable later: `git pull && npm install && npm run build && npx cap sync`.

---

## What does NOT change

- Codebase, AURA, LexiQuest, RPG, SSVRS, auth flow, RLS, Resend wrapper, email queue — untouched
- Web app at nabulearn.com keeps working unchanged
- Same React codebase ships to web + iOS + Android (one repo, three targets)

---

## Recommended order of execution

1. **Approve this plan**
2. I ship the **3 security fixes** (`classroom_students`, `districts.primary_contact_email`, PvP smoke check) — ~20 min
3. I ship **Capacitor M1–M3** (scaffold + plugins + deep links) — ~30 min
4. You run the **8 export/build commands** on your Mac — ~15 min the first time
5. App on simulator → physical iPad → TestFlight → App Store

Final state: same codebase, web at nabulearn.com + native iOS/Android apps with mic, push, deep links, splash screen, and Clever SSO all working natively.

