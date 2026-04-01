/**
 * ML-ENHANCED: Phoneme Transfer Predictions using Patent #3 (RL Agent)
 * Replaces old rule-based phonemeTransferModel with RL-powered predictions
 */

import { PhonemeQAgent } from '../reinforcementLearning/qTable';
import { articulatoryFatigueTracker, calculateInterference } from '../reinforcementLearning/articulatoryModel';

export interface TransferPrediction {
  phoneme: string;
  transferProbability: number;
  reasoning: string;
  readinessLevel: 'high' | 'medium' | 'low';
  expectedGain: number;
  similarToMastered?: string[]; // Optional for backwards compatibility
}

/**
 * PATENT #3: RL-based phoneme gain predictions
 */
export function predictPhonemeGains(
  masteredPhonemes: string[],
  strugglingPhonemes: string[],
  grade?: number
): TransferPrediction[] {
  const qAgent = new PhonemeQAgent();
  qAgent.initializeQTable();
  
  const predictions: TransferPrediction[] = [];
  
  for (const targetPhoneme of strugglingPhonemes) {
    // Check articulatory fatigue
    const fatigueScore = articulatoryFatigueTracker.getFatigueScore(targetPhoneme);
    
    if (fatigueScore > 0.7) {
      // Too fatigued to practice effectively
      predictions.push({
        phoneme: targetPhoneme,
        transferProbability: 30,
        reasoning: `High articulatory fatigue (${Math.round(fatigueScore * 100)}%) - rest recommended`,
        readinessLevel: 'low',
        expectedGain: 5
      });
      continue;
    }
    
    // Find best mastered phoneme to transfer from
    let bestTransferPhoneme = '';
    let maxTransferScore = 0;
    
    for (const masteredPhoneme of masteredPhonemes) {
      const interference = calculateInterference(masteredPhoneme, targetPhoneme);
      const transferScore = (1 - interference.interferenceScore) * 100; // Lower interference = better transfer
      
      if (transferScore > maxTransferScore) {
        maxTransferScore = transferScore;
        bestTransferPhoneme = masteredPhoneme;
      }
    }
    
    // Use Q-Learning to get expected reward
    const state = {
      masteredPhonemes,
      strugglingPhonemes,
      recentAttempts: [],
      studentGrade: grade
    };
    
    const action = qAgent.selectAction(state);
    const qValue = action?.expectedReward || 0.5;
    
    // Convert Q-value to probability (sigmoid)
    const transferProbability = Math.round((1 / (1 + Math.exp(-5 * qValue))) * 100);
    
    const readinessLevel = transferProbability > 75 ? 'high' 
      : transferProbability > 50 ? 'medium' 
      : 'low';
    
    const expectedGain = Math.round(transferProbability * 0.2); // 0-20 point gain
    
    predictions.push({
      phoneme: targetPhoneme,
      transferProbability,
      reasoning: bestTransferPhoneme 
        ? `Transfer from mastered /${bestTransferPhoneme}/ (${Math.round(maxTransferScore)}% compatibility). Q-value: ${qValue.toFixed(2)}`
        : `Direct practice recommended. Q-value: ${qValue.toFixed(2)}`,
      readinessLevel,
      expectedGain,
      similarToMastered: bestTransferPhoneme ? [bestTransferPhoneme] : []
    });
  }
  
  return predictions.sort((a, b) => b.transferProbability - a.transferProbability);
}

/**
 * Explain phoneme articulatory features
 */
export function explainPhonemeFeatures(phoneme: string): string {
  const features: Record<string, string> = {
    'b': 'voiced bilabial stop',
    'p': 'voiceless bilabial stop',
    'd': 'voiced alveolar stop',
    't': 'voiceless alveolar stop',
    'g': 'voiced velar stop',
    'ɡ': 'voiced velar stop',
    'k': 'voiceless velar stop',
    'f': 'voiceless labiodental fricative',
    'v': 'voiced labiodental fricative',
    'θ': 'voiceless dental fricative',
    'ð': 'voiced dental fricative',
    's': 'voiceless alveolar fricative',
    'z': 'voiced alveolar fricative',
    'ʃ': 'voiceless postalveolar fricative',
    'ʒ': 'voiced postalveolar fricative',
    'h': 'voiceless glottal fricative',
    'tʃ': 'voiceless postalveolar affricate',
    'dʒ': 'voiced postalveolar affricate',
    'm': 'bilabial nasal',
    'n': 'alveolar nasal',
    'ŋ': 'velar nasal',
    'l': 'lateral liquid',
    'ɹ': 'rhotic liquid',
    'w': 'labial-velar glide',
    'j': 'palatal glide',
    'æ': 'near-open front vowel',
    'ɑ': 'open back vowel',
    'ɛ': 'open-mid front vowel',
    'ɪ': 'near-close front vowel',
    'i': 'close front vowel',
    'ʌ': 'open-mid back vowel',
    'u': 'close back rounded vowel',
    'ʊ': 'near-close back rounded vowel',
    'ə': 'mid central vowel (schwa)',
    'ɔ': 'open-mid back rounded vowel',
    'ɝ': 'r-colored mid central vowel',
    'aɪ': 'diphthong (eye)',
    'aʊ': 'diphthong (out)',
    'eɪ': 'diphthong (day)',
    'oʊ': 'diphthong (go)',
    'ɔɪ': 'diphthong (boy)',
    // R-controlled vowels
    'ɑɹ': 'r-controlled open back vowel (car)',
    'ɔɹ': 'r-controlled open-mid back vowel (for)',
    'ɛɹ': 'r-controlled open-mid front vowel (fair)',
    // Legacy aliases
    'sh': 'voiceless postalveolar fricative',
    'zh': 'voiced postalveolar fricative',
    'th': 'voiceless dental fricative',
    'dh': 'voiced dental fricative',
    'r': 'rhotic liquid',
    'y': 'palatal glide',
  };
  
  return features[phoneme.toLowerCase()] || features[phoneme] || 'complex sound';
}
