/**
 * Transcript Cleanup Utilities
 * Cleans speech recognition transcripts for better word matching
 * 
 * Handles:
 * - Filler words (um, uh, like)
 * - Self-corrections (ca- cat → cat)
 * - False starts
 * - Common speech disfluencies
 */

// Filler words to remove from transcripts
const FILLER_WORDS = new Set([
  'um', 'uh', 'umm', 'uhh', 'hmm', 'hm', 'mm',
  'er', 'err', 'ah', 'ahh', 'oh', 'ohh',
  'like', 'so', 'well', 'okay', 'ok',
  'yeah', 'yep', 'yup', 'nope', 'nah',
  'just', 'actually', 'basically', 'literally',
  'you know', 'i mean', 'sort of', 'kind of',
]);

// Common false start patterns (partial words)
const FALSE_START_PATTERN = /\b(\w{1,3})-\s*/g;  // "ca- cat" or "th- the"

// Self-correction patterns
const SELF_CORRECTION_PATTERNS = [
  /\b(\w+)\s+(?:no|wait|i mean)\s+(\w+)\b/gi,  // "dog no cat" → "cat"
  /\b(\w+)\s+(?:sorry)\s+(\w+)\b/gi,            // "dog sorry cat" → "cat"
];

// Repeated word pattern (stuttering)
const REPEATED_WORD_PATTERN = /\b(\w+)(?:\s+\1)+\b/gi;  // "the the the" → "the"

/**
 * Remove filler words from transcript
 */
export const removeFillerWords = (transcript: string): string => {
  const words = transcript.split(/\s+/);
  const cleaned = words.filter(word => {
    const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
    return !FILLER_WORDS.has(normalized);
  });
  return cleaned.join(' ');
};

/**
 * Handle false starts (partial words with hyphen)
 * "ca- cat" → "cat"
 * "th- the" → "the"
 */
export const handleFalseStarts = (transcript: string): string => {
  return transcript.replace(FALSE_START_PATTERN, '');
};

/**
 * Handle self-corrections
 * "dog no cat" → "cat"
 * "the wait a" → "a"
 */
export const handleSelfCorrections = (transcript: string): string => {
  let result = transcript;
  
  for (const pattern of SELF_CORRECTION_PATTERNS) {
    result = result.replace(pattern, '$2');
  }
  
  return result;
};

/**
 * Handle repeated words (stuttering)
 * "the the the cat" → "the cat"
 */
export const handleRepeatedWords = (transcript: string): string => {
  return transcript.replace(REPEATED_WORD_PATTERN, '$1');
};

/**
 * Normalize contractions to match expected text
 */
export const normalizeContractions = (transcript: string): string => {
  const contractionMap: Record<string, string> = {
    'cannot': "can't",
    'do not': "don't",
    'does not': "doesn't",
    'did not': "didn't",
    'will not': "won't",
    'would not': "wouldn't",
    'could not': "couldn't",
    'should not': "shouldn't",
    'is not': "isn't",
    'are not': "aren't",
    'was not': "wasn't",
    'were not': "weren't",
    'have not': "haven't",
    'has not': "hasn't",
    'had not': "hadn't",
    'i am': "i'm",
    'you are': "you're",
    'we are': "we're",
    'they are': "they're",
    'it is': "it's",
    'that is': "that's",
    'what is': "what's",
    'there is': "there's",
    'here is': "here's",
    'let us': "let's",
    'i will': "i'll",
    'you will': "you'll",
    'we will': "we'll",
    'they will': "they'll",
    'i would': "i'd",
    'you would': "you'd",
    'we would': "we'd",
    'they would': "they'd",
    'i have': "i've",
    'you have': "you've",
    'we have': "we've",
    'they have': "they've",
    'going to': 'gonna',
    'want to': 'wanna',
    'got to': 'gotta',
  };
  
  let result = transcript.toLowerCase();
  
  for (const [full, contracted] of Object.entries(contractionMap)) {
    const regex = new RegExp(`\\b${full}\\b`, 'gi');
    result = result.replace(regex, contracted);
  }
  
  return result;
};

/**
 * Clean extra whitespace and punctuation
 */
export const cleanWhitespace = (transcript: string): string => {
  return transcript
    .replace(/\s+/g, ' ')  // Multiple spaces → single space
    .replace(/[.,!?;:]+/g, '')  // Remove punctuation
    .trim();
};

/**
 * Main cleanup function - applies all cleanup steps
 * @param transcript Raw transcript from speech recognition
 * @returns Cleaned transcript ready for word matching
 */
export const cleanupTranscript = (transcript: string): string => {
  if (!transcript) return '';
  
  let cleaned = transcript.toLowerCase();
  
  // Apply cleanup steps in order
  cleaned = handleFalseStarts(cleaned);      // "ca- cat" → "cat"
  cleaned = handleRepeatedWords(cleaned);    // "the the" → "the"
  cleaned = handleSelfCorrections(cleaned);  // "dog no cat" → "cat"
  cleaned = removeFillerWords(cleaned);      // Remove "um", "uh", etc.
  cleaned = cleanWhitespace(cleaned);        // Normalize spaces
  
  return cleaned;
};

/**
 * Extract just the spoken words from a cleaned transcript
 * @param transcript Cleaned transcript
 * @returns Array of individual words
 */
export const extractWords = (transcript: string): string[] => {
  const cleaned = cleanupTranscript(transcript);
  return cleaned.split(/\s+/).filter(w => w.length > 0);
};

/**
 * Check if a word is likely a filler
 */
export const isFillerWord = (word: string): boolean => {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
  return FILLER_WORDS.has(normalized);
};
