import { pipeline, env } from '@huggingface/transformers';
import { getIPAPronunciation } from './cmuDictWrapper';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

// Cache for CMU Dictionary lookups to boost performance
const phonemeCache = new Map<string, string[]>();

// Cache for model initialization promise
let modelInitPromise: Promise<any> | null = null;

export interface PhonemeResult {
  phoneme: string;
  timestamp: number;
  duration: number;
  confidence: number;
}

/** NEW: Word-level detection result from Whisper */
export interface DetectedWord {
  /** The word Whisper detected (transcribed) */
  text: string;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
  /** ASR confidence (0-1) */
  confidence: number;
}

export interface PhonemeAnalysis {
  phonemes: PhonemeResult[];
  overallAccuracy: number;
  problematicPhonemes: string[];
}

let phonemeRecognizer: any = null;

/**
 * Initialize the phoneme recognition model with promise caching
 */
export const initPhonemeRecognizer = async (): Promise<any> => {
  if (phonemeRecognizer) return phonemeRecognizer;
  
  // Use cached promise to prevent multiple simultaneous downloads
  if (!modelInitPromise) {
    modelInitPromise = (async () => {
      try {
        console.log('Loading phoneme recognition model...');
        const model = await pipeline(
          'automatic-speech-recognition',
          'Xenova/whisper-tiny.en',
          { 
            device: 'webgpu',
            dtype: 'fp32'
          }
        );
        console.log('Phoneme recognition model loaded');
        phonemeRecognizer = model;
        return model;
      } catch (error) {
        console.error('Failed to load phoneme recognition model:', error);
        modelInitPromise = null; // Reset so we can retry
        throw new Error('Failed to initialize phoneme recognizer. Please check your internet connection.');
      }
    })();
  }
  
  return modelInitPromise;
};

/**
 * Detect phonemes from audio blob
 */
export const detectPhonemes = async (audioBlob: Blob): Promise<PhonemeResult[]> => {
  try {
    if (!phonemeRecognizer) {
      await initPhonemeRecognizer();
    }
    
    // Convert blob to audio buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Get audio data
    const audioData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Resample to 16kHz if needed (whisper expects 16kHz)
    const targetSampleRate = 16000;
    let processedAudio = audioData;
    
    if (sampleRate !== targetSampleRate) {
      processedAudio = resampleAudio(audioData, sampleRate, targetSampleRate);
    }
    
    // Run ASR to get word-level timestamps
    const result = await phonemeRecognizer(processedAudio, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: 'word'
    });
    
    // Map words to approximate phonemes
    const phonemes = mapWordsToPhonemes(result.chunks || []);
    
    return phonemes;
    
  } catch (error) {
    console.error('Error detecting phonemes:', error);
    // Return empty array on error rather than failing
    return [];
  }
};

/**
 * NEW: Detect WORDS from audio blob (for substitution analysis)
 * Returns the actual transcribed words from Whisper for comparison with expected words
 */
export const detectWords = async (audioBlob: Blob): Promise<DetectedWord[]> => {
  try {
    if (!phonemeRecognizer) {
      await initPhonemeRecognizer();
    }
    
    // Convert blob to audio buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Get audio data
    const audioData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Resample to 16kHz if needed (whisper expects 16kHz)
    const targetSampleRate = 16000;
    let processedAudio = audioData;
    
    if (sampleRate !== targetSampleRate) {
      processedAudio = resampleAudio(audioData, sampleRate, targetSampleRate);
    }
    
    // Run ASR to get word-level timestamps
    const result = await phonemeRecognizer(processedAudio, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: 'word'
    });
    
    // Extract word-level results
    const detectedWords: DetectedWord[] = (result.chunks || []).map((chunk: any) => ({
      text: chunk.text.toLowerCase().trim(),
      startTime: chunk.timestamp[0] || 0,
      endTime: chunk.timestamp[1] || (chunk.timestamp[0] + 0.5),
      confidence: 0.85, // Whisper doesn't give per-word confidence, use baseline
    }));
    
    console.log('[detectWords] Whisper detected', detectedWords.length, 'words:', 
      detectedWords.map(w => w.text).join(' '));
    
    return detectedWords;
    
  } catch (error) {
    console.error('Error detecting words:', error);
    return [];
  }
};

/**
 * Simple audio resampling
 */
const resampleAudio = (
  audioData: Float32Array,
  originalRate: number,
  targetRate: number
): Float32Array => {
  const ratio = originalRate / targetRate;
  const newLength = Math.round(audioData.length / ratio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, audioData.length - 1);
    const fraction = srcIndex - srcIndexFloor;
    
    result[i] = audioData[srcIndexFloor] * (1 - fraction) + audioData[srcIndexCeil] * fraction;
  }
  
  return result;
};

/**
 * Map words to phonemes with approximate IPA representation
 */
const mapWordsToPhonemes = (chunks: any[]): PhonemeResult[] => {
  const phonemes: PhonemeResult[] = [];
  
  chunks.forEach((chunk) => {
    const word = chunk.text.toLowerCase().trim();
    const timestamp = chunk.timestamp[0] || 0;
    const duration = (chunk.timestamp[1] || timestamp + 0.5) - timestamp;
    
    // Use cached CMU Dictionary lookup for performance
    let wordPhonemes: string[];
    if (phonemeCache.has(word)) {
      wordPhonemes = phonemeCache.get(word)!;
    } else {
      const pronunciations = getIPAPronunciation(word);
      wordPhonemes = pronunciations[0] || simpleG2P(word);
      phonemeCache.set(word, wordPhonemes);
    }
    
    const phonemeDuration = duration / wordPhonemes.length;
    
    wordPhonemes.forEach((phoneme, idx) => {
      phonemes.push({
        phoneme,
        timestamp: timestamp + (idx * phonemeDuration),
        duration: phonemeDuration,
        confidence: 0.85 // Baseline confidence
      });
    });
  });
  
  return phonemes;
};

/**
 * Simple grapheme-to-phoneme mapping for common English sounds
 * DEPRECATED: Use cmuDictWrapper.ts for production-grade G2P
 */
const simpleG2P = (word: string): string[] => {
  const phonemeMap: { [key: string]: string[] } = {
    'th': ['θ'], // think
    'sh': ['ʃ'], // ship
    'ch': ['tʃ'], // chip
    'ph': ['f'], // phone
    'ck': ['k'], // back
    'ng': ['ŋ'], // sing
    'a': ['æ'], 'e': ['ɛ'], 'i': ['ɪ'], 'o': ['ɑ'], 'u': ['ʌ'],
    'b': ['b'], 'c': ['k'], 'd': ['d'], 'f': ['f'], 'g': ['ɡ'],
    'h': ['h'], 'j': ['dʒ'], 'k': ['k'], 'l': ['l'], 'm': ['m'],
    'n': ['n'], 'p': ['p'], 'q': ['kw'], 'r': ['ɹ'], 's': ['s'],
    't': ['t'], 'v': ['v'], 'w': ['w'], 'x': ['ks'], 'y': ['j'], 'z': ['z']
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

/**
 * Analyze phoneme accuracy compared to expected transcript
 */
export const analyzePhonemeAccuracy = (
  detectedPhonemes: PhonemeResult[],
  transcript: string
): PhonemeAnalysis => {
  // Map transcript to expected phonemes using CMU Dictionary with caching
  const words = transcript.toLowerCase().split(/\s+/);
  const expectedPhonemes = words.flatMap(word => {
    if (phonemeCache.has(word)) {
      return phonemeCache.get(word)!;
    }
    const pronunciations = getIPAPronunciation(word);
    const phonemes = pronunciations[0] || simpleG2P(word);
    phonemeCache.set(word, phonemes);
    return phonemes;
  });
  
  // Calculate overall accuracy
  const matchCount = Math.min(detectedPhonemes.length, expectedPhonemes.length);
  let correctCount = 0;
  
  const phonemeScores: { [key: string]: { correct: number; total: number } } = {};
  
  for (let i = 0; i < matchCount; i++) {
    const detected = detectedPhonemes[i]?.phoneme || '';
    const expected = expectedPhonemes[i] || '';
    
    if (!phonemeScores[expected]) {
      phonemeScores[expected] = { correct: 0, total: 0 };
    }
    
    phonemeScores[expected].total++;
    
    if (detected === expected) {
      correctCount++;
      phonemeScores[expected].correct++;
    }
  }
  
  const overallAccuracy = matchCount > 0 ? (correctCount / matchCount) * 100 : 0;
  
  // Identify problematic phonemes (< 70% accuracy)
  const problematicPhonemes = Object.entries(phonemeScores)
    .filter(([_, scores]) => scores.total > 2 && (scores.correct / scores.total) < 0.7)
    .map(([phoneme]) => phoneme);
  
  return {
    phonemes: detectedPhonemes,
    overallAccuracy,
    problematicPhonemes
  };
};
