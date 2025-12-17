/**
 * Phoneme Intervention Recommendations
 * Generates targeted practice recommendations based on phoneme error patterns
 * $0/month - runs entirely in-browser
 */

import { getPhonemeDisplayName, getCommonSubstitutions } from './phonemeInference';

export interface PhonemeIntervention {
  phoneme: string;
  displayName: string;
  accuracy: number;
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  practiceWords: string[];
  articulationTip: string;
  commonMistakes: string[];
}

export interface InterventionReport {
  studentName?: string;
  sessionDate: Date;
  overallPhonemeAccuracy: number;
  interventions: PhonemeIntervention[];
  summary: string;
  nextSteps: string[];
}

/**
 * Practice words for each phoneme (organized by position)
 */
const practiceWordsByPhoneme: Record<string, { initial: string[]; medial: string[]; final: string[] }> = {
  'ɹ': {
    initial: ['red', 'run', 'read', 'rain', 'rice'],
    medial: ['berry', 'sorry', 'carry', 'mirror', 'arrow'],
    final: ['car', 'star', 'door', 'more', 'far'],
  },
  'l': {
    initial: ['love', 'like', 'look', 'late', 'leaf'],
    medial: ['balloon', 'yellow', 'pillow', 'melon', 'color'],
    final: ['ball', 'bell', 'call', 'pull', 'tall'],
  },
  'θ': {
    initial: ['think', 'thank', 'thick', 'thumb', 'three'],
    medial: ['bathtub', 'nothing', 'toothbrush', 'birthday', 'something'],
    final: ['bath', 'tooth', 'math', 'path', 'both'],
  },
  'ð': {
    initial: ['this', 'that', 'the', 'them', 'there'],
    medial: ['mother', 'father', 'brother', 'weather', 'feather'],
    final: ['smooth', 'breathe', 'bathe', 'soothe', 'clothe'],
  },
  's': {
    initial: ['sun', 'see', 'say', 'sit', 'some'],
    medial: ['missing', 'messy', 'lesson', 'passing', 'basket'],
    final: ['bus', 'yes', 'miss', 'class', 'dress'],
  },
  'z': {
    initial: ['zoo', 'zero', 'zip', 'zone', 'zebra'],
    medial: ['busy', 'fuzzy', 'cozy', 'lazy', 'crazy'],
    final: ['buzz', 'fizz', 'jazz', 'quiz', 'sneeze'],
  },
  'ʃ': {
    initial: ['ship', 'she', 'shoe', 'shop', 'shell'],
    medial: ['fishing', 'pushing', 'washing', 'wishing', 'cushion'],
    final: ['fish', 'wish', 'wash', 'push', 'brush'],
  },
  'tʃ': {
    initial: ['chip', 'chair', 'cheese', 'child', 'change'],
    medial: ['teacher', 'kitchen', 'catching', 'watching', 'matching'],
    final: ['much', 'such', 'watch', 'catch', 'teach'],
  },
  'dʒ': {
    initial: ['jump', 'just', 'job', 'jam', 'joke'],
    medial: ['magic', 'imagine', 'major', 'subject', 'danger'],
    final: ['page', 'edge', 'badge', 'bridge', 'judge'],
  },
  'k': {
    initial: ['cat', 'key', 'kick', 'cup', 'come'],
    medial: ['bucket', 'pocket', 'ticket', 'basket', 'chicken'],
    final: ['back', 'book', 'look', 'duck', 'truck'],
  },
  'ɡ': {
    initial: ['go', 'get', 'good', 'game', 'give'],
    medial: ['again', 'begin', 'tiger', 'bigger', 'wagon'],
    final: ['dog', 'big', 'bag', 'pig', 'frog'],
  },
};

/**
 * Articulation tips for each phoneme
 */
const articulationTips: Record<string, string> = {
  'ɹ': 'Curl tongue tip back without touching the roof of mouth. Lips slightly rounded.',
  'l': 'Touch tongue tip to the bump behind front teeth. Keep sides of tongue down.',
  'θ': 'Put tongue between teeth and blow air out gently. Like a snake hiss with tongue out.',
  'ð': 'Same as TH but with voice. Feel your throat buzz while tongue is between teeth.',
  's': 'Teeth almost together, tongue behind teeth. Push air out like a snake hiss.',
  'z': 'Same as S but turn your voice on. Feel your throat buzz.',
  'ʃ': 'Round lips like saying "shoe". Tongue pulled back. Push air out quietly.',
  'tʃ': 'Start with T, then move to SH. Quick "t-sh" sound.',
  'dʒ': 'Start with D, then move to ZH. Quick "d-zh" sound.',
  'k': 'Back of tongue touches soft palate (back of roof). Quick puff of air.',
  'ɡ': 'Same as K but with voice. Feel your throat buzz.',
  'f': 'Gently bite lower lip with top teeth. Blow air out.',
  'v': 'Same as F but with voice. Feel your throat buzz.',
  'b': 'Lips together, then pop them open with voice.',
  'p': 'Lips together, then pop them open without voice. Quick puff of air.',
  'd': 'Tongue tip behind top teeth, then release with voice.',
  't': 'Tongue tip behind top teeth, then release without voice.',
  'm': 'Lips together, hum through your nose.',
  'n': 'Tongue tip behind top teeth, hum through your nose.',
  'ŋ': 'Back of tongue up, hum through your nose. Like the end of "sing".',
  'w': 'Round lips tight like a kiss, then open while making sound.',
  'j': 'Tongue up high, close to roof. Like saying "ee" quickly.',
  'h': 'Open mouth, push air out from throat. Like breathing on a mirror.',
};

/**
 * Generate intervention recommendations based on phoneme accuracy data
 */
export const generateInterventions = (
  phonemeAccuracy: Record<string, number>,
  problematicPhonemes: string[]
): PhonemeIntervention[] => {
  const interventions: PhonemeIntervention[] = [];
  
  problematicPhonemes.forEach(phoneme => {
    const accuracy = phonemeAccuracy[phoneme] || 0;
    const priority: 'high' | 'medium' | 'low' = 
      accuracy < 40 ? 'high' : 
      accuracy < 60 ? 'medium' : 'low';
    
    const words = practiceWordsByPhoneme[phoneme] || {
      initial: [],
      medial: [],
      final: [],
    };
    
    // Select 3 words from each position
    const practiceWords = [
      ...words.initial.slice(0, 2),
      ...words.medial.slice(0, 2),
      ...words.final.slice(0, 2),
    ];
    
    interventions.push({
      phoneme,
      displayName: getPhonemeDisplayName(phoneme),
      accuracy,
      priority,
      recommendation: generateRecommendation(phoneme, accuracy),
      practiceWords: practiceWords.length > 0 ? practiceWords : ['Practice with teacher guidance'],
      articulationTip: articulationTips[phoneme] || 'Practice with teacher guidance.',
      commonMistakes: getCommonSubstitutions(phoneme).map(sub => 
        `Often substituted with ${getPhonemeDisplayName(sub)}`
      ),
    });
  });
  
  // Sort by priority (high first) then by accuracy (lowest first)
  return interventions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.accuracy - b.accuracy;
  });
};

/**
 * Generate specific recommendation text for a phoneme
 */
const generateRecommendation = (phoneme: string, accuracy: number): string => {
  const displayName = getPhonemeDisplayName(phoneme);
  
  if (accuracy < 30) {
    return `${displayName} needs significant practice. Consider 1-on-1 articulation exercises.`;
  } else if (accuracy < 50) {
    return `${displayName} shows emerging skills. Practice with targeted word lists daily.`;
  } else if (accuracy < 70) {
    return `${displayName} is developing. Continue practice with varied contexts.`;
  }
  return `${displayName} is progressing well. Reinforce with natural reading practice.`;
};

/**
 * Generate a full intervention report
 */
export const generateInterventionReport = (
  phonemeAccuracy: Record<string, number>,
  problematicPhonemes: string[],
  overallAccuracy: number,
  studentName?: string
): InterventionReport => {
  const interventions = generateInterventions(phonemeAccuracy, problematicPhonemes);
  
  const highPriority = interventions.filter(i => i.priority === 'high');
  const mediumPriority = interventions.filter(i => i.priority === 'medium');
  
  let summary = '';
  if (highPriority.length > 0) {
    const sounds = highPriority.map(i => i.displayName).join(', ');
    summary = `Focus areas: ${sounds}. These sounds need targeted practice.`;
  } else if (mediumPriority.length > 0) {
    const sounds = mediumPriority.map(i => i.displayName).join(', ');
    summary = `Developing sounds: ${sounds}. Continue regular practice.`;
  } else if (problematicPhonemes.length === 0) {
    summary = 'Excellent phoneme accuracy! No specific sounds need intervention.';
  } else {
    summary = 'Minor phoneme patterns detected. Continue regular reading practice.';
  }
  
  const nextSteps: string[] = [];
  
  if (highPriority.length > 0) {
    nextSteps.push(`Practice ${highPriority[0].displayName} with the word list provided.`);
    nextSteps.push('Use a mirror to check tongue/lip placement.');
    nextSteps.push('Record and playback to self-monitor progress.');
  }
  
  if (overallAccuracy < 70) {
    nextSteps.push('Consider a speech-language evaluation if patterns persist.');
  }
  
  nextSteps.push('Continue daily reading practice to reinforce all sounds.');
  
  return {
    studentName,
    sessionDate: new Date(),
    overallPhonemeAccuracy: overallAccuracy,
    interventions,
    summary,
    nextSteps,
  };
};

/**
 * Get celebration message for phoneme improvement
 */
export const getPhonemeImprovementMessage = (
  phoneme: string,
  previousAccuracy: number,
  currentAccuracy: number
): string | null => {
  const improvement = currentAccuracy - previousAccuracy;
  
  if (improvement >= 20) {
    return `Amazing! You're getting SO much better at the ${getPhonemeDisplayName(phoneme)}! 🎉`;
  } else if (improvement >= 10) {
    return `Great progress on the ${getPhonemeDisplayName(phoneme)}! Keep it up! ⭐`;
  } else if (currentAccuracy >= 80 && previousAccuracy < 80) {
    return `You mastered the ${getPhonemeDisplayName(phoneme)}! 🏆`;
  }
  
  return null;
};
