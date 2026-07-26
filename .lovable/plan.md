## Honest read first

The RPG mode has **more systems than almost any reading app on the market** — 25+ mini-game phases, loot, seasons, ranks, pets, upgrades, PvP/co-op, boss spectacle. Content and depth are not the problem.

What's thin is **game feel** — the 100-millisecond layer between "child says the word correctly" and "child feels a hit land." That layer is what makes a game physically addictive, and right now it's the weakest part of the stack. Verified in the code:

- **Screen shake is a flat 5px, 0.3s** regardless of whether the hit was 4 damage or a 90-damage crit (`RPGBattleArena.tsx:2692`). Every hit feels identical.
- **No hit-stop anywhere in the RPG.** Castle Swarm already has it (`CastleSwarmArena.tsx` freezes 70–150ms on impact) and it's the single biggest reason that mode feels punchier. RPG never freezes on contact.
- **Zero haptics in the entire app.** No `navigator.vibrate`, no Capacitor Haptics. On an iPad — the primary classroom device — that's the most powerful "addictive" channel available and it is completely unused.
- **Crits are computed but barely shown.** `isCritical` drives a floating number and nothing else — no zoom, no color shift, no distinct sound, no slow-motion.
- **Streak is a text chip.** `x3` in the corner. A streak is the core addiction loop of any action game and it currently has no escalating audio, no visual heat, no risk-of-loss tension.
- **Attack animations are ambient, not impact-driven.** The sprite work is mostly infinite idle loops (breathing, glowing). There's no anticipation → contact → recoil arc, which is what reads as "amazing attack animation."

So: the gameplay is deep and varied, but it does not yet *hit*. That's fixable without adding a single new mini-game.

---

## The Game Feel Pass

### Tier 1 — Impact (this is the whole ballgame)

**1. Damage-scaled impact system**
One shared `impact(intensity)` helper driving every hit:
- Shake amplitude, duration, and rotation scale with damage-as-percentage-of-enemy-max-HP, not a fixed 5px.
- Hit-stop: freeze the arena 60ms on a normal hit, 140ms on a crit, 220ms on a boss phase break — ported from the Castle Swarm pattern that already works.
- Impact flash: one-frame white blowout on the struck sprite.

**2. Haptics on iPad and phone**
Capacitor Haptics with a web `navigator.vibrate` fallback, routed through the existing mute/settings toggle so classrooms can silence it:
- Light tick on each correct word, medium thump on hit landing, heavy on crit and boss break, error buzz on a miss.

**3. Crit gets its own language**
Screen punches in ~4%, brief desaturation of everything except the crit number, a distinct rising sound, radial impact lines, and the damage number arrives large and rotated instead of drifting up like a normal hit.

**4. Attack animation arc**
Rebuild the attack beat as anticipation (wind-back, ~120ms) → strike (fast, ~80ms, with a motion-trail smear) → contact (hit-stop + particle burst at the point of contact) → recoil on the target. Same for the enemy's attacks so incoming damage feels dangerous.

### Tier 2 — Escalation (the addiction loop)

**5. Streak heat**
The streak becomes the visual state of the whole screen: at x3 the hero's weapon ignites, at x5 the background pulses with the hero's element, at x8 a "UNSTOPPABLE" banner and the music layer adds a track. Each streak tier raises the sound pitch a step — the rising-pitch ladder is the cheapest and most reliable dopamine device in games.

**6. Break-the-streak tension**
A visible, decaying streak meter between words. It's not just a counter that resets on a miss — the child can *see* it draining, which converts reading speed into felt urgency.

**7. Boss break moments**
When a boss crosses a phase threshold, stop everything: full hit-stop, boss stagger animation, camera push-in, and a free-hit window where the next correct word does double damage. Gives every boss fight two or three memorable spikes instead of a flat HP drain.

### Tier 3 — One new element worth adding

**8. Ultimate meter**
A charge bar that fills from correct words and streaks. When full, the child gets a one-tap ultimate: a full-screen character-specific attack with its own animation, sound, and hit-stop. This is the "I want to play again" hook — it gives the child something they're *saving up for* across a whole battle, which is exactly the mechanic the current loop is missing.

---

## Explicitly out of scope

No new mini-games, no new bosses, no new worlds, no new cosmetics. The library is already large; the problem is not variety, it's impact. Adding more phases would make it worse.

---

## Technical notes

- All of it lands in the presentation layer — `RPGBattleArena.tsx`, `RPGCharacterSprite.tsx`, `RPGSpellEffects.tsx`, and the `SoundEffects` class. Damage math, quest credit, and the reading/speech pipeline are untouched.
- Hit-stop is implemented as a render-pause flag, matching the existing `hitStopUntilRef` pattern in Castle Swarm — it must never pause the speech recognizer, only the visuals.
- Haptics need `@capacitor/haptics` and must respect the existing game mute setting plus a per-classroom off switch.
- Every effect gets an intensity ceiling and honors `prefers-reduced-motion` — screen flashes and rapid shake are a real accessibility and photosensitivity concern for K-5, so the reduced-motion path swaps flashes for scale pops.
- The ultimate meter is client-state only for v1; no schema change.
