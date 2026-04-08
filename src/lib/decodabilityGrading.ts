/**
 * Decodability-Based Grade Level System
 *
 * Grades text based on phoneme introduction order, phonics pattern complexity,
 * and decodability percentage — mirroring real K–12 reading curriculum
 * scope-and-sequence (Ehri 2005, NRP 2000).
 *
 * A word's grade = max(phoneme grade, pattern grade).
 * A passage's grade = lowest grade where enough words are decodable.
 */

import { getIPAPronunciation } from './cmuDictWrapper';

// ─── High-Frequency Sight Words ──────────────────────────────────────────────
// Exempt from decodability checks — memorized at all levels
const SIGHT_WORDS = new Set([
  'the','a','an','i','is','am','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','shall','should',
  'may','might','must','can','could','not','no','yes',
  'and','but','or','nor','for','so','yet',
  'to','of','in','on','at','by','up','out','off','from','into','with',
  'as','if','then','than','that','this','these','those',
  'it','its','he','she','we','me','us','him','her','his','my','our',
  'you','your','they','them','their','there','here','where','when',
  'what','which','who','whom','whose','why','how',
  'all','each','every','both','few','more','most','other','some','any',
  'many','much','such','own',
  'said','says','say','go','goes','went','gone','come','came',
  'get','got','give','gave','make','made','take','took',
  'see','saw','seen','look','looked','know','knew','known',
  'want','like','just','also','very','too','only','about','after',
  'before','again','because','between','through','over','under',
  'one','two','three','four','five','first','new','old','good','great',
  'little','big','long','right','put','people','Mr','Mrs',
]);

// ─── IPA Phoneme Sets by Grade ──────────────────────────────────────────────
// Cumulative: each grade adds to previous grades

const VOWEL_PHONEMES = new Set([
  'ɑ','æ','ʌ','ɛ','ɪ','i','ʊ','u','ɔ','ə','ɝ',
  'aʊ','aɪ','eɪ','oʊ','ɔɪ',
  'ɑɹ','ɔɹ','ɛɹ','ɪɹ',
]);

const CONSONANT_PHONEMES = new Set([
  'm','n','p','b','h','w','t','d','k','ɡ','f','j',
  's','z','v','l','tʃ','dʒ','ʃ','ɹ','θ','ð','ʒ','ŋ',
]);

// Grade 0 (K): earliest consonants + short /æ/ only
const GRADE_K_PHONEMES = new Set([
  'm','s','t','p','k','b','d','n',
  'æ',        // short a
  'ə',        // schwa (appears in unstressed syllables of even simple words)
]);

// Grade 1: remaining consonants, all short vowels, digraphs
const GRADE_1_PHONEMES = new Set([
  ...GRADE_K_PHONEMES,
  'f','ɡ','h','dʒ','l','ɹ','v','w','j','z',
  'ɛ','ɪ','ɑ','ʌ','ɔ',   // remaining short vowels
  'ʃ','tʃ','θ','ð','ŋ',   // digraphs
]);

// Grade 2: long vowels, vowel teams
const GRADE_2_PHONEMES = new Set([
  ...GRADE_1_PHONEMES,
  'eɪ','i','aɪ','oʊ','u', // long vowels
]);

// Grade 3: diphthongs, R-controlled vowels
const GRADE_3_PHONEMES = new Set([
  ...GRADE_2_PHONEMES,
  'ɔɪ','aʊ',              // diphthongs
  'ɑɹ','ɔɹ','ɝ','ɛɹ','ɪɹ', // R-controlled
]);

// Grade 4-5: remaining phonemes
const GRADE_4_PHONEMES = new Set([
  ...GRADE_3_PHONEMES,
  'ʊ','ʒ',                // variant vowel + /zh/
]);

// Grade 6+: all phonemes — nothing new
const ALL_PHONEMES = new Set([
  ...GRADE_4_PHONEMES,
]);

const GRADE_PHONEME_SETS: Set<string>[] = [
  GRADE_K_PHONEMES,   // 0 = K
  GRADE_1_PHONEMES,   // 1
  GRADE_2_PHONEMES,   // 2
  GRADE_3_PHONEMES,   // 3
  GRADE_4_PHONEMES,   // 4
  ALL_PHONEMES,       // 5
  ALL_PHONEMES,       // 6
  ALL_PHONEMES,       // 7
  ALL_PHONEMES,       // 8
];

/**
 * Get the minimum grade at which a phoneme is introduced.
 */
const getPhonemeGrade = (phoneme: string): number => {
  for (let g = 0; g < GRADE_PHONEME_SETS.length; g++) {
    if (GRADE_PHONEME_SETS[g].has(phoneme)) return g;
  }
  return 4; // unknown phoneme → grade 4 default
};

// ─── Phonics Pattern Detection ──────────────────────────────────────────────

const isVowel = (phoneme: string): boolean => VOWEL_PHONEMES.has(phoneme);
const isConsonant = (phoneme: string): boolean => CONSONANT_PHONEMES.has(phoneme);

// Digraph phonemes (single IPA symbols representing two-letter combos)
const DIGRAPH_PHONEMES = new Set(['ʃ', 'tʃ', 'θ', 'ð', 'ŋ']);

// Common prefixes and suffixes
const PREFIXES = ['un','re','pre','dis','mis','non','over','under','out','sub','super','anti','inter','trans'];
const SUFFIXES = ['ing','ed','er','est','ly','ful','less','ness','ment','tion','sion','able','ible','ous','ive','al','ial'];

// Greek/Latin roots
const GRECO_LATIN = ['bio','geo','graph','phon','scope','tele','micro','auto','photo','hydro','therm','chron','struct','ject','rupt','port','dict','scrib','script','spec','duct','form','mit','mis','vert','vers'];

/**
 * Detect the phonics pattern grade required for a word.
 */
const getPatternGrade = (word: string, phonemes: string[]): number => {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return 0;

  const vowelCount = phonemes.filter(isVowel).length;
  const consonants = phonemes.filter(isConsonant);
  let patternGrade = 0;

  // Check for Greek/Latin roots → grade 4-5
  if (GRECO_LATIN.some(root => cleaned.includes(root)) && cleaned.length >= 6) {
    patternGrade = Math.max(patternGrade, 4);
  }

  // Check for complex affixes → grade 3
  const hasPrefix = PREFIXES.some(p => cleaned.startsWith(p) && cleaned.length > p.length + 2);
  const hasSuffix = SUFFIXES.some(s => cleaned.endsWith(s) && cleaned.length > s.length + 2);
  if (hasPrefix || hasSuffix) {
    patternGrade = Math.max(patternGrade, 3);
  }

  // Multisyllabic (3+ vowel phonemes) → grade 3
  if (vowelCount >= 3) {
    patternGrade = Math.max(patternGrade, 3);
  }

  // Two-syllable words → grade 2
  if (vowelCount === 2) {
    patternGrade = Math.max(patternGrade, 2);
  }

  // Silent-e / CVCe pattern → grade 2
  if (cleaned.endsWith('e') && cleaned.length >= 4) {
    const longVowels = new Set(['eɪ', 'aɪ', 'oʊ', 'i', 'u']);
    if (phonemes.some(p => longVowels.has(p))) {
      patternGrade = Math.max(patternGrade, 2);
    }
  }

  // Vowel teams in spelling → grade 2
  const vowelTeams = ['ai','ay','ee','ea','oa','ow','oo','ie','ue','ey','ei','au','aw'];
  if (vowelTeams.some(vt => cleaned.includes(vt))) {
    patternGrade = Math.max(patternGrade, 2);
  }

  // Digraphs in phonemes → grade 1
  if (phonemes.some(p => DIGRAPH_PHONEMES.has(p))) {
    patternGrade = Math.max(patternGrade, 1);
  }

  // Consonant blends (two consonants adjacent) → grade 1
  for (let i = 0; i < phonemes.length - 1; i++) {
    if (isConsonant(phonemes[i]) && isConsonant(phonemes[i + 1])) {
      patternGrade = Math.max(patternGrade, 1);
      break;
    }
  }

  // Morphological complexity (word length 10+) → grade 6
  if (cleaned.length >= 10 && vowelCount >= 4) {
    patternGrade = Math.max(patternGrade, 6);
  }

  return patternGrade;
};

// ─── Word Grade Level ───────────────────────────────────────────────────────

/**
 * Determine the minimum grade at which a word is fully decodable.
 * Returns grade 0-8.
 */
export const getWordGradeLevel = (word: string): number => {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return 0;

  // Sight words are decodable at all levels
  if (SIGHT_WORDS.has(cleaned)) return 0;

  const pronunciations = getIPAPronunciation(cleaned);
  const phonemes = pronunciations[0];
  if (!phonemes || phonemes.length === 0) return 3; // unknown → grade 3

  // Phoneme grade = highest grade required by any single phoneme
  let phonemeGrade = 0;
  for (const p of phonemes) {
    phonemeGrade = Math.max(phonemeGrade, getPhonemeGrade(p));
  }

  // Pattern grade = complexity of the word structure
  const patternGrade = getPatternGrade(cleaned, phonemes);

  // Word grade = whichever is higher
  return Math.max(phonemeGrade, patternGrade);
};

// ─── Passage / Story Grade Level ────────────────────────────────────────────

/**
 * Decodability thresholds by grade level.
 * K-1: 90% of words must be decodable
 * 2-3: 80%
 * 4+: 70%
 */
const getDecodabilityThreshold = (grade: number): number => {
  if (grade <= 1) return 0.90;
  if (grade <= 3) return 0.80;
  return 0.70;
};

export interface DecodabilityAnalysis {
  gradeLevel: number;
  decodabilityByGrade: number[];     // percentage decodable at each grade 0-8
  wordGrades: Map<string, number>;   // word → its grade level
  totalWords: number;
  sightWordCount: number;
  hardestWords: { word: string; grade: number }[];
}

/**
 * Analyze a passage and determine its grade level based on decodability.
 */
export const analyzePassageDecodability = (text: string): DecodabilityAnalysis => {
  const rawWords = text.split(/\s+/).filter(w => /[a-zA-Z]/.test(w));
  if (rawWords.length === 0) {
    return {
      gradeLevel: 0,
      decodabilityByGrade: Array(9).fill(1),
      wordGrades: new Map(),
      totalWords: 0,
      sightWordCount: 0,
      hardestWords: [],
    };
  }

  // Compute grade for each unique word
  const wordGradeCache = new Map<string, number>();
  let sightWordCount = 0;

  for (const raw of rawWords) {
    const cleaned = raw.toLowerCase().replace(/[^a-z]/g, '');
    if (!cleaned) continue;
    if (SIGHT_WORDS.has(cleaned)) sightWordCount++;
    if (!wordGradeCache.has(cleaned)) {
      wordGradeCache.set(cleaned, getWordGradeLevel(cleaned));
    }
  }

  // Build word grade array (one entry per token, including duplicates)
  const tokenGrades: number[] = rawWords.map(raw => {
    const cleaned = raw.toLowerCase().replace(/[^a-z]/g, '');
    return wordGradeCache.get(cleaned) ?? 3;
  });

  const totalWords = tokenGrades.length;

  // Calculate decodability % at each grade level
  const decodabilityByGrade: number[] = [];
  for (let g = 0; g <= 8; g++) {
    const decodable = tokenGrades.filter(wg => wg <= g).length;
    decodabilityByGrade.push(decodable / totalWords);
  }

  // Find passage grade = lowest grade where threshold is met
  let gradeLevel = 8;
  for (let g = 0; g <= 8; g++) {
    const threshold = getDecodabilityThreshold(g);
    if (decodabilityByGrade[g] >= threshold) {
      gradeLevel = g;
      break;
    }
  }

  // Collect hardest words (top 5 by grade)
  const uniqueEntries = Array.from(wordGradeCache.entries())
    .filter(([w]) => !SIGHT_WORDS.has(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, grade]) => ({ word, grade }));

  return {
    gradeLevel,
    decodabilityByGrade,
    wordGrades: wordGradeCache,
    totalWords,
    sightWordCount,
    hardestWords: uniqueEntries,
  };
};

/**
 * Get grade level (0-8) for a passage of text.
 * Drop-in replacement for the old averaging approach.
 */
export const getPassageGradeLevel = (text: string): number => {
  return analyzePassageDecodability(text).gradeLevel;
};

/**
 * Get difficulty level (1-5) for UI display.
 */
export const getPassageDifficultyLevel = (text: string): number => {
  const grade = getPassageGradeLevel(text);
  if (grade <= 1) return 1;
  if (grade <= 3) return 2;
  if (grade <= 5) return 3;
  if (grade <= 6) return 4;
  return 5;
};
