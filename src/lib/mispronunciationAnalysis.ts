/**
 * Mispronunciation Pattern Analysis
 * Analyzes word_readings to identify systematic phoneme errors
 */

import { supabase } from '@/integrations/supabase/client';
import { getIPAPronunciation } from './cmuDictWrapper';

interface ErrorPattern {
  errorType: string;
  frequency: number;
  contexts: string[];
}

/**
 * Analyze recent word readings for a student and update error patterns
 */
export async function analyzeMispronunciationPatterns(
  studentId: string,
  sessionId?: string
): Promise<void> {
  try {
    // Fetch recent word readings (last 30 days or specific session)
    let query = supabase
      .from('word_readings')
      .select('*, reading_sessions!inner(student_id)')
      .eq('reading_sessions.student_id', studentId)
      .eq('was_correct', false)
      .order('created_at', { ascending: false })
      .limit(500);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data: errorReadings, error } = await query;

    if (error || !errorReadings || errorReadings.length === 0) {
      console.log('No error readings to analyze');
      return;
    }

    // Group errors by phoneme patterns
    const errorMap = new Map<string, ErrorPattern>();

    for (const reading of errorReadings) {
      // Get expected phonemes (cast Json to string[])
      const expectedPhonemes = Array.isArray(reading.phonemes_expected) 
        ? (reading.phonemes_expected as string[])
        : [];
      
      if (expectedPhonemes.length === 0) continue;

      // For now, analyze at word level since we don't have detected phonemes
      // In future: compare phonemes_detected with phonemes_expected
      
      // Identify common error patterns by word context
      const wordContext = reading.word_text.toLowerCase();
      
      // Check for common phoneme confusion patterns
      const commonConfusions = identifyCommonConfusions(
        wordContext,
        expectedPhonemes
      );

      for (const confusion of commonConfusions) {
        const errorType = `${confusion.target}→${confusion.substitute}`;
        
        if (errorMap.has(errorType)) {
          const existing = errorMap.get(errorType)!;
          existing.frequency++;
          if (!existing.contexts.includes(wordContext)) {
            existing.contexts.push(wordContext);
          }
        } else {
          errorMap.set(errorType, {
            errorType,
            frequency: 1,
            contexts: [wordContext],
          });
        }
      }
    }

    // Save significant patterns (frequency >= 3) to database
    const patterns = Array.from(errorMap.values())
      .filter(p => p.frequency >= 3)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10); // Top 10 patterns

    if (patterns.length > 0) {
      const inserts = patterns.map(pattern => ({
        student_id: studentId,
        error_type: pattern.errorType,
        frequency: pattern.frequency,
        last_seen: new Date().toISOString(),
        word_examples: pattern.contexts.slice(0, 5),
        mastered: false,
      }));

      // Upsert patterns (update if exists, insert if new)
      for (const insert of inserts) {
        await supabase
          .from('student_error_patterns')
          .upsert(insert, {
            onConflict: 'student_id,error_type',
          });
      }

      console.log(`Updated ${patterns.length} error patterns for student ${studentId}`);
    }

  } catch (error) {
    console.error('Error analyzing mispronunciation patterns:', error);
  }
}

/**
 * Identify common phoneme confusion patterns based on word structure
 */
function identifyCommonConfusions(
  word: string,
  expectedPhonemes: string[]
): Array<{ target: string; substitute: string }> {
  const confusions: Array<{ target: string; substitute: string }> = [];

  // Common English phoneme confusions
  const commonPatterns = [
    // TH sounds
    { pattern: /th/i, target: 'θ', substitute: 't' }, // "think" -> "tink"
    { pattern: /th/i, target: 'ð', substitute: 'd' }, // "this" -> "dis"
    
    // R/W confusion
    { pattern: /r/i, target: 'ɹ', substitute: 'w' }, // "red" -> "wed"
    
    // L/R confusion
    { pattern: /l/i, target: 'l', substitute: 'ɹ' }, // "light" -> "right"
    
    // Short vowels
    { pattern: /[aeiou]/i, target: 'ɪ', substitute: 'i' }, // "ship" -> "sheep"
    { pattern: /[aeiou]/i, target: 'ɛ', substitute: 'æ' }, // "bed" -> "bad"
    
    // Consonant clusters
    { pattern: /str/i, target: 's', substitute: '' }, // "street" -> "treet"
    { pattern: /[sc]h/i, target: 'ʃ', substitute: 's' }, // "ship" -> "sip"
  ];

  for (const { pattern, target, substitute } of commonPatterns) {
    if (pattern.test(word) && expectedPhonemes.includes(target)) {
      confusions.push({ target, substitute });
    }
  }

  return confusions;
}

/**
 * Generate practice exercises based on error patterns
 */
export async function generatePracticeExercises(
  studentId: string
): Promise<Array<{ phoneme: string; words: string[]; tips: string }>> {
  const { data: patterns } = await supabase
    .from('student_error_patterns')
    .select('*')
    .eq('student_id', studentId)
    .eq('mastered', false)
    .order('frequency', { ascending: false })
    .limit(5);

  if (!patterns || patterns.length === 0) {
    return [];
  }

  const exercises = patterns.map(pattern => {
    // Extract phoneme from error_type (format: "θ→t")
    const phoneme = pattern.error_type.split('→')[0];
    const tips = getPhonemeProTips(phoneme);
    const practiceWords = getPracticeWords(phoneme);

    return {
      phoneme,
      words: practiceWords,
      tips,
    };
  });

  return exercises;
}

/**
 * Get pro tips for pronouncing specific phonemes
 */
function getPhonemeProTips(phoneme: string): string {
  const tips: { [key: string]: string } = {
    'θ': 'Put your tongue between your teeth and blow air: "th-th-th"',
    'ð': 'Same as θ but vibrate your vocal cords: "the, this, that"',
    'ɹ': 'Curl your tongue slightly back, don\'t touch the roof: "red, run, right"',
    'l': 'Touch tongue to roof behind front teeth: "light, lake, hello"',
    'ʃ': 'Round your lips and blow: "sh-sh-sh" like "ship, shoe, wish"',
    'tʃ': 'Start with "t" and slide to "sh": "ch-ch-ch" like "chip, chat, lunch"',
    'dʒ': 'Start with "d" and slide to "zh": "j-j-j" like "jump, job, badge"',
    'ŋ': 'Sound comes from your nose: "ng-ng-ng" like "sing, ring, thing"',
  };

  return tips[phoneme] || `Practice the sound: ${phoneme}`;
}

/**
 * Get practice words for a specific phoneme
 */
function getPracticeWords(phoneme: string): string[] {
  const wordLists: { [key: string]: string[] } = {
    'θ': ['think', 'thank', 'three', 'path', 'tooth', 'month'],
    'ð': ['this', 'that', 'they', 'mother', 'father', 'weather'],
    'ɹ': ['red', 'run', 'right', 'very', 'carry', 'sorry'],
    'l': ['light', 'lake', 'hello', 'ball', 'full', 'tall'],
    'ʃ': ['ship', 'shoe', 'wish', 'fish', 'push', 'fresh'],
    'tʃ': ['chip', 'chat', 'lunch', 'beach', 'match', 'teach'],
    'dʒ': ['jump', 'job', 'badge', 'judge', 'cage', 'page'],
    'ŋ': ['sing', 'ring', 'thing', 'king', 'long', 'song'],
  };

  return wordLists[phoneme] || ['practice', 'repeat', 'try', 'again'];
}
