No code changes — drafted email reply for Christopher answering whether the three drawings accurately illustrate all parts of the invention.

---

**Subject: Re: Drawings Review**

Hi Christopher,

I reviewed all three drawings against the actual NabuLearn codebase. Short answer: **all three are accurate and I approve them as drawn.** A couple of optional refinements below — none are required for the provisional.

**FIG. 1 — Game interface screenshot**
Accurate. This is a representative view of the in-browser reading/battle UI a student sees during a session and fairly depicts the user-facing embodiment of the invention. No changes needed for the provisional. (Optional, for the non-provisional: we could swap in a cleaner annotated screenshot that labels the passage text, the live word-by-word highlighting, and the speech-input indicator — but it's not necessary now.)

**FIG. 2 — System block diagram**
Accurate and matches our architecture:
- *User Speech → Microphone → Browser*: correct. Audio capture happens through the browser's mic API on the user's device.
- *Speech-to-text Module ↔ Matching Unit, both inside the Browser*: correct. Both run client-side in the browser (Web Speech API for STT; our matching functions in `wordMatchingModes.ts`).
- *Controller* inside the Browser, wired to STT, Matching Unit, and Screen: correct. The controller is the CPU on the user's device executing our JavaScript; it orchestrates STT, invokes the Matching Unit, and updates the Screen.
- *Screen → Output Image*: correct.
- *Storage Device* shown in dashed lines outside the Browser: correct. In-session state lives locally in browser `localStorage`, and the dashed remote storage represents the optional end-of-session sync to our cloud database — properly shown as optional.

Optional (not required): we could add a second dashed "Local Storage" block inside the Browser to make explicit that there are two storage paths — local (always on) and remote (optional sync). The current single-dashed-block treatment is fine for a provisional.

**FIG. 3 — Four-layer matching flowchart**
Accurate. The order and gating logic match the code exactly:
1. Layer 1 — Exact Match → if yes, MATCH; else continue.
2. Layer 2 — Homophone Dictionary → if yes, MATCH; else continue.
3. Layer 3 — Levenshtein Distance → if yes, MATCH; else continue.
4. Layer 4 — Phoneme Comparison → if yes, MATCH; else NO MATCH.

Two small clarifications worth folding into the spec text (not the figure itself):
- Layer 2 actually consults **two parallel lookup tables** at this stage — a true-homophones table and a separate phonics-confusion / API-mishear table. The figure label "Homophone Dictionary" is fine as a generic label.
- Layer 4 uses a **70% phoneme-similarity threshold with partial credit (0.7)** via an articulatory feature-distance metric. Spec-text detail, not a figure change.

**Bottom line:** Approve all three drawings as drawn. The two notes above are spec additions, not figure revisions. Happy to jump on a quick call if easier.

Best,
[Name]
