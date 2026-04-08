/**
 * Decodability-Based Grade Level System (K–12)
 *
 * Grades text based on phoneme introduction order, phonics pattern complexity,
 * sentence complexity, and decodability percentage — mirroring real K–12
 * reading curriculum scope-and-sequence (Ehri 2005, NRP 2000).
 *
 * K–5: Word grade = max(phoneme grade, pattern grade).
 * 6–12: Adds sentence complexity scoring (length, clause density, vocabulary).
 * A passage's grade = max(word-decodability grade, sentence complexity grade).
 */

import { getIPAPronunciation } from './cmuDictWrapper';

// ─── High-Frequency Sight Words ──────────────────────────────────────────────
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
const VOWEL_PHONEMES = new Set([
  'ɑ','æ','ʌ','ɛ','ɪ','i','ʊ','u','ɔ','ə','ɝ',
  'aʊ','aɪ','eɪ','oʊ','ɔɪ',
  'ɑɹ','ɔɹ','ɛɹ','ɪɹ',
]);

const CONSONANT_PHONEMES = new Set([
  'm','n','p','b','h','w','t','d','k','ɡ','f','j',
  's','z','v','l','tʃ','dʒ','ʃ','ɹ','θ','ð','ʒ','ŋ',
]);

const GRADE_K_PHONEMES = new Set([
  'm','s','t','p','k','b','d','n','æ','ə',
]);

const GRADE_1_PHONEMES = new Set(Array.from(GRADE_K_PHONEMES).concat([
  'f','ɡ','h','dʒ','l','ɹ','v','w','j','z',
  'ɛ','ɪ','ɑ','ʌ','ɔ',
  'ʃ','tʃ','θ','ð','ŋ',
]));

const GRADE_2_PHONEMES = new Set(Array.from(GRADE_1_PHONEMES).concat([
  'eɪ','i','aɪ','oʊ','u',
]));

const GRADE_3_PHONEMES = new Set(Array.from(GRADE_2_PHONEMES).concat([
  'ɔɪ','aʊ','ɑɹ','ɔɹ','ɝ','ɛɹ','ɪɹ',
]));

const GRADE_4_PHONEMES = new Set(Array.from(GRADE_3_PHONEMES).concat([
  'ʊ','ʒ',
]));

const ALL_PHONEMES = new Set(Array.from(GRADE_4_PHONEMES));

// Extended to 13 entries (grades 0–12)
const GRADE_PHONEME_SETS: Set<string>[] = [
  GRADE_K_PHONEMES, GRADE_1_PHONEMES, GRADE_2_PHONEMES, GRADE_3_PHONEMES,
  GRADE_4_PHONEMES, ALL_PHONEMES, ALL_PHONEMES, ALL_PHONEMES,
  ALL_PHONEMES, ALL_PHONEMES, ALL_PHONEMES, ALL_PHONEMES, ALL_PHONEMES,
];

const getPhonemeGrade = (phoneme: string): number => {
  for (let g = 0; g < GRADE_PHONEME_SETS.length; g++) {
    if (GRADE_PHONEME_SETS[g].has(phoneme)) return g;
  }
  return 4;
};

// ─── Phonics Pattern Detection ──────────────────────────────────────────────
const isVowel = (phoneme: string): boolean => VOWEL_PHONEMES.has(phoneme);
const isConsonant = (phoneme: string): boolean => CONSONANT_PHONEMES.has(phoneme);
const DIGRAPH_PHONEMES = new Set(['ʃ', 'tʃ', 'θ', 'ð', 'ŋ']);

const PREFIXES = ['un','re','pre','dis','mis','non','over','under','out','sub','super','anti','inter','trans'];
const SUFFIXES = ['ing','ed','er','est','ly','ful','less','ness','ment','tion','sion','able','ible','ous','ive','al','ial'];

// Advanced affixes for grades 7+
const ADVANCED_PREFIXES = ['counter','pseudo','quasi','meta','multi','poly','hyper','ultra','macro','semi','infra','circum','extra','intra'];
const ADVANCED_SUFFIXES = ['ology','ological','ification','istically','ousness','entially','ization','ographical','ionnaire','aceous','escent','atorial'];

const GRECO_LATIN = ['bio','geo','graph','phon','scope','tele','micro','auto','photo','hydro','therm','chron','struct','ject','rupt','port','dict','scrib','script','spec','duct','form','mit','mis','vert','vers'];
const ADVANCED_ROOTS = ['psych','anthro','socio','neuro','electr','philos','patho','morpho','cosmo','proto','crypto','pneum','rhetor','pedagog','phenomen','bureauc','democr','ideolog','epistemo','astro','ethno','techno','physio','archaeo','eco'];

const ALL_ROOTS = [...GRECO_LATIN, ...ADVANCED_ROOTS];
const ALL_PREFIXES = [...PREFIXES, ...ADVANCED_PREFIXES];
const ALL_SUFFIXES = [...SUFFIXES, ...ADVANCED_SUFFIXES];

/**
 * Detect the phonics pattern grade required for a word.
 * Extended to return grades 0–10 for K–12 support.
 */
const getPatternGrade = (word: string, phonemes: string[]): number => {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return 0;

  const vowelCount = phonemes.filter(isVowel).length;
  let patternGrade = 0;

  // Check for Greek/Latin roots (basic + advanced)
  const basicRootMatch = GRECO_LATIN.some(root => cleaned.includes(root)) && cleaned.length >= 6;
  const advancedRootMatch = ADVANCED_ROOTS.some(root => cleaned.includes(root)) && cleaned.length >= 6;
  const hasGrecoLatin = basicRootMatch || advancedRootMatch;
  const rootCount = ALL_ROOTS.filter(root => cleaned.includes(root)).length;

  // Check for affixes (basic + advanced)
  const hasBasicPrefix = PREFIXES.some(p => cleaned.startsWith(p) && cleaned.length > p.length + 2);
  const hasAdvancedPrefix = ADVANCED_PREFIXES.some(p => cleaned.startsWith(p) && cleaned.length > p.length + 2);
  const hasPrefix = hasBasicPrefix || hasAdvancedPrefix;

  const hasBasicSuffix = SUFFIXES.some(s => cleaned.endsWith(s) && cleaned.length > s.length + 2);
  const hasAdvancedSuffix = ADVANCED_SUFFIXES.some(s => cleaned.endsWith(s) && cleaned.length > s.length + 2);
  const hasSuffix = hasBasicSuffix || hasAdvancedSuffix;

  // ── Grades 7–10: Advanced morphological complexity ──

  // Grade 10: extreme morphological density (18+ chars with roots + affixes)
  if (cleaned.length >= 18 && vowelCount >= 7) {
    patternGrade = Math.max(patternGrade, 10);
  }

  // Grade 9: very high complexity (16+ chars OR multiple roots + both affixes)
  if (cleaned.length >= 16 && vowelCount >= 6) {
    patternGrade = Math.max(patternGrade, 9);
  }
  if (rootCount >= 2 && hasPrefix && hasSuffix) {
    patternGrade = Math.max(patternGrade, 9);
  }

  // Grade 8: multiple Greco-Latin roots, OR 14+ chars with affixes
  if (rootCount >= 2 && vowelCount >= 4) {
    patternGrade = Math.max(patternGrade, 8);
  }
  if (cleaned.length >= 14 && vowelCount >= 5 && (hasPrefix || hasSuffix)) {
    patternGrade = Math.max(patternGrade, 8);
  }
  if (hasAdvancedSuffix && cleaned.length >= 10) {
    patternGrade = Math.max(patternGrade, 8);
  }

  // Grade 7: prefix + suffix + 4+ syllables, OR advanced prefix/suffix
  if (hasPrefix && hasSuffix && vowelCount >= 4) {
    patternGrade = Math.max(patternGrade, 7);
  }
  if (hasAdvancedPrefix && cleaned.length >= 8) {
    patternGrade = Math.max(patternGrade, 7);
  }
  if (advancedRootMatch && (hasPrefix || hasSuffix)) {
    patternGrade = Math.max(patternGrade, 7);
  }

  // ── Grades 0–6: Original logic ──

  // Grade 6: morphological complexity (12+ chars, 5+ vowels)
  if (cleaned.length >= 12 && vowelCount >= 5) {
    patternGrade = Math.max(patternGrade, 6);
  }

  // Grade 5: Greek/Latin root + affix combo, OR 10-11 chars with 4+ vowels
  if (hasGrecoLatin && (hasPrefix || hasSuffix)) {
    patternGrade = Math.max(patternGrade, 5);
  }
  if (cleaned.length >= 10 && vowelCount >= 4 && cleaned.length < 12) {
    patternGrade = Math.max(patternGrade, 5);
  }

  // Grade 4: Greek/Latin roots alone
  if (hasGrecoLatin) {
    patternGrade = Math.max(patternGrade, 4);
  }

  // Grade 3: affixes or multisyllabic
  if (hasPrefix || hasSuffix) {
    patternGrade = Math.max(patternGrade, 3);
  }
  if (vowelCount >= 3) {
    patternGrade = Math.max(patternGrade, 3);
  }

  // Grade 2: two syllables, silent-e, vowel teams
  if (vowelCount === 2) {
    patternGrade = Math.max(patternGrade, 2);
  }
  if (cleaned.endsWith('e') && cleaned.length >= 4) {
    const longVowels = new Set(['eɪ', 'aɪ', 'oʊ', 'i', 'u']);
    if (phonemes.some(p => longVowels.has(p))) {
      patternGrade = Math.max(patternGrade, 2);
    }
  }
  const vowelTeams = ['ai','ay','ee','ea','oa','ow','oo','ie','ue','ey','ei','au','aw'];
  if (vowelTeams.some(vt => cleaned.includes(vt))) {
    patternGrade = Math.max(patternGrade, 2);
  }

  // Grade 1: digraphs, consonant blends
  if (phonemes.some(p => DIGRAPH_PHONEMES.has(p))) {
    patternGrade = Math.max(patternGrade, 1);
  }
  for (let i = 0; i < phonemes.length - 1; i++) {
    if (isConsonant(phonemes[i]) && isConsonant(phonemes[i + 1])) {
      patternGrade = Math.max(patternGrade, 1);
      break;
    }
  }

  return patternGrade;
};

// ─── Word Grade Level ───────────────────────────────────────────────────────

/**
 * Determine the minimum grade at which a word is fully decodable.
 * Returns grade 0–12.
 */
export const getWordGradeLevel = (word: string): number => {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return 0;
  if (SIGHT_WORDS.has(cleaned)) return 0;

  const pronunciations = getIPAPronunciation(cleaned);
  const phonemes = pronunciations[0];
  if (!phonemes || phonemes.length === 0) return 3;

  let phonemeGrade = 0;
  for (const p of phonemes) {
    phonemeGrade = Math.max(phonemeGrade, getPhonemeGrade(p));
  }

  const patternGrade = getPatternGrade(cleaned, phonemes);
  return Math.max(phonemeGrade, patternGrade);
};

// ─── Sentence Complexity Scoring ────────────────────────────────────────────

/**
 * Compute a sentence-complexity-based grade floor for a passage.
 * Considers average sentence length, average word length, and clause density.
 * Returns 0 (no boost) or a grade 6–12.
 */
const computeSentenceComplexityGrade = (text: string): number => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
  if (sentences.length < 2) return 0;

  const words = text.split(/\s+/).filter(w => /[a-zA-Z]/.test(w));
  if (words.length < 10) return 0;

  const avgSentLen = words.length / sentences.length;
  const totalCharLen = words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z]/g, '').length, 0);
  const avgWordLen = totalCharLen / words.length;

  const commas = (text.match(/,/g) || []).length;
  const commaDensity = commas / sentences.length;
  const semicolons = (text.match(/[;:—–]/g) || []).length;

  // Count long words (7+ chars, excluding sight words)
  const longWords = words.filter(w => {
    const c = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
    return c.length >= 7 && !SIGHT_WORDS.has(c);
  });
  const longWordPct = longWords.length / words.length;

  let score = 0;

  // Sentence length scoring
  if (avgSentLen >= 30) score += 4;
  else if (avgSentLen >= 25) score += 3;
  else if (avgSentLen >= 21) score += 2;
  else if (avgSentLen >= 17) score += 1;

  // Word length scoring
  if (avgWordLen >= 6.5) score += 4;
  else if (avgWordLen >= 5.8) score += 3;
  else if (avgWordLen >= 5.2) score += 2;
  else if (avgWordLen >= 4.7) score += 1;

  // Clause density scoring
  if (commaDensity >= 4.0) score += 3;
  else if (commaDensity >= 3.0) score += 2;
  else if (commaDensity >= 2.0) score += 1;

  // Long word density
  if (longWordPct >= 0.35) score += 3;
  else if (longWordPct >= 0.25) score += 2;
  else if (longWordPct >= 0.15) score += 1;

  // Semicolons/colons/dashes (complex syntax markers)
  if (semicolons >= 3) score += 1;

  // Map score → grade (0–15 possible)
  if (score >= 13) return 12;
  if (score >= 11) return 11;
  if (score >= 9) return 10;
  if (score >= 7) return 9;
  if (score >= 5) return 8;
  if (score >= 4) return 7;
  if (score >= 3) return 6;
  return 0;
};

// ─── Passage / Story Grade Level ────────────────────────────────────────────

const getDecodabilityThreshold = (grade: number): number => {
  if (grade <= 1) return 0.90;
  if (grade <= 3) return 0.80;
  return 0.70;
};

export interface DecodabilityAnalysis {
  gradeLevel: number;
  decodabilityByGrade: number[];     // percentage decodable at each grade 0–12
  wordGrades: Map<string, number>;
  totalWords: number;
  sightWordCount: number;
  hardestWords: { word: string; grade: number }[];
  sentenceComplexityGrade: number;   // grade from sentence complexity alone
}

/**
 * Analyze a passage and determine its grade level based on decodability
 * and sentence complexity.
 */
export const analyzePassageDecodability = (text: string): DecodabilityAnalysis => {
  const rawWords = text.split(/\s+/).filter(w => /[a-zA-Z]/.test(w));
  if (rawWords.length === 0) {
    return {
      gradeLevel: 0,
      decodabilityByGrade: Array(13).fill(1),
      wordGrades: new Map(),
      totalWords: 0,
      sightWordCount: 0,
      hardestWords: [],
      sentenceComplexityGrade: 0,
    };
  }

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

  const tokenGrades: number[] = rawWords.map(raw => {
    const cleaned = raw.toLowerCase().replace(/[^a-z]/g, '');
    return wordGradeCache.get(cleaned) ?? 3;
  });

  const totalWords = tokenGrades.length;

  // Calculate decodability % at each grade level 0–12
  const decodabilityByGrade: number[] = [];
  for (let g = 0; g <= 12; g++) {
    const decodable = tokenGrades.filter(wg => wg <= g).length;
    decodabilityByGrade.push(decodable / totalWords);
  }

  // Word-based grade = lowest grade where threshold is met
  let wordBasedGrade = 12;
  for (let g = 0; g <= 12; g++) {
    const threshold = getDecodabilityThreshold(g);
    if (decodabilityByGrade[g] >= threshold) {
      wordBasedGrade = g;
      break;
    }
  }

  // Sentence complexity grade
  const sentenceComplexityGrade = computeSentenceComplexityGrade(text);

  // Final grade = max of word-based and sentence complexity
  const gradeLevel = Math.max(wordBasedGrade, sentenceComplexityGrade);

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
    sentenceComplexityGrade,
  };
};

/**
 * Get grade level (0–12) for a passage of text.
 */
export const getPassageGradeLevel = (text: string): number => {
  return analyzePassageDecodability(text).gradeLevel;
};

/**
 * Get difficulty level (1–5) for UI display.
 */
export const getPassageDifficultyLevel = (text: string): number => {
  const grade = getPassageGradeLevel(text);
  if (grade <= 1) return 1;
  if (grade <= 3) return 2;
  if (grade <= 5) return 3;
  if (grade <= 8) return 4;
  return 5;
};
