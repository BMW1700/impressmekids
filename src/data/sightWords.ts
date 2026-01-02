// Dolch sight words organized by difficulty level

export const SIGHT_WORDS = {
  preK: [
    "a", "and", "away", "big", "blue", "can", "come", "down", "find", "for",
    "funny", "go", "help", "here", "I", "in", "is", "it", "jump", "little",
    "look", "make", "me", "my", "not", "one", "play", "red", "run", "said",
    "see", "the", "three", "to", "two", "up", "we", "where", "yellow", "you"
  ],
  kindergarten: [
    "all", "am", "are", "at", "ate", "be", "black", "brown", "but", "came",
    "did", "do", "eat", "four", "get", "good", "have", "he", "into", "like",
    "must", "new", "no", "now", "on", "our", "out", "please", "pretty", "ran",
    "ride", "saw", "say", "she", "so", "soon", "that", "there", "they", "this",
    "too", "under", "want", "was", "well", "went", "what", "white", "who", "will",
    "with", "yes"
  ],
  firstGrade: [
    "after", "again", "an", "any", "ask", "as", "by", "could", "every", "fly",
    "from", "give", "going", "had", "has", "her", "him", "his", "how", "just",
    "know", "let", "live", "may", "of", "old", "once", "open", "over", "put",
    "round", "some", "stop", "take", "thank", "them", "then", "think", "walk", "were",
    "when"
  ],
  secondGrade: [
    "always", "around", "because", "been", "before", "best", "both", "buy", "call", "cold",
    "does", "don't", "fast", "first", "five", "found", "gave", "goes", "green", "its",
    "made", "many", "off", "or", "pull", "read", "right", "sing", "sit", "sleep",
    "tell", "their", "these", "those", "upon", "us", "use", "very", "wash", "which",
    "why", "wish", "work", "would", "write", "your"
  ],
  thirdGrade: [
    "about", "better", "bring", "carry", "clean", "cut", "done", "draw", "drink", "eight",
    "fall", "far", "full", "got", "grow", "hold", "hot", "hurt", "if", "keep",
    "kind", "laugh", "light", "long", "much", "myself", "never", "only", "own", "pick",
    "seven", "shall", "show", "six", "small", "start", "ten", "today", "together", "try",
    "warm"
  ]
};

export type DifficultyLevel = keyof typeof SIGHT_WORDS;

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  preK: "Pre-K",
  kindergarten: "Kindergarten",
  firstGrade: "1st Grade",
  secondGrade: "2nd Grade",
  thirdGrade: "3rd Grade"
};

export const DIFFICULTY_DESCRIPTIONS: Record<DifficultyLevel, string> = {
  preK: "Simple 3-4 letter words",
  kindergarten: "Basic sight words",
  firstGrade: "Common words",
  secondGrade: "Intermediate words",
  thirdGrade: "Advanced words"
};

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get shuffled words for a specific difficulty
export function getShuffledWords(difficulty: DifficultyLevel, count?: number): string[] {
  const words = shuffleArray(SIGHT_WORDS[difficulty]);
  return count ? words.slice(0, count) : words;
}

// Get words from multiple difficulties combined
export function getMixedWords(difficulties: DifficultyLevel[], count?: number): string[] {
  const allWords = difficulties.flatMap(d => SIGHT_WORDS[d]);
  const shuffled = shuffleArray(allWords);
  return count ? shuffled.slice(0, count) : shuffled;
}
