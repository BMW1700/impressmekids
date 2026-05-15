## Problem

In Pre-K mode (World 102 "Action Time" + World 103 phrases), most verbs share the same generic transform (shake/wiggle), so "clap", "wave", "nod", "shake", "dance" all look identical. Kids can't connect the printed word to its meaning, which is the whole point of Action Time.

Today the verb library (`src/lib/verbAnimations.ts`) is shared with grades 6–12 battle mode and is intentionally minimal: a single transform OR a single emoji prop. That ceiling is what's making everything look the same.

## Approach

Build a **Pre-K-specific signature animation layer** that runs *on top of* the existing verb system, only for Pre-K worlds. Each Pre-K verb gets a hand-authored, instantly-recognizable mini-scene with:

1. **Multiple synchronized emoji props** flying in distinct, meaning-shaped paths (e.g. clap = two 👏 hands meeting from left + right; wave = 👋 swinging in arc; eat apple = 🍎 flies to mouth then 🍏✨ crumbs).
2. **A matching character body transform** that mimics the action (jump = vertical arc + squash landing; sleep = tilt + slow fade; sing = open-mouth bob; spin = full rotate; sit = squish down; fly = arc across screen).
3. **A short on-screen action label / sound effect emoji** ("BOING!", "ZZZ", "🎵🎵") so the meaning lands even without audio.
4. **Slower pacing** (~1.6–2.0s) so 3–5-year-olds can actually watch it complete.

The character keeps its current single-sprite art (no need to add 3D or rigged hands) — the props *become* the hands, the food, the bed, the wand. This is how Duolingo ABC and Khan Academy Kids convey verbs: prop choreography around a static mascot.

## What gets built

### 1. New descriptor type: `compound`

In `src/lib/verbAnimations.ts` add:

```ts
type CompoundVerbDescriptor = {
  kind: "compound";
  props: EmojiPropDescriptor[];   // multiple emojis, each with own path/timing
  transform?: TransformVerbDescriptor; // optional character motion played in parallel
  label?: { text: string; color?: string }; // optional "BOING!" badge
  duration: number; // total scene length
};
```

### 2. `VerbAnimationLayer` upgraded to render N props

Today it renders one emoji. Change it to accept either a single descriptor (back-compat) or a `compound` descriptor, then map over `props[]` and animate each independently with its own delay/path/rotation. Add an absolutely-positioned label badge when `label` is set.

### 3. New Pre-K signature library

Create `src/lib/prekVerbAnimations.ts` with one signature scene per Pre-K word. Examples (all use compound):

```text
jump   → character arcs up 60px + lands with squash; 💨 puff at feet on landing; "BOING!" label
hop    → two short arcs (smaller); 🐰 prop bounces alongside
run    → character tilts forward + leg-blur; 💨💨💨 trail flies left across screen
spin   → character rotateY 720°; 🌀 expands behind it
flip   → rotateX 360°; ⭐ trail in arc
twirl  → rotate 540° + scaleX wobble; ✨✨ sparkles orbit
clap   → 👏 from left + 👏 from right meet at center, scale up, "CLAP!" label, character squish
wave   → 👋 enters from side, swings rotate -30°↔30° three times; character tilts toward it
dance  → character does the existing dance transform + 🎵 + 🎶 + 💃 emojis bob around it
eat    → 🍎 flies from right to character mouth, shrinks to 0; 😋 puff appears; tiny crumbs ✨
drink  → 🥤 tilts up to mouth, character head tilts back, 💧 droplet falls
sleep  → character tilts 20° + dims; 💤 then 💤 then 💤 float up with stagger; "ZZZ" label
sing   → character bobs + opens (scaleY pulse); 🎵 🎶 🎼 emit on a fountain arc
fly    → character translates across screen with gentle arc; 🪶 trail
grow   → character scales 1→1.6; 🌱→🌿→🌳 chain of emojis stacking
shrink → character scales 1→0.4; 🔻 arrow above
wiggle → existing wiggle + 🪱 prop alongside
```

Phrases (World 103) similarly:

```text
help me/you  → 🤝 prop slides in between, character leans
my dog/your dog → 🐶 emoji enters and sits next to character
in the box   → 📦 appears, character hops INTO box (translate down + clip)
on the box   → 📦 appears below, character hops ONTO it (translate up + land)
drink water  → 💧→🥤 to mouth, head tilt
eat apple    → 🍎 to mouth, shrink, 🍏 core falls
wash hands   → 🫧🫧🫧 swirl around character; 💧 droplets
plant seed   → 🌱 drops from above into ground line, then sprouts 🌿
throw ball   → ⚾ flies left across screen with arc + spin; character follow-through tilt
```

Each entry hand-tuned: distinct emojis, distinct trajectories, distinct durations. No two should be confusable.

### 4. Wire it into `RPGOneWordReader` only

In `RPGOneWordReader.tsx`:

- Replace the call to `resolveVerbAnimation(currentWord)` / `useVerbAnimation` with a Pre-K-aware resolver: try `resolvePreKVerb(word)` first; fall back to existing `resolveVerbAnimation` if Pre-K library has no entry.
- When the descriptor is `compound`, run `transform` on the enemy `motion.div` and pass the full `props[]` array + `label` to `VerbAnimationLayer`.
- Bump the verb-active grace window from 1400ms → 2000ms so compound scenes finish before the next word.
- Keep grades 6–12 battle mode untouched — they keep using the lean library.

### 5. No new assets / no 3D

Everything uses native emoji + framer-motion transforms — zero image generation, zero rigging, zero perf cost. The "hands/objects" the user asked about are emoji props orbiting the existing sprite, which reads just as well to a 4-year-old and ships today.

## Files touched

- `src/lib/verbAnimations.ts` — add `CompoundVerbDescriptor` type + export.
- `src/components/aura/game/effects/VerbAnimationLayer.tsx` — render array of props + optional label badge.
- `src/lib/prekVerbAnimations.ts` — **new**, signature scene per Pre-K word/phrase.
- `src/hooks/useVerbAnimation.ts` — accept Pre-K resolver path (or add `usePreKVerbAnimation`).
- `src/components/aura/game/rpg/RPGOneWordReader.tsx` — use Pre-K resolver, pass compound descriptor through, extend grace window.

## Acceptance

- "clap", "wave", "nod", "shake", "dance" each look obviously different at a glance.
- Every verb in World 102 + every phrase in World 103 has a unique signature scene that pictorially conveys the meaning (a parent watching with sound off can guess the word).
- Grades 6–12 battle animations are unchanged.
- Animation completes before the next word card appears; no overlap, no jank at 690×636.

## Open question (low-stakes, can decide during build)

Should the action **label badge** ("BOING!", "ZZZ", "CLAP!") be on by default, or hidden behind a teacher toggle? Default ON for Pre-K is recommended — it doubles as sight-word exposure — but happy to make it a setting.
