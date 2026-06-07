## Brutally honest audit

You asked for it, so here it is — no sugarcoating. The three screenshots show exactly where this mode is going to lose Patrick:

1. **Benny is a static cutout, not a character.** Right now `BennyDog.tsx` has three PNGs (idle / celebrate / sad) plus a 30-frame idle sprite-sheet for "breathing." There is no walking, no jumping, no reacting to the obstacle — when Benny "solves" the river, we cross-fade to the celebrate PNG and add a CSS bounce. For a 3–4 year old that's fine; for a superintendent demo it reads as a slideshow with a dog sticker, not Mario.
2. **The props look like clip-art glued on grass.** The blue river is a flat rectangle, the boots are a 64px emoji (🥾) on the dirt, and the gate is two gray rectangles with a yellow key emoji floating between them. The screenshots literally show this — the boots are smaller than Benny's tag, and the key is dwarfed by the pillars. It feels unfinished, exactly like you said.
3. **Some words are wrong for Pre-K.** W101 L1 currently has JUMP, BOOTS, KEY, **AXE**, BONE. W101 L3 has SUN, **ROOSTER**, BELL, KETTLE, FLOWERS. AXE has a CVCe-ish shape Pre-K kids cannot decode and a violent prop. ROOSTER is two syllables with a tricky 'oo' digraph (you spelled it "roster" — that's a clue this word is too hard even to remember which it is). KETTLE has a double-T and a schwa.
4. **The voice flow gives the answer away.** Today: Benny says "Oh no! A river is in the way!" → then "I need to leap over it..." → then we show the word JUMP and ask the child to say it. "Leap over it" already IS the answer in synonyms. You're right — the ask should end with an open slot the child fills with the target word: "I need to…" → child says **JUMP**.
5. **No payoff after the word.** When the child says JUMP, Benny doesn't actually jump over the river — we cross-fade to the celebrate PNG and play a sparkle. The whole promise of the mode is "I say the word, Benny does the thing." That promise is broken.

Everything else (TTS, speech matching, level select, story shell, Nabu the Owl wrapper, audio cues) is solid. The hole is presentation + the verb-payoff loop.

---

## The fix — five focused changes

### 1. Rig Benny so he actually performs the verb

Real answer to your question: yes, we can do better than PNG swaps, but no, we are not going to import a Mario-style skeletal rig (Spine / Rive / DragonBones) just for the demo — it adds a runtime, a license question, and a re-export of every pose. The right pragmatic move is **layered CSS transforms on body parts of Benny**, the same trick Duolingo's owl uses:

- Slice Benny once into 4 PNG layers with transparent backgrounds: `body`, `head`, `front-legs`, `back-legs` (we already have the artwork — we just need to export 4 layers from the existing image, no new art required).
- Build `<BennyRigged />` that stacks the 4 layers absolutely. Each layer is a `motion.div` driven by named poses: `idle`, `walk`, `jump`, `splash`, `unlock`, `bark`, `cheer`, `sad`.
- Poses are pure Framer Motion keyframe sequences on translate / rotate / scaleY (e.g. `jump` = squash legs → launch body up 120px while rotating head back 10° → land squash → rebound). This is what `prekVerbAnimations.ts` already does for the K-12 character; we extend the same pattern to Benny.
- Idle stays the existing sprite-sheet breathing. We never load the static celebrate/sad PNGs again — those moods become poses on the rig.

This gets us Mario-grade motion without a rigging runtime, and the existing speech-→-animation pipe (`useVerbAnimation`) plugs straight in.

### 2. Replace emoji props with painted SVG scenes that fill the stage

In `NabuScene.tsx` the obstacle/solution rendering currently drops the emoji at ~64–80px. Three concrete upgrades:

- **River scene**: replace the flat blue rectangle with a multi-layer SVG (far bank, water with two animated wave paths, near bank, reeds). The "bridge" / "jump arc" appears as a real painted arc Benny tracks along.
- **Mud scene**: keep the three holes but paint them as 3D-ish ovals with rim light + inner shadow, and render the boots as a **large painted SVG pair (~140px each)** that fly in from off-screen and land on Benny's feet (parented to the rig's `front-legs` layer). Splash particles spawn from each hole as he stomps through.
- **Gate scene**: re-skin the gray pillars as a real wooden/stone gate SVG with hinges and a glowing keyhole. The key grows from ~40px to a chunky **~120px SVG** with a metallic gradient, floats to the keyhole, rotates 90°, and the gate doors swing open before Benny walks through.

All three are pure SVG inside the existing `NabuScene` switch — no new asset pipeline, no images to commission.

### 3. Simpler, decodable word bank

Drop every word that isn't a Pre-K decodable CVC / CVCC / common sight word with a one-image referent. Proposed replacements (only changing words, not story beats):

| Level | Old word | New word | Why |
|---|---|---|---|
| W101 L1 #4 | AXE | CHOP (sight-word verb, action obvious) or SAW | AXE has a silent E pattern and a violent prop |
| W101 L3 #2 | ROOSTER | SUN (already at #1, swap) → use **HEN** | one syllable, CVC, same wake-up gag |
| W101 L3 #4 | KETTLE | **POT** | CVC, same "ding" gag |
| W101 L2 #3 | LADDER | **STEPS** | LADDER has a double-D + schwa; STEPS is decodable CCVCC |
| W101 L2 #4 | UMBRELLA | **HOOD** | 3-syllable → CVC sight word |

(I'll do the same sweep across W102/W103 — easy to enumerate before I edit.)

### 4. Cloze-style speech flow ("I need to …")

Change the obstacle script shape and the phase driver so the ASK line ends in an audible ellipsis and the child's spoken word IS the completion.

- `PreKObstacle.askLine` becomes a **sentence stem** that ends right before the word. e.g. for the river obstacle: `problemLine: "Oh no! A river!"` → `askLine: "I need to..."` (TTS pauses on the "…") → child says `"JUMP"` → Benny jumps.
- In `NabuAdventure.tsx` the `ask → reading` transition stays, but we shorten the gap to 600ms so the word card and the listening mic come up before the kid loses the stem.
- Re-write every askLine across all levels to be a stem the target word literally completes ("Splash! I need my…" → BOOTS, "Locked! I need a…" → KEY, "Tree in the way! I need to…" → CHOP).

### 5. Wire spoken word → rigged pose → scene payoff

The handshake everything else exists for:

- Add a `solutionPose: BennyPose` field to each `PreKObstacle` ("jump", "splash", "unlock", "bark", "cheer").
- When `handleResult(true)` fires, set `bennyPose` to the obstacle's pose for ~1.6s, then return to idle. The scene SVG plays its solved-state in parallel (water gets crossed, mud holes splash and clear, gate doors open). Only after both finish do we advance to "solved" → next obstacle.
- This is the moment Patrick actually feels the product: kid speaks the word → the dog performs the verb → the world responds.

---

## Technical details (skip if you don't want them)

- **Files touched**
  - `src/components/BennyDog.tsx` → keep as legacy export; add `src/components/BennyRigged.tsx` (4 layers + pose system).
  - `src/data/preKAdventures.ts` → reword askLines, swap the 5 problem words, add `solutionPose` per obstacle.
  - `src/components/aura/game/rpg/NabuScene.tsx` → swap the river / mud / gate / generic renderers to painted SVG and wire `solutionPose` through to `<BennyRigged />`.
  - `src/components/aura/game/rpg/NabuAdventure.tsx` → shorten ask→reading timing, pass `solutionPose` into the scene, leave TTS, speech matcher, scoring, and onComplete untouched.
- **No changes to**: TTS engine, speechRecognitionManager, scoring/star logic, level select, world routing, DB writes, Nabu wrapper, ConsentVerification, or any backend.
- **No new dependencies.** Pure React + Framer Motion + SVG, same stack we already ship.
- **Asset cost**: zero new images for the demo. Benny's 4 layers come from re-exporting his existing artwork; props are SVG.

---

## What I need from you before I build

1. **Benny rig**: green light to slice Benny into body / head / front-legs / back-legs PNG layers (I can do the slicing — no new art needed)?
2. **Word swaps**: are the 5 proposed replacements (CHOP, HEN, POT, STEPS, HOOD) fine, or do you want me to sweep all three worlds and bring back the full list before editing?
3. **Voice flow**: confirm the stem style — "Oh no! A river!" → "I need to…" → child says JUMP. Want any flavor words ("Quick! I need to…") or keep it minimal?
4. **Scope**: do you want me to ship all five fixes in one pass, or do the **rigged Benny + cloze flow + W101 only** first so you can demo it tomorrow and we polish W102/W103 after?