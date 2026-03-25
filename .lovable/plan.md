

# Generate Code-Accurate Patent Brief for Chris (v2)

## Purpose
Create a plain-English technical document for your patent attorney Chris that is 100% accurate to the actual codebase. Not for the USPTO directly — for Chris so he can draft the provisional patent filing without back-and-forth.

## What's Wrong With the Current Document (5 Errors)

| Section | Document Says | Code Actually Does |
|---------|--------------|-------------------|
| Base Damage | `8 + (letters / 2)` | `Max(8, letters x 3)` — "elephant" = 24, not 12 |
| Speed Bonus | Under 1.5s = 30%, Under 2s = 15% | Under 1.5s = +15 flat points, Under 3s = +8 flat points |
| Streak | 3+ = 1.5x, 5+ = 2x, 10+ = 3x | `Floor(streak / 2) x 5` flat additive bonus |
| Accuracy | 95%+ = 1.5x XP, 85%+ = 1.25x XP | 90%+ = 1.2x damage, 75%+ = 1.1x damage |
| Section 4C | "Two children see different words" | Children see different **stories** recommended, not different words within a story |

## What the New Document Will Contain

**Same structure, same dumbed-down tone, corrected math, plus missing innovations:**

1. **Section 1** — What the invention is (minor tweaks for clarity)
2. **Section 2** — Step-by-step how it works (mostly fine, keep as-is)
3. **Section 3** — Damage formula with CORRECT math and a corrected worked example ("elephant" = 64 damage, not 31)
4. **Section 4A** — Q-Learning agent (accurate, keep)
5. **Section 4B** — Fatigue model (accurate, keep)
6. **Section 4C** — FIXED: explain that personalization happens at the **story recommendation** level, not per-word scrambling. Stories are ranked by phoneme overlap with the student's weaknesses.
7. **Section 4D** — NEW: Phoneme tracking during battle (Gap 1 we built). During combat, every word is decomposed into individual speech sounds and accuracy is tracked per-phoneme. This feeds back into the Q-table.
8. **Section 4E** — NEW: Cross-Modal Transfer Network. The system predicts a child's speaking ability from their reading data without requiring a separate speech assessment.
9. **Section 5** — Competitor comparison (update damage formula column)
10. **Section 6** — Pipeline diagram (add the feedback loop: Battle → Phoneme Scores → Q-Table → Story Recommendation → Next Battle)
11. **Section 7** — Database storage (accurate, keep)
12. **Claims** — Fix Claim 2 ("determines which stories are recommended" not "which words are presented"). Add Claim 4 for cross-modal prediction and Claim 5 for real-time phoneme decomposition during gameplay.

## Output
- File: `/mnt/documents/NabuLearn_Patent_Technical_Description_v2.docx`
- Same formatting: CONFIDENTIAL header, page numbers, professional tables
- Generated via `docx-js` script
- QA: convert to images, inspect every page before delivering

## Technical Approach
- Write a Node.js script using the `docx` package
- US Letter format, 1-inch margins, Arial font
- Proper numbered lists, tables with borders, headers/footers
- Every formula and number verified against `RPGBattleArena.tsx` line 1031-1072

