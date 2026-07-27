# RPG v3 — "Breathtaking" Pass

## Honest verdict first

**Ready to ship? No — but not because it's broken.** It's mechanically complete and stable. Two real gaps:

1. **The spectacle ceiling is CSS.** Every effect (`RPGSpellEffects`, `RPGEnemyAbilityEffect`, sprite smears, ultimate flashes) is a DOM node with a keyframe animation. That caps you at "polished web game." Kirby's Magolor fight works because of: hundreds of simultaneous particles, screen-filling beams with bloom, multi-phase transformation, camera pushes/pulls, and 8–12 frames of anticipation before every attack. You cannot get there with divs — you need one canvas layer sitting over the arena.
2. **Too much going on — in the wrong places.** 40+ minigame components, 5 battle modes, gear locker, season pass, daily hub, leaderboards, ranks, pets, themes, store. A 7-year-old sees a dashboard, not an adventure. Meanwhile the boss climax — the thing that should be overwhelming — gets the same visual budget as a random encounter. The fix is not "delete features," it's **gate them behind progression** so the first 10 minutes are pure combat.

**Verdict: 2 focused passes, then port.** Not months.

---

## Phase 1 — Spectacle Engine (the Kirby layer)

A single GPU-friendly canvas overlay mounted once in `RPGBattleArena`, driven by an event bus. Effects become data, not components.

**New: `src/lib/rpg/spectacleEngine.ts`**
- One `requestAnimationFrame` loop, one `<canvas>`, object-pooled particles (cap ~600, auto-degrade to 200 on low-end/iOS).
- Emitters: `burst`, `beam`, `shockwave`, `debris`, `sparkTrail`, `screenFlash`, `bloomOrb`, `plasmaBolt`.
- Additive blending for plasma/energy so beams actually glow instead of looking like colored rectangles.
- Respects `prefers-reduced-motion` and a Settings toggle (schools will ask).

**New: `src/components/aura/game/rpg/v2/RPGSpectacleCanvas.tsx`** — mounts the engine, absolutely positioned over the arena, `pointer-events: none`.

**New: `src/lib/rpg/attackChoreography.ts`** — every attack becomes a timeline, not a single animation:
```text
ANTICIPATION (250ms)  charge glow + sprite crouch + camera push-in
STRIKE      (120ms)   beam/bolt fires, motion smear
IMPACT      (90ms)    hit-stop, white flash, radial shockwave, debris
RECOVERY    (400ms)   embers fall, camera settles, damage number arcs up
```
Wire the existing `rpgGameFeel` shake/hit-stop/haptics into the IMPACT beat so they land on the same frame instead of firing independently.

**Camera rig** — a transform wrapper around the arena supporting push-in on charge, punch-out on impact, and a slow drift during boss phases. This single addition does more for "wow" than any particle.

---

## Phase 2 — Boss climax rework (the Magolor moment)

Upgrade `RPGBossSpectacle` / final-boss encounters only — normal enemies stay cheap.

- **Multi-phase fights.** At 50% HP the boss *transforms*: screen desaturates, sprite scales up, arena background shifts palette, new attack set unlocks. At 15% it goes desperate — faster telegraphs, screen-edge vignette pulse.
- **Signature super attacks** (2–3 per boss) with 1.5s telegraph, full-screen plasma beam sweep, and a readable dodge/block window. These are the moments kids will describe to their friends.
- **Final blow cinematic**: hit-stop freeze → radial white-out → boss disintegration into particles → slow-motion camera pull → victory banner.
- **Audio**: layered synth stings per beat (charge riser, impact, disintegrate) reusing the existing spectacle audio approach.

---

## Phase 3 — Focus pass (fix "too much going on")

Nothing is deleted; everything is **sequenced**.

- **First-run funnel**: character select → scripted first battle (existing `RPGCoachMarks`) → first level. No hub, no store, no locker visible.
- **Progressive unlocks**, surfaced as celebratory "NEW!" moments rather than always-on buttons:
  - Store + Gear Locker → after level 3
  - Daily Hub / Season Pass → after first day-2 login
  - Leaderboards / Ranks → after level 5
  - Multiplayer / battle-mode selector → after first world clear
- **HUD diet**: during battle show only HP, ultimate meter, streak, and the current word. Quest chip collapses to a thin edge pip and only expands on progress.
- **Minigame rotation**: pull from a weighted pool of ~8 per world instead of exposing all 40, so each feels like a set piece rather than a grab bag.

---

## Phase 4 — App Store port (after 1–3)

- Verify canvas perf on a real iPad (target 60fps, auto-degrade path tested).
- Native haptics through Capacitor on every IMPACT beat.
- Audio session config so effects don't duck background/TTS.
- Then run the store submission checklist.

---

## Technical notes

- Canvas overlay is additive-only and never intercepts input, so existing battle logic, RLS, quests, and reward wiring are untouched.
- Existing CSS effect components remain as the fallback path when the engine is disabled (reduced-motion / low-end).
- No database changes in Phases 1–3.
- `RPGBattleArena.tsx` is already 4,033 lines — the choreography timeline moves attack sequencing *out* of it into `attackChoreography.ts`, which shrinks it rather than growing it.

## What I'd cut if you want it faster

Phase 3 can ship independently and is ~1 pass of work. Phase 1 is the one that actually delivers "breathtaking" — I would not skip it.
