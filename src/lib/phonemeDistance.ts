/**
 * Phoneme distance calculation using feature-based similarity
 * Based on linguistic features: voicing, place, manner
 */

// IPA phoneme feature matrix (simplified for key phonemes)
export const phonemeFeatures: { [key: string]: { voicing: number; place: number; manner: number } } = {
  // Consonants
  'b': { voicing: 1, place: 1, manner: 1 }, // voiced bilabial stop
  'p': { voicing: 0, place: 1, manner: 1 }, // voiceless bilabial stop
  'd': { voicing: 1, place: 2, manner: 1 }, // voiced alveolar stop
  't': { voicing: 0, place: 2, manner: 1 }, // voiceless alveolar stop
  'g': { voicing: 1, place: 3, manner: 1 }, // voiced velar stop (represented as ɡ)
  'ɡ': { voicing: 1, place: 3, manner: 1 }, // voiced velar stop
  'k': { voicing: 0, place: 3, manner: 1 }, // voiceless velar stop
  'f': { voicing: 0, place: 4, manner: 2 }, // voiceless labiodental fricative
  'v': { voicing: 1, place: 4, manner: 2 }, // voiced labiodental fricative
  'θ': { voicing: 0, place: 5, manner: 2 }, // voiceless dental fricative (think)
  'ð': { voicing: 1, place: 5, manner: 2 }, // voiced dental fricative (this)
  's': { voicing: 0, place: 2, manner: 2 }, // voiceless alveolar fricative
  'z': { voicing: 1, place: 2, manner: 2 }, // voiced alveolar fricative
  'ʃ': { voicing: 0, place: 6, manner: 2 }, // voiceless postalveolar fricative (ship)
  'ʒ': { voicing: 1, place: 6, manner: 2 }, // voiced postalveolar fricative (measure)
  'h': { voicing: 0, place: 7, manner: 2 }, // voiceless glottal fricative
  'tʃ': { voicing: 0, place: 6, manner: 3 }, // voiceless postalveolar affricate (chip)
  'dʒ': { voicing: 1, place: 6, manner: 3 }, // voiced postalveolar affricate (judge)
  'm': { voicing: 1, place: 1, manner: 4 }, // voiced bilabial nasal
  'n': { voicing: 1, place: 2, manner: 4 }, // voiced alveolar nasal
  'ŋ': { voicing: 1, place: 3, manner: 4 }, // voiced velar nasal (sing)
  'l': { voicing: 1, place: 2, manner: 5 }, // voiced alveolar lateral approximant
  'ɹ': { voicing: 1, place: 2, manner: 6 }, // voiced alveolar approximant (English r)
  'w': { voicing: 1, place: 8, manner: 6 }, // voiced labio-velar approximant
  'j': { voicing: 1, place: 9, manner: 6 }, // voiced palatal approximant (yes)
  
  // Vowels (simplified features)
  'æ': { voicing: 1, place: 10, manner: 7 }, // /a/ near-open front unrounded (cat)
  'ɑ': { voicing: 1, place: 11, manner: 7 }, // /a/ open back unrounded (father)
  'ɛ': { voicing: 1, place: 10, manner: 8 }, // /e/ open-mid front unrounded (bed)
  'ɪ': { voicing: 1, place: 10, manner: 9 }, // /i/ near-close front unrounded (bit)
  'i': { voicing: 1, place: 10, manner: 10 }, // /ee/ close front unrounded (beat)
  'ʌ': { voicing: 1, place: 11, manner: 8 }, // /u/ open-mid back unrounded (but)
  'u': { voicing: 1, place: 11, manner: 10 }, // /ue/ close back rounded (boot)
  'ʊ': { voicing: 1, place: 11, manner: 9 }, // /oo/ near-close back rounded (book)
  'ə': { voicing: 1, place: 12, manner: 8 }, // schwa mid central (about)
  'ɔ': { voicing: 1, place: 11, manner: 8 }, // /au/ open-mid back rounded (caught)
  'ɝ': { voicing: 1, place: 12, manner: 9 }, // /ur/ r-colored vowel (bird)

  // Diphthongs (simplified features)
  'aɪ': { voicing: 1, place: 10, manner: 7 }, // /ie/ (eye)
  'aʊ': { voicing: 1, place: 11, manner: 7 }, // /ow/ (out)
  'eɪ': { voicing: 1, place: 10, manner: 8 }, // /ae/ (day)
  'oʊ': { voicing: 1, place: 11, manner: 9 }, // /oe/ (go)
  'ɔɪ': { voicing: 1, place: 11, manner: 7 }, // /oi/ (boy)
};

/**
 * Calculate phoneme distance using feature-based approach
 * Returns 0.0 (identical) to 1.0 (completely different)
 */
export const phonemeDistance = (p1: string, p2: string): number => {
  // Exact match
  if (p1 === p2) return 0.0;
  
  const f1 = phonemeFeatures[p1];
  const f2 = phonemeFeatures[p2];
  
  // If either phoneme is unknown, use high distance
  if (!f1 || !f2) return 0.9;
  
  // Calculate weighted feature differences
  const voicingDiff = Math.abs(f1.voicing - f2.voicing) * 0.3;
  const placeDiff = Math.abs(f1.place - f2.place) / 12 * 0.4;
  const mannerDiff = Math.abs(f1.manner - f2.manner) / 10 * 0.3;
  
  return Math.min(1.0, voicingDiff + placeDiff + mannerDiff);
};

/**
 * Check if two phonemes are similar enough to be considered a match
 * Threshold: < 0.3 distance = similar
 */
export const arePhonemesSimilar = (p1: string, p2: string, threshold = 0.3): boolean => {
  return phonemeDistance(p1, p2) < threshold;
};

/**
 * Find the closest matching phoneme from a list
 */
export const findClosestPhoneme = (target: string, candidates: string[]): { phoneme: string; distance: number } => {
  let closest = candidates[0] || '';
  let minDistance = 1.0;
  
  for (const candidate of candidates) {
    const dist = phonemeDistance(target, candidate);
    if (dist < minDistance) {
      minDistance = dist;
      closest = candidate;
    }
  }
  
  return { phoneme: closest, distance: minDistance };
};

/**
 * Calculate phoneme accuracy with fuzzy matching
 */
export const calculatePhonemeAccuracy = (
  detected: string[],
  expected: string[]
): { accuracy: number; problematicPhonemes: string[] } => {
  const matchCount = Math.min(detected.length, expected.length);
  let correctCount = 0;
  
  const phonemeScores: { [key: string]: { correct: number; total: number } } = {};
  
  for (let i = 0; i < matchCount; i++) {
    const det = detected[i] || '';
    const exp = expected[i] || '';
    
    if (!phonemeScores[exp]) {
      phonemeScores[exp] = { correct: 0, total: 0 };
    }
    
    phonemeScores[exp].total++;
    
    // Use fuzzy matching instead of exact match
    if (arePhonemesSimilar(det, exp)) {
      correctCount++;
      phonemeScores[exp].correct++;
    }
  }
  
  const accuracy = matchCount > 0 ? (correctCount / matchCount) * 100 : 0;
  
  // Identify problematic phonemes (< 70% accuracy)
  const problematicPhonemes = Object.entries(phonemeScores)
    .filter(([_, scores]) => scores.total >= 2 && (scores.correct / scores.total) < 0.7)
    .map(([phoneme]) => phoneme);
  
  return { accuracy, problematicPhonemes };
};
