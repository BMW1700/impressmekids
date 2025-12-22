/**
 * Presentation Analysis Library
 * 
 * Analyzes spoken presentations for:
 * - Filler word detection (um, uh, like, you know, etc.)
 * - Confidence scoring based on voice patterns
 * - Pacing analysis (too fast, too slow, good variation)
 * - Structure detection (opening, body, conclusion)
 */

export interface FillerWordMatch {
  word: string;
  count: number;
  positions: number[]; // timestamps in seconds
}

export interface PresentationMetrics {
  // Core scores (0-100)
  confidenceScore: number;
  pacingScore: number;
  structureScore: number;
  clarityScore: number;
  
  // Filler analysis
  fillerWordCount: number;
  fillerWords: FillerWordMatch[];
  fillerWordsPerMinute: number;
  
  // Pacing metrics
  wordsPerMinute: number;
  pacingVariation: number; // 0-1, higher = more natural variation
  averagePauseLength: number;
  effectivePauseCount: number; // pauses used for emphasis
  
  // Voice quality
  volumeConsistency: number; // 0-100
  voiceVariation: number; // 0-100 (pitch/energy variation)
  
  // Structure indicators
  hasStrongOpening: boolean;
  hasStrongClosing: boolean;
  hasTransitions: boolean;
  
  // Overall
  overallScore: number;
  grade: string; // A, B, C, D, F
}

export interface PresentationFeedback {
  type: 'strength' | 'improvement' | 'tip';
  category: 'confidence' | 'pacing' | 'structure' | 'filler' | 'clarity';
  message: string;
  priority: number; // 1-5, 5 being most important
}

// Common filler words/phrases to detect
const FILLER_PATTERNS: { pattern: RegExp; word: string }[] = [
  { pattern: /\bum+\b/gi, word: 'um' },
  { pattern: /\buh+\b/gi, word: 'uh' },
  { pattern: /\blike\b/gi, word: 'like' },
  { pattern: /\byou know\b/gi, word: 'you know' },
  { pattern: /\bso+\b(?=\s+(?:like|um|uh|basically|essentially)|\s*,)/gi, word: 'so' },
  { pattern: /\bbasically\b/gi, word: 'basically' },
  { pattern: /\bessentially\b/gi, word: 'essentially' },
  { pattern: /\bliterally\b/gi, word: 'literally' },
  { pattern: /\bactually\b/gi, word: 'actually' },
  { pattern: /\bi mean\b/gi, word: 'I mean' },
  { pattern: /\bkind of\b/gi, word: 'kind of' },
  { pattern: /\bsort of\b/gi, word: 'sort of' },
  { pattern: /\bright\??\b(?=\s*,|\s*$|\s+so|\s+and)/gi, word: 'right?' },
  { pattern: /\bokay so\b/gi, word: 'okay so' },
  { pattern: /\byeah\b/gi, word: 'yeah' },
];

// Transition phrases that indicate good structure
const TRANSITION_PATTERNS = [
  /\bfirst(?:ly)?\b/i,
  /\bsecond(?:ly)?\b/i,
  /\bthird(?:ly)?\b/i,
  /\bnext\b/i,
  /\bthen\b/i,
  /\bfinally\b/i,
  /\bin conclusion\b/i,
  /\bto summarize\b/i,
  /\bfor example\b/i,
  /\bmoreover\b/i,
  /\bhowever\b/i,
  /\btherefore\b/i,
  /\bconsequently\b/i,
  /\blet me explain\b/i,
  /\bmoving on\b/i,
];

// Strong opening patterns
const OPENING_PATTERNS = [
  /^(?:hello|hi|good (?:morning|afternoon|evening))/i,
  /^today (?:i'm|i am|we're|we will)/i,
  /^i(?:'m| am) (?:here|going) to (?:talk|discuss|present)/i,
  /^let me (?:start|begin)/i,
  /^have you ever (?:wondered|thought)/i,
  /^imagine/i,
  /^what if/i,
];

// Strong closing patterns  
const CLOSING_PATTERNS = [
  /(?:thank(?:s| you)|questions\??|in summary|to conclude|finally|in closing)/i,
  /that(?:'s| is) (?:all|everything|my presentation)/i,
  /any questions/i,
];

/**
 * Detect filler words in transcript with approximate positions
 */
export function detectFillerWords(
  transcript: string,
  durationSeconds: number
): FillerWordMatch[] {
  const results: FillerWordMatch[] = [];
  const words = transcript.split(/\s+/);
  const wordsPerSecond = words.length / durationSeconds;
  
  for (const { pattern, word } of FILLER_PATTERNS) {
    const matches: number[] = [];
    let match;
    let searchIndex = 0;
    
    // Reset pattern
    pattern.lastIndex = 0;
    
    // Find all matches and estimate positions
    while ((match = pattern.exec(transcript)) !== null) {
      // Estimate timestamp based on word position
      const wordsBeforeMatch = transcript.slice(0, match.index).split(/\s+/).length;
      const estimatedTime = wordsBeforeMatch / wordsPerSecond;
      matches.push(Math.round(estimatedTime * 10) / 10);
    }
    
    if (matches.length > 0) {
      results.push({
        word,
        count: matches.length,
        positions: matches,
      });
    }
  }
  
  return results.sort((a, b) => b.count - a.count);
}

/**
 * Calculate confidence score based on voice and content metrics
 */
export function calculateConfidenceScore(
  transcript: string,
  audioFeatures: {
    avgEnergy?: number;
    energyVariance?: number;
    avgPitch?: number;
    pitchVariance?: number;
  } | undefined,
  fillerCount: number,
  durationSeconds: number
): number {
  let score = 70; // Base score
  
  // Filler words penalty (up to -30 points)
  const fillersPerMinute = (fillerCount / durationSeconds) * 60;
  if (fillersPerMinute > 10) score -= 30;
  else if (fillersPerMinute > 6) score -= 20;
  else if (fillersPerMinute > 3) score -= 10;
  else if (fillersPerMinute < 1) score += 10; // Bonus for minimal fillers
  
  // Voice energy consistency bonus (up to +15)
  if (audioFeatures?.avgEnergy) {
    const normalizedEnergy = Math.min(1, audioFeatures.avgEnergy);
    if (normalizedEnergy > 0.3) score += 10;
    if (normalizedEnergy > 0.5) score += 5;
  }
  
  // Pitch variation indicates expressiveness (up to +15)
  if (audioFeatures?.pitchVariance) {
    const variation = audioFeatures.pitchVariance;
    if (variation > 20 && variation < 100) score += 15; // Good variation
    else if (variation > 10) score += 8;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Analyze pacing quality
 */
export function analyzePacing(
  wordsPerMinute: number,
  pauseCount: number,
  avgSilenceMs: number,
  durationSeconds: number
): { score: number; feedback: string } {
  let score = 70;
  let feedback = '';
  
  // Ideal speaking pace is 130-170 WPM for presentations
  if (wordsPerMinute >= 130 && wordsPerMinute <= 170) {
    score += 20;
    feedback = 'Excellent pacing - clear and engaging';
  } else if (wordsPerMinute >= 110 && wordsPerMinute <= 190) {
    score += 10;
    feedback = wordsPerMinute < 130 ? 'Slightly slow - try to pick up the pace' : 'Slightly fast - slow down for clarity';
  } else if (wordsPerMinute < 100) {
    score -= 15;
    feedback = 'Too slow - audience may lose interest';
  } else if (wordsPerMinute > 200) {
    score -= 20;
    feedback = 'Too fast - slow down so audience can follow';
  }
  
  // Pause effectiveness
  const idealPausesPerMinute = 3; // Roughly 1 pause every 20 seconds
  const pausesPerMinute = (pauseCount / durationSeconds) * 60;
  
  if (pausesPerMinute >= 2 && pausesPerMinute <= 5) {
    score += 10; // Good use of pauses
  } else if (pausesPerMinute > 8) {
    score -= 10; // Too many pauses (hesitation)
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    feedback,
  };
}

/**
 * Analyze presentation structure
 */
export function analyzeStructure(
  transcript: string
): { score: number; hasOpening: boolean; hasClosing: boolean; hasTransitions: boolean } {
  const words = transcript.split(/\s+/);
  const openingWords = words.slice(0, Math.min(30, Math.floor(words.length * 0.15))).join(' ');
  const closingWords = words.slice(-Math.min(30, Math.floor(words.length * 0.15))).join(' ');
  
  const hasOpening = OPENING_PATTERNS.some(p => p.test(openingWords));
  const hasClosing = CLOSING_PATTERNS.some(p => p.test(closingWords));
  const transitionCount = TRANSITION_PATTERNS.filter(p => p.test(transcript)).length;
  const hasTransitions = transitionCount >= 2;
  
  let score = 50;
  if (hasOpening) score += 20;
  if (hasClosing) score += 20;
  if (hasTransitions) score += Math.min(10, transitionCount * 3);
  
  return {
    score: Math.min(100, score),
    hasOpening,
    hasClosing,
    hasTransitions,
  };
}

/**
 * Generate presentation feedback
 */
export function generatePresentationFeedback(
  metrics: PresentationMetrics
): PresentationFeedback[] {
  const feedback: PresentationFeedback[] = [];
  
  // Filler word feedback
  if (metrics.fillerWordsPerMinute > 6) {
    feedback.push({
      type: 'improvement',
      category: 'filler',
      message: `You used ${metrics.fillerWordCount} filler words. Try pausing silently instead of saying "${metrics.fillerWords[0]?.word || 'um'}"`,
      priority: 5,
    });
  } else if (metrics.fillerWordsPerMinute < 2) {
    feedback.push({
      type: 'strength',
      category: 'filler',
      message: 'Great job avoiding filler words! Your speech sounds polished.',
      priority: 2,
    });
  }
  
  // Confidence feedback
  if (metrics.confidenceScore >= 80) {
    feedback.push({
      type: 'strength',
      category: 'confidence',
      message: 'You sound confident and assured. Keep up the strong delivery!',
      priority: 3,
    });
  } else if (metrics.confidenceScore < 60) {
    feedback.push({
      type: 'improvement',
      category: 'confidence',
      message: 'Try to speak with more conviction. Stand tall and project your voice.',
      priority: 4,
    });
  }
  
  // Pacing feedback
  if (metrics.wordsPerMinute > 180) {
    feedback.push({
      type: 'improvement',
      category: 'pacing',
      message: `You're speaking at ${Math.round(metrics.wordsPerMinute)} WPM. Slow down to ~150 WPM for better clarity.`,
      priority: 5,
    });
  } else if (metrics.wordsPerMinute < 110) {
    feedback.push({
      type: 'improvement',
      category: 'pacing',
      message: `Your pace of ${Math.round(metrics.wordsPerMinute)} WPM is quite slow. Try to be more dynamic.`,
      priority: 4,
    });
  } else {
    feedback.push({
      type: 'strength',
      category: 'pacing',
      message: 'Your pacing is excellent - easy to follow and engaging.',
      priority: 2,
    });
  }
  
  // Structure feedback
  if (!metrics.hasStrongOpening) {
    feedback.push({
      type: 'tip',
      category: 'structure',
      message: 'Start with a hook! Try "Have you ever wondered..." or state your main point upfront.',
      priority: 3,
    });
  }
  
  if (!metrics.hasStrongClosing) {
    feedback.push({
      type: 'tip',
      category: 'structure',
      message: 'End with impact! Summarize your key point or end with a call to action.',
      priority: 3,
    });
  }
  
  if (metrics.hasTransitions) {
    feedback.push({
      type: 'strength',
      category: 'structure',
      message: 'Good use of transition phrases - your presentation flows well.',
      priority: 2,
    });
  }
  
  return feedback.sort((a, b) => b.priority - a.priority);
}

/**
 * Main function to analyze a presentation
 */
export function analyzePresentation(
  transcript: string,
  durationSeconds: number,
  wordsPerMinute: number,
  pauseCount: number,
  avgSilenceMs: number,
  audioFeatures?: {
    avgEnergy?: number;
    energyVariance?: number;
    avgPitch?: number;
    pitchVariance?: number;
  }
): PresentationMetrics {
  // Detect filler words
  const fillerWords = detectFillerWords(transcript, durationSeconds);
  const fillerWordCount = fillerWords.reduce((sum, f) => sum + f.count, 0);
  const fillerWordsPerMinute = (fillerWordCount / durationSeconds) * 60;
  
  // Calculate confidence
  const confidenceScore = calculateConfidenceScore(
    transcript,
    audioFeatures,
    fillerWordCount,
    durationSeconds
  );
  
  // Analyze pacing
  const pacingAnalysis = analyzePacing(wordsPerMinute, pauseCount, avgSilenceMs, durationSeconds);
  
  // Analyze structure
  const structureAnalysis = analyzeStructure(transcript);
  
  // Calculate voice metrics
  const volumeConsistency = audioFeatures?.energyVariance
    ? Math.max(0, 100 - (audioFeatures.energyVariance * 200))
    : 70;
  
  const voiceVariation = audioFeatures?.pitchVariance
    ? Math.min(100, 40 + (audioFeatures.pitchVariance / 2))
    : 60;
  
  // Clarity score (inverse of filler density + articulation)
  const clarityScore = Math.round(
    100 - Math.min(40, fillerWordsPerMinute * 4) + (confidenceScore > 70 ? 10 : 0)
  );
  
  // Overall score (weighted average)
  const overallScore = Math.round(
    confidenceScore * 0.25 +
    pacingAnalysis.score * 0.25 +
    structureAnalysis.score * 0.2 +
    clarityScore * 0.2 +
    (100 - Math.min(100, fillerWordsPerMinute * 10)) * 0.1
  );
  
  // Grade
  let grade: string;
  if (overallScore >= 90) grade = 'A';
  else if (overallScore >= 80) grade = 'B';
  else if (overallScore >= 70) grade = 'C';
  else if (overallScore >= 60) grade = 'D';
  else grade = 'F';
  
  return {
    confidenceScore,
    pacingScore: pacingAnalysis.score,
    structureScore: structureAnalysis.score,
    clarityScore: Math.max(0, Math.min(100, clarityScore)),
    
    fillerWordCount,
    fillerWords,
    fillerWordsPerMinute: Math.round(fillerWordsPerMinute * 10) / 10,
    
    wordsPerMinute,
    pacingVariation: voiceVariation / 100,
    averagePauseLength: avgSilenceMs,
    effectivePauseCount: Math.max(0, pauseCount - Math.floor(fillerWordCount * 0.5)),
    
    volumeConsistency: Math.round(volumeConsistency),
    voiceVariation: Math.round(voiceVariation),
    
    hasStrongOpening: structureAnalysis.hasOpening,
    hasStrongClosing: structureAnalysis.hasClosing,
    hasTransitions: structureAnalysis.hasTransitions,
    
    overallScore,
    grade,
  };
}

// Presentation prompts for practice
export const PRESENTATION_PROMPTS = [
  {
    id: 'intro',
    title: 'Introduce Yourself',
    description: 'Give a 1-minute introduction about yourself, your interests, and what makes you unique.',
    duration: 60,
    difficulty: 'easy',
  },
  {
    id: 'hobby',
    title: 'Teach Your Hobby',
    description: 'Explain your favorite hobby or activity to someone who knows nothing about it.',
    duration: 90,
    difficulty: 'easy',
  },
  {
    id: 'convince',
    title: 'Convince Me',
    description: 'Persuade your audience why they should try your favorite food, game, or activity.',
    duration: 90,
    difficulty: 'medium',
  },
  {
    id: 'explain',
    title: 'Explain a Concept',
    description: 'Choose something you learned in school and explain it in simple terms.',
    duration: 120,
    difficulty: 'medium',
  },
  {
    id: 'story',
    title: 'Tell a Story',
    description: 'Share a memorable experience or tell a short story with a clear beginning, middle, and end.',
    duration: 120,
    difficulty: 'medium',
  },
  {
    id: 'opinion',
    title: 'Defend Your Opinion',
    description: 'Take a stance on a topic you care about and explain why with at least 3 reasons.',
    duration: 120,
    difficulty: 'hard',
  },
  {
    id: 'impromptu',
    title: 'Impromptu Challenge',
    description: 'A random topic will be given. Speak for 1 minute without preparation!',
    duration: 60,
    difficulty: 'hard',
  },
];

export type PresentationPrompt = typeof PRESENTATION_PROMPTS[number];
