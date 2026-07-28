## Honest verdict

The v10 work landed and is correctly wired. I confirmed each piece in the arena file rather than trusting the summary:

- Combat coach marks mount on first battle, gated by `hasSeenCombatCoach()`.
- The "READ FAST TO BLOCK" prompt renders during `enemyTelegraph` while `blockTraining` is true.
- `bumpBlockSuccess()` increments only on an actual parry inside the block window.
- The "Ultimate ready" banner fires once per battle and resets on new battles.
- The effects toggle is in the battle header and persists through `setSpectacleEnabled`.

So: no, nothing from the last pass is half-done. But "ready to ship" is still not true, for two reasons.

## Gap 1 — the tutorial gating is per-device, not per-student

Both `yubi.rpg.combatcoach.v1` and `yubi.rpg.blocks.landed.v1` live in `localStorage`. On a shared classroom iPad — which is the mandated primary device — the first child through sees the tutorial and lands three blocks. Every child after them on that same iPad gets **zero** combat teaching and **no** block prompt. In a 25-student class that means 24 kids hit the exact problem v10 was built to solve.

This is the difference between "we taught the fight" and "we taught one child per iPad."

Fix: namespace both keys by the signed-in user id (fall back to the device-wide key only when there is no session). Same components, same UX, one key change plus a small helper.

## Gap 2 — nothing has run on hardware

There is no `ios/` folder in the repo (correct — it is generated after export). That means haptics, native speech recognition, and the particle canvas frame rate have never executed outside a sandboxed Chrome. Every performance claim is currently a claim about a desktop browser. All of Phase 5 in `docs/PRE_SUBMISSION_RUNBOOK.md` is unchecked.

## Plan

1. **Per-student tutorial keys.** Add a small helper that suffixes the coach-mark and block-training localStorage keys with the current user id. Update `RPGCombatCoachMarks.tsx` and the `BLOCK_TRAINING_KEY` helpers in `RPGBattleArena.tsx` to use it. No behavior change for single-user devices.
2. **Teacher-side reset (optional, small).** Not required for pilots; skip unless you want it — the per-student key makes it mostly unnecessary.
3. **Pivot to App Store.** Export to GitHub, `npx cap add ios`, then walk the runbook in order: Phase 1 demo accounts, Phase 2 Apple Developer, Phase 3 App Store Connect, Phase 4 Info.plist + icons, Phase 5 TestFlight smoke tests on a real iPhone and a real iPad.

## Answer to the actual question

RPG mode is mechanically complete, taught, and the spectacle is genuinely strong. It is not "perfect" — item 1 above is a real classroom-blocking defect, and it is roughly 20 minutes of work. After that, yes: the remaining risk is entirely on-device, and that is where your attention should go.
