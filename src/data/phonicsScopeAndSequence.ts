/**
 * YubiLearn Phonics Scope & Sequence
 *
 * Aligned with Common Core Foundational Reading Standards (RF.K.2, RF.K.3,
 * RF.1.3, RF.2.3) and the Wilson / UFLI / Heggerty / Orton-Gillingham
 * progression that virtually every K-2 reading specialist expects.
 *
 * This is the single source of truth for both:
 *   1. World 0: Phonics Foundations (in-app campaign)
 *   2. /scope-and-sequence (public, printable)
 */

export interface CurriculumAlignment {
  /** Wilson Fundations unit (e.g. "K Unit 3", "1 Unit 5") */
  fundations?: string;
  /** Amplify CKLA Skills strand domain */
  ckla?: string;
  /** HMH Into Reading module + week */
  hmhIntoReading?: string;
  /** EL Education module + cycle */
  elEducation?: string;
  /** Wit & Wisdom module */
  witWisdom?: string;
  /** UFLI Foundations lesson range */
  ufli?: string;
  /** Heggerty Phonemic Awareness week range */
  heggerty?: string;
}

export interface PhonicsStage {
  id: string;
  stageNumber: number;
  title: string;
  shortLabel: string;
  description: string;
  ccssStandards: string[];
  recommendedGrades: string;
  example: string;
  practiceWords: string[];
  teachingTip: string;
  /** Crosswalk to the major charter/district-mandated curricula. */
  curriculumAlignment?: CurriculumAlignment;
}


export const phonicsScopeAndSequence: PhonicsStage[] = [
  {
    id: 'cvc',
    stageNumber: 1,
    title: 'CVC Words — Closed Syllables',
    shortLabel: 'CVC',
    description:
      'Three-letter consonant-vowel-consonant words with short vowel sounds. The foundation of decoding.',
    ccssStandards: ['RF.K.2.D', 'RF.K.3.B', 'RF.1.3.B'],
    recommendedGrades: 'PreK – Grade 1',
    example: 'cat, mat, sit, run, hop',
    practiceWords: [
      'cat', 'mat', 'sat', 'bat', 'hat', 'rat',
      'pin', 'sit', 'big', 'win', 'lid', 'pig',
      'sun', 'run', 'bus', 'cup', 'mud', 'tub',
      'hop', 'pot', 'dog', 'box', 'top', 'mom',
      'bed', 'pen', 'red', 'leg', 'wet', 'net',
    ],
    teachingTip:
      'Sound out each phoneme separately, then blend. Use stretchable hand gestures: c-a-t → cat.',
    curriculumAlignment: {
      fundations: 'K Units 4–9 / Grade 1 Unit 1',
      ckla: 'Kindergarten Skills Units 4–7',
      hmhIntoReading: 'K Modules 3–6 / Grade 1 Modules 1–2',
      elEducation: 'K Module 1 Cycles 3–6',
      witWisdom: 'K Module 1 (foundational skills)',
      ufli: 'Lessons 1–34',
      heggerty: 'Kindergarten Weeks 15–30',
    },

  },
  {
    id: 'blends',
    stageNumber: 2,
    title: 'Consonant Blends — CCVC & CVCC',
    shortLabel: 'Blends',
    description:
      'Two consonants that blend together while keeping their individual sounds. Builds on CVC fluency.',
    ccssStandards: ['RF.K.3.B', 'RF.1.3.B'],
    recommendedGrades: 'Kindergarten – Grade 1',
    example: 'stop, milk, frog, jump, sand',
    practiceWords: [
      'stop', 'spin', 'flag', 'frog', 'plus',
      'snap', 'swim', 'twin', 'club', 'glad',
      'milk', 'lamp', 'help', 'jump', 'bend',
      'fast', 'best', 'lost', 'must', 'past',
      'hand', 'wind', 'gold', 'belt', 'gift',
    ],
    teachingTip:
      'Each consonant in a blend keeps its sound — don\'t merge them. Say "s-t-op", not "shtop".',
  },
  {
    id: 'silent-e',
    stageNumber: 3,
    title: 'Silent-E — Magic E / VCe',
    shortLabel: 'Silent-E',
    description:
      'The "magic E" rule: a silent E at the end makes the vowel say its long name. Transforms cat → cake.',
    ccssStandards: ['RF.1.3.C'],
    recommendedGrades: 'Grade 1',
    example: 'mate, kite, bone, tube, cute',
    practiceWords: [
      'cake', 'bake', 'lake', 'make', 'gate', 'late',
      'bike', 'like', 'time', 'hide', 'kite', 'ride',
      'bone', 'cone', 'home', 'rope', 'note', 'rose',
      'cube', 'tube', 'cute', 'mule', 'June',
      'mate', 'tape', 'safe', 'wave', 'name', 'game',
    ],
    teachingTip:
      'Compare pairs side-by-side: mat → mate, kit → kite, hop → hope. The E is silent but powerful.',
  },
  {
    id: 'digraphs',
    stageNumber: 4,
    title: 'Consonant Digraphs',
    shortLabel: 'Digraphs',
    description:
      'Two consonants that combine to make ONE new sound: sh, ch, th, ck, wh, ph.',
    ccssStandards: ['RF.K.3.A', 'RF.1.3.A'],
    recommendedGrades: 'Kindergarten – Grade 1',
    example: 'ship, chip, thin, duck, when',
    practiceWords: [
      'ship', 'shop', 'fish', 'wish', 'cash', 'rush',
      'chip', 'chin', 'much', 'rich', 'lunch',
      'thin', 'thick', 'with', 'bath', 'math',
      'duck', 'sock', 'pack', 'kick', 'lock',
      'when', 'whip', 'whale', 'wheel', 'white',
      'phone', 'graph', 'photo',
    ],
    teachingTip:
      'Two letters, one sound. Practice pairs that look similar: sip vs ship, tin vs thin.',
  },
  {
    id: 'vowel-teams',
    stageNumber: 5,
    title: 'Vowel Teams & Diphthongs',
    shortLabel: 'Vowel Teams',
    description:
      'Two vowels working together: ai, ee, oa, ea, ie, oo, ou, ow, oi, oy.',
    ccssStandards: ['RF.1.3.C', 'RF.2.3.B'],
    recommendedGrades: 'Grade 1 – Grade 2',
    example: 'rain, feet, boat, read, coin',
    practiceWords: [
      'rain', 'pain', 'train', 'sail', 'mail',
      'feet', 'meet', 'tree', 'green', 'sweet',
      'boat', 'coat', 'road', 'soap', 'goal',
      'read', 'team', 'beach', 'leaf', 'eat',
      'pie', 'tie', 'lie', 'die',
      'moon', 'soon', 'food', 'book', 'good',
      'out', 'house', 'cloud', 'down', 'cow',
      'coin', 'point', 'boy', 'toy',
    ],
    teachingTip:
      'Old saying: "When two vowels go walking, the first one does the talking." True for many but not all teams.',
  },
  {
    id: 'r-controlled',
    stageNumber: 6,
    title: 'R-Controlled Vowels',
    shortLabel: 'R-Controlled',
    description:
      'When R follows a vowel, it changes the vowel\'s sound: ar, or, er, ir, ur.',
    ccssStandards: ['RF.2.3.A'],
    recommendedGrades: 'Grade 2',
    example: 'car, fork, her, bird, turn',
    practiceWords: [
      'car', 'far', 'star', 'park', 'arm', 'farm',
      'fork', 'horn', 'storm', 'short', 'born',
      'her', 'fern', 'germ', 'verb',
      'bird', 'girl', 'first', 'shirt', 'dirt',
      'turn', 'burn', 'hurt', 'curl', 'church',
    ],
    teachingTip:
      '"Bossy R" controls the vowel sound. Group ir/er/ur — they all sound the same: /ur/.',
  },
];

/** Total practice words across all stages (used for marketing copy). */
export const totalPracticeWords = phonicsScopeAndSequence.reduce(
  (sum, stage) => sum + stage.practiceWords.length,
  0,
);
