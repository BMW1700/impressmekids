

## Brutally Honest Take on Christina's Notes

Going through each one with real talk, then proposing a focused build plan.

### 1. CVC → CCVC → Silent-E hierarchy (scope & sequence)
**CRITICAL. This is the #1 missing thing.** Every reading specialist, curriculum director, and Tier-1 RFP asks for an explicit phonics scope & sequence. We have 280 decodability-aligned stories and a decodability engine, but no visible ladder a superintendent can point to and say "yes, this matches our Tier 1 instruction." Without it, we can't honestly answer "what's your phonics progression?" in pilot meetings.

### 2. Pre-LexiQuest "Phonics Foundations" world (your idea)
**YES. Pilot-closer. Build it.** This is exactly the move. Wilson, Orton-Gillingham, UFLI, Heggerty all use this ladder. Adding World 0 makes us look like *instruction*, not *practice*. Specialists sign off on platforms that look like instruction. Investors love "we teach the foundation, then gamify the practice."

### 3. Filtering hard sounds (egg/agg, short-e, voiced-th)
**Important — but DO NOT switch to Dragon API.** Dragon kills the $0/month cost model and breaks iPad support (mandate from core memory). Better path: extend our existing speech matching V3 pipeline with a phonics-aware "misrecognition map" that auto-accepts known Web Speech API confusions (short-e ↔ short-a, short-i ↔ short-e, voiced-th ↔ d, etc.). Rule-based, free, in-browser, solves her exact concern.

### 4. "Phoneme" not "phenome"
Already in core memory. Quick grep audit to confirm zero rogue instances survive.

### 5. Non-email username (PPI)
Already shipped last pass. Christina will be happy.

---

## Recommended Build (Phase 1 — pilot closers)

1. **World 0: Phonics Foundations** — 5-stage pre-campaign mini-world:
   - Stage 1: CVC (cat, mat, sit, run)
   - Stage 2: CCVC/CVCC blends (stop, milk, frog)
   - Stage 3: Silent-E magic (mat→mate, kit→kite)
   - Stage 4: Digraphs (sh, ch, th, ck)
   - Stage 5: Vowel teams (ai, ee, oa)
   - Each stage = brief lesson card + decodable practice + speech-checked mastery gate
   - Visual "ladder" UI that mirrors a printable scope chart

2. **Public `/scope-and-sequence` page** — branded, printable, downloadable PDF. The document Christina hands her superintendent. Maps every stage to Common Core foundational standards (RF.K.2, RF.K.3, RF.1.3, RF.2.3).

3. **Phonics-aware speech matching extension** — new `phonicsConfusionMap.ts` plugged into the existing 3-layer matching pipeline. Maps known Web Speech API confusions so "agg"/"ed"/"edge" all accept when the target is "egg".

4. **"Phenome" audit** — grep + fix any UI text violations.

### What I'm NOT building
- Dragon API integration (cost + iPad blocker)
- Username changes (already done)
- Brand-new ML models (existing inference engine handles it)

### Risk call
The single thing that loses pilots if we skip it: **no visible scope & sequence**. World 0 + the printable chart solves it in one shot. Multiplayer is fun in demos; phonics scope & sequence is what gets contracts signed.

---

## Four quick decisions before I write the build plan

1. **Scope of work:** All four Phase 1 items, or just World 0, or just the scope page + speech fix?
2. **World 0 gating:** Required for K-2 only / required for all K-5 / optional with badge / teacher-assignable?
3. **Scope chart format:** Web page + downloadable PDF / web page only / PDF only?
4. **Loop Christina back in:** Show her the proposed scope before building, or ship first and demo to her after?

Answer those and I'll come back with the precise file-level build plan.

