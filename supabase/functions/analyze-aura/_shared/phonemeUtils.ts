/**
 * Simple grapheme-to-phoneme mapping for English
 * Used for phoneme accuracy analysis
 */
export const simpleG2P = (word: string): string[] => {
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
