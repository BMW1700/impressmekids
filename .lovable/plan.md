# Pre-K Phonemic Awareness & Letter-Sounds

Optional follow-up to the curriculum audit. Only build this if you want to convert the schools the audit marked "No."

## Why

The audit found one gap responsible for nearly every rejection: our Pre-K mode teaches oral vocabulary but no phonemic awareness and no letter-sound knowledge. That single gap is what loses Joyful Noise, Einstein Daycare, and Harbor Country Day, and what keeps every Creative Curriculum center at "language supplement" instead of "literacy supplement."

## What to build

1. **Rhyme world** — pick the word that rhymes; spoken response, Benny video framing, same runner as today's Pre-K levels.
2. **First-sound world** — isolate the initial phoneme of a spoken word.
3. **Blending world** — hear c-a-t, say "cat." Oral only, no letters required.
4. **Letter-sound world** — see a letter, say its sound. Reuses the existing word-card and mic loop.
5. **Standards crosswalk** — extend the Curriculum Alignment page to cover Pre-K, mapping the new worlds to Creative Curriculum Literacy objectives 15-17, the NY Prekindergarten Foundation, and NJ Preschool Teaching and Learning Standards.

## Technical notes

- New worlds slot into the existing Pre-K world routing and reuse the DB-driven level CMS, so content is authored in Super Admin rather than hardcoded.
- Content follows the same shape as the current Pre-K word banks, with a new content kind for rhyme and blend pairs.
- Speech matching reuses the existing phoneme-fallback matcher.
- No new backend tables required; stars and progress use the current Pre-K tracking.

## Out of scope

Letter formation and handwriting (needs tracing input), math, and SEL.
