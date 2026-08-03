# Where Vertex AI Actually Is (and how to get to $0)

## The straight answer

You are right that the core gameplay is free. Nothing in Pre-K or RPG calls a
paid model. But there **is** a paid Google Vertex AI path in the backend, and it
has been there a long time. It runs on your own Google Cloud key
(`GOOGLE_VERTEX_AI_KEY`), not on Lovable credits.

Verified by reading the code. Exactly seven backend functions touch Vertex:

| Function | What it does | Who triggers it |
| --- | --- | --- |
| `analyze-aura` | Deep speaking/reading analysis (premium path only) | AURA practice in "premium" mode; annotation grading |
| `generate-question-ai` | Teacher generates quiz questions | Teacher |
| `generate-practice-exercises` | Teacher/intervention exercises | Teacher |
| `generate-flashcards` | Flashcard generation | Teacher/student |
| `generate-teacher-summary` | Teacher narrative summaries | Teacher |
| `extract-text-from-image` | OCR of worksheet photos | Teacher |
| `_shared/pseudonymize.ts` | Strips names before any of the above | Support code |

## What is already free (confirmed)

- **RPG mode**: zero AI backend calls. Web Speech + in-house matching only.
- **Pre-K**: submits with `freeMode: true`, which explicitly **skips Vertex**
  and uses the in-house metrics (`analyze-aura` line 196: "FREE MODE: Skipping
  Vertex AI").
- **The 4 ML models**: trained and run in-house on your own data, not Vertex.

## What actually costs money

1. **AURA practice in "premium" mode** — `practiceMode !== 'free'` sends the
   transcript to Gemini 2.5 Flash for the narrative feedback.
2. **Reading-annotation grading** (`readingMode` path in `analyze-aura`) —
   always calls Vertex, no free branch exists.
3. **The five teacher content-generation functions** — always Vertex.

So: kids playing is free. Teacher tooling and the premium AURA narrative are
not.

## Decision to make

There is no version of "AI writes a paragraph of feedback" that is free —
either Google bills your GCP account, or Lovable AI bills workspace credits.
The only true $0 option is to not call a model and use the in-house engine.

Three options, pick one:

**A. Go 100% free.** Force `freeMode` everywhere, add a free branch to the
annotation-grading path, and turn the five teacher-generation features into
in-house/template-driven output. Cost goes to $0. Teacher AI generation gets
noticeably less impressive, and the AURA narrative feedback becomes canned
rather than written per student.

**B. Free for students, paid only for teachers.** Force `freeMode` on every
student-facing submission (already true for Pre-K; make it true for AURA
practice and annotation grading). Leave the five teacher functions on a model.
Cost drops to near zero at classroom scale, because only teachers trigger spend
and they trigger it rarely. This is the recommended option.

**C. Keep it as-is** and just watch the GCP bill.

## If you pick B (recommended) — the work

1. Add a free-metrics branch to the `readingMode` path in `analyze-aura` so
   student annotation grading no longer requires Vertex.
2. Default AURA practice to `freeMode` for all student submissions; keep the
   premium narrative behind an explicit teacher/admin opt-in.
3. Move the five teacher functions off your GCP key onto the Lovable AI
   Gateway, so there is one metered path instead of a second cloud account with
   its own quota and billing.
4. Add a single `AI_SPEND_ENABLED` school setting so a district can switch all
   paid generation off entirely.

## Technical details

- Free/premium switch already exists: `analyze-aura` line 196 (`if (freeMode)`).
  Only the `readingMode` branch (line 598) has no free equivalent.
- Vertex is reached only through `supabase/functions/_shared/vertexAuth.ts`;
  swapping providers is a change in that one file plus the model id.
- Files touched for option B: `analyze-aura/index.ts`,
  `src/pages/student/AuraPractice.tsx`, `_shared/vertexAuth.ts`, and the five
  generation functions listed above.
