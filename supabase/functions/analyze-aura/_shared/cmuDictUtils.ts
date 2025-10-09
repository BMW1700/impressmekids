/**
 * CMU Pronouncing Dictionary utilities for Deno edge functions
 * Since we can't use the npm package directly, we implement core functionality
 */

// ARPAbet to IPA mapping
const arpabetToIPA: { [key: string]: string } = {
  // Vowels
  'AA': 'ɑ', 'AE': 'æ', 'AH': 'ʌ', 'AO': 'ɔ', 'AW': 'aʊ',
  'AY': 'aɪ', 'EH': 'ɛ', 'ER': 'ɝ', 'EY': 'eɪ', 'IH': 'ɪ',
  'IY': 'i', 'OW': 'oʊ', 'OY': 'ɔɪ', 'UH': 'ʊ', 'UW': 'u',
  
  // Consonants
  'B': 'b', 'CH': 'tʃ', 'D': 'd', 'DH': 'ð', 'F': 'f',
  'G': 'ɡ', 'HH': 'h', 'JH': 'dʒ', 'K': 'k', 'L': 'l',
  'M': 'm', 'N': 'n', 'NG': 'ŋ', 'P': 'p', 'R': 'ɹ',
  'S': 's', 'SH': 'ʃ', 'T': 't', 'TH': 'θ', 'V': 'v',
  'W': 'w', 'Y': 'j', 'Z': 'z', 'ZH': 'ʒ',
};

/**
 * Convert ARPAbet to IPA phonemes
 */
export const arpabetToIPAPhonemes = (arpabet: string): string[] => {
  const phonemes = arpabet
    .replace(/[012]/g, '') // Remove stress markers
    .trim()
    .split(/\s+/);
  
  return phonemes.map(p => arpabetToIPA[p] || p).filter(Boolean);
};

/**
 * Simple G2P fallback (same as browser version)
 */
export const simpleG2PFallback = (word: string): string[] => {
  const phonemeMap: { [key: string]: string[] } = {
    'th': ['θ'], 'sh': ['ʃ'], 'ch': ['tʃ'], 'ph': ['f'], 'ck': ['k'],
    'ng': ['ŋ'], 'qu': ['kw'], 'gh': ['f'],
    'a': ['æ'], 'e': ['ɛ'], 'i': ['ɪ'], 'o': ['ɑ'], 'u': ['ʌ'],
    'b': ['b'], 'c': ['k'], 'd': ['d'], 'f': ['f'], 'g': ['ɡ'],
    'h': ['h'], 'j': ['dʒ'], 'k': ['k'], 'l': ['l'], 'm': ['m'],
    'n': ['n'], 'p': ['p'], 'r': ['ɹ'], 's': ['s'], 't': ['t'],
    'v': ['v'], 'w': ['w'], 'x': ['ks'], 'y': ['j'], 'z': ['z']
  };
  
  const phonemes: string[] = [];
  let i = 0;
  
  while (i < word.length) {
    if (i < word.length - 1) {
      const digraph = word.substring(i, i + 2);
      if (phonemeMap[digraph]) {
        phonemes.push(...phonemeMap[digraph]);
        i += 2;
        continue;
      }
    }
    
    const char = word[i];
    if (phonemeMap[char]) {
      phonemes.push(...phonemeMap[char]);
    }
    i++;
  }
  
  return phonemes;
};
