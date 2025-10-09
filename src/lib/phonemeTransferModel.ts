/**
 * Transfer Learning Model for Phoneme Mastery Prediction
 * Predicts which phonemes a student will master next based on articulatory similarity
 */

import { phonemeDistance, phonemeFeatures } from './phonemeDistance';

export interface TransferPrediction {
  phoneme: string;                  // Target phoneme (e.g., 'd')
  transferProbability: number;      // 0-100 confidence score
  reasoning: string;                // Human-readable explanation
  similarToMastered: string[];      // List of mastered phonemes it's similar to
  differentFromStruggling: boolean; // True if dissimilar to problem phonemes
  articulatoryDistance: number;     // Average distance to mastered phonemes
  readinessLevel: 'high' | 'medium' | 'low'; // Visual indicator
}

/**
 * Predict which phonemes a student is ready to master next
 * Uses articulatory feature transfer learning
 */
export const predictPhonemeGains = (
  masteredPhonemes: string[],      // Phonemes with >85% accuracy
  strugglingPhonemes: string[],    // Phonemes with <70% accuracy
  studentGrade?: number            // Optional grade level for curriculum filtering
): TransferPrediction[] => {
  // Get all possible target phonemes (excluding already mastered ones)
  const allPhonemes = Object.keys(phonemeFeatures);
  const targetPhonemes = allPhonemes.filter(
    p => !masteredPhonemes.includes(p) && !strugglingPhonemes.includes(p)
  );

  const predictions: TransferPrediction[] = [];

  for (const targetPhoneme of targetPhonemes) {
    // Calculate average distance to mastered phonemes
    const distancesToMastered = masteredPhonemes
      .map(m => phonemeDistance(targetPhoneme, m))
      .filter(d => d < 0.9); // Filter out unknown phonemes
    
    if (distancesToMastered.length === 0) continue;

    const avgDistanceToMastered = distancesToMastered.reduce((a, b) => a + b, 0) / distancesToMastered.length;

    // Calculate minimum distance to struggling phonemes
    const distancesToStruggling = strugglingPhonemes
      .map(s => phonemeDistance(targetPhoneme, s))
      .filter(d => d < 0.9);
    
    const minDistanceToStruggling = distancesToStruggling.length > 0 
      ? Math.min(...distancesToStruggling)
      : 1.0;

    // Find most similar mastered phonemes
    const similarMastered = masteredPhonemes
      .map(m => ({ phoneme: m, distance: phonemeDistance(targetPhoneme, m) }))
      .filter(({ distance }) => distance < 0.4)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(({ phoneme }) => phoneme);

    // Calculate transfer probability
    let transferProbability = 0;
    let readinessLevel: 'high' | 'medium' | 'low' = 'low';
    let reasoning = '';

    if (avgDistanceToMastered < 0.25 && minDistanceToStruggling > 0.5) {
      // HIGH probability: Similar to mastered, different from struggling
      transferProbability = Math.round((1 - avgDistanceToMastered) * 100);
      readinessLevel = 'high';
      reasoning = `Very similar to mastered ${similarMastered.map(p => `/${p}/`).join(', ')}. Strong transfer potential!`;
    } else if (avgDistanceToMastered < 0.4) {
      // MEDIUM probability: Moderately similar to mastered
      transferProbability = Math.round((1 - avgDistanceToMastered) * 80);
      readinessLevel = 'medium';
      reasoning = `Shares features with ${similarMastered.map(p => `/${p}/`).join(', ')}. Ready with practice.`;
    } else if (minDistanceToStruggling < 0.3) {
      // LOW probability: Similar to struggling phonemes
      transferProbability = Math.round((1 - avgDistanceToMastered) * 40);
      readinessLevel = 'low';
      reasoning = `Similar to sounds you're working on. Need more foundation first.`;
    } else {
      // MEDIUM-LOW probability: Distant from both
      transferProbability = Math.round((1 - avgDistanceToMastered) * 60);
      readinessLevel = 'low';
      reasoning = `Different from familiar sounds. Will require dedicated practice.`;
    }

    // Apply grade-level curriculum filtering (optional)
    if (studentGrade && studentGrade < 3) {
      // Early elementary: Penalize complex phonemes
      const complexPhonemes = ['θ', 'ð', 'ʒ', 'ɹ'];
      if (complexPhonemes.includes(targetPhoneme)) {
        transferProbability = Math.round(transferProbability * 0.7);
      }
    }

    predictions.push({
      phoneme: targetPhoneme,
      transferProbability: Math.min(95, Math.max(5, transferProbability)),
      reasoning,
      similarToMastered: similarMastered,
      differentFromStruggling: minDistanceToStruggling > 0.5,
      articulatoryDistance: avgDistanceToMastered,
      readinessLevel,
    });
  }

  // Sort by probability (highest first) and return top 10
  return predictions
    .sort((a, b) => b.transferProbability - a.transferProbability)
    .slice(0, 10);
};

/**
 * Get a human-readable explanation of articulatory features
 */
export const explainPhonemeFeatures = (phoneme: string): string => {
  const features = phonemeFeatures[phoneme];
  if (!features) return 'Unknown phoneme';

  const voicing = features.voicing === 1 ? 'voiced' : 'voiceless';
  const place = ['bilabial', 'alveolar', 'velar', 'labiodental', 'dental', 'postalveolar', 'glottal', 'labio-velar', 'palatal'][features.place - 1] || 'unknown place';
  const manner = ['stop', 'fricative', 'affricate', 'nasal', 'lateral', 'approximant', 'vowel'][features.manner - 1] || 'unknown manner';

  return `${voicing} ${place} ${manner}`;
};