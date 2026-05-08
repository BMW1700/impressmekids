No code changes — this is a drafted email reply for Christopher reviewing FIGs. 1–3 of the provisional patent drawings.

---

**Subject: Re: Drawings Review — Provisional Patent**

Hi Christopher,

I reviewed all three drawings against the actual NabuLearn codebase. Overall they accurately illustrate the invention. A few small notes and one optional addition below.

**FIG. 1 — Game interface screenshot**
Accurate. This is a representative view of the in-browser reading/battle UI the student sees during a session. No edits needed for a provisional. (If you'd like, for the non-provisional we can swap in a cleaner, annotated screenshot that labels the passage text, the live word-by-word highlighting, and the speech-input indicator — but it's not required now.)

**FIG. 2 — System block diagram**
Accurate and matches the architecture:
- *User Speech → Microphone → Browser*: correct. All capture happens through the browser's mic API on the user's device.
- *Speech-to-text Module ↔ Matching Unit, both inside Browser*: correct. Both run client-side in the browser (Web Speech API for STT; our matching functions in `wordMatchingModes.ts`).
- *Controller* inside the Browser, wired to STT, Matching Unit, and Screen: correct. The controller is the CPU on the user's device executing our JavaScript; it orchestrates STT, invokes the Matching Unit, and updates the Screen.
- *Screen → Output Image*: correct.
- *Storage Device* shown in dashed lines outside the Browser: correct. Local in-session state lives in browser `localStorage`; the dashed remote storage represents the optional end-of-session sync to our cloud database, which is properly shown as optional.

One **optional** refinement (not required): we could add a dashed local "Storage" block inside the Browser to make explicit that there are two storage paths — local (always on) and remote (optional) — but the current single-dashed-block treatment is fine for a provisional.

**FIG. 3 — Four-layer matching flowchart**
Accurate. The order and gating logic match the code exactly:
1. Layer 1 — Exact Match → if yes, MATCH; else continue.
2. Layer 2 — Homophone Dictionary → if yes, MATCH; else continue.
3. Layer 3 — Levenshtein Distance → if yes, MATCH; else continue.
4. Layer 4 — Phoneme Comparison → if yes, MATCH; else NO MATCH.

Two small clarifications you may want to fold in (specification text, not the figure itself):
- Layer 2 actually consults **two parallel lookup tables** at this stage — a true-homophones table and a separate phonics-confusion / API-mishear table. The figure label "Homophone Dictionary" is fine as a generic label; we can elaborate in the spec.
- Layer 4 uses a **70% phoneme-similarity threshold with partial credit (0.7)** via an articulatory feature-distance metric. Again, a spec-text detail, not a figure change.

**Bottom line:** Approve all three drawings as drawn. The two clarifications above are spec additions, not figure revisions. Happy to jump on a quick call if easier.

Best,
[Name]
