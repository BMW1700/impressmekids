

# Plan: Create Corrected Patent Attorney Response DOCX

## What
Create a corrected version of the patent attorney response document as a professional DOCX file, fixing the **one critical error**: the muscle group names and recovery rates in Question 2 don't match the actual code.

## The Fix

**Current (WRONG):** "lips, tongue tip, tongue back, jaw, soft palate, vocal cords, teeth ridge (alveolar ridge), and airflow control" with fake recovery rates like "soft palate recovers at 5% per minute"

**Corrected (matches `articulatoryModel.ts`):**
1. Lips (bilabial) — 10%/min recovery
2. Tongue tip (alveolar) — 8%/min
3. Tongue back (velar) — 12%/min
4. Tongue blade (palatal/postalveolar) — 9%/min
5. Teeth/lips (labiodental) — 11%/min
6. Tongue tip/teeth (dental) — 7%/min
7. Glottis (glottal) — 15%/min
8. Approximants — 10%/min

The example in the answer will also be corrected (e.g., "the 'th' sound uses the tongue tip/teeth (dental) group" instead of referencing non-existent groups).

## Implementation
- Single step: Generate a clean, professional DOCX using `docx-js` with all 8 questions and answers from the original document, correcting only the muscle group section
- QA the output by converting to images and inspecting every page
- Deliver as `/mnt/documents/NabuLearn_Patent_Attorney_Response_v2.docx`

