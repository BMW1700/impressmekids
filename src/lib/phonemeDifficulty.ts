/**
 * Phoneme-based difficulty scoring system
 * 
 * Each IPA phoneme is scored 1–10 based on developmental acquisition order
 * from speech-language pathology research (Sander 1972, Shriberg 1993).
 * 
 * Word difficulty = avg(phoneme difficulties) × length multiplier
 * Story grade level = avg(word difficulties) → mapped to grade 0–8
 */

import { getIPAPronunciation } from './cmuDictWrapper';

// IPA phoneme difficulty scores (1-10)
// Based on age of acquisition in typically developing children
const phonemeDifficultyMap: Record<string, number> = {
  // === EASY (1-2): Acquired by age 3 ===
  // Short vowels
  'ɑ': 1, // /a/ as in "hot", /ar/ as in "car"
  'æ': 1, // /a/ as in "cat"
  'ʌ': 1, // /u/ as in "cup"
  'ɛ': 1, // /e/ as in "bed"
  'ɪ': 1, // /i/ as in "sit"
  'i': 1, // /ee/ as in "tree"
  'ʊ': 1, // /oo/ as in "book"
  'u': 1, // /ue/ as in "blue"
  'ɔ': 1, // /au/ as in "saw"
  'ə': 1, // schwa as in "about"
  'ɝ': 2, // /ur/, /er/ as in "bird", "teacher"

  // Early consonants
  'm': 1, 'n': 1, 'p': 1, 'b': 1, 'h': 1, 'w': 1,
  't': 2, 'd': 2,

  // === MEDIUM (3-5): Acquired by age 4-5 ===
  'k': 3, 'ɡ': 3, 'f': 3,
  'j': 3, // /y/ as in "yes"
  's': 4, 'z': 4,
  'v': 4,
  'l': 5,
  'tʃ': 4, // /ch/ as in "chair"
  'dʒ': 4, // /j/ as in "judge"
  'ʃ': 5,  // /sh/ as in "ship"

  // === HARD (6-10): Acquired by age 6+ ===
  'ɹ': 7,  // /r/ - one of the last acquired
  'θ': 7,  // /th/ (voiceless, "think")
  'ð': 6,  // /th/ (voiced, "this")
  'ʒ': 8,  // /zh/ (as in "measure")
  'ŋ': 5,  // /ng/ (as in "sing")

  // Diphthongs - moderate difficulty
  'aʊ': 4, // /ow/ as in "out"
  'aɪ': 3, // /ie/ as in "eye"
  'eɪ': 3, // /ae/ as in "day"
  'oʊ': 3, // /oe/ as in "go"
  'ɔɪ': 5, // /oi/ as in "boy"

  // R-controlled vowels
  'ɑɹ': 6, // /ar/ as in "car"
  'ɔɹ': 6, // /or/ as in "for"
  'ɛɹ': 6, // /air/ as in "fair"
};

/**
 * Get difficulty score for a single phoneme (1-10)
 */
export const getPhonemeDifficulty = (phoneme: string): number => {
  return phonemeDifficultyMap[phoneme] ?? 3; // default to medium if unknown
};

/**
 * Compute difficulty score for a word based on its phonemes.
 * Returns a number roughly in range 1-10.
 * 
 * Formula: avg(phoneme difficulties) × length multiplier
 * Length multiplier: 1.0 for ≤3 phonemes, scaling up to 1.4 for 8+ phonemes
 */
export const getWordDifficulty = (word: string): number => {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return 0;

  const pronunciations = getIPAPronunciation(cleaned);
  const phonemes = pronunciations[0]; // use first pronunciation variant

  if (!phonemes || phonemes.length === 0) return 3;

  const totalDifficulty = phonemes.reduce(
    (sum, p) => sum + getPhonemeDifficulty(p), 0
  );
  const avgDifficulty = totalDifficulty / phonemes.length;

  // Length multiplier: longer words are harder to decode
  const lengthMultiplier = phonemes.length <= 3
    ? 1.0
    : Math.min(1.4, 1.0 + (phonemes.length - 3) * 0.08);

  return avgDifficulty * lengthMultiplier;
};

/**
 * Compute a grade level (0-8) for a passage of text.
 * Based on the average word difficulty of all words.
 */
export const getStoryGradeLevel = (passageText: string): number => {
  const words = passageText.split(/\s+/).filter(w => /[a-zA-Z]/.test(w));
  if (words.length === 0) return 0;

  const totalDifficulty = words.reduce(
    (sum, word) => sum + getWordDifficulty(word), 0
  );
  const avgDifficulty = totalDifficulty / words.length;

  // Map average word difficulty to grade level
  // Thresholds calibrated so simple CVC stories → grade 0,
  // complex multi-syllable stories → grade 6-8
  if (avgDifficulty < 2.0) return 0;  // Pre-K / Kindergarten
  if (avgDifficulty < 2.3) return 1;  // 1st grade
  if (avgDifficulty < 2.6) return 2;  // 2nd grade
  if (avgDifficulty < 2.9) return 3;  // 3rd grade
  if (avgDifficulty < 3.2) return 4;  // 4th grade
  if (avgDifficulty < 3.5) return 5;  // 5th grade
  if (avgDifficulty < 4.0) return 6;  // 6th grade
  if (avgDifficulty < 4.8) return 7;  // 7th grade
  return 8;                            // 8th grade+
};

/**
 * Compute a difficulty level (1-5) for a passage.
 * Simpler scale for UI display.
 */
export const getStoryDifficultyLevel = (passageText: string): number => {
  const grade = getStoryGradeLevel(passageText);
  if (grade <= 1) return 1;
  if (grade <= 3) return 2;
  if (grade <= 5) return 3;
  if (grade <= 6) return 4;
  return 5;
};
