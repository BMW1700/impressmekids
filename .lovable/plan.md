

# Fix: No Books Found at Grade Levels 4 and 5

## Problem
Line 609 of `src/data/curatedStories.ts` overwrites every story's hardcoded `grade_level` with the phoneme-computed value:
```ts
grade_level: getStoryGradeLevel(story.passage_text),
```

The current thresholds in `getStoryGradeLevel()` use uniform 0.5 steps (2.0, 2.5, 3.0, 3.5, 4.0, 4.5...). Most English prose — even "advanced" passages — averages around 2.5–3.5 word difficulty, so stories cluster into grades 1–3, then jump to 6+. Grades 4 and 5 get zero stories.

## Fix

### Recalibrate the grade thresholds in `src/lib/phonemeDifficulty.ts`

Replace the uniform 0.5-step thresholds with tighter spacing in the mid-range so that the natural distribution of English text actually populates grades 4 and 5:

```
< 2.0 → Grade 0 (Pre-K)
< 2.3 → Grade 1
< 2.6 → Grade 2
< 2.9 → Grade 3
< 3.2 → Grade 4
< 3.5 → Grade 5
< 4.0 → Grade 6
< 4.8 → Grade 7
≥ 4.8 → Grade 8
```

This narrows the bands where most text lands (2.0–3.5 range) and widens the upper bands. Stories with longer words and harder phonemes (the ones currently hardcoded as grade 4/5) should now land in those buckets.

### One file changed
- `src/lib/phonemeDifficulty.ts` — update the 8 threshold values in `getStoryGradeLevel()`

No other files need changes. The computed values in `curatedStories.ts` will automatically recalculate.

