## Brutally honest: the v9 pass landed, but "perfect" is still not the word

Verified in the code right now, not from memory:

- `attackChoreography.ts:113` calls `cameraPushIn(from.x, beat.anticipation)` — the anticipation lean is live for hero and enemy attacks.
- `RPGBattleArena.tsx:3159/3164` applies `camera.y` in both the shake and rest transforms — boss drift now reads vertically.
- `RPGBossSpectacle.tsx:67` has the dismiss timer in its own `[activePhase]` effect — the sticky-banner bug is gone.
- `RPGSpectacleCanvas.tsx:51` returns `<ReducedMotionHitConfirm/>` instead of `null` — reduced-motion students still get a hit confirm.
- Full typecheck clean; all touched modules transform in the dev server.
- `capacitor.config.ts` is already production-shaped: no `server.url` block (Guideline 2.5.2), ATS untouched, splash/keyboard/push configured. `docs/ios-info-plist-additions.md` has the exact mic / speech / camera usage strings, category, and encryption keys. Apple sign-in exists in `src/pages/Auth.tsx`.

So the spectacle work is done and correct. What is **not** true is "absolutely perfect and nothing missing."

## The three real gaps

**1. Combat is never taught — this is the biggest one.**
`RPGCoachMarks.tsx` teaches meta systems only: Gear Locker, Equip, Daily quests, Season Pass, Ranks. It teaches **nothing** about the fight itself. The 1100ms enemy telegraph and the block window (75% damage reduction) and the Ultimate meter are all implemented — and a 7-year-old has no way to discover any of them. They will stand there and eat every boss hit, then decide the game is unfair. An addictive loop that the player can't see is not an addictive loop.

**2. Nothing has been verified on a real device.**
There is no `ios/` or `android/` folder in the repo (correct — those are generated after export on your Mac). That means haptics, `@capacitor-community/speech-recognition`, and the spectacle canvas frame rate on an actual iPad have **never run on hardware**. Every performance claim about the particle engine is a claim about Chrome in a sandbox. `docs/PRE_SUBMISSION_RUNBOOK.md` still has all of Phases 1-5 unchecked.

**3. No spectacle/motion setting surfaced to schools.**
`isSpectacleEnabled()` respects OS reduced-motion and an internal flag, but there is no teacher- or parent-facing toggle. A district that asks "can I turn the flashing off for a photosensitive student?" currently gets "change their iOS setting."

## Plan — v10 "Teach The Fight + Pre-Flight"

1. **Combat coach marks (first battle only).** Add a small `RPGCombatCoachMarks` shown inside `RPGBattleArena` on a student's first fight, gated by a `localStorage` seen-flag like the existing coach marks: three beats — "Read to attack", "When the enemy glows, TAP TO BLOCK", "Fill the meter for your Ultimate."
2. **Live block prompt.** During the enemy telegraph window, show a large, unmissable "TAP TO BLOCK!" pulse over the block target for the first N battles, then fade to the subtle version once the student has blocked successfully a few times. Presentation only — no change to the damage math or the 1100ms window.
3. **Ultimate ready callout.** When `ultReady` flips true, fire a one-time-per-battle banner + audio sting so the meter is not just a bar nobody reads.
4. **Spectacle toggle in settings.** Surface an "Extra effects" on/off switch in the existing game header settings (gear icon), wired to `setSpectacleEnabled` and persisted, so the reduced-motion path is a choice, not an OS side effect.
5. **Device pre-flight pass.** Once you export to GitHub and run `npx cap add ios`, walk the runbook Phase 5 smoke tests together: mic permission prompt, speech recognition on device, haptics on a real hit, one full boss fight at 60fps on iPad, and account deletion reachable.

## Straight answer to the question

RPG mode is mechanically complete and the spectacle is genuinely strong. It is **not** ready to ship until players are taught to block — that single gap is the difference between "this is hard and fun" and "this is unfair." Items 1-4 are a few hours of frontend work. After that, yes: pivot fully to App Store deployment and do the device verification, because that is where the remaining risk actually lives.