/**
 * Real Phoneme Analysis using Whisper ASR
 * Analyzes actual audio to detect spoken phonemes and compare with expected
 * This provides REAL phoneme-level accuracy instead of text-based simulation
 */

import { initPhonemeRecognizer, detectPhonemes, PhonemeResult } from './phonemeDetection';
import { getIPAPronunciation } from './cmuDictWrapper';
import { phonemeDistance, arePhonemesSimilar } from './phonemeDistance';

export interface RealPhonemeAnalysisResult {
  /** Detected phonemes from the audio */
  detectedPhonemes: PhonemeResult[];
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
  /** Phonemes with <70% accuracy */
  problematicPhonemes: string[];
  /** Overall phoneme accuracy percentage */
  overallAccuracy: number;
  /** Whether the model successfully analyzed the audio */
  analysisSuccessful: boolean;
  /** Error message if analysis failed */
  errorMessage?: string;
}

interface WordWithExpectedPhonemes {
  word: string;
  index: number;
  expectedPhonemes: string[];
  startMs: number;
  endMs: number;
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
 * Analyze audio blob to detect real phonemes and compare with expected words
 * 
 * @param audioBlob - The recorded audio blob
 * @param words - Array of expected words in the passage
 * @param wordReadings - Array of word readings with timing info
 * @returns Real phoneme analysis result
 */
export const analyzeRealPhonemes = async (
  audioBlob: Blob,
  words: string[],
  wordReadings: Array<{ word: string; index: number; startMs: number; endMs: number; correct: boolean }>
): Promise<RealPhonemeAnalysisResult> => {
  // Build expected phonemes for each word
  const wordsWithPhonemes: WordWithExpectedPhonemes[] = wordReadings.map(wr => {
    const expectedWord = words[wr.index] || wr.word;
    const expectedPhonemes = getIPAPronunciation(expectedWord)[0] || [];
    return {
      word: expectedWord,
      index: wr.index,
      expectedPhonemes,
      startMs: wr.startMs,
      endMs: wr.endMs,
    };
  });

  try {
    // Ensure model is initialized
    if (!modelInitialized) {
      const initResult = await preloadPhonemeModel();
      if (!initResult.success) {
        console.warn('[RealPhonemeAnalysis] Model not available, falling back to simulated');
        return createFallbackResult(wordsWithPhonemes, wordReadings);
      }
    }

    // Detect phonemes from actual audio
    console.log('[RealPhonemeAnalysis] Analyzing audio blob:', audioBlob.size, 'bytes');
    const detectedPhonemes = await detectPhonemes(audioBlob);
    console.log('[RealPhonemeAnalysis] Detected', detectedPhonemes.length, 'phonemes from audio');

    if (detectedPhonemes.length === 0) {
      console.warn('[RealPhonemeAnalysis] No phonemes detected, using fallback');
      return createFallbackResult(wordsWithPhonemes, wordReadings);
    }

    // Compare detected phonemes with expected phonemes
    const { phonemeScores, substitutions, problematicPhonemes, overallAccuracy } = 
      compareDetectedWithExpected(detectedPhonemes, wordsWithPhonemes, wordReadings);

    return {
      detectedPhonemes,
      phonemeScores,
      substitutions,
      problematicPhonemes,
      overallAccuracy,
      analysisSuccessful: true,
    };

  } catch (error) {
    console.error('[RealPhonemeAnalysis] Analysis failed:', error);
    return {
      ...createFallbackResult(wordsWithPhonemes, wordReadings),
      analysisSuccessful: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Compare detected phonemes from audio with expected phonemes
 */
function compareDetectedWithExpected(
  detectedPhonemes: PhonemeResult[],
  wordsWithPhonemes: WordWithExpectedPhonemes[],
  wordReadings: Array<{ word: string; index: number; startMs: number; endMs: number; correct: boolean }>
): {
  phonemeScores: Record<string, number>;
  substitutions: RealPhonemeAnalysisResult['substitutions'];
  problematicPhonemes: string[];
  overallAccuracy: number;
} {
  const phonemeStats: Record<string, { correct: number; total: number }> = {};
  const substitutions: RealPhonemeAnalysisResult['substitutions'] = [];

  // Group detected phonemes by timestamp ranges matching word timings
  wordsWithPhonemes.forEach((wordInfo, idx) => {
    const wordReading = wordReadings[idx];
    if (!wordReading) return;

    // Find detected phonemes that fall within this word's time range
    // Convert timestamps: detectPhonemes returns seconds, wordReadings uses milliseconds
    const startSec = wordInfo.startMs / 1000;
    const endSec = wordInfo.endMs / 1000;
    
    const phonemesInWord = detectedPhonemes.filter(p => 
      p.timestamp >= startSec - 0.1 && p.timestamp <= endSec + 0.1
    );

    // Track expected phonemes
    wordInfo.expectedPhonemes.forEach(expectedPhoneme => {
      if (!phonemeStats[expectedPhoneme]) {
        phonemeStats[expectedPhoneme] = { correct: 0, total: 0 };
      }
      phonemeStats[expectedPhoneme].total++;
    });

    // Compare detected vs expected
    if (phonemesInWord.length > 0 && wordInfo.expectedPhonemes.length > 0) {
      // Align detected to expected using simple matching
      const alignedPairs = alignPhonemes(wordInfo.expectedPhonemes, phonemesInWord);
      
      alignedPairs.forEach(({ expected, detected, confidence }) => {
        if (expected === detected) {
          // Perfect match
          phonemeStats[expected].correct++;
        } else if (detected && arePhonemesSimilar(expected, detected, 0.3)) {
          // Close enough - count as correct but note the variation
          phonemeStats[expected].correct++;
        } else if (detected) {
          // Substitution detected
          substitutions.push({
            expected,
            detected,
            word: wordInfo.word,
            wordIndex: wordInfo.index,
            confidence,
          });
        }
        // If no detected phoneme matched, it's an omission (already counted as miss in total)
      });
    } else if (wordReading.correct) {
      // Word was marked correct but no phoneme data - assume all phonemes correct
      wordInfo.expectedPhonemes.forEach(phoneme => {
        phonemeStats[phoneme].correct++;
      });
    }
    // If word was incorrect and no phoneme data, phonemes remain as misses
  });

  // Calculate per-phoneme accuracy scores
  const phonemeScores: Record<string, number> = {};
  Object.entries(phonemeStats).forEach(([phoneme, stats]) => {
    phonemeScores[phoneme] = stats.total > 0 
      ? Math.round((stats.correct / stats.total) * 100) 
      : 0;
  });

  // Identify problematic phonemes (<70% accuracy with 2+ occurrences)
  const problematicPhonemes = Object.entries(phonemeStats)
    .filter(([_, stats]) => stats.total >= 2 && (stats.correct / stats.total) < 0.7)
    .map(([phoneme]) => phoneme);

  // Calculate overall accuracy
  const totalCorrect = Object.values(phonemeStats).reduce((sum, s) => sum + s.correct, 0);
  const totalPhonemes = Object.values(phonemeStats).reduce((sum, s) => sum + s.total, 0);
  const overallAccuracy = totalPhonemes > 0 
    ? Math.round((totalCorrect / totalPhonemes) * 100) 
    : 0;

  return { phonemeScores, substitutions, problematicPhonemes, overallAccuracy };
}

/**
 * Align detected phonemes with expected phonemes for comparison
 */
function alignPhonemes(
  expected: string[],
  detected: PhonemeResult[]
): Array<{ expected: string; detected: string | null; confidence: number }> {
  const aligned: Array<{ expected: string; detected: string | null; confidence: number }> = [];
  
  // Simple greedy alignment - match each expected phoneme to closest detected
  const usedDetected = new Set<number>();
  
  expected.forEach(expectedPhoneme => {
    let bestMatch: { idx: number; phoneme: string; confidence: number; distance: number } | null = null;
    
    detected.forEach((det, idx) => {
      if (usedDetected.has(idx)) return;
      
      const distance = phonemeDistance(expectedPhoneme, det.phoneme);
      if (!bestMatch || distance < bestMatch.distance) {
        bestMatch = { idx, phoneme: det.phoneme, confidence: det.confidence, distance };
      }
    });
    
    if (bestMatch && bestMatch.distance < 0.8) {
      usedDetected.add(bestMatch.idx);
      aligned.push({
        expected: expectedPhoneme,
        detected: bestMatch.phoneme,
        confidence: bestMatch.confidence,
      });
    } else {
      // No good match found - phoneme was omitted
      aligned.push({
        expected: expectedPhoneme,
        detected: null,
        confidence: 0,
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
  wordsWithPhonemes: WordWithExpectedPhonemes[],
  wordReadings: Array<{ word: string; index: number; startMs: number; endMs: number; correct: boolean }>
): RealPhonemeAnalysisResult {
  const phonemeStats: Record<string, { correct: number; total: number }> = {};
  
  wordReadings.forEach((wr, idx) => {
    const wordInfo = wordsWithPhonemes[idx];
    if (!wordInfo) return;
    
    wordInfo.expectedPhonemes.forEach(phoneme => {
      if (!phonemeStats[phoneme]) {
        phonemeStats[phoneme] = { correct: 0, total: 0 };
      }
      phonemeStats[phoneme].total++;
      if (wr.correct) {
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
  
  return {
    detectedPhonemes: [],
    phonemeScores,
    substitutions: [],
    problematicPhonemes: Object.entries(phonemeStats)
      .filter(([_, stats]) => stats.total >= 2 && (stats.correct / stats.total) < 0.7)
      .map(([phoneme]) => phoneme),
    overallAccuracy: totalPhonemes > 0 ? Math.round((totalCorrect / totalPhonemes) * 100) : 0,
    analysisSuccessful: false,
    errorMessage: 'Using text-based fallback (simulated)',
  };
}
