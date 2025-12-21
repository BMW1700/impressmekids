/**
 * Simple phonetic guide generator for visual pronunciation hints
 * Uses reader-friendly phonetic representations (not IPA)
 */

// Common phonetic patterns for readable sound-outs
const phoneticPatterns: [RegExp, string][] = [
  // Silent letters and special patterns first
  [/ight$/i, '-ite'],
  [/ough$/i, '-uff'],
  [/tion$/i, '-shun'],
  [/sion$/i, '-zhun'],
  [/ous$/i, '-us'],
  [/ious$/i, '-ee-us'],
  [/eous$/i, '-ee-us'],
  [/ture$/i, '-cher'],
  [/sure$/i, '-zher'],
  [/ble$/i, '-bul'],
  [/ple$/i, '-pul'],
  [/tle$/i, '-tul'],
  [/cle$/i, '-kul'],
  [/dle$/i, '-dul'],
  [/gle$/i, '-gul'],
  [/kle$/i, '-kul'],
  [/fle$/i, '-ful'],
  [/zle$/i, '-zul'],
  [/ing$/i, '-ing'],
  [/ed$/i, '-ed'],
  [/er$/i, '-er'],
  [/est$/i, '-est'],
  [/ly$/i, '-lee'],
  [/ness$/i, '-nes'],
  [/ment$/i, '-ment'],
  [/able$/i, '-uh-bul'],
  [/ible$/i, '-ih-bul'],
];

// Sound mappings for syllable breakdown
const soundMap: { [key: string]: string } = {
  // Digraphs and special combos
  'th': 'th',
  'sh': 'sh',
  'ch': 'ch',
  'ph': 'f',
  'wh': 'w',
  'ck': 'k',
  'ng': 'ng',
  'nk': 'nk',
  'qu': 'kw',
  'wr': 'r',
  'kn': 'n',
  'gn': 'n',
  'mb': 'm',
  'gh': '',
  
  // Common vowel combos
  'ee': 'ee',
  'ea': 'ee',
  'ai': 'ay',
  'ay': 'ay',
  'oa': 'oh',
  'ow': 'oh',
  'ou': 'ow',
  'oo': 'oo',
  'oi': 'oy',
  'oy': 'oy',
  'au': 'aw',
  'aw': 'aw',
  'ie': 'ee',
  'ue': 'oo',
  'ui': 'oo-ee',
  
  // R-controlled vowels
  'ar': 'ar',
  'er': 'er',
  'ir': 'er',
  'or': 'or',
  'ur': 'er',
  
  // Single vowels (short sounds as default)
  'a': 'a',
  'e': 'e',
  'i': 'i',
  'o': 'o',
  'u': 'u',
  
  // Consonants
  'b': 'b',
  'c': 'k',
  'd': 'd',
  'f': 'f',
  'g': 'g',
  'h': 'h',
  'j': 'j',
  'k': 'k',
  'l': 'l',
  'm': 'm',
  'n': 'n',
  'p': 'p',
  'r': 'r',
  's': 's',
  't': 't',
  'v': 'v',
  'w': 'w',
  'x': 'ks',
  'y': 'y',
  'z': 'z',
};

// Common words with their phonetic spellings
const commonWords: { [key: string]: string } = {
  // Short words
  'the': 'thuh',
  'a': 'uh',
  'an': 'an',
  'is': 'iz',
  'are': 'ar',
  'was': 'wuz',
  'were': 'wer',
  'be': 'bee',
  'been': 'bin',
  'have': 'hav',
  'has': 'haz',
  'had': 'had',
  'do': 'doo',
  'does': 'duz',
  'did': 'did',
  'will': 'wil',
  'would': 'wood',
  'could': 'kood',
  'should': 'shood',
  'can': 'kan',
  'may': 'may',
  'might': 'mite',
  'must': 'must',
  'shall': 'shal',
  'to': 'too',
  'of': 'uv',
  'for': 'for',
  'with': 'with',
  'at': 'at',
  'by': 'by',
  'from': 'frum',
  'up': 'up',
  'about': 'uh-bowt',
  'into': 'in-too',
  'over': 'oh-ver',
  'after': 'af-ter',
  'said': 'sed',
  'says': 'sez',
  'one': 'wun',
  'two': 'too',
  'three': 'three',
  'four': 'for',
  'five': 'five',
  'their': 'thair',
  'there': 'thair',
  'they': 'thay',
  'what': 'wut',
  'when': 'wen',
  'where': 'wair',
  'which': 'wich',
  'who': 'hoo',
  'why': 'wy',
  'how': 'how',
  'come': 'kum',
  'some': 'sum',
  'other': 'uh-ther',
  'only': 'ohn-lee',
  'very': 'vair-ee',
  'your': 'yor',
  'you': 'yoo',
  'my': 'my',
  'me': 'mee',
  'we': 'wee',
  'he': 'hee',
  'she': 'shee',
  'it': 'it',
  'his': 'hiz',
  'her': 'her',
  'him': 'him',
  'them': 'them',
  'this': 'this',
  'that': 'that',
  'these': 'theez',
  'those': 'thohz',
  'here': 'heer',
  'just': 'just',
  'now': 'now',
  'then': 'then',
  'also': 'awl-soh',
  'like': 'like',
  'know': 'noh',
  'see': 'see',
  'look': 'look',
  'give': 'giv',
  'take': 'tayk',
  'make': 'mayk',
  'go': 'goh',
  'get': 'get',
  'put': 'poot',
  'say': 'say',
  'think': 'think',
  'want': 'wont',
  'use': 'yooz',
  'find': 'find',
  'tell': 'tel',
  'ask': 'ask',
  'work': 'werk',
  'seem': 'seem',
  'feel': 'feel',
  'try': 'try',
  'leave': 'leev',
  'call': 'kawl',
  'good': 'good',
  'new': 'noo',
  'first': 'ferst',
  'last': 'last',
  'long': 'long',
  'great': 'grayt',
  'little': 'lit-ul',
  'own': 'ohn',
  'old': 'ohld',
  'right': 'rite',
  'big': 'big',
  'high': 'hy',
  'different': 'dif-er-ent',
  'small': 'smawl',
  'large': 'larj',
  'next': 'nekst',
  'early': 'er-lee',
  'young': 'yung',
  'important': 'im-por-tant',
  'few': 'fyoo',
  'public': 'pub-lik',
  'bad': 'bad',
  'same': 'saym',
  'able': 'ay-bul',
  // Common names
  'sam': 'sam',
  'max': 'maks',
  'ben': 'ben',
  'tim': 'tim',
  'tom': 'tom',
  'dan': 'dan',
  'jim': 'jim',
  'bob': 'bob',
  'joe': 'joh',
  'ann': 'an',
  'amy': 'ay-mee',
  'kate': 'kayt',
  'jane': 'jayn',
  'mary': 'mair-ee',
  'emma': 'em-uh',
  'alex': 'al-eks',
};

/**
 * Generate a simple phonetic guide for a word
 */
export function getPhoneticGuide(word: string): string {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  
  if (!cleanWord) return '';
  
  // Check common words first
  if (commonWords[cleanWord]) {
    return commonWords[cleanWord];
  }
  
  // For short words (1-3 letters), just return as-is with simple mapping
  if (cleanWord.length <= 3) {
    return buildSimplePhonetic(cleanWord);
  }
  
  // For longer words, try to break into syllables
  return buildPhoneticWithSyllables(cleanWord);
}

function buildSimplePhonetic(word: string): string {
  let result = '';
  let i = 0;
  
  while (i < word.length) {
    // Try two-letter combos first
    if (i < word.length - 1) {
      const pair = word.substring(i, i + 2);
      if (soundMap[pair]) {
        result += soundMap[pair];
        i += 2;
        continue;
      }
    }
    
    // Single letter
    const char = word[i];
    result += soundMap[char] || char;
    i++;
  }
  
  return result;
}

function buildPhoneticWithSyllables(word: string): string {
  const syllables: string[] = [];
  let remaining = word;
  
  // Simple syllable splitting based on vowel patterns
  const vowels = 'aeiouy';
  let currentSyllable = '';
  let prevWasVowel = false;
  
  for (let i = 0; i < remaining.length; i++) {
    const char = remaining[i];
    const isVowel = vowels.includes(char);
    
    currentSyllable += char;
    
    // Split after vowel + consonant when followed by another vowel
    if (!isVowel && prevWasVowel && i < remaining.length - 1) {
      const nextChar = remaining[i + 1];
      if (vowels.includes(nextChar)) {
        syllables.push(currentSyllable);
        currentSyllable = '';
      }
    }
    
    prevWasVowel = isVowel;
  }
  
  if (currentSyllable) {
    syllables.push(currentSyllable);
  }
  
  // Convert each syllable to phonetic
  const phoneticSyllables = syllables.map(s => buildSimplePhonetic(s));
  
  return phoneticSyllables.join('-');
}

/**
 * Get syllable segments for visual display
 */
export function getWordSegments(word: string): { segment: string; phonetic: string }[] {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  
  if (!cleanWord) return [];
  
  // For very short words, return as single segment
  if (cleanWord.length <= 2) {
    return [{ segment: cleanWord, phonetic: buildSimplePhonetic(cleanWord) }];
  }
  
  const segments: { segment: string; phonetic: string }[] = [];
  const vowels = 'aeiouy';
  let currentSegment = '';
  let prevWasVowel = false;
  
  for (let i = 0; i < cleanWord.length; i++) {
    const char = cleanWord[i];
    const isVowel = vowels.includes(char);
    
    currentSegment += char;
    
    // Create segment breaks
    if (!isVowel && prevWasVowel && i < cleanWord.length - 1) {
      const nextChar = cleanWord[i + 1];
      if (vowels.includes(nextChar)) {
        segments.push({
          segment: currentSegment,
          phonetic: buildSimplePhonetic(currentSegment)
        });
        currentSegment = '';
      }
    }
    
    prevWasVowel = isVowel;
  }
  
  if (currentSegment) {
    segments.push({
      segment: currentSegment,
      phonetic: buildSimplePhonetic(currentSegment)
    });
  }
  
  return segments;
}
