## Brutally honest audit first — no, the last implementation did not all work

I re-read the actual source before writing this. Three things I previously described as done are **not wired up**. Typecheck passing hid this, because dead code compiles fine.

**1. The four-beat attack timeline is dead code.**
`playAttack` and `playEnemyAttack` in `src/lib/rpg/attackChoreography.ts` have **zero call sites** anywhere in the app. Only `playBossTransform`, `playSuperAttack` and `playFinalBlow` are imported by the arena. So the Anticipation beat — the exact thing I told you makes Kirby feel like Kirby — is not in the game. Every normal hero hit still just fires a burst + shockwave at the moment of impact, with no wind-up.

**2. The per-boss catalog is orphaned.**
`src/lib/rpgBossSpectacle.ts` holds a genuinely good catalog: per-boss titles, entrance quotes, colors, and 2–3 named phase mechanics (`VOID PULL`, `REALITY SHATTER`, `SOLAR FLARE`, `FINAL EDIT`) with taunts. The component that renders it, `RPGBossSpectacle.tsx`, is **never mounted** — the arena imports only `isBossType` from that file. Meanwhile the phase gates I added are hardcoded to 50% / 15% with fixed `'shadow'` and `'arcane'` hues. Every boss in the game currently transforms identically.

**3. The entire spectacle is silent.**
`RPGBattleArena.tsx` contains no audio calls at all, and nothing under `src/lib/rpg/` touches `AudioContext`. The "synthesized boss audio" I claimed earlier does not exist in the battle path. A screen-wide plasma beam with no sound reads as a screensaver, not a boss.

**Answering the technology question directly: you are not constrained.** The hard part is already built and working — the canvas engine supports beams, bursts, shockwaves, bloom orbs, embers, debris, disintegration and screen flash with pooling and adaptive quality; the boss data exists; and `src/components/aura/game/castle/sfx.ts` already proves WebAudio synth works in this codebase. What's missing is wiring, not capability. No new dependency, no WebGL rewrite.

**Is it ready to ship?** The systems are ready. The spectacle is about 60% real and 40% scaffolding. I would not put this in front of a Bronx principal as "the addicting part" until the three gaps above are closed — a kid will notice silence and identical bosses immediately.

---

## Master Plan v8 — True Boss Set Pieces

### Phase 1: Connect the dead choreography (highest value, lowest risk)
Route hero and enemy attacks through `playAttack` / `playEnemyAttack` instead of the bare impact call, so every strike gets its wind-up. The existing `triggerScreenShake` becomes the `onImpact` callback, which also guarantees shake, hit-stop, haptics and particles land on the same frame. Element hue comes from the equipped weapon / character rather than a constant.

### Phase 2: Data-driven boss set pieces
Replace the hardcoded 50%/15% gates with the real per-boss phase list from `getBossSpectacle(enemy.id)`:
- Each phase fires at its own `hpThreshold` with its own `mechanicColor` mapped to a spectacle hue.
- The phase banner shows the boss's real `mechanicName` + emoji + `taunt` instead of a generic "TRANSFORMS!".
- Each named mechanic gets a distinct choreography shape rather than one shared beam sweep:

```text
ASTEROID BARRAGE  staggered plasmaBolts raining from off-screen top
VOID PULL         inward-converging embers + arena drift toward the boss
REALITY SHATTER   full screenFlash, radial shockwave ring, heavy debris
SUPERNOVA         expanding bloomOrb into a white-out, then embers
BINDING WORDS     beams that lock onto the hero anchor one at a time
```

### Phase 3: Mount the orphan and give bosses a voice
Mount `RPGBossSpectacle` in the arena so entrance titles, quotes and phase callouts actually appear. Add a small WebAudio module modelled on `castle/sfx.ts`: charge whine, beam roar, impact thud, transformation stinger, final-blow silence-then-boom. Respects the existing spectacle/reduced-motion toggle and mutes with the app's audio setting.

### Phase 4: Final-blow cinematic upgrade
Per-boss disintegration color, a brief slow-motion hold before the victory banner, and the boss's defeat line — so the climax is the loudest moment in the session, not a banner swap.

### Technical notes
- All work is presentational. No damage math, reward path, quest crediting or reading-recognition logic is touched.
- Every new effect goes through the existing pooled `emitSpectacle` cue system and honours `isSpectacleEnabled()`, so reduced-motion and low-end tablets degrade to the current behaviour.
- Boss phase state stays in refs guarded by `bossPhasesFiredRef` so nothing double-fires on re-render.
- Files: `attackChoreography.ts`, `rpgBossSpectacle.ts`, `RPGBattleArena.tsx`, `RPGBossSpectacle.tsx`, plus one new `src/lib/rpg/spectacleAudio.ts`.

### What I will not claim this time
I will verify each wiring point with a grep for call sites before reporting it done, not just a passing typecheck.

### On App Store porting
After v8. Shipping the port while bosses are silent and identical means shipping the weakest version of the thing the store screenshots will sell.
