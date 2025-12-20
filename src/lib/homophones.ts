/**
 * Homophones and Common Word Variants Dictionary
 * Maps expected words to acceptable spoken variants
 * 
 * Includes:
 * - True homophones (to/two/too)
 * - Common children's speech patterns
 * - Reduced vowel pronunciations
 * - Contractions and informal speech
 */

export const homophones: Record<string, string[]> = {
  // Articles and common short words
  'the': ['da', 'duh', 'thee', 'tha', 'de'],
  'a': ['uh', 'ah', 'eh'],
  'an': ['en', 'un'],
  
  // To/Two/Too variants
  'to': ['two', 'too', 'ta', 'tuh'],
  'two': ['to', 'too', 'tu'],
  'too': ['to', 'two', 'tu'],
  
  // For/Four variants
  'for': ['four', '4', 'fer', 'fur', 'fo'],
  'four': ['for', '4', 'fo'],
  
  // Common pronouns
  'you': ['u', 'ya', 'yah', 'yuh'],
  'your': ['ur', 'yer', 'yur', 'yor'],
  "you're": ['your', 'ur', 'yer', 'yur'],
  'their': ['there', 'theyre', "they're", 'thair', 'ther'],
  'there': ['their', "they're", 'thair', 'ther'],
  "they're": ['their', 'there', 'thair', 'ther'],
  'our': ['are', 'hour', 'ar'],
  'hour': ['our', 'are', 'ar'],
  
  // Common verbs
  'are': ['r', 'ar', 'er', 'our'],
  'were': ['we\'re', 'wer', 'wur', 'where'],
  "we're": ['were', 'wer', 'wir'],
  'was': ['wuz', 'woz'],
  'have': ['hav', 'av'],
  'has': ['haz', 'az'],
  'had': ['hd'],
  'would': ['wood', 'wud', 'wuld'],
  'could': ['cud', 'culd'],
  'should': ['shud', 'shuld'],
  
  // Common conjunctions/prepositions
  'and': ['an', 'n', 'en', 'nd', 'un'],
  'of': ['ov', 'uv', 'o', 'uh'],
  'or': ['er'],
  'with': ['wit', 'wif', 'wiv'],
  'from': ['frum', 'frm'],
  'than': ['then', 'den'],
  'then': ['than', 'den'],
  
  // Be verbs
  'is': ['iz', 'es'],
  'it': ['et', 'ih'],
  "it's": ['its', 'itz'],
  'its': ["it's", 'itz'],
  "isn't": ['isnt', 'iznt'],
  
  // Common nouns with variants
  'said': ['sed', 'sayed'],
  'says': ['sez'],
  'little': ['liddle', 'lil', 'widdle', 'litl'],
  'water': ['wader', 'wadder', 'wata', 'watter'],
  'because': ['cuz', 'cause', 'coz', 'becuz', 'becoz'],
  'want': ['wanna', 'wont', 'wan'],
  'going': ['gonna', 'goin', 'gowin'],
  'got': ['gotta'],
  'getting': ['gettin', 'geddin'],
  'something': ['somethin', 'sumthin', 'sumthing'],
  'nothing': ['nothin', 'nuthin', 'nuffin'],
  'anything': ['anythin', 'anythink'],
  'everything': ['everythin', 'evrything'],
  
  // Children's common substitutions
  'this': ['dis', 'thiz'],
  'that': ['dat', 'thad'],
  'them': ['dem', 'em', 'thm'],
  'these': ['dese', 'theez'],
  'those': ['doze', 'thoze'],
  'thing': ['ting', 'fing'],
  'think': ['tink', 'fink'],
  'brother': ['bruther', 'bruver', 'bruvver'],
  'mother': ['muther', 'muvver'],
  'father': ['fader', 'faver'],
  
  // Number/word equivalents
  'one': ['1', 'won', 'wun'],
  'won': ['one', '1'],
  'eight': ['8', 'ate'],
  'ate': ['eight', '8'],
  'no': ['know', 'nah', 'nope'],
  'know': ['no', 'nah'],
  'knew': ['new', 'nu'],
  'new': ['knew', 'nu'],
  'right': ['write', 'rite'],
  'write': ['right', 'rite'],
  
  // Common contractions expanded
  "don't": ['dont', 'dun', 'dunno'],
  "can't": ['cant', 'canna', 'cannot'],
  "won't": ['wont', 'wount'],
  "didn't": ['didnt', 'dint'],
  "wasn't": ['wasnt', 'wusnt'],
  "couldn't": ['couldnt', 'cudnt'],
  "wouldn't": ['wouldnt', 'wudnt'],
  "shouldn't": ['shouldnt', 'shudnt'],
  "haven't": ['havent', 'havnt'],
  "hasn't": ['hasnt', 'haznt'],
  "let's": ['lets', 'lez'],
  "what's": ['whats', 'wutz'],
  
  // Question words
  'what': ['wut', 'wot', 'whut'],
  'where': ['were', 'wer', 'whair'],
  'when': ['wen'],
  'why': ['y', 'wai'],
  'how': ['hao'],
  'who': ['hoo'],
  'which': ['wich', 'witch'],
  'witch': ['which', 'wich'],
  
  // Other common homophones
  'here': ['hear', 'heer'],
  'hear': ['here', 'heer'],
  'see': ['sea', 'c'],
  'sea': ['see', 'c'],
  'be': ['bee', 'b'],
  'bee': ['be', 'b'],
  'by': ['buy', 'bye', 'bi'],
  'buy': ['by', 'bye', 'bi'],
  'bye': ['by', 'buy', 'bi'],
  'eye': ['i', 'aye'],
  'i': ['eye', 'aye'],
  'hi': ['high', 'hai'],
  'high': ['hi', 'hai'],
  'way': ['weigh', 'whey'],
  'weigh': ['way', 'whey'],
  'wait': ['weight', 'wate'],
  'weight': ['wait', 'wate'],
  'week': ['weak', 'wk'],
  'weak': ['week', 'wk'],
  'meet': ['meat', 'mete'],
  'meat': ['meet', 'mete'],
  'read': ['red', 'reed'],  // Note: context-dependent
  'red': ['read'],
  'sun': ['son'],
  'son': ['sun'],
  'some': ['sum'],
  'sum': ['some'],
  'pair': ['pear', 'pare'],
  'pear': ['pair', 'pare'],
  'peace': ['piece', 'pees'],
  'piece': ['peace', 'pees'],
  'break': ['brake'],
  'brake': ['break'],
  'tail': ['tale'],
  'tale': ['tail'],
  'mail': ['male'],
  'male': ['mail'],
  'sail': ['sale'],
  'sale': ['sail'],
  'made': ['maid'],
  'maid': ['made'],
  'flower': ['flour'],
  'flour': ['flower'],
  'plain': ['plane'],
  'plane': ['plain'],
  'role': ['roll'],
  'roll': ['role'],
  'hole': ['whole'],
  'whole': ['hole'],
  'dear': ['deer'],
  'deer': ['dear'],
  'bare': ['bear'],
  'bear': ['bare'],
  'hair': ['hare'],
  'hare': ['hair'],
  'fair': ['fare'],
  'fare': ['fair'],
  'stair': ['stare'],
  'stare': ['stair'],
  'wear': ['where', 'ware'],
  'knight': ['night', 'nite'],
  'night': ['knight', 'nite'],
};

/**
 * Check if a spoken word is an acceptable homophone of the expected word
 */
export const isHomophone = (spoken: string, expected: string): boolean => {
  const normalizedSpoken = spoken.toLowerCase().replace(/[^a-z0-9']/g, '');
  const normalizedExpected = expected.toLowerCase().replace(/[^a-z0-9']/g, '');
  
  // Direct match
  if (normalizedSpoken === normalizedExpected) return true;
  
  // Check if spoken is in expected's homophone list
  const variants = homophones[normalizedExpected];
  if (variants && variants.includes(normalizedSpoken)) {
    return true;
  }
  
  // Check reverse: if expected is in spoken's homophone list
  const spokenVariants = homophones[normalizedSpoken];
  if (spokenVariants && spokenVariants.includes(normalizedExpected)) {
    return true;
  }
  
  return false;
};

/**
 * Get all acceptable variants for a word (including itself)
 */
export const getWordVariants = (word: string): string[] => {
  const normalized = word.toLowerCase().replace(/[^a-z0-9']/g, '');
  const variants = new Set<string>([normalized]);
  
  // Add homophones
  const directVariants = homophones[normalized];
  if (directVariants) {
    directVariants.forEach(v => variants.add(v));
  }
  
  // Check if this word appears as a variant of another word
  for (const [key, values] of Object.entries(homophones)) {
    if (values.includes(normalized)) {
      variants.add(key);
      values.forEach(v => variants.add(v));
    }
  }
  
  return Array.from(variants);
};
