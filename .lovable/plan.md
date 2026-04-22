

## Pre-Pilot Verification Pass (No new features — proof it works)

### What I'll actually do

**1. Live-fire bulk signup smoke test (the real gap)**
- Use existing `bulk-create-students` edge function to create **5 throwaway test students** with synthetic `@student.nabulearn.internal` emails
- Watch `email_send_log` + `email_failures` populate in real time
- Confirm queue drains, no DLQ entries, all 5 confirm cleanly
- Delete the 5 test accounts via existing `cleanup-orphan-student` flow
- **Outcome:** documented proof the pipeline works end-to-end, not just "looks configured"

**2. Throughput knob fix + safe bump**
- Correct my earlier mistake: tune `email_send_state.batch_size` and `email_send_state.send_delay_ms` (the real columns), not the imaginary `active` flag
- Bump `batch_size: 10 → 25`, `send_delay_ms: 200 → 100` → ~250 emails/min sustained
- Conservative — leaves headroom under Resend's 2 req/sec hard ceiling
- Reversible in one SQL update if anything misbehaves

**3. PvP turn-switching smoke verification (the deferred thread)**
- Open two tabs, run a local PvP match with the existing test accounts
- Confirm: buzz → wrong answer → turn passes to opponent → opponent's 10s window opens
- If broken, file the exact failure mode; if working, mark closed
- ~5 min, no code unless it's actually broken

**4. Capacitor sanity check (web-side only)**
- Re-confirm `node_modules/.vite` rebuilt cleanly, no duplicate React, no console errors
- Verify `initCapacitor()` is a true no-op in the browser (network tab + console)
- Confirm `viewport-fit=cover` + safe-area CSS doesn't shift any existing layout
- **No native build attempted from Lovable** — that stays on your Mac

### What I will NOT do
- No new features
- No schema migrations beyond the throughput tune
- No touching AURA, LexiQuest, RPG, auth, RLS, COPPA flow
- No native iOS/Android builds (your machine, your call)

### What you do after
- When ready: the 8-step `npx cap add ios && npx cap sync && npx cap run ios` flow on your Mac
- I can stay on standby to debug any Xcode/Android Studio errors you hit

### Time
~15 min, fully autonomous. Final report includes:
- (a) test student send timestamps from `email_send_log`
- (b) confirmed new throughput numbers
- (c) PvP test result (pass/fail with evidence)
- (d) clean console screenshot of the web app post-Capacitor

