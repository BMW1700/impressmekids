

# Gap 2 (Revised): Smart Story Recommendation Based on Q-Learning

## The Problem With the Old Plan
Reordering words within a story would destroy the narrative. A kid can't read scrambled sentences. That was a bad idea.

## The Right Approach
Each story already has a `target_phonemes` field (e.g., `["d", "p", "s", "k"]`). Instead of scrambling words, we **score and rank stories** so the system recommends stories that contain the phonemes the student needs to practice most.

The student still picks their story — but the UI highlights which ones are "recommended for you" based on their weaknesses.

## How It Works

```text
Student's Q-Learning data says: struggles with [θ, ʃ, ɹ]
                                    ↓
Story A target_phonemes: [d, p, s, k]     → low match
Story B target_phonemes: [θ, ɹ, s, t]     → HIGH match (2 overlap)
Story C target_phonemes: [ʃ, tʃ, dʒ, l]   → HIGH match (1 overlap)
                                    ↓
Stories B and C get a "Recommended for You" badge in the story picker
```

## Changes

### 1. New utility: `src/lib/adaptiveStoryRanking.ts`
- Pure function: takes an array of stories + student's struggling phonemes → returns stories sorted by relevance
- Scoring: count how many of the story's `target_phonemes` overlap with the student's weak phonemes
- No side effects, easy to test

### 2. Modify: `src/components/aura/StoryLibrary.tsx`
- Import the ranking utility and the ML context (via `useMLContextSafe`)
- On mount, fetch the student's struggling phonemes from the ML context or skill vector
- If data exists: sort stories so highest-match ones appear first, add a "Recommended" badge
- If no data: show stories in default order (zero-risk fallback)

### 3. Modify: `src/components/aura/game/CampaignModeEntry.tsx`
- Same ranking logic applied to campaign story selection

## Safety
- Stories are never modified or scrambled — just sorted/badged
- Students can still pick any story they want
- No ML data = default order, no visible change
- Zero changes to RPG battle mechanics

## Patent Alignment
This closes the loop for Claim 3: the RL agent's phoneme recommendations now influence which reading content is presented to the student, making the system genuinely adaptive.

