## Brutally honest verdict

The v8 "True Boss Set Pieces" work is **really wired**, not stubbed. Verified this turn:

- `RPGBattleArena.tsx` imports and actually calls `playAttack`, `playEnemyAttack`, `playBossTransform`, `playFinalBlow`, `playBossMechanic`, `hexToHslTriplet`, and emits `burst / shockwave / debris / screenFlash / beam / embers` cues.
- `RPGSpectacleCanvas` and `RPGBossSpectacle` are mounted in the arena tree.
- Spectacle audio is bound to the existing `soundEnabled` toggle.
- Camera rig is subscribed (`useSpectacleCamera`) and its scale/x feed the arena transform; `cameraPunch` and `cameraBossDrift` fire.
- Full TypeScript check passes clean.
- Capacitor deps for App Store porting are present: `@capacitor/ios`, `haptics`, `push-notifications`, `@capacitor-community/speech-recognition`.

So: no, I'm not crying wolf — this is close. But it is **not** "absolutely perfect", and three of the issues are visible to a kid within one boss fight.

## What is actually broken

**1. Boss phase banner can stick on screen (real bug).**
In `RPGBossSpectacle.tsx` the phase-transition effect sets `activePhase`, starts a 1.6s dismiss timer, and returns that timer's cleanup. The effect's deps include `currentHp`, which changes on the very next hit — React runs the cleanup, kills the dismiss timer, and the re-run takes no branch (that phase is already in `firedPhaseIds`), so no new timer is created. The mechanic banner then stays plastered over the middle of the arena until the next phase or the end of the fight.

**2. The anticipation push-in never happens.**
`cameraPushIn` is defined in `spectacleCamera.ts` and called from nowhere. The charge beat has audio and particles but no camera lean, so hits land flatter than designed. Also `camera.y` is computed by the rig but never applied in the arena's transform, so `cameraBossDrift`'s vertical lift is silently dropped.

**3. Reduced-motion students get nothing.**
`RPGSpectacleCanvas` returns `null` when `isSpectacleEnabled()` is false, so those users lose every hit-confirm cue — no flash, no impact feedback. That is a real accessibility/QA note for a school pilot, not just polish.

## Plan — v9 "Ship-Blocker Fix Pass" (small, contained)

1. **Fix the sticky phase banner.** Move the dismiss timer out of the HP-watching effect: keep the HP effect purely for detection (`setActivePhase` + `firedPhaseIds` + audio cue), and add a separate effect keyed only on `activePhase` that owns the 1.6s timeout and its cleanup. Same for the entrance banner pattern.
2. **Wire the push-in.** Call `cameraPushIn` at the start of the charge beat in `attackChoreography.ts` (both hero and enemy paths, toward the attacker's anchor X), so the four-beat timeline has anticipation → strike → impact → settle.
3. **Apply `camera.y`.** Add `y: `${camera.y}%`` to the arena's motion transform alongside `x` and `scale`, so boss drift reads vertically.
4. **Reduced-motion fallback.** When spectacle is disabled, keep a minimal non-animated hit confirm (brief opacity-only damage flash + number pop) so feedback never disappears entirely.
5. **Re-verify.** Typecheck, then drive a boss fight in the preview with Playwright: capture screenshots at entrance, at each phase gate, and 3s after a gate to confirm the banner is gone.

## After that

With those four fixed I'd call RPG mode ship-ready and pivot to App Store deployment: iOS capability/permission strings, native speech-recognition path validation on device, and the submission checklist already drafted in `docs/`.

Not addressed here (deliberately): no new content, worlds, or economy changes — the loop, loot, ranks, quests, and season pass are all wired and verified from the previous passes.