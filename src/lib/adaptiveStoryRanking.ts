/**
 * adaptiveStoryRanking - Scores and sorts stories based on phoneme overlap
 * with a student's struggling phonemes from the Q-Learning agent.
 * 
 * Pure function, no side effects.
 */

export interface RankedStory<T> {
  story: T;
  phonemeMatchCount: number;
  matchedPhonemes: string[];
  isRecommended: boolean;
}

/**
 * Score and rank stories by how many of the student's struggling phonemes
 * appear in each story's target_phonemes list.
 * 
 * Stories with >= 1 match are marked as "recommended".
 * Returns all stories sorted by match count (desc), then original order.
 */
export function rankStoriesByPhonemeNeed<T extends { target_phonemes?: string[] }>(
  stories: T[],
  strugglingPhonemes: string[]
): RankedStory<T>[] {
  if (!strugglingPhonemes.length) {
    return stories.map(story => ({
      story,
      phonemeMatchCount: 0,
      matchedPhonemes: [],
      isRecommended: false,
    }));
  }

  const strugglingSet = new Set(strugglingPhonemes.map(p => p.toLowerCase()));

  const ranked = stories.map(story => {
    const storyPhonemes = story.target_phonemes || [];
    const matched = storyPhonemes.filter(p => strugglingSet.has(p.toLowerCase()));

    return {
      story,
      phonemeMatchCount: matched.length,
      matchedPhonemes: matched,
      isRecommended: matched.length >= 1,
    };
  });

  // Stable sort: highest match first, original order preserved for ties
  ranked.sort((a, b) => b.phonemeMatchCount - a.phonemeMatchCount);

  return ranked;
}

/**
 * Extract struggling phonemes from the ML context's Q-learning data.
 * Returns an empty array if no data is available (safe fallback).
 */
export function extractStrugglingPhonemes(
  mlContext: {
    selectBestPhoneme: (
      mastered: string[],
      struggling: string[],
      level: number,
      candidates: string[]
    ) => { phoneme: string; isMLPowered: boolean };
    modelStatus: {
      qLearningTable: { loaded: boolean; totalStates: number };
    };
  } | null | undefined
): string[] {
  if (!mlContext) return [];
  if (!mlContext.modelStatus.qLearningTable.loaded) return [];
  if (mlContext.modelStatus.qLearningTable.totalStates === 0) return [];

  // Common English phonemes to probe the Q-agent with
  const probePhonemes = [
    'θ', 'ð', 'ʃ', 'ʒ', 'tʃ', 'dʒ', 'ɹ', 'l', 'w', 'j',
    'p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z',
    'h', 'm', 'n', 'ŋ', 'æ', 'ɛ', 'ɪ', 'ɑ', 'ʌ', 'ʊ',
  ];

  try {
    // Use Q-agent to find which phonemes have lowest expected reward
    // (i.e., the student struggles most with them)
    const result = mlContext.selectBestPhoneme([], [], 1, probePhonemes);
    
    if (!result.isMLPowered) return [];

    // The "best phoneme to practice" is the one the student needs most work on
    // We return a small set centered on this recommendation
    return [result.phoneme];
  } catch {
    return [];
  }
}
