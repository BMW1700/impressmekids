/**
 * Centralized phoneme display utility
 * Converts IPA symbols and ARPABET codes to readable English letters
 * Used ONLY for UI display — internal calculations keep using IPA
 */

const IPA_TO_ENGLISH: Record<string, string> = {
  // Consonants
  'b': 'b',
  'p': 'p',
  'd': 'd',
  't': 't',
  'ɡ': 'g',
  'k': 'k',
  'f': 'f',
  'v': 'v',
  'θ': 'th',
  'ð': 'th',
  's': 's',
  'z': 'z',
  'ʃ': 'sh',
  'ʒ': 'zh',
  'h': 'h',
  'tʃ': 'ch',
  'dʒ': 'j',
  'm': 'm',
  'n': 'n',
  'ŋ': 'ng',
  'l': 'l',
  'ɹ': 'r',
  'w': 'w',
  'j': 'y',

  // Short vowels
  'æ': 'a',
  'ɛ': 'e',
  'ɪ': 'i',
  'ɑ': 'ah',
  'ʌ': 'u',
  'ʊ': 'oo',
  'ɔ': 'aw',
  'ə': 'uh',

  // Long vowels / diphthongs
  'eɪ': 'ay',
  'i': 'ee',
  'aɪ': 'ie',
  'oʊ': 'oh',
  'u': 'oo',
  'aʊ': 'ow',
  'ɔɪ': 'oy',

  // R-controlled vowels
  'ɝ': 'ur',
  'ɑɹ': 'ar',
  'ɔɹ': 'or',
  'ɛɹ': 'air',
  'ɪɹ': 'ear',
};

// ARPABET to English display
const ARPABET_TO_ENGLISH: Record<string, string> = {
  'AA': 'ah',
  'AE': 'a',
  'AH': 'uh',
  'AO': 'aw',
  'AW': 'ow',
  'AY': 'ie',
  'B': 'b',
  'CH': 'ch',
  'D': 'd',
  'DH': 'th',
  'EH': 'e',
  'ER': 'ur',
  'EY': 'ay',
  'F': 'f',
  'G': 'g',
  'HH': 'h',
  'IH': 'i',
  'IY': 'ee',
  'JH': 'j',
  'K': 'k',
  'L': 'l',
  'M': 'm',
  'N': 'n',
  'NG': 'ng',
  'OW': 'oh',
  'OY': 'oy',
  'P': 'p',
  'R': 'r',
  'S': 's',
  'SH': 'sh',
  'T': 't',
  'TH': 'th',
  'UH': 'oo',
  'UW': 'oo',
  'V': 'v',
  'W': 'w',
  'Y': 'y',
  'Z': 'z',
  'ZH': 'zh',
};

// Friendly descriptions for tooltips/labels
const IPA_TO_FRIENDLY: Record<string, string> = {
  'b': 'b (bat)',
  'p': 'p (pat)',
  'd': 'd (dog)',
  't': 't (top)',
  'ɡ': 'g (go)',
  'k': 'k (cat)',
  'f': 'f (fun)',
  'v': 'v (van)',
  'θ': 'th (think)',
  'ð': 'th (this)',
  's': 's (sun)',
  'z': 'z (zoo)',
  'ʃ': 'sh (ship)',
  'ʒ': 'zh (measure)',
  'h': 'h (hat)',
  'tʃ': 'ch (chip)',
  'dʒ': 'j (jump)',
  'm': 'm (mom)',
  'n': 'n (no)',
  'ŋ': 'ng (sing)',
  'l': 'l (love)',
  'ɹ': 'r (red)',
  'w': 'w (wet)',
  'j': 'y (yes)',
  'æ': 'a (cat)',
  'ɛ': 'e (bed)',
  'ɪ': 'i (sit)',
  'ɑ': 'ah (father)',
  'ʌ': 'u (but)',
  'ʊ': 'oo (book)',
  'ɔ': 'aw (caught)',
  'ə': 'uh (about)',
  'eɪ': 'ay (say)',
  'i': 'ee (see)',
  'aɪ': 'ie (my)',
  'oʊ': 'oh (go)',
  'u': 'oo (boot)',
  'aʊ': 'ow (cow)',
  'ɔɪ': 'oy (boy)',
  'ɝ': 'ur (bird)',
  'ɑɹ': 'ar (car)',
  'ɔɹ': 'or (for)',
  'ɛɹ': 'air (fair)',
  'ɪɹ': 'ear (ear)',
};

/**
 * Convert an IPA or ARPABET phoneme to a readable English display string.
 * e.g. "θ" → "th", "ʃ" → "sh", "æ" → "a"
 */
export const ipaToEnglish = (phoneme: string): string => {
  if (!phoneme) return phoneme;
  const trimmed = phoneme.trim().replace(/[0-9]/g, '');

  // Try IPA first (exact match, longest first for composites)
  if (IPA_TO_ENGLISH[trimmed]) return IPA_TO_ENGLISH[trimmed];

  // Try ARPABET
  const upper = trimmed.toUpperCase();
  if (ARPABET_TO_ENGLISH[upper]) return ARPABET_TO_ENGLISH[upper];

  // Pass through (already English or unknown)
  return trimmed;
};

/**
 * Convert to English with slash notation: /th/, /sh/, etc.
 */
export const ipaToEnglishWithSlashes = (phoneme: string): string => {
  return `/${ipaToEnglish(phoneme)}/`;
};

/**
 * Get a friendly human-readable label with example word.
 * e.g. "θ" → "th (think)"
 */
export const ipaToFriendlyLabel = (phoneme: string): string => {
  if (!phoneme) return phoneme;
  const trimmed = phoneme.trim().replace(/[0-9]/g, '');

  if (IPA_TO_FRIENDLY[trimmed]) return IPA_TO_FRIENDLY[trimmed];

  const upper = trimmed.toUpperCase();
  if (ARPABET_TO_ENGLISH[upper]) return ARPABET_TO_ENGLISH[upper];

  return trimmed;
};
