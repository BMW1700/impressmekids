

# Plan: Remove Hardcoded Grade Levels, Use Decoded Grades Everywhere

## The Problem

Two story files handle grade levels differently:

- **`curatedStories.ts`** — already overrides hardcoded `grade_level` with the decodability engine ✅
- **`agentStories.ts`** — exports hardcoded `grade_level` values directly (6, 7, 8, etc.) with **no decodability override** ❌

The hardcoded values in `rawStories` inside `curatedStories.ts` are also still present (even though they're overridden), which creates confusion about which values are actually used.

## Changes

### 1. `src/data/agentStories.ts`
- Import `getStoryGradeLevel` and `getStoryDifficultyLevel` from `@/lib/phonemeDifficulty`
- Change the export from a direct array to the same override pattern used in `curatedStories.ts`:
  ```typescript
  const rawAgentStories: CuratedStory[] = [ ... ];
  export const agentStories = rawAgentStories.map(story => ({
    ...story,
    grade_level: getStoryGradeLevel(story.passage_text),
    difficulty_level: getStoryDifficultyLevel(story.passage_text),
  }));
  ```

### 2. `src/data/curatedStories.ts`
- Remove the hardcoded `grade_level` and `difficulty_level` values from every story object in `rawStories`, replacing them with placeholder `0` values and a comment noting they are computed at export time
- Keep the existing override at lines 1372-1377 (already correct)

### 3. `src/lib/decodabilityGrading.ts` — no changes needed
The engine already handles grades 0-8+, which covers both K-5 and 6-12 texts.

## What stays the same
- The decodability engine logic
- All story text content
- The `CuratedStory` interface (keeps `grade_level` field)
- All components that read `grade_level` from stories — they'll just get decoded values now

## Risk
Agent stories (grades 6-12) may get reclassified by the decodability engine. Since the engine caps at grade 8 and uses phoneme/pattern complexity, some stories written for grade 10-12 might cluster at grade 6-8. This is expected — the engine grades by decoding difficulty, not content maturity.

