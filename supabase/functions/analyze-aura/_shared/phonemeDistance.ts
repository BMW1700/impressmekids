/**
 * Phoneme distance calculation for Deno edge functions
 * Same implementation as browser version
 */

export const phonemeFeatures: { [key: string]: { voicing: number; place: number; manner: number } } = {
  'b': { voicing: 1, place: 1, manner: 1 }, 'p': { voicing: 0, place: 1, manner: 1 },
  'd': { voicing: 1, place: 2, manner: 1 }, 't': { voicing: 0, place: 2, manner: 1 },
  'g': { voicing: 1, place: 3, manner: 1 }, 'ɡ': { voicing: 1, place: 3, manner: 1 },
  'k': { voicing: 0, place: 3, manner: 1 },
  'f': { voicing: 0, place: 4, manner: 2 }, 'v': { voicing: 1, place: 4, manner: 2 },
  'θ': { voicing: 0, place: 5, manner: 2 }, 'ð': { voicing: 1, place: 5, manner: 2 },
  's': { voicing: 0, place: 2, manner: 2 }, 'z': { voicing: 1, place: 2, manner: 2 },
  'ʃ': { voicing: 0, place: 6, manner: 2 }, 'ʒ': { voicing: 1, place: 6, manner: 2 },
  'h': { voicing: 0, place: 7, manner: 2 },
  'tʃ': { voicing: 0, place: 6, manner: 3 }, 'dʒ': { voicing: 1, place: 6, manner: 3 },
  'm': { voicing: 1, place: 1, manner: 4 }, 'n': { voicing: 1, place: 2, manner: 4 },
  'ŋ': { voicing: 1, place: 3, manner: 4 },
  'l': { voicing: 1, place: 2, manner: 5 }, 'ɹ': { voicing: 1, place: 2, manner: 6 },
  'w': { voicing: 1, place: 8, manner: 6 }, 'j': { voicing: 1, place: 9, manner: 6 },
  'æ': { voicing: 1, place: 10, manner: 7 }, 'ɑ': { voicing: 1, place: 11, manner: 7 },
  'ɛ': { voicing: 1, place: 10, manner: 8 }, 'ɪ': { voicing: 1, place: 10, manner: 9 },
  'i': { voicing: 1, place: 10, manner: 10 }, 'ʌ': { voicing: 1, place: 11, manner: 8 },
  'u': { voicing: 1, place: 11, manner: 10 }, 'ʊ': { voicing: 1, place: 11, manner: 9 },
  'ə': { voicing: 1, place: 12, manner: 8 }, 'ɔ': { voicing: 1, place: 11, manner: 8 },
  'ɝ': { voicing: 1, place: 12, manner: 9 },
  // Diphthongs
  'aɪ': { voicing: 1, place: 10, manner: 7 }, 'aʊ': { voicing: 1, place: 11, manner: 7 },
  'eɪ': { voicing: 1, place: 10, manner: 8 }, 'oʊ': { voicing: 1, place: 11, manner: 9 },
  'ɔɪ': { voicing: 1, place: 11, manner: 7 },
  // R-controlled vowels
  'ɑɹ': { voicing: 1, place: 11, manner: 6 },
  'ɔɹ': { voicing: 1, place: 11, manner: 6 },
  'ɛɹ': { voicing: 1, place: 10, manner: 6 },
};

export const phonemeDistance = (p1: string, p2: string): number => {
  if (p1 === p2) return 0.0;
  
  const f1 = phonemeFeatures[p1];
  const f2 = phonemeFeatures[p2];
  
  if (!f1 || !f2) return 0.9;
  
  const voicingDiff = Math.abs(f1.voicing - f2.voicing) * 0.3;
  const placeDiff = Math.abs(f1.place - f2.place) / 12 * 0.4;
  const mannerDiff = Math.abs(f1.manner - f2.manner) / 10 * 0.3;
  
  return Math.min(1.0, voicingDiff + placeDiff + mannerDiff);
};

export const arePhonemesSimilar = (p1: string, p2: string, threshold = 0.3): boolean => {
  return phonemeDistance(p1, p2) < threshold;
};

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
    
    if (arePhonemesSimilar(det, exp)) {
      correctCount++;
      phonemeScores[exp].correct++;
    }
  }
  
  const accuracy = matchCount > 0 ? (correctCount / matchCount) * 100 : 0;
  
  const problematicPhonemes = Object.entries(phonemeScores)
    .filter(([_, scores]) => scores.total >= 2 && (scores.correct / scores.total) < 0.7)
    .map(([phoneme]) => phoneme);
  
  return { accuracy, problematicPhonemes };
};
