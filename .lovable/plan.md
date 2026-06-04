## Pre-K Mode: Make It Wow-Patrick Perfect

Brutally honest audit done. Here's the full plan to fix the character identity AND every gameplay problem at once. No half-measures.

### Cast (locked in)
- **Benny the dog** — main narrator and hero for ~80% of Pre-K. Already have idle / celebrate / sad / blink art.
- **Matty the bear** — co-star for select adventures (will need 3 mood frames generated).
- **Sally the horse** — co-star for select adventures (will need 3 mood frames generated).
- All voice lines say **"Benny"** (or Matty/Sally when starring), never "Nabu". "Nabu Village" stays as the world name only.

---

### What gets fixed

**1. Identity — global rename**
- `preKAdventures.ts`: every `goal`, `problemLine`, `askLine`, `successLine`, `endingLine` rewritten so the speaker is Benny/Matty/Sally, not Nabu.
- Per-adventure `star` field added (`"benny" | "matty" | "sally"`) so each level picks its hero.
- `NabuAdventure` / `NabuScene` / `NabuSprite` kept as file names (avoids a churny rename), but the component renders the chosen hero. Internal var renamed `hero`.
- Header chip + intro bubble use the hero's name ("Help Benny visit Grandma!").

**2. Pacing — cut the dead air in half**
Current intro→problem→ask = ~5.8s of nothing. New timings:
- intro 900ms, problem 1400ms, ask 1100ms, solved 1500ms, transition 1700ms.
- Word card appears ~3.4s after a new obstacle instead of ~5.8s.

**3. Mic + "your turn" affordance**
- Big pulsing mic ring + "Your turn!" badge the moment `reading` starts.
- Auto-start the mic on the FIRST word too (drop the `hasStartedListening` gate; just gate retries).
- Auto-play the word's pronunciation once when the card appears (kids who can't read get the prompt for free).

**4. No kid ever gets stuck**
- Track attempt count per word. After **3 misses**: auto-pass with a warm "Great try!" line, advance to `solved`, count as half-credit (no star penalty hit).
- Add a **giant "Tap to continue"** fallback button under the word card after the 2nd miss, so a broken mic isn't a dead end.
- Add a small **"Skip"** button in the header (parent-tap), discoverable but unobtrusive.

**5. Reward feedback that actually feels good**
- On correct: 300ms sparkle burst + happy chime + word card flashes green + progress dot fills with a pop, all before Benny speaks.
- On incorrect: gentle bonk sound + Benny shakes (already does) + the missed letters get a soft outline pulse.
- Ending: confetti, 3 stars pop in one at a time with chimes.

**6. Speech bubbles, replay, and accessibility**
- Tap any speech bubble to replay the line.
- Small speaker icon on the bubble.
- Make the "Hear it" button on the word card huge (child-sized, 56px+) and pulse it the first time the word appears.

**7. Visual cleanup**
- Remove the duplicate goal text (header chip already shows it — drop the intro bubble repeat, replace with "Ready?" + Benny waving).
- Remove the top-right `0/5` star counter; keep only the bottom progress dots (one source of truth).
- Bigger, juicier progress dots.

**8. Scene coverage — fix the "false advertising"**
Current `NabuScene.tsx` only has real scenes for ~10 words. Data file uses 30+. For every other word the kid sees Benny on plain grass while a card says "ROOSTER". Two-pronged fix:
- **Trim** `preKAdventures.ts` to ONLY use words that have a real scene, OR
- **Build** the missing scenes. We'll build the high-frequency missing ones inline as part of this work: NEST, WORM, LADDER, UMBRELLA, BALLOON, ROCKET, STAR, LAMP, KITE, FAN, BED, LEASH, HONEY, BASKET, ROOSTER, BELL, DRUM, TENT, HELMET, BLANKET.
- Anything still uncovered after this pass gets removed from the data file. No level ships with a generic fallback.

**9. Benny blink/tail-wag actually visible in gameplay**
- `NabuScene` currently renders Benny via a raw SVG `<image>`, so the CSS blink/tail-wag never runs in-level. Switch to rendering a `<foreignObject>` containing the real `<BennyDog />` component so the blink + tail wag DO play during adventures.

**10. Co-star art (Matty & Sally)**
- Generate `matty-bear-idle/celebrate/sad.png` and `sally-horse-idle/celebrate/sad.png` via image-gen, same flat style as Benny.
- Wire them through the existing `BennyDog`-shaped component (rename it `HeroSprite`, pass `character` prop).

---

### Files touched

- `src/data/preKAdventures.ts` — rewrite all narration; add `star` per adventure; trim or remap any word without a scene.
- `src/components/aura/game/rpg/NabuAdventure.tsx` — pacing, mic affordance, attempt-cap auto-pass, tap-to-continue, skip, sparkle/chime on correct, cleanup of duplicated header/intro, larger "Hear it" button, auto-pronounce on word reveal, hero name in copy.
- `src/components/aura/game/rpg/NabuScene.tsx` — render `<BennyDog/>` (or `<HeroSprite/>`) via `<foreignObject>` so blink/tail actually show; add the ~20 missing scenes.
- `src/components/BennyDog.tsx` → generalize to `HeroSprite` (keep `BennyDog` as a thin alias for callers). Add `character: "benny" | "matty" | "sally"` prop.
- New assets: `src/assets/matty-bear-*.png` (3), `src/assets/sally-horse-*.png` (3) via imagegen.
- New tiny sound files in `src/assets/sfx/`: `chime.mp3`, `bonk.mp3`, `sparkle.mp3` (or reuse what's already in the project — will check first and only add what's missing).

### Technical notes
- Auto-pass after 3 misses is implemented in `NabuAdventure.handleResult` by tracking `attemptsRef` per word index, then forcing `setPhase("solved")` while flipping a `wasAutoPassed` flag that suppresses the celebrate star increment but plays a kind line ("That was tricky — let's keep going!").
- The mic component (`RPGWordReader`) stays the same; we just wrap it with the bigger affordance and tap-fallback. No changes to its matching internals — appropriate for now since Pre-K words are short and forgiving enough.
- Sparkle is a pure CSS keyframe overlay (no library), chime is `new Audio().play()` — zero new deps.

### Out of scope (intentionally deferred)
- Custom Pre-K-tuned mic matcher (more forgiving phoneme rules for toddlers). Current matcher is fine once we have the 3-strike auto-pass safety net.
- Saving star results to backend in a new schema — uses existing `onComplete` path.
- Hero unlock progression / character select screen. For now the level data picks the hero.

---

### Build order (1 pass, ~15 minutes of agent work)
1. Rewrite `preKAdventures.ts` narration to Benny/Matty/Sally + `star` field, trim unscened words.
2. Generalize `BennyDog` → `HeroSprite` with `character` prop.
3. Generate Matty + Sally art (6 images).
4. Update `NabuScene` to use `<foreignObject>` + `<HeroSprite/>` and add the missing scenes.
5. Overhaul `NabuAdventure`: pacing, mic affordance, 3-strike auto-pass, tap-fallback, sparkle/chime, header cleanup, hear-it button.
6. Smoke-test by walking through Worlds 101–103 in the preview.

Approve and I'll execute the whole thing in one go.
