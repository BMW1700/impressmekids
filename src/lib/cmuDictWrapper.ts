/**
 * CMU Pronouncing Dictionary wrapper for browser use
 * Maps words to IPA phonemes using CMUDict data
 */

import * as cmuDictModule from 'cmu-pronouncing-dictionary';
const cmuDict = (cmuDictModule as any).default || cmuDictModule;

// CMUDict to IPA mapping (ARPAbet to IPA)
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
 * Convert ARPAbet phonemes to IPA
 */
const arpabetToIPAPhonemes = (arpabet: string): string[] => {
  const tokens = arpabet.trim().split(/\s+/);
  
  const rawPhonemes = tokens.map(token => {
    const stress = token.match(/[012]/)?.[0];
    const base = token.replace(/[012]/g, '');
    
    // AH0 = schwa (ə), AH1/AH2 = strut (ʌ)
    if (base === 'AH' && stress === '0') return 'ə';
    
    return arpabetToIPA[base] || base;
  }).filter(Boolean);

  // Post-process: detect R-controlled vowel sequences and emit composites
  const result: string[] = [];
  for (let i = 0; i < rawPhonemes.length; i++) {
    const current = rawPhonemes[i];
    const next = rawPhonemes[i + 1];
    
    if (next === 'ɹ') {
      if (current === 'ɑ') { result.push('ɑɹ'); i++; continue; }
      if (current === 'ɔ') { result.push('ɔɹ'); i++; continue; }
      if (current === 'ɛ') { result.push('ɛɹ'); i++; continue; }
    }
    result.push(current);
  }
  
  return result;
};

/**
 * Get IPA pronunciation for a word using CMUDict
 * Returns multiple pronunciations if available
 */
export const getIPAPronunciation = (word: string): string[][] => {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
  const pronunciation = cmuDict[normalized];
  
  if (!pronunciation) {
    // Fallback to simple G2P for unknown words
    return [simpleG2PFallback(normalized)];
  }
  
  // CMUDict can have multiple pronunciations separated by newlines
  const variants = pronunciation.split('\n');
  return variants.map(arpabetToIPAPhonemes);
};

/**
 * Simple grapheme-to-phoneme fallback for words not in CMUDict
 */
const simpleG2PFallback = (word: string): string[] => {
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
    // Try two-character combinations first
    if (i < word.length - 1) {
      const digraph = word.substring(i, i + 2);
      if (phonemeMap[digraph]) {
        phonemes.push(...phonemeMap[digraph]);
        i += 2;
        continue;
      }
    }
    
    // Single character
    const char = word[i];
    if (phonemeMap[char]) {
      phonemes.push(...phonemeMap[char]);
    }
    i++;
  }
  
  return phonemes;
};

/**
 * Get phonemes for entire transcript
 */
export const getTranscriptPhonemes = (transcript: string): string[] => {
  const words = transcript.toLowerCase().split(/\s+/).filter(Boolean);
  const phonemes: string[] = [];
  
  for (const word of words) {
    const pronunciations = getIPAPronunciation(word);
    // Use first pronunciation variant
    phonemes.push(...pronunciations[0]);
  }
  
  return phonemes;
};
