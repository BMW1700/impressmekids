
# Landing page restructure: lead with the assessment, not the game

## Goal
Make the hero immediately convey what NabuLearn actually does for buyers (administrators, principals, teachers): **a child reads aloud → AI scores it live → teachers get WCPM, miscues, risk flags**. Move the RPG battle to a dedicated "Game Mode" section where its toy-look becomes an asset, not a liability. Keep RPG showcase intact in the in-app dashboards.

---

## Changes

### 1. New component: `LiveAssessmentShowcase.tsx`
A cinematic, looping "teacher-facing magic" visualization for the hero. No copy needed — the visual tells the story.

**Loop (~9s):**
1. **Listen (1.5s)** — A pulsing mic icon + animated waveform appears. Caption chip: "Child reading aloud."
2. **Transcribe (2.5s)** — A sentence appears word-by-word as if transcribed in real time:
   *"The quick brown fox jumps over the lazy dog."*
   Words land one at a time with a soft fade.
3. **Analyze (2s)** — Words recolor:
   - Most go **green** (correct)
   - One word (e.g., "quick") flashes **amber** with a small tag: *"miscue: /kw/ → /k/"*
   - One word (e.g., "lazy") gets a subtle underline: *"prosody: flat"*
4. **Score (2s)** — A teacher-style metrics card slides in from the right:
   - **WCPM: 87** (count-up animation)
   - **Accuracy: 94%**
   - **Phoneme mastery: /kw/ ⚠**
   - **Risk: Low** (green pill)
5. **Reset (1s)** — Card and transcript fade, loop restarts with a different sentence.

**Visual language:**
- Dark glass card on the existing purple hero gradient (matches current aesthetic)
- Solid colors, slow easings (per `mem://design/visual-restraint-solid-colors-mandate`)
- `IntersectionObserver` to pause off-screen
- `useReducedMotion` → static frame showing the metrics card fully populated
- ~3 rotating sentences hardcoded (no backend)

### 2. Edit `PremiumHero.tsx`
- Replace `<RPGShowcase variant="hero" />` with `<LiveAssessmentShowcase />`.
- No copy changes in this pass (existing headline already speaks to assessment).

### 3. New section in `Index.tsx`: "Kids think it's a game. Teachers get NAEP-grade data."
Insert a new section between `HowItWorks` and `ResearchSection`:
- Two-column layout on desktop, stacked on mobile
- **Left:** `<RPGShowcase variant="hero" />` (the existing battle, reused as-is)
- **Right:** Headline + 3 short bullets:
  - *Same voice. Same ML pipeline.*
  - *Phoneme inference, miscues, prosody — scored mid-battle.*
  - *Teachers see the data. Kids see a boss fight.*
- CTA: "See Game Mode" → `/demos`

This reframes the cartoon look as the **strategic moat** ("kids will actually do it") rather than the product itself.

### 4. Untouched
- `ModeSelect.tsx` — keeps `<RPGShowcase variant="compact" />` (right audience: students)
- `GameDashboard.tsx` — same
- `RPGShowcase.tsx`, `RPGParentAttackVFX.tsx` — no edits
- All other landing sections (`BentoFeatures`, `OutcomesStrip`, `HowItWorks`, `TrustSection`, `ResearchSection`, `TestimonialSection`, closing CTA) stay in place

---

## Technical notes

**New files:**
- `src/components/landing/LiveAssessmentShowcase.tsx` (~200 LOC)
- `src/components/landing/GameModeSection.tsx` (wrapper for the new RPG section)

**Edited files:**
- `src/components/landing/PremiumHero.tsx` — swap one component
- `src/pages/Index.tsx` — add `<GameModeSection />` between `HowItWorks` and `ResearchSection`

**No backend, no deps, no schema changes.** Pure presentation work.

**Order of operations:** build `LiveAssessmentShowcase` → swap in hero → build `GameModeSection` wrapper → insert in `Index`.

---

## What this fixes (vs. current state)
- Hero now reads as "AI literacy assessment platform" within 2 seconds, not "kids' game"
- RPG showcase still appears prominently — but framed correctly for buyers
- In-app experience for kids is unchanged
- No loss of the work already done on `RPGShowcase`
