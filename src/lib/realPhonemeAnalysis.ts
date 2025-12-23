/**
 * Real Phoneme Analysis using Whisper ASR
 * 
 * ENHANCED: Now uses word-level comparison for TRUE phoneme substitution detection!
 * 
 * How it works:
 * 1. Whisper transcribes the audio → detected words (e.g., "wabbit")
 * 2. Compare detected words with expected words (e.g., "rabbit")
 * 3. Use phoneme alignment to find substitutions (e.g., /ɹ/→/w/)
 * 4. This gives REAL data on pronunciation struggles!
 */

import { initPhonemeRecognizer, detectWords, DetectedWord } from './phonemeDetection';
import { getIPAPronunciation } from './cmuDictWrapper';
import { 
  compareWordsForPhonemes, 
  aggregatePhonemeAccuracy,
  WordSubstitutionResult,
  PhonemeSubstitution,
} from './phonemeSubstitutionAnalysis';

export interface RealPhonemeAnalysisResult {
  /** Detected words from the audio (what Whisper heard) */
  detectedWords: DetectedWord[];
  /** Per-phoneme accuracy scores based on real detection */
  phonemeScores: Record<string, number>;
  /** Specific substitutions detected (e.g., /ɹ/ → /w/) */
  substitutions: Array<{
    expected: string;
    detected: string;
    word: string;
    wordIndex: number;
    confidence: number;
  }>;
  /** Substitution counts for patterns (e.g., "ɹ→w": 3) */
  substitutionCounts: Record<string, number>;
  /** Phonemes with <70% accuracy */
  problematicPhonemes: string[];
  /** Top substitution patterns sorted by frequency */
  topSubstitutions: Array<{ from: string; to: string; count: number }>;
  /** Overall phoneme accuracy percentage */
  overallAccuracy: number;
  /** Whether the model successfully analyzed the audio */
  analysisSuccessful: boolean;
  /** Error message if analysis failed */
  errorMessage?: string;
}

// Track model initialization state
let isModelInitializing = false;
let modelInitialized = false;
let modelInitError: Error | null = null;

/**
 * Pre-initialize the Whisper model for phoneme detection
 * Call this early (e.g., when component mounts) to avoid delays during recording
 */
export const preloadPhonemeModel = async (): Promise<{ success: boolean; error?: string }> => {
  if (modelInitialized) {
    return { success: true };
  }
  
  if (isModelInitializing) {
    // Wait for existing initialization
    while (isModelInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return { success: modelInitialized, error: modelInitError?.message };
  }
  
  isModelInitializing = true;
  
  try {
    console.log('[RealPhonemeAnalysis] Pre-loading Whisper model...');
    await initPhonemeRecognizer();
    modelInitialized = true;
    console.log('[RealPhonemeAnalysis] ✅ Model loaded successfully');
    return { success: true };
  } catch (error) {
    modelInitError = error instanceof Error ? error : new Error('Unknown error');
    console.error('[RealPhonemeAnalysis] ❌ Model loading failed:', error);
    return { success: false, error: modelInitError.message };
  } finally {
    isModelInitializing = false;
  }
};

/**
 * Get the current model loading state
 */
export const getModelState = (): { initialized: boolean; initializing: boolean; error: string | null } => ({
  initialized: modelInitialized,
  initializing: isModelInitializing,
  error: modelInitError?.message || null,
});

/**
 * Analyze audio blob to detect real phoneme substitutions
 * 
 * NEW APPROACH (Option 1 - Enhanced Mismatch Detection):
 * 1. Use Whisper to transcribe audio → get detected words
 * 2. Align detected words with expected words by timing
 * 3. Compare mismatched words at the phoneme level
 * 4. Aggregate into per-phoneme accuracy scores
 * 
 * @param audioBlob - The recorded audio blob
 * @param words - Array of expected words in the passage
 * @param wordReadings - Array of word readings with timing info and correct/incorrect status
 * @returns Real phoneme analysis result with substitutions
 */
export const analyzeRealPhonemes = async (
  audioBlob: Blob,
  words: string[],
  wordReadings: Array<{ word: string; index: number; startMs: number; endMs: number; correct: boolean }>
): Promise<RealPhonemeAnalysisResult> => {
  try {
    // Ensure model is initialized
    if (!modelInitialized) {
      const initResult = await preloadPhonemeModel();
      if (!initResult.success) {
        console.warn('[RealPhonemeAnalysis] Model not available, falling back to text-based');
        return createFallbackResult(words, wordReadings);
      }
    }

    // Step 1: Detect words from actual audio using Whisper
    console.log('[RealPhonemeAnalysis] 🎤 Analyzing audio blob:', audioBlob.size, 'bytes');
    const detectedWords = await detectWords(audioBlob);
    console.log('[RealPhonemeAnalysis] 📝 Whisper detected', detectedWords.length, 'words');

    if (detectedWords.length === 0) {
      console.warn('[RealPhonemeAnalysis] No words detected, using fallback');
      return createFallbackResult(words, wordReadings);
    }

    // Step 2: Align detected words with expected words by timing
    const alignedPairs = alignDetectedToExpected(detectedWords, wordReadings, words);
    console.log('[RealPhonemeAnalysis] 🔗 Aligned', alignedPairs.length, 'word pairs');

    // Step 3: Compare mismatched pairs at phoneme level
    const wordResults: WordSubstitutionResult[] = [];
    const allSubstitutions: RealPhonemeAnalysisResult['substitutions'] = [];

    alignedPairs.forEach(pair => {
      const result = compareWordsForPhonemes(
        pair.detected,
        pair.expected,
        pair.expectedIndex,
        pair.confidence
      );
      wordResults.push(result);

      // Collect substitutions
      result.substitutions.forEach(sub => {
        allSubstitutions.push({
          expected: sub.expected,
          detected: sub.detected,
          word: sub.expectedWord,
          wordIndex: sub.wordIndex,
          confidence: sub.confidence,
        });
      });
    });

    // Step 4: Aggregate into per-phoneme accuracy
    const aggregated = aggregatePhonemeAccuracy(wordResults, words);

    console.log('[RealPhonemeAnalysis] ✅ REAL phoneme analysis complete:', {
      wordsAnalyzed: alignedPairs.length,
      substitutionsFound: allSubstitutions.length,
      problematicPhonemes: aggregated.problematicPhonemes,
      overallAccuracy: aggregated.overallAccuracy,
    });

    return {
      detectedWords,
      phonemeScores: aggregated.phonemeScores,
      substitutions: allSubstitutions,
      substitutionCounts: aggregated.substitutionCounts,
      problematicPhonemes: aggregated.problematicPhonemes,
      topSubstitutions: aggregated.topSubstitutions,
      overallAccuracy: aggregated.overallAccuracy,
      analysisSuccessful: true,
    };

  } catch (error) {
    console.error('[RealPhonemeAnalysis] Analysis failed:', error);
    return {
      ...createFallbackResult(words, wordReadings),
      analysisSuccessful: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Align detected words from Whisper with expected words from the passage
 * Uses timing information to match detected words to expected words
 */
function alignDetectedToExpected(
  detectedWords: DetectedWord[],
  wordReadings: Array<{ word: string; index: number; startMs: number; endMs: number; correct: boolean }>,
  expectedWords: string[]
): Array<{ detected: string; expected: string; expectedIndex: number; confidence: number }> {
  const aligned: Array<{ detected: string; expected: string; expectedIndex: number; confidence: number }> = [];
  
  // Create a map of detected words by approximate time
  const detectedByTime: Map<number, DetectedWord> = new Map();
  detectedWords.forEach(dw => {
    // Round to nearest 100ms for matching
    const timeKey = Math.round(dw.startTime * 10);
    detectedByTime.set(timeKey, dw);
  });

  // For each word reading, find the best matching detected word
  wordReadings.forEach(wr => {
    const expectedWord = expectedWords[wr.index] || wr.word;
    const startSec = wr.startMs / 1000;
    const endSec = wr.endMs / 1000;

    // Find detected word that overlaps with this time range
    let bestMatch: DetectedWord | null = null;
    let bestOverlap = 0;

    detectedWords.forEach(dw => {
      const overlapStart = Math.max(startSec, dw.startTime);
      const overlapEnd = Math.min(endSec, dw.endTime);
      const overlap = Math.max(0, overlapEnd - overlapStart);

      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestMatch = dw;
      }
    });

    if (bestMatch) {
      aligned.push({
        detected: bestMatch.text,
        expected: expectedWord,
        expectedIndex: wr.index,
        confidence: bestMatch.confidence,
      });
    } else {
      // No detected word found - use the word from wordReadings as "detected"
      // (This happens when Whisper missed a word)
      aligned.push({
        detected: wr.word.toLowerCase(),
        expected: expectedWord,
        expectedIndex: wr.index,
        confidence: 0.5,
      });
    }
  });

  return aligned;
}

/**
 * Create fallback result using text-based phoneme lookup (simulated)
 * Used when audio analysis fails or model is unavailable
 */
function createFallbackResult(
  words: string[],
  wordReadings: Array<{ word: string; index: number; startMs: number; endMs: number; correct: boolean }>
): RealPhonemeAnalysisResult {
  const phonemeStats: Record<string, { correct: number; total: number }> = {};
  
  // Count all expected phonemes from passage words
  words.forEach(word => {
    const phonemes = getIPAPronunciation(word.toLowerCase().replace(/[^a-z]/g, ''))[0] || [];
    phonemes.forEach(phoneme => {
      if (!phonemeStats[phoneme]) {
        phonemeStats[phoneme] = { correct: 0, total: 0 };
      }
      phonemeStats[phoneme].total++;
    });
  });
  
  // Mark phonemes as correct/incorrect based on word-level correctness
  wordReadings.forEach(wr => {
    const expectedWord = words[wr.index] || wr.word;
    const phonemes = getIPAPronunciation(expectedWord.toLowerCase().replace(/[^a-z]/g, ''))[0] || [];
    
    phonemes.forEach(phoneme => {
      if (phonemeStats[phoneme] && wr.correct) {
        phonemeStats[phoneme].correct++;
      }
    });
  });
  
  const phonemeScores: Record<string, number> = {};
  Object.entries(phonemeStats).forEach(([phoneme, stats]) => {
    phonemeScores[phoneme] = stats.total > 0 
      ? Math.round((stats.correct / stats.total) * 100) 
      : 0;
  });
  
  const totalCorrect = Object.values(phonemeStats).reduce((sum, s) => sum + s.correct, 0);
  const totalPhonemes = Object.values(phonemeStats).reduce((sum, s) => sum + s.total, 0);
  
  const problematicPhonemes = Object.entries(phonemeStats)
    .filter(([_, stats]) => stats.total >= 2 && (stats.correct / stats.total) < 0.7)
    .map(([phoneme]) => phoneme);
  
  return {
    detectedWords: [],
    phonemeScores,
    substitutions: [],
    substitutionCounts: {},
    problematicPhonemes,
    topSubstitutions: [],
    overallAccuracy: totalPhonemes > 0 ? Math.round((totalCorrect / totalPhonemes) * 100) : 0,
    analysisSuccessful: false,
    errorMessage: 'Using text-based fallback (simulated)',
  };
}
