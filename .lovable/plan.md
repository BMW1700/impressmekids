
# Pipeline test-ready audit + fixes

## 1. Why "Nuke poisoned cache" is unclickable — FOUND IT

`src/pages/superadmin/BennyVoicePrewarm.tsx` line 526:

```tsx
<Button variant="destructive" size="sm" disabled={purging || !voiceId}>
```

The trigger is disabled whenever the "ElevenLabs voice ID" input is empty. Your screenshot shows the input blank (using default Benny voice), so the button is greyed out and un-clickable. Not a wiring bug — a guard bug.

**Fix:** Resolve to the default Benny voice ID when the input is empty (same fallback the prewarm itself uses), then only disable on `purging`. The purge edge function already accepts `voiceId: undefined` and falls back server-side, but the client guard blocks the click before it can call it.

## 2. Redub + Music pipeline — status

Already audited end-to-end twice. Verdict unchanged: **the automation is solid.** Recap of the guarantees you'll see when you test:

- **Track 90 (Redub)**: ElevenLabs Voice Isolator strips music/SFX from the source → Speech-to-Speech produces clean Benny voice. Clip is placed at scene start, source video's own voice track is muted. `pause_on_word_card: true`.
- **Track 89 (Music/SFX)**: LALAL.AI phoenix splitter returns the `back_track` (everything minus voice). Clip placed at the same scene start, directly under Track 90. `pause_on_word_card: false` so music keeps playing under word cards.
- **Alignment**: both clips share the same `start_ms = scene.start_ms` from the same scene graph, so they line up frame-accurate with the original.
- **Two buttons available**: "Redub only", "Music only", plus "Full auto" that runs both in parallel with 3-worker concurrency, atomic JSONB merge RPC, resumable LALAL polling, `Retry-After`-aware retries, and stem reuse on retry.

I will not re-audit these files a 4th time unless a test actually fails — that's crying wolf.

## 3. Splicing / cropping tools — needs verification

You keep asking for this and I've been assuming `TimelineCanvas.tsx` already has it. I'll verify in the next turn:

- Drag left/right edge of clip to trim (crop)
- Drag body to reposition
- Split-at-playhead (razor) to slice out bad middle sections
- Delete selected segment

If any are missing or clunky on Track 89/90, I'll add them in a focused patch. No pipeline changes.

## 4. App Store / Capacitor readiness — brutal truth

**Already handled (verified in `docs/APP_STORE_LAUNCH_CHECKLIST.md` + `capacitor.config.ts`):**
- `@capacitor-community/speech-recognition` installed → routes to native `SFSpeechRecognizer` on iOS. **Yes, this is the iOS equivalent of Web Speech API — same behavior, native under the hood.** You already have this.
- `capacitor.config.ts` has no `server.url` (App Store requirement)
- Sign in with Apple wired
- `/account/delete` route exists (Apple 5.1.1(v))
- Info.plist docs written (mic, speech, camera, encryption)
- R2 migration done → private buckets, presigned URLs. Works fine inside a Capacitor WebView (HTTPS, no cookies needed).

**Not blockers, but you must do them manually before submission** (Lovable can't do any of these — no Mac in the sandbox):
- `npx cap add ios` on your Mac, paste the four Info.plist keys, enable Sign in with Apple capability in Xcode
- Generate branded icon + splash
- Seed 4 reviewer demo accounts
- Physical iPhone + iPad smoke test (Benny mic prompt, retry, skip, video playback)
- Archive + upload via Xcode

**One real risk for App Store:** the Redub Studio + Prewarm are **superadmin-only tools**. Do NOT ship them in the App Store build's user-facing routes — Apple reviewers will hit them and either (a) fail because they're not superadmin, or (b) burn ElevenLabs/LALAL credits. Already gated behind `user_roles`, so reviewers won't see them, but confirm the superadmin surface isn't linked from the student/parent nav.

## 5. What I'll do this turn if you approve

1. Fix the Nuke-button guard (`!voiceId` → allow default) — 1 line.
2. Read `TimelineCanvas.tsx` to confirm split/trim/delete exist and are actually usable; if they're broken or missing, add them.
3. Confirm no superadmin routes are reachable from the student/parent shell (defense in depth for Apple review).

Nothing else changes. Say **go** and I'll ship those three.
