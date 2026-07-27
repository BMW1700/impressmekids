## Honest read

The impact layer that was missing last round is now in and verified in the code: damage-scaled shake/hit-stop/flash routes through one `triggerScreenShake` choke point, haptics fire per intensity, boss breaks fire at 66%/33% with a free-hit window, streak heat glows the arena and steps the sound pitch, and the Ultimate meter charges from reading and blasts with its own profile.

So the "does a hit feel like a hit" problem is solved. What is still verifiably thin:

1. **The attack animation is not an animation.** In `RPGCharacterSprite.tsx` the entire attack is one spring translate of ±30px (`x: isAttacking ? -30 : ...`). There is no wind-back, no fast strike, no smear, no recoil on the target. This is the single biggest remaining gap versus "amazing attack animations."
2. **Crits share the normal visual language.** `isCritical` only picks a bigger shake profile and a different sound. The floating number, colour, and screen treatment are the same as a 4-damage poke.
3. **Streaks have no tension.** Heat tiers exist, but nothing decays — the child never *sees* the streak at risk, so reading fast has no felt urgency.
4. **Enemy attacks are not dangerous-feeling.** Incoming damage is a scale-to-0.95 blip; there is no telegraph, so there is nothing for the child to react to between words.

## The plan

### 1. Attack animation arc (the main event)
Rebuild the attack beat in `RPGCharacterSprite.tsx` as a real four-part arc driven by an attack nonce so back-to-back attacks re-fire cleanly:
- **Anticipation** ~120ms: wind back away from the target, slight squash, weapon/aura charges.
- **Strike** ~80ms: fast lunge past the contact point with a motion-trail smear (stacked, blurred, fading ghost copies of the sprite) and a slight forward lean.
- **Contact**: particle burst at the contact point, synced to the existing hit-stop window.
- **Recoil**: the struck sprite kicks back, flashes white for one frame, and settles.

Enemy attacks get the same arc so incoming damage reads as a real swing, not a nudge.

### 2. Crit gets its own language
- Damage number arrives large, rotated, gold-on-black with a scale-punch instead of drifting up.
- Radial impact lines burst from the contact point.
- Brief desaturation of everything except the crit number during the crit hit-stop.
- Reuse the existing crit shake profile and `critHit()` sound — no new audio work.

### 3. Streak decay meter
A thin, visibly draining bar under the streak chip between words. It refills on each correct word and drains over the word window; if it empties the streak drops a tier (not to zero — dropping to zero punishes struggling readers). Purely presentational on top of the existing streak counter; no change to damage math or quest credit.

### 4. Enemy telegraph + block beat
Before an enemy attack lands, the enemy sprite winds up with a red telegraph flash for a short window. Reading the current word correctly during that window blocks the hit (reduced damage, block spark, distinct haptic). This is the one genuinely new mechanic — it converts reading speed into moment-to-moment defence, which is the missing "I have to react right now" element.

## Guardrails

- Everything stays in the presentation layer: `RPGCharacterSprite.tsx`, `RPGBattleArena.tsx` render/effects, `RPGSpellEffects.tsx`. Damage math, quest credit, and the speech pipeline are untouched — except the block beat, which only applies a damage multiplier at the existing enemy-attack site.
- Every new effect honours `prefers-reduced-motion` via the existing `rpgGameFeel` profile reducer: smears and desaturation are dropped, timing beats are kept.
- Hit-stop stays a visual flag only; it must never gate the recognizer.
- No new mini-games, bosses, worlds, or cosmetics.

## Technical notes

- The arc uses framer-motion keyframe arrays with per-segment `times`, keyed on an attack nonce so a new attack interrupts the old one instead of queueing.
- Smear ghosts are 3 absolutely-positioned copies at decreasing opacity and increasing blur, rendered only during the strike segment and only when reduced motion is off.
- The decay meter is a ref-driven `requestAnimationFrame` value written to a CSS custom property, so it never re-renders the arena per frame (consistent with the ref-based counter rule already used in the speech components).
