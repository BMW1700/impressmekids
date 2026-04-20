/**
 * Phonics-Aware Misrecognition Map
 *
 * Web Speech API systematically confuses certain phonemes — especially short
 * vowels and voiced/voiceless dental fricatives. When a child correctly
 * pronounces a target word but the API mis-transcribes it in a known way, we
 * accept the response instead of penalizing the child for an API limitation.
 *
 * This map is consulted from `wordMatchingModes.ts` BEFORE fuzzy/Levenshtein
 * matching, alongside the homophones dictionary. It is rule-based, in-browser,
 * and adds zero cost or latency.
 *
 * Categories covered:
 *   1. Short-e ↔ short-a / short-i confusions ("egg" → "agg", "pen" → "pin")
 *   2. Voiced-th ↔ d / f ("the" → "duh", "thing" → "fing")
 *   3. Voiceless-th ↔ f / s ("three" → "free", "thumb" → "fumb")
 *   4. r-controlled vowel collapse ("car" → "cah", "bird" → "bud")
 *   5. /æ/ ↔ /ɛ/ ("man" → "men", "bat" → "bet")
 *   6. Final-consonant deletion ("cat" → "ca", "dog" → "do")
 *   7. Common digraph mishears ("ship" → "sheep", "fish" → "feesh")
 */

/**
 * Map of expected word → array of accepted Web Speech API misrecognitions.
 * Keys and values are lowercase, no punctuation.
 */
export const phonicsConfusionMap: Record<string, string[]> = {
  // Short-e words frequently heard as short-a or short-i
  egg: ['agg', 'ag', 'ed', 'edge', 'eg', 'ig'],
  bed: ['bad', 'bid', 'bead'],
  red: ['rad', 'rid', 'read'],
  pen: ['pan', 'pin', 'pawn'],
  ten: ['tan', 'tin'],
  hen: ['han', 'hin'],
  men: ['man', 'min', 'main'],
  pet: ['pat', 'pit', 'put'],
  net: ['nat', 'nit', 'knit'],
  let: ['lat', 'lit'],
  get: ['gat', 'git', 'got'],
  set: ['sat', 'sit'],
  jet: ['jat', 'jit'],
  wet: ['wat', 'wit', 'what'],
  yet: ['yat', 'yit'],
  fed: ['fad', 'fid'],
  led: ['lad', 'lid'],
  web: ['wab', 'wib'],
  end: ['and', 'ind'],

  // Short-i words heard as short-e
  pin: ['pen', 'pan'],
  bin: ['ben', 'ban'],
  tin: ['ten', 'tan'],
  win: ['when', 'wen'],
  sit: ['set', 'sat'],
  bit: ['bet', 'bat'],
  hit: ['het', 'hat'],
  fit: ['fet', 'fat'],
  ship: ['sheep', 'shep', 'shup'],
  chip: ['cheap', 'chep'],
  lip: ['leap', 'lep'],
  fish: ['feesh', 'fesh'],
  dish: ['deesh', 'desh'],

  // Short-a words heard as short-e or short-u
  cat: ['ket', 'cut', 'kat', 'kut'],
  bat: ['bet', 'but', 'bot'],
  hat: ['het', 'hut', 'hot'],
  mat: ['met', 'mut'],
  rat: ['ret', 'rut'],
  sat: ['set', 'sut'],
  fan: ['fen', 'fun'],
  man: ['men', 'mun', 'mon'],
  pan: ['pen', 'pun'],
  ran: ['ren', 'run'],
  van: ['ven', 'von'],
  bag: ['beg', 'bug'],
  tag: ['teg', 'tug'],
  nap: ['nep', 'nip'],
  map: ['mep', 'mop'],
  cap: ['kep', 'cup'],

  // Short-o words heard as short-a or short-u
  dog: ['dag', 'dug', 'dawg'],
  log: ['lag', 'lug'],
  hot: ['hat', 'hut'],
  pot: ['pat', 'put'],
  top: ['tap', 'tup'],
  mop: ['map', 'mup'],
  rock: ['rack', 'ruck'],
  sock: ['sack', 'suck'],
  box: ['backs', 'bucks'],
  fox: ['facts', 'fucks'], // unfortunate but real STT mishear

  // Short-u words heard as short-a / short-o
  sun: ['son', 'san', 'soon'],
  run: ['ran', 'ron'],
  bus: ['boss', 'bass'],
  cup: ['cap', 'cop'],
  cut: ['cat', 'cot'],
  mud: ['mad', 'mod'],
  bug: ['bag', 'bog'],
  hug: ['hag', 'hog'],
  jump: ['jamp', 'jomp'],

  // Voiced-th (/ð/) heard as d, v, or z
  the: ['duh', 'da', 'de', 'thee', 'va'],
  this: ['dis', 'vis', 'zis'],
  that: ['dat', 'vat', 'zat'],
  them: ['dem', 'vem'],
  then: ['den', 'ven'],
  these: ['deez', 'veez'],
  those: ['doze', 'voze'],
  there: ['dare', 'vere'],
  their: ['dare', 'vere'],
  they: ['day', 'vay'],
  with: ['wit', 'wif', 'wiv', 'wid'],
  brother: ['bruvver', 'bruther', 'brudder'],
  mother: ['muvver', 'muther', 'mudder'],
  father: ['fava', 'faver', 'fadder'],
  another: ['anuvver', 'anudder'],
  other: ['uvver', 'udder'],

  // Voiceless-th (/θ/) heard as f, s, or t
  thing: ['fing', 'sing', 'ting'],
  think: ['fink', 'sink', 'tink'],
  three: ['free', 'tree'],
  thumb: ['fumb', 'sum', 'tum'],
  thin: ['fin', 'sin', 'tin'],
  thick: ['fick', 'sick', 'tick'],
  thank: ['fank', 'sank', 'tank'],
  thorn: ['forn', 'sorn', 'torn'],
  bath: ['baf', 'bass', 'bat'],
  math: ['maf', 'mass', 'mat'],
  path: ['paf', 'pass', 'pat'],
  cloth: ['clof', 'closs', 'clot'],
  mouth: ['mouf', 'mouse', 'mout'],
  tooth: ['toof', 'toose', 'toot'],
  truth: ['truf', 'truss', 'trut'],
  fifth: ['fif', 'fiss', 'fit'],
  sixth: ['six', 'siss'],

  // r-controlled vowels heard as bare vowels (non-rhotic mishears)
  car: ['cah', 'ka', 'cow'],
  far: ['fah', 'fa'],
  star: ['stah', 'sta'],
  bird: ['bud', 'berd', 'bord'],
  word: ['wud', 'werd'],
  girl: ['gul', 'gerl'],
  her: ['huh', 'her', 'hur'],
  for: ['fo', 'foe', 'fa'],
  fork: ['foke', 'fok'],
  horn: ['hone', 'hon'],
  storm: ['stom', 'stome'],

  // Silent-e words where the long vowel is misheard
  cake: ['kek', 'kake', 'cack'],
  bake: ['bek', 'bake', 'back'],
  make: ['mek', 'mack'],
  take: ['tek', 'tack'],
  lake: ['lek', 'lack'],
  bike: ['bek', 'bick', 'beak'],
  kite: ['ket', 'kit', 'kate'],
  ride: ['red', 'rid'],
  hide: ['hed', 'hid'],
  side: ['sed', 'sid'],
  time: ['tem', 'tim'],
  bone: ['ben', 'bon'],
  cone: ['ken', 'con'],
  home: ['hem', 'hom'],
  rope: ['rep', 'rop'],
  cube: ['kub', 'koob'],
  tube: ['tub', 'toob'],
  mate: ['met', 'mat'],
  late: ['let', 'lat'],
  date: ['det', 'dat'],

  // Common consonant blends mis-segmented
  stop: ['top', 'sop'],
  spot: ['pot', 'sot'],
  step: ['tep', 'sep'],
  swim: ['sim', 'wim'],
  smell: ['mell', 'sell'],
  snake: ['nake', 'sake'],
  frog: ['rog', 'fog'],
  flag: ['lag', 'fag'],
  glass: ['lass', 'gass'],
  grass: ['rass', 'gass'],
  brick: ['rick', 'bick'],
  block: ['lock', 'bock'],
  truck: ['ruck', 'tuck'],
  drum: ['rum', 'dum'],

  // Digraphs heard differently
  sheep: ['ship', 'cheep', 'seep'],
  cheese: ['sheese', 'tease', 'sees'],
  chair: ['share', 'shar'],
  chin: ['shin', 'tin'],
  whale: ['wail', 'wale'],
  when: ['win', 'wen'],
  white: ['wite', 'wight'],

  // Vowel teams
  rain: ['ren', 'ran'],
  pain: ['pen', 'pan'],
  train: ['tren', 'tran'],
  boat: ['bot', 'boot'],
  coat: ['cot', 'coot'],
  road: ['rod', 'rude'],
  feet: ['fit', 'fet'],
  meet: ['mit', 'met'],
  tree: ['tri', 'tre'],
  green: ['grin', 'gren'],
  read: ['red', 'rid', 'reed'],
  bean: ['ben', 'bin'],
  team: ['tem', 'tim'],
  night: ['nit', 'net', 'nite'],
  light: ['lit', 'let', 'lite'],
  right: ['rit', 'ret', 'rite'],
};

/**
 * Returns true if `spoken` is a known Web Speech API misrecognition of
 * `expected`. Both inputs should already be normalized (lowercase, no
 * punctuation). Comparison is case-insensitive and trims whitespace as a
 * defensive measure.
 */
export const isPhonicsConfusion = (spoken: string, expected: string): boolean => {
  if (!spoken || !expected) return false;
  const s = spoken.toLowerCase().trim().replace(/[^a-z]/g, '');
  const e = expected.toLowerCase().trim().replace(/[^a-z]/g, '');
  if (!s || !e) return false;
  if (s === e) return true;

  // Direct lookup: expected → list of accepted misrecognitions
  const accepted = phonicsConfusionMap[e];
  if (accepted && accepted.includes(s)) return true;

  // Reverse lookup: spoken word's accepted list contains expected
  const reverse = phonicsConfusionMap[s];
  if (reverse && reverse.includes(e)) return true;

  return false;
};
