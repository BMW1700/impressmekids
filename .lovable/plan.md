

# Plan: Generate 60 New Decodability-Aligned Stories (10 per Grade, K–5)

## What We're Building

60 new stories added to `src/data/curatedStories.ts`, strictly following the phoneme/phonics progression from the decodability grading system. Each grade level gets exactly 10 new stories.

## Decodability Rules Per Grade

| Grade | Allowed Phonemes | Allowed Patterns | Word Count | Example Words |
|---|---|---|---|---|
| K | /m/ /s/ /t/ /p/ /k/ /b/ /d/ /n/ + short /a/ only | CVC only (cat, sat, map) | 40–60 | cat, mat, bat, nap, tap |
| 1 | + /f/ /g/ /h/ /j/ /l/ /r/ /v/ /w/ /y/ /z/ + all short vowels + digraphs /sh/ /ch/ /th/ /ng/ | CVC + blends + digraphs | 60–80 | ship, chat, frog, clap, thin |
| 2 | + long vowels + vowel teams (ai, ee, oa, silent-e) | Silent-e, vowel teams, 2-syllable | 80–110 | cake, rain, boat, teacher | 
| 3 | + diphthongs /oi/ /ou/ + R-controlled /ar/ /or/ /er/ | Multisyllabic, affixes (-ing, -ed, un-, re-) | 100–130 | explore, adventure, morning |
| 4 | + /oo/ /ʒ/ (measure) | Greek/Latin roots, complex multisyllabic | 120–150 | photograph, microscope |
| 5 | All 44 phonemes mastered | Morphological decoding, academic vocab | 140–170 | civilization, photosynthesis |

## Story Generation Approach

I'll use the AI gateway to generate stories that strictly conform to each grade's phoneme constraints. Each story will be crafted with:

- **K stories**: Only CVC words with /m,s,t,p,k,b,d,n/ + short /a/. Sight words allowed. Extremely controlled vocabulary.
- **1st grade stories**: Add remaining consonants, all short vowels, blends, digraphs. No long vowels or vowel teams.
- **2nd grade stories**: Introduce silent-e and vowel team words. Two-syllable words OK.
- **3rd grade stories**: Diphthongs, R-controlled vowels, prefixes/suffixes, 3+ syllable words.
- **4th grade stories**: Greek/Latin roots, variant vowels, complex vocabulary.
- **5th grade stories**: Full academic language, morphological complexity.

Categories will be distributed across: animals, space, sports, fairy_tales, science, adventure, history.

## File Modified

- `src/data/curatedStories.ts` — append 60 new story objects to the `rawStories` array

## What Stays the Same

- Story interface (`CuratedStory`) — unchanged
- Grade level computation at export — the decodability engine will validate these stories automatically
- All existing 48 stories — kept as-is
- Agent mode stories — untouched

