import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Mic, StopCircle, Loader2, AlertCircle, Sparkles, Brain, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getIPAPronunciation } from '@/lib/cmuDictWrapper';
import { analyzeMispronunciationPatterns } from '@/lib/mispronunciationAnalysis';
import { checkAndAwardAchievements, generateDailyMissions, updateMissionProgress } from '@/lib/achievementLogic';
import { AchievementUnlockedModal } from './AchievementUnlockedModal';
import { CelebrationEffect } from './CelebrationEffect';
import { XPPopup } from './XPPopup';
import { playCorrectPronunciation, SoundEffects, unlockSpeechSynthesis } from '@/lib/pronunciationPlayer';
import { AuraCharacter, useAuraCharacterState } from './AuraCharacter';
import { RealtimeCoachingFeedback } from './RealtimeCoachingFeedback';
import { DifficultyLevelDisplay } from './DifficultyLevelDisplay';
import { SmartExercisesPanel } from './SmartExercisesPanel';
import { cognitiveLoadEstimator, detectHesitationMarkers } from '@/lib/cognitiveLoadEstimator';
import { adaptiveDifficultyEngine } from '@/lib/difficultyScalingV2';
import { analyzeMiscues, getMiscueInterventions, type MiscueAnalysis } from '@/lib/miscueAnalysis';
import { calculateProsodyScore, type ProsodyMetrics } from '@/lib/prosodyAnalysis';
import { RealtimeAudioAnalyzer, type LiveMetrics } from '@/lib/realtimeAudioAnalysis';
// ML INTEGRATION: Import ML hook for training data pipeline and predictions
import { useMLIntegration } from '@/hooks/useMLIntegration';
// DUAL-MODE MATCHING: Import strict/lenient matchers for benchmark vs practice
// SUPERCHARGED V2: Added window matching, phoneme fallback, and multi-alternative support
// SUPERCHARGED V3: Added homophones dictionary and transcript cleanup integration
import { 
  isWordMatchStrict, 
  isWordMatchLenient,
  isWordMatchBattle,
  analyzeWordMatch,
  calculateSessionConfidence,
  findWordInWindow,
  matchWithAlternatives,
  matchWithPhonemes,
  findWordInFullTranscript,
  isHomophone,
  type WordMatchResult 
} from '@/lib/wordMatchingModes';
// SUPERCHARGED V3: Transcript cleanup for filler words and self-corrections
import { cleanupTranscript, extractWords, isFillerWord } from '@/lib/transcriptCleanup';
// ENHANCED PHONEME INFERENCE: $0/month phoneme pattern analysis
import { usePhonemePatterns } from '@/hooks/usePhonemePatterns';
import { compareWordPhonemes, analyzePhonemePatterns, getPhonemeDisplayName } from '@/lib/phonemeInference';
// REAL PHONEME ANALYSIS: Whisper-based audio phoneme detection
import { preloadPhonemeModel, analyzeRealPhonemes, getModelState, type RealPhonemeAnalysisResult } from '@/lib/realPhonemeAnalysis';
// MIC DIAGNOSTICS: Detailed error handling for microphone access
import { ensureMicrophoneAccess, getMicDiagnostics, type MicAccessResult } from '@/lib/micDiagnostics';
import { mirrorToR2Async } from '@/lib/r2Mirror';

// Browser compatibility check
const checkBrowserSupport = () => {
  const hasWebSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  const hasMediaRecorder = 'MediaRecorder' in window;
  const hasGetUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  
  return {
    isSupported: hasWebSpeech && hasMediaRecorder && hasGetUserMedia,
    missing: [
      !hasWebSpeech && 'Web Speech API',
      !hasMediaRecorder && 'MediaRecorder',
      !hasGetUserMedia && 'Microphone Access'
    ].filter(Boolean) as string[]
  };
};

interface WordByWordReaderProps {
  passageText: string;
  assignmentId?: string | null;
  onComplete: (sessionData: ReadingSessionResult) => void;
  // Screening mode props
  screeningPeriodId?: string | null;
  screeningClassroomId?: string | null;
  screeningPassageId?: string | null;
  screeningPassageTitle?: string | null;
  screeningGradeLevel?: number;
  // Battle mode callback - fires on each word result
  onWordResult?: (result: { 
    correct: boolean; 
    wordIndex: number; 
    streak: number; 
    word: string;
    wordLength: number;
  }) => void;
  // Battle mode props - for challenging mode matching
  battleMode?: boolean;
  challengingMode?: boolean;
  // Grade mode for data separation
  gradeMode?: string;
}

interface ReadingSessionResult {
  sessionId: string;
  wpm: number;
  wcpm: number;  // Words Correct Per Minute (WPM minus miscues)
  accuracy: number;
  wordsRead: number;
  durationSeconds: number;
  xpEarned: number;
  miscueAnalysis?: MiscueAnalysis;
  prosodyMetrics?: ProsodyMetrics;
  fluencyLevel?: 'frustration' | 'instructional' | 'independent';
  // NEW: Confidence tracking for teacher verification
  aiConfidenceScore?: number;
  flaggedWords?: Array<{
    wordIndex: number;
    expected: string;
    spoken: string;
    confidence: number;
    aiResult: boolean;
  }>;
  // ENHANCED PHONEME INFERENCE: Specific substitution patterns
  phonemeInference?: {
    substitutions: Array<{
      expected: string;
      spoken: string;
      word: string;
      position: string;
    }>;
    problematicPhonemes: string[];
    phonemeAccuracyBySound: Record<string, number>;
    overallPhonemeAccuracy: number;
    interventionPriority: string[];
  };
  // NEW: Word results with attempts for grading
  wordResults?: Array<{
    word: string;
    correct: boolean;
    attempts: number;
    index: number;
  }>;
}

interface WordReading {
  word: string;
  index: number;
  startMs: number;
  endMs: number;
  correct: boolean;
  hesitation: boolean;
  selfCorrected?: boolean;
  // NEW: Speech API confidence for this word
  speechConfidence?: number;
  // NEW: Number of attempts for this word
  attempts?: number;
}

// Fuzzy string matching using Levenshtein distance
const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const normalizeWord = (word: string): string => {
  return word.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// DUAL-MODE WORD MATCHING: Uses strict for benchmarks, lenient for practice
// This wrapper function automatically chooses the right matcher based on context
const createWordMatcher = (isStrictMode: boolean) => {
  return (spoken: string, expected: string): boolean => {
    if (isStrictMode) {
      return isWordMatchStrict(spoken, expected);
    }
    return isWordMatchLenient(spoken, expected);
  };
};

// Fallback for places that don't have access to mode context (legacy)
const isWordMatch = (spoken: string, expected: string): boolean => {
  // Default to lenient for backwards compatibility
  return isWordMatchLenient(spoken, expected);
};

// Voice mascot triggers when pronunciation is significantly different
// INDEPENDENT of word matching - provides pronunciation help when really needed
const shouldSpeakWord = (spoken: string, expected: string): boolean => {
  const normalizedSpoken = normalizeWord(spoken);
  const normalizedExpected = normalizeWord(expected);
  
  // Exact match - never speak
  if (normalizedSpoken === normalizedExpected) return false;
  if (!normalizedSpoken || !normalizedExpected) return false;
  
  // Short words - only speak if completely wrong
  if (normalizedExpected.length <= 3) {
    return normalizedSpoken[0] !== normalizedExpected[0];
  }
  
  const distance = levenshteinDistance(normalizedSpoken, normalizedExpected);
  const maxLen = Math.max(normalizedSpoken.length, normalizedExpected.length);
  const percentDifferent = distance / maxLen;
  
  // SPEAK if >40% different (only for major mispronunciations)
  if (percentDifferent > 0.40) {
    console.log('🔊 VOICE MASCOT: >40% different, speaking:', expected, '(said:', spoken, ', diff:', Math.round(percentDifferent * 100), '%)');
    return true;
  }
  
  return false;
};

export const WordByWordReader = ({ 
  passageText, 
  assignmentId, 
  onComplete,
  screeningPeriodId,
  screeningClassroomId,
  screeningPassageId,
  screeningPassageTitle,
  screeningGradeLevel,
  onWordResult,
  battleMode,
  challengingMode,
  gradeMode,
}: WordByWordReaderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordReadings, setWordReadings] = useState<WordReading[]>([]);
  const [browserSupport] = useState(checkBrowserSupport());
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  
  // Real-time tracking states
  const [realtimeWordIndex, setRealtimeWordIndex] = useState(0);
  // SUPERCHARGED V2: Added 'pending-incorrect' status for grace period before marking definitively incorrect
  const [realtimeWordStatus, setRealtimeWordStatus] = useState<Map<number, 'correct' | 'incorrect' | 'pending-incorrect' | 'current' | 'pending'>>(new Map());
  const [correctStreak, setCorrectStreak] = useState(0);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);
  const [xpPopupTrigger, setXpPopupTrigger] = useState(0);
  const [xpAmount, setXpAmount] = useState(0);
  const [celebrationMessage, setCelebrationMessage] = useState('Amazing!');
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  
  // NEW: Words per group slider (changeable during reading)
  const [wordsPerGroup, setWordsPerGroup] = useState(1);
  
  // NEW: Track attempts per word for grading
  const wordAttemptsRef = useRef<Map<number, number>>(new Map());
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const soundEffectsRef = useRef<SoundEffects>(new SoundEffects());
  const auraCharacter = useAuraCharacterState();
  const words = passageText.split(/\s+/).filter(w => w.length > 0);
  const { toast } = useToast();
  
  // ML INTEGRATION: Hook for saving to aura_records and Q-learning updates
  const { saveToAuraRecords, triggerQLearningUpdate, getModelStatus, mlContext } = useMLIntegration();
  const [mlStatus, setMlStatus] = useState<{ crossModalLoaded: boolean; qLearningLoaded: boolean; isLoading: boolean }>({ 
    crossModalLoaded: false, 
    qLearningLoaded: false, 
    isLoading: false 
  });
  
  // Update ML status on mount and when context changes
  useEffect(() => {
    setMlStatus(getModelStatus());
  }, [getModelStatus, mlContext]);
  
  // Track processed words to avoid duplicates
  const processedWordsRef = useRef<Set<number>>(new Set());
  const lastInterimRef = useRef<string>('');
  
  // PHASE 1 FIX: Track which incorrect words have already had pronunciation played
  const spokenIncorrectWordsRef = useRef<Set<number>>(new Set());
  
  // CRITICAL FIX: Use refs to avoid stale closure issues in callbacks
  // SUPERCHARGED V2: Added 'pending-incorrect' status type
  const realtimeWordStatusRef = useRef<Map<number, 'correct' | 'incorrect' | 'pending-incorrect' | 'current' | 'pending'>>(new Map());
  const realtimeWordIndexRef = useRef(0);
  const correctStreakRef = useRef(0);
  
  // SUPERCHARGED V2: Track pending-incorrect words for grace period (3 seconds before marking definitively incorrect)
  const pendingIncorrectTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  // SUPERCHARGED V2: Store full transcript for final result override
  const fullTranscriptRef = useRef<string>('');
  // SUPERCHARGED V3: Store cleaned transcript separately
  const cleanedTranscriptRef = useRef<string>('');
  
  // Phase 3: Smart Coach states
  const [cognitiveLoad, setCognitiveLoad] = useState(0);
  const [hesitationCount, setHesitationCount] = useState(0);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<any>(null);
  const [generatedExercises, setGeneratedExercises] = useState<any[]>([]);
  const [recentAccuracy, setRecentAccuracy] = useState(0.5);
  
  // Track speech pauses for cognitive load
  const speechPausesRef = useRef<number[]>([]);
  const lastSpeechTimeRef = useRef<number>(0);
  
  // Real-time audio analysis for prosody (pitch + energy)
  const audioAnalyzerRef = useRef<RealtimeAudioAnalyzer | null>(null);
  const pitchHistoryRef = useRef<number[]>([]);
  const energyHistoryRef = useRef<number[]>([]);
  
  // DUAL-MODE MATCHING: Determine if we're in strict benchmark mode, challenging battle mode, or lenient practice mode
  const isStrictMode = Boolean(screeningPeriodId);
  const wordMatcher = useCallback((spoken: string, expected: string) => {
    if (isStrictMode) {
      return isWordMatchStrict(spoken, expected);
    }
    if (challengingMode) {
      return isWordMatchBattle(spoken, expected);
    }
    return isWordMatchLenient(spoken, expected);
  }, [isStrictMode, challengingMode]);
  
  // NEW: Track speech API confidence for each word (for teacher verification)
  const wordConfidencesRef = useRef<Map<number, number>>(new Map());
  const flaggedWordsRef = useRef<Array<{
    wordIndex: number;
    expected: string;
    spoken: string;
    confidence: number;
    aiResult: boolean;
    timestamp: number;
  }>>([]);
  const lastSpeechConfidenceRef = useRef<number>(1);
  
  // ENHANCED PHONEME INFERENCE: Track phoneme patterns across sessions ($0/month)
  const [phonemeMessages, setPhonemeMessages] = useState<string[]>([]);
  const phonemePatternsInitialized = useRef(false);
  
  // REAL PHONEME ANALYSIS: Whisper model loading state
  const [phonemeModelState, setPhonemeModelState] = useState<{
    initialized: boolean;
    initializing: boolean;
    error: string | null;
  }>({ initialized: false, initializing: false, error: null });
  const realPhonemeAnalysisRef = useRef<RealPhonemeAnalysisResult | null>(null);

  // Initialize word status
  useEffect(() => {
    const initialStatus = new Map<number, 'correct' | 'incorrect' | 'current' | 'pending'>();
    words.forEach((_, idx) => initialStatus.set(idx, 'pending'));
    setRealtimeWordStatus(initialStatus);
    realtimeWordStatusRef.current = initialStatus;
    realtimeWordIndexRef.current = 0;
    correctStreakRef.current = 0;
  }, [words.length]);
  
  // REAL PHONEME ANALYSIS: Pre-load Whisper model on mount for faster analysis
  useEffect(() => {
    const initPhonemeModel = async () => {
      setPhonemeModelState(prev => ({ ...prev, initializing: true }));
      try {
        const result = await preloadPhonemeModel();
        setPhonemeModelState({
          initialized: result.success,
          initializing: false,
          error: result.error || null,
        });
        if (result.success) {
          console.log('[WordByWordReader] ✅ Phoneme recognition model ready');
        }
      } catch (error) {
        console.error('[WordByWordReader] Phoneme model init error:', error);
        setPhonemeModelState({
          initialized: false,
          initializing: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };
    
    // Start loading the model immediately
    initPhonemeModel();
  }, []);
  
  // WIRE UP: Cognitive load estimation during recording
  useEffect(() => {
    if (!isRecording) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      
      // Track pause if no speech for 1+ seconds
      if (lastSpeechTimeRef.current > 0 && now - lastSpeechTimeRef.current > 1000) {
        speechPausesRef.current.push(now - lastSpeechTimeRef.current);
      }
      
      // Calculate cognitive load from behavioral signals
      const statusMap = realtimeWordStatusRef.current;
      const correctCount = Array.from(statusMap.values()).filter(s => s === 'correct').length;
      const totalProcessed = Array.from(statusMap.values()).filter(s => s === 'correct' || s === 'incorrect').length;
      const currentAccuracy = totalProcessed > 0 ? correctCount / totalProcessed : 0.5;
      
      // Update recent accuracy for coaching feedback
      setRecentAccuracy(currentAccuracy);
      
      // Estimate cognitive load
      const loadResult = cognitiveLoadEstimator.estimateLoad({
        speechPauses: speechPausesRef.current.slice(-10), // Last 10 pauses
        speechConfidence: currentAccuracy, // Use accuracy as proxy for confidence
        hesitationMarkers: [], // Would need transcript analysis
        taskDifficulty: 0.5, // Default moderate
        previousAttempts: 0,
        responseDelay: speechPausesRef.current.length > 0 
          ? speechPausesRef.current[speechPausesRef.current.length - 1] 
          : undefined,
      });
      
      setCognitiveLoad(loadResult.loadScore);
      setHesitationCount(speechPausesRef.current.length);
    }, 3000); // Check every 3 seconds
    
    return () => clearInterval(interval);
  }, [isRecording]);

  const startReading = useCallback(async () => {
    if (!browserSupport.isSupported) {
      toast({
        title: 'Browser not supported',
        description: `Missing: ${browserSupport.missing.join(', ')}. Please use Chrome or Edge.`,
        variant: 'destructive',
      });
      return;
    }

    // CRITICAL: Unlock speech synthesis on user gesture (start button click)
    unlockSpeechSynthesis();

    auraCharacter.setThinking();
    processedWordsRef.current = new Set();
    lastInterimRef.current = '';
    spokenIncorrectWordsRef.current = new Set(); // Reset spoken words tracker
    wordAttemptsRef.current = new Map(); // Reset attempts tracker
    setTotalXpEarned(0);

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    // PHASE 1 FIX: Use centralized mic access with detailed error handling
    const micResult = await ensureMicrophoneAccess(true);
    
    if (!micResult.success || !micResult.stream) {
      console.error('[WordByWordReader] Microphone access failed:', micResult.error);
      
      // Show specific error message based on the error type
      const errorInfo = micResult.error;
      const errorTitle = errorInfo?.actionRequired === 'unblock' 
        ? 'Microphone Blocked' 
        : errorInfo?.actionRequired === 'open-new-tab'
        ? 'Microphone Not Available'
        : errorInfo?.actionRequired === 'connect-device'
        ? 'No Microphone Found'
        : 'Microphone Error';
      
      toast({
        title: errorTitle,
        description: errorInfo?.userMessage || 'Please allow microphone access to use this feature.',
        variant: 'destructive',
      });
      
      // Log diagnostics for debugging
      console.log('[WordByWordReader] Mic diagnostics:', micResult.diagnostics);
      return;
    }
    
    const stream = micResult.stream;
    const recorder = new MediaRecorder(stream);
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };
    
    recorder.start(100);
    mediaRecorderRef.current = recorder;
    
    // Start real-time audio analysis for pitch/energy (prosody expression)
    pitchHistoryRef.current = [];
    energyHistoryRef.current = [];
    
    const analyzer = new RealtimeAudioAnalyzer(
      (metrics: LiveMetrics) => {
        // Collect pitch and energy data for prosody expression scoring
        if (metrics.avgPitch > 0) {
          pitchHistoryRef.current.push(metrics.avgPitch);
        }
        energyHistoryRef.current.push(metrics.energyLevel);
      },
      (feedback) => {
        // Real-time feedback is handled elsewhere, but we can log
        console.log('Audio feedback:', feedback.message);
      }
    );
    
    try {
      await analyzer.start(stream);
      audioAnalyzerRef.current = analyzer;
    } catch (analyzerError) {
      console.error('[WordByWordReader] Audio analyzer error (non-fatal):', analyzerError);
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // CRITICAL: Enable interim results for real-time
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    startTimeRef.current = Date.now();

    recognition.onresult = (event: any) => {
      const timestamp = Date.now() - startTimeRef.current;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim().toLowerCase();
        const isFinal = result.isFinal;
        
        // CAPTURE SPEECH API CONFIDENCE (0-1 scale, default 1 if not provided)
        const speechConfidence = result[0].confidence ?? 1;
        lastSpeechConfidenceRef.current = speechConfidence;
        
        // REAL-TIME WORD TRACKING - Process interim results immediately
        if (!isFinal) {
          processInterimResult(transcript, timestamp, speechConfidence);
        } else {
          // IMPORTANT: Some browsers only deliver FINAL results (no interim events),
          // and many browsers revise the last 1–2 words at sentence end. Route final
          // transcripts through the same incremental pipeline so the last word(s)
          // still get consumed and registered.
          processInterimResult(transcript, timestamp, speechConfidence, { force: true });

          // SUPERCHARGED V2: Pass all alternatives for better override logic
          const alternatives = Array.from({ length: result.length }, (_, idx) =>
            result[idx]?.transcript?.trim().toLowerCase() || ''
          ).filter(Boolean);
          processFinalResult(transcript, timestamp, speechConfidence, alternatives);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        toast({
          title: 'No speech detected',
          description: 'Please start reading aloud',
          variant: 'destructive',
        });
      }
    };

    // SILENCE DETECTION: Detect when speech starts
    recognition.onspeechstart = () => {
      console.log('🎤 Speech started');
      speechDetectedRef.current = true;
      lastSpeechEventTimeRef.current = Date.now();
      
      // Clear any pending silence flush timer
      if (silenceFlushTimerRef.current) {
        clearTimeout(silenceFlushTimerRef.current);
        silenceFlushTimerRef.current = null;
      }
    };
    
    // SILENCE DETECTION: Detect when speech ends - flush pending words after brief delay
    recognition.onspeechend = () => {
      console.log('🔇 Speech ended - starting silence flush timer');
      lastSpeechEventTimeRef.current = Date.now();
      
      // Clear any existing timer
      if (silenceFlushTimerRef.current) {
        clearTimeout(silenceFlushTimerRef.current);
      }
      
      // Wait 600ms after speech ends, then force-flush any pending transcript
      silenceFlushTimerRef.current = setTimeout(() => {
        const currentTranscript = lastInterimRef.current;
        if (currentTranscript) {
          console.log('🔄 Silence flush: forcing process of transcript:', currentTranscript);
          const flushTimestamp = Date.now() - startTimeRef.current;
          processInterimResult(currentTranscript, flushTimestamp, lastSpeechConfidenceRef.current, { force: true });
        }
        silenceFlushTimerRef.current = null;
      }, 600);
    };

    // FIX 3: Add onend handler to restart recognition if needed
    recognition.onend = () => {
      console.log('Speech recognition ended');
      
      // CRITICAL: Flush any pending transcript before potentially restarting
      if (lastInterimRef.current) {
        console.log('🔄 Recognition end flush:', lastInterimRef.current);
        const flushTimestamp = Date.now() - startTimeRef.current;
        processInterimResult(lastInterimRef.current, flushTimestamp, lastSpeechConfidenceRef.current, { force: true });
      }
      
      // Restart recognition if still recording (continuous mode recovery)
      if (isRecording && realtimeWordIndexRef.current < words.length) {
        try {
          console.log('Restarting speech recognition...');
          recognition.start();
        } catch (e) {
          console.log('Recognition restart skipped:', e);
        }
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    
    // Reset silence detection state
    speechDetectedRef.current = false;
    if (silenceFlushTimerRef.current) {
      clearTimeout(silenceFlushTimerRef.current);
      silenceFlushTimerRef.current = null;
    }
    setIsRecording(true);

    toast({
      title: 'Start Reading!',
      description: 'Read the passage aloud, word by word. I\'ll highlight as you go!',
    });
  }, [words, toast, browserSupport]);

  // Track sound throttling - only play every 3rd word at high speed
  const lastSoundPlayedAtRef = useRef(0);
  const previousCorrectCountRef = useRef(0);
  
  // SILENCE DETECTION: Refs for detecting when user stops speaking
  const speechDetectedRef = useRef(false);
  const silenceFlushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechEventTimeRef = useRef<number>(0);
  
  // Process interim (real-time) results - ULTRA FAST with proper repeated word handling
  // SUPERCHARGED V2: Expanded look-ahead (5 words), pending-incorrect state, phoneme fallback
  // SUPERCHARGED V3: Added transcript cleanup and confidence thresholds
  const processInterimResult = useCallback(
    (
      transcript: string,
      timestamp: number,
      speechConfidence: number = 1,
      options?: { force?: boolean }
    ) => {
      // Some browsers emit identical interim/final transcripts; allow forced re-processing
      // (used for FINAL results and stop-flush) so the last word(s) don't get dropped.
      if (!options?.force && transcript === lastInterimRef.current) return;

      // SUPERCHARGED V3: Clean the transcript BEFORE processing
      const cleanedTranscript = cleanupTranscript(transcript);

      // SUPERCHARGED V2: Store full transcript for final result override
      fullTranscriptRef.current = transcript;
      cleanedTranscriptRef.current = cleanedTranscript;

      // Get previous words BEFORE updating ref (using cleaned transcripts)
      const prevCleanedTranscript = cleanupTranscript(lastInterimRef.current);
      const prevSpokenWords = prevCleanedTranscript.split(/\s+/).filter(w => w.length > 0);
      lastInterimRef.current = transcript;

      // SUPERCHARGED V3: Use cleaned transcript for word extraction
      const spokenWords = cleanedTranscript.split(/\s+/).filter(w => w.length > 0);

      // IMPORTANT:
      // - Web Speech can revise the last 1–2 words without increasing word count
      // - In continuous mode, it can also emit per-segment transcripts (e.g., just "the")
      //   which makes the length shrink compared to the previous transcript.
      // We handle all of these so single remaining words register reliably.
      let newWords: string[] = [];

      if (spokenWords.length > prevSpokenWords.length) {
        // Normal case: new words appended
        newWords = spokenWords.slice(prevSpokenWords.length);
      } else if (spokenWords.length < prevSpokenWords.length) {
        // Segment reset case: treat the whole segment as new input
        newWords = spokenWords;
      } else {
        // Revision case: last word(s) changed but length stayed the same
        const maxBacktrack = 2;
        for (let back = 1; back <= maxBacktrack; back++) {
          const prevIdx = prevSpokenWords.length - back;
          const currIdx = spokenWords.length - back;
          if (prevIdx >= 0 && currIdx >= 0 && prevSpokenWords[prevIdx] !== spokenWords[currIdx]) {
            newWords = spokenWords.slice(currIdx);
            break;
          }
        }
      }

      // Only process if we have something new/changed to consume
      if (newWords.length === 0) return;
    
    // Track speech time for cognitive load
    lastSpeechTimeRef.current = Date.now();
    
    // INSTANT UPDATE: Process new words, matching to FIRST UNPROCESSED position
    requestAnimationFrame(() => {
      setRealtimeWordStatus(prev => {
        const newMap = new Map(prev);
        
        // SUPERCHARGED V2: Helper finds first unprocessed index (ignores pending-incorrect)
        const getFirstUnprocessedIndex = () => {
          for (let i = 0; i < words.length; i++) {
            const status = newMap.get(i);
            // pending-incorrect is still considered "unprocessed" for matching purposes
            if (status !== 'correct' && status !== 'incorrect') {
              return i;
            }
          }
          return words.length; // All processed
        };
        
        // Process each newly spoken word
        for (const spokenWord of newWords) {
          let currentIdx = getFirstUnprocessedIndex();
          if (currentIdx >= words.length) break; // Done with passage
          
          // Track attempts for this word
          const currentAttempts = wordAttemptsRef.current.get(currentIdx) || 0;
          wordAttemptsRef.current.set(currentIdx, currentAttempts + 1);
          
          const expectedWord = words[currentIdx];
          
          // DUAL-MODE MATCHING: Use strict mode for benchmarks, lenient for practice
          let matchResult = wordMatcher(spokenWord, expectedWord);
          
          // SUPERCHARGED V2: If text matching fails, try phoneme matching as fallback
          if (!matchResult && !isStrictMode) {
            const phonemeResult = matchWithPhonemes(spokenWord, expectedWord, 0.70);
            if (phonemeResult.isMatch) {
              matchResult = true;
              console.log('PHONEME MATCH:', spokenWord, '→', expectedWord, 'similarity:', phonemeResult.similarity.toFixed(2));
            }
          }
          
          // Store confidence for this word
          wordConfidencesRef.current.set(currentIdx, speechConfidence);
          
          // FLAG LOW-CONFIDENCE WORDS for teacher verification
          const lenientResult = isWordMatchLenient(spokenWord, expectedWord);
          const strictResult = isWordMatchStrict(spokenWord, expectedWord);
          const modesDisagree = lenientResult !== strictResult;
          
          if (speechConfidence < 0.7 || (isStrictMode && modesDisagree)) {
            flaggedWordsRef.current.push({
              wordIndex: currentIdx,
              expected: expectedWord,
              spoken: spokenWord,
              confidence: speechConfidence,
              aiResult: matchResult,
              timestamp: timestamp,
            });
          }
          
          if (matchResult) {
            // SUPERCHARGED V3: Only mark as instant 'correct' if confidence >= 0.8
            // Otherwise use pending-incorrect to allow for verification
            if (speechConfidence >= 0.8) {
              // High confidence - direct match at current position
              if (pendingIncorrectTimersRef.current.has(currentIdx)) {
                clearTimeout(pendingIncorrectTimersRef.current.get(currentIdx));
                pendingIncorrectTimersRef.current.delete(currentIdx);
              }
              newMap.set(currentIdx, 'correct');
              
              // BATTLE MODE: Fire callback for correct word
              if (onWordResult) {
                const newStreak = correctStreakRef.current + 1;
                onWordResult({
                  correct: true,
                  wordIndex: currentIdx,
                  streak: newStreak,
                  word: expectedWord,
                  wordLength: expectedWord.length,
                });
              }
            } else {
              // Lower confidence match - set as pending-incorrect with shorter timer
              // Will become 'correct' after 1.5 seconds if not contradicted
              newMap.set(currentIdx, 'pending-incorrect');
              
              if (!pendingIncorrectTimersRef.current.has(currentIdx)) {
                const wordIdx = currentIdx;
                const timer = setTimeout(() => {
                  setRealtimeWordStatus(prevStatus => {
                    const updated = new Map(prevStatus);
                    // If still pending-incorrect, upgrade to correct (benefit of doubt)
                    if (updated.get(wordIdx) === 'pending-incorrect') {
                      updated.set(wordIdx, 'correct');
                      realtimeWordStatusRef.current = updated;
                      
                      // BATTLE MODE: Fire callback for correct word (delayed)
                      if (onWordResult) {
                        onWordResult({
                          correct: true,
                          wordIndex: wordIdx,
                          streak: correctStreakRef.current + 1,
                          word: words[wordIdx],
                          wordLength: words[wordIdx].length,
                        });
                      }
                    }
                    return updated;
                  });
                  pendingIncorrectTimersRef.current.delete(wordIdx);
                }, 1500); // 1.5 second grace period for low-confidence matches
                pendingIncorrectTimersRef.current.set(currentIdx, timer);
              }
            }
          } else {
            // SUPERCHARGED V2: Look ahead up to 5 positions (expanded from 2)
            let foundAhead = -1;
            for (let ahead = 1; ahead <= 5; ahead++) {
              const aheadIdx = currentIdx + ahead;
              if (aheadIdx < words.length) {
                // Try text match first
                if (wordMatcher(spokenWord, words[aheadIdx])) {
                  foundAhead = aheadIdx;
                  break;
                }
                // SUPERCHARGED V2: Try phoneme match as fallback
                if (!isStrictMode) {
                  const phonemeResult = matchWithPhonemes(spokenWord, words[aheadIdx], 0.70);
                  if (phonemeResult.isMatch) {
                    foundAhead = aheadIdx;
                    console.log('PHONEME LOOKAHEAD MATCH:', spokenWord, '→', words[aheadIdx]);
                    break;
                  }
                }
              }
            }
            
            if (foundAhead !== -1) {
              // SUPERCHARGED V2: Mark skipped words as pending-incorrect (not definitive)
              for (let i = currentIdx; i < foundAhead; i++) {
                // Only mark as pending-incorrect if not already correct
                if (newMap.get(i) !== 'correct') {
                  newMap.set(i, 'pending-incorrect');
                  
                  // Set up timer to convert to definitive incorrect after 3 seconds
                  if (!pendingIncorrectTimersRef.current.has(i)) {
                    const wordIdx = i;
                    const timer = setTimeout(() => {
                      setRealtimeWordStatus(prevStatus => {
                        const updated = new Map(prevStatus);
                        if (updated.get(wordIdx) === 'pending-incorrect') {
                          updated.set(wordIdx, 'incorrect');
                          realtimeWordStatusRef.current = updated;

                          // Reset streak on definitive incorrect
                          setCorrectStreak(0);
                          correctStreakRef.current = 0;

                          // ACCURACY PARITY (Elara/Cypher fast mode): play correct
                          // pronunciation exactly like single-word characters do, so kids
                          // hear the model word even in 5-word batch flow. De-duped via ref.
                          if (!spokenIncorrectWordsRef.current.has(wordIdx) && !isStrictMode) {
                            spokenIncorrectWordsRef.current.add(wordIdx);
                            try { playCorrectPronunciation(words[wordIdx]); } catch {}
                          }

                          // BATTLE MODE: Fire callback for incorrect word
                          if (onWordResult) {
                            onWordResult({
                              correct: false,
                              wordIndex: wordIdx,
                              streak: 0,
                              word: words[wordIdx],
                              wordLength: words[wordIdx].length,
                            });
                          }
                        }
                        return updated;
                      });
                      pendingIncorrectTimersRef.current.delete(wordIdx);
                    }, 3000); // 3 second grace period
                    pendingIncorrectTimersRef.current.set(i, timer);
                  }
                }
              }
              // Mark the matched word as correct
              newMap.set(foundAhead, 'correct');
            } else {
              // SUPERCHARGED V2: No match - mark as pending-incorrect (not definitive yet)
              newMap.set(currentIdx, 'pending-incorrect');
              
              // Set up timer to convert to definitive incorrect after 3 seconds
              if (!pendingIncorrectTimersRef.current.has(currentIdx)) {
                const wordIdx = currentIdx;
                const timer = setTimeout(() => {
                  setRealtimeWordStatus(prevStatus => {
                    const updated = new Map(prevStatus);
                    if (updated.get(wordIdx) === 'pending-incorrect') {
                      updated.set(wordIdx, 'incorrect');
                      realtimeWordStatusRef.current = updated;

                      // Reset streak on definitive incorrect
                      setCorrectStreak(0);
                      correctStreakRef.current = 0;

                      // ACCURACY PARITY: play correct pronunciation in batch mode
                      if (!spokenIncorrectWordsRef.current.has(wordIdx) && !isStrictMode) {
                        spokenIncorrectWordsRef.current.add(wordIdx);
                        try { playCorrectPronunciation(words[wordIdx]); } catch {}
                      }

                      // BATTLE MODE: Fire callback for incorrect word
                      if (onWordResult) {
                        onWordResult({
                          correct: false,
                          wordIndex: wordIdx,
                          streak: 0,
                          word: words[wordIdx],
                          wordLength: words[wordIdx].length,
                        });
                      }
                    }
                    return updated;
                  });
                  pendingIncorrectTimersRef.current.delete(wordIdx);
                }, 3000); // 3 second grace period
                pendingIncorrectTimersRef.current.set(currentIdx, timer);
              }
            }
          }
        }
        
        // Count correct words and update position
        // SUPERCHARGED V2: Include pending-incorrect in position tracking
        let newCorrectCount = 0;
        let nextIdx = 0;
        for (let i = 0; i < words.length; i++) {
          const status = newMap.get(i);
          if (status === 'correct') newCorrectCount++;
          if (status === 'correct' || status === 'incorrect' || status === 'pending-incorrect') {
            nextIdx = i + 1;
          }
        }
        
        // Clear old 'current' markers and set new one
        for (let i = 0; i < words.length; i++) {
          if (newMap.get(i) === 'current') {
            newMap.set(i, 'pending');
          }
        }
        if (nextIdx < words.length) {
          newMap.set(nextIdx, 'current');
        }
        
        // XP update based on new correct words
        const correctDelta = newCorrectCount - previousCorrectCountRef.current;
        if (correctDelta > 0) {
          previousCorrectCountRef.current = newCorrectCount;
          setTotalXpEarned(p => p + correctDelta);
          
          // Update streak
          setCorrectStreak(prev => {
            const newStreak = prev + correctDelta;
            correctStreakRef.current = newStreak;
            if (newStreak >= 5 && prev < 5) {
              setCelebrationMessage('On Fire! 🔥');
              setCelebrationTrigger(Date.now());
              soundEffectsRef.current.streakAchieved();
            } else if (newStreak >= 10 && prev < 10) {
              setCelebrationMessage('Unstoppable! ⚡');
              setCelebrationTrigger(Date.now());
              soundEffectsRef.current.celebrationSound();
            }
            return newStreak;
          });
        }
        
        // Update position
        realtimeWordIndexRef.current = nextIdx;
        setRealtimeWordIndex(nextIdx);
        setCurrentWordIndex(nextIdx);
        
        realtimeWordStatusRef.current = newMap;
        return newMap;
      });
    });
    
    // CONTINUOUS FLOW: Only play sounds for correct words, never interrupt for incorrect
    // This keeps the reading experience smooth - incorrect words are tracked silently
    const processedCount = spokenWords.length;
    const wordsSinceLastSound = processedCount - lastSoundPlayedAtRef.current;
    
    if (wordsSinceLastSound >= 3 || processedCount <= 3) {
      // Get latest result from ref after update
      const latestNewWord = newWords[newWords.length - 1];
      const currentPos = realtimeWordIndexRef.current > 0 ? realtimeWordIndexRef.current - 1 : 0;
      const expectedWord = words[currentPos];
      
      if (expectedWord && latestNewWord) {
        const isCorrect = wordMatcher(latestNewWord, expectedWord);
        if (isCorrect) {
          soundEffectsRef.current.correctWord();
          auraCharacter.reactToCorrect();
        }
        // NO SOUND/INTERRUPT FOR INCORRECT - just track silently and keep reading flowing
        // The word status is updated in the map above, grading happens at session end
        lastSoundPlayedAtRef.current = processedCount;
      }
    }
  }, [words, auraCharacter, wordMatcher, isStrictMode]);

  // Process final results - confirm word readings AND play robot voice for errors
  // SUPERCHARGED V2: Full transcript re-scan, pending-incorrect recovery, all alternatives checked
  const processFinalResult = useCallback((transcript: string, timestamp: number, speechConfidence: number = 1, alternatives?: string[]) => {
    const spokenWords = transcript.split(/\s+/).filter(w => w.length > 0);
    
    // SUPERCHARGED V2: Store full transcript for override logic
    fullTranscriptRef.current = transcript;
    
    // Create confirmed word readings
    const newReadings: WordReading[] = [];
    
    // SUPERCHARGED V2: Full re-scan of ALL incorrect/pending-incorrect words against entire transcript
    setRealtimeWordStatus(prev => {
      const newMap = new Map(prev);
      let overrideCount = 0;
      
      // Check every incorrect or pending-incorrect word
      for (let i = 0; i < words.length; i++) {
        const status = newMap.get(i);
        if (status === 'incorrect' || status === 'pending-incorrect') {
          const expectedWord = words[i];
          
          // SUPERCHARGED V2: Search ENTIRE transcript for this word
          const foundInTranscript = findWordInFullTranscript(expectedWord, transcript, !isStrictMode);
          
          // SUPERCHARGED V2: Also check all alternatives if provided
          let foundInAlternatives = false;
          if (!foundInTranscript && alternatives && alternatives.length > 1) {
            for (let alt = 1; alt < alternatives.length; alt++) {
              if (findWordInFullTranscript(expectedWord, alternatives[alt], !isStrictMode)) {
                foundInAlternatives = true;
                break;
              }
            }
          }
          
          // SUPERCHARGED V2: Try phoneme matching as last resort
          let phonemeMatch = false;
          if (!foundInTranscript && !foundInAlternatives && !isStrictMode) {
            for (const spokenWord of spokenWords) {
              const result = matchWithPhonemes(spokenWord, expectedWord, 0.70);
              if (result.isMatch) {
                phonemeMatch = true;
                console.log('FINAL PHONEME OVERRIDE:', spokenWord, '→', expectedWord, 'similarity:', result.similarity.toFixed(2));
                break;
              }
            }
          }
          
          if (foundInTranscript || foundInAlternatives || phonemeMatch) {
            // Override to correct!
            newMap.set(i, 'correct');
            overrideCount++;
            
            // Clear any pending timer
            if (pendingIncorrectTimersRef.current.has(i)) {
              clearTimeout(pendingIncorrectTimersRef.current.get(i));
              pendingIncorrectTimersRef.current.delete(i);
            }
            
            console.log('SUPERCHARGED OVERRIDE:', words[i], 
              foundInTranscript ? '(in transcript)' : 
              foundInAlternatives ? '(in alternatives)' : '(phoneme match)');
          }
        }
      }
      
      if (overrideCount > 0) {
        console.log(`SUPERCHARGED V2: Recovered ${overrideCount} false negatives from final result`);
      }
      
      realtimeWordStatusRef.current = newMap;
      return newMap;
    });
    
    // Create word readings for new words
    spokenWords.forEach((spokenWord, idx) => {
      const wordIndex = idx;
      if (wordIndex < words.length) {
        const expectedWord = words[wordIndex];
        const isCorrect = wordMatcher(spokenWord, expectedWord);
        
        // Store confidence for this word
        wordConfidencesRef.current.set(wordIndex, speechConfidence);
        
        if (!processedWordsRef.current.has(wordIndex)) {
          newReadings.push({
            word: spokenWord,
            index: wordIndex,
            startMs: timestamp - 500,
            endMs: timestamp,
            correct: isCorrect,
            hesitation: false,
            speechConfidence: speechConfidence,
            attempts: wordAttemptsRef.current.get(wordIndex) || 1,
          });
          
          processedWordsRef.current.add(wordIndex);
        }
      }
    });
    
    if (newReadings.length > 0) {
      setWordReadings(prev => {
        const existingIndices = new Set(prev.map(r => r.index));
        const uniqueNew = newReadings.filter(r => !existingIndices.has(r.index));
        return [...prev, ...uniqueNew];
      });
    }
  }, [words, wordMatcher, isStrictMode]);

  const stopReading = useCallback(async () => {
    // Clear any pending silence flush timer
    if (silenceFlushTimerRef.current) {
      clearTimeout(silenceFlushTimerRef.current);
      silenceFlushTimerRef.current = null;
    }
    
    if (recognitionRef.current) {
      // Flush any last transcript changes before stopping (common source of "missing last word")
      const flushTimestamp = Date.now() - startTimeRef.current;
      processInterimResult(lastInterimRef.current, flushTimestamp, lastSpeechConfidenceRef.current, { force: true });

      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Stop audio analyzer and collect pitch/energy data
    if (audioAnalyzerRef.current) {
      audioAnalyzerRef.current.stop();
      audioAnalyzerRef.current = null;
    }
    
    // Get collected pitch and energy data for expression scoring
    const pitchData = pitchHistoryRef.current;
    const energyData = energyHistoryRef.current;
    console.log('AUDIO ANALYSIS DATA:', { 
      pitchSamples: pitchData.length, 
      energySamples: energyData.length 
    });

    setIsRecording(false);
    setIsProcessing(true);

    const totalDuration = (Date.now() - startTimeRef.current) / 1000;
    
    // CRITICAL FIX: Calculate stats from REFS (not state) to avoid stale closure
    const statusMap = realtimeWordStatusRef.current;
    const correctCount = Array.from(statusMap.values()).filter(s => s === 'correct').length;
    const incorrectCount = Array.from(statusMap.values()).filter(s => s === 'incorrect').length;
    const wordsRead = correctCount + incorrectCount;
    const wpm = totalDuration > 0 ? Math.round((wordsRead / totalDuration) * 60) : 0;
    const accuracy = wordsRead > 0 ? Math.round((correctCount / wordsRead) * 100) : 0;
    
    // ========== POLISHED AURA: WCPM & Miscue Analysis ==========
    const miscueAnalysis = analyzeMiscues(wordReadings, words, totalDuration);
    const wcpm = miscueAnalysis.wcpm;
    const miscueInterventions = getMiscueInterventions(miscueAnalysis);
    
    console.log('WCPM & MISCUE ANALYSIS:', { 
      wpm, 
      wcpm, 
      miscuesByType: miscueAnalysis.miscuesByType,
      fluencyLevel: miscueAnalysis.fluencyLevel,
      selfCorrectionRate: miscueAnalysis.selfCorrectionRate
    });
    
    // ========== POLISHED AURA: Real Prosody Scoring ==========
    const wordTimings = wordReadings.map(wr => ({
      word: wr.word,
      startMs: wr.startMs,
      endMs: wr.endMs,
      index: wr.index,
    }));
    
    const hesitationCountForProsody = wordReadings.filter(wr => wr.hesitation).length;
    const prosodyMetrics = calculateProsodyScore(
      wordTimings,
      words,
      wpm,
      miscueAnalysis.totalMiscues,
      hesitationCountForProsody,
      pitchData, // REAL pitch data from audio analyzer
      energyData, // REAL energy data from audio analyzer
      undefined // gradeLevel - could be fetched from user profile
    );
    
    console.log('PROSODY ANALYSIS:', { 
      phrasing: prosodyMetrics.phrasing,
      expression: prosodyMetrics.expression,
      smoothness: prosodyMetrics.smoothness,
      pace: prosodyMetrics.pace,
      level: prosodyMetrics.level,
      overallScore: prosodyMetrics.overallScore
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save your reading',
        variant: 'destructive',
      });
      setIsProcessing(false);
      return;
    }

    // ========== REAL PHONEME ANALYSIS: Detect actual spoken phonemes from audio ==========
    let phonemeScores: Record<string, number> = {};
    let phonemeInferenceData: any = null;
    let realPhonemeResult: RealPhonemeAnalysisResult | null = null;
    
    // Build audio blob for analysis
    const audioChunkCount = audioChunksRef.current.length;
    console.log('[REAL PHONEME] 🎤 Audio chunks for analysis:', audioChunkCount);
    
    if (audioChunkCount > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      if (audioBlob.size > 1000 && phonemeModelState.initialized) {
        try {
          console.log('[REAL PHONEME] 🔬 Analyzing audio with Whisper model...');
          realPhonemeResult = await analyzeRealPhonemes(audioBlob, words, wordReadings);
          realPhonemeAnalysisRef.current = realPhonemeResult;
          
          if (realPhonemeResult.analysisSuccessful) {
            // Use REAL phoneme scores from audio detection
            phonemeScores = realPhonemeResult.phonemeScores;
            
            console.log('[REAL PHONEME] ✅ REAL phoneme analysis complete:', {
              detectedWords: realPhonemeResult.detectedWords.length,
              substitutions: realPhonemeResult.substitutions.length,
              topSubstitutions: realPhonemeResult.topSubstitutions,
              problematicPhonemes: realPhonemeResult.problematicPhonemes,
              overallAccuracy: realPhonemeResult.overallAccuracy,
            });
            
            // Build inference data from real analysis
            phonemeInferenceData = {
              substitutions: realPhonemeResult.substitutions.map(s => ({
                expected: s.expected,
                spoken: s.detected,
                word: s.word,
                position: 'unknown',
              })),
              problematicPhonemes: realPhonemeResult.problematicPhonemes,
              phonemeAccuracyBySound: realPhonemeResult.phonemeScores,
              overallPhonemeAccuracy: realPhonemeResult.overallAccuracy,
              interventionPriority: realPhonemeResult.problematicPhonemes.slice(0, 5),
            };
            
            // Show improvement messages for problematic phonemes
            if (realPhonemeResult.problematicPhonemes.length > 0) {
              const topPhoneme = realPhonemeResult.problematicPhonemes[0];
              const displayName = getPhonemeDisplayName(topPhoneme);
              setPhonemeMessages([`Keep practicing the ${displayName}! You're getting better! 💪`]);
            }
          } else {
            console.warn('[REAL PHONEME] ⚠️ Analysis fell back to simulated:', realPhonemeResult.errorMessage);
            // Still use the fallback scores
            phonemeScores = realPhonemeResult.phonemeScores;
          }
        } catch (err) {
          console.error('[REAL PHONEME] ❌ Analysis failed:', err);
        }
      } else if (!phonemeModelState.initialized) {
        console.warn('[REAL PHONEME] ⚠️ Model not ready, using text-based fallback');
      }
    }
    
    // Fallback: Calculate phoneme accuracy from word readings if real analysis failed
    if (Object.keys(phonemeScores).length === 0) {
      console.log('[REAL PHONEME] 📝 Using text-based phoneme calculation (fallback)');
      const phonemeAccuracy: Record<string, { correct: number; total: number }> = {};
      wordReadings.forEach((wr) => {
        const expectedWord = words[wr.index] || wr.word;
        const phonemes = getIPAPronunciation(expectedWord)[0] || [];
        phonemes.forEach((p: string) => {
          if (!phonemeAccuracy[p]) phonemeAccuracy[p] = { correct: 0, total: 0 };
          phonemeAccuracy[p].total += 1;
          if (wr.correct) phonemeAccuracy[p].correct += 1;
        });
      });
      
      Object.entries(phonemeAccuracy).forEach(([phoneme, stats]) => {
        phonemeScores[phoneme] = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      });
      
      // Text-based inference for incorrect words (original approach)
      const incorrectReadings = wordReadings.filter(wr => !wr.correct);
      if (incorrectReadings.length > 0 && !phonemeInferenceData) {
        try {
          const comparisons = incorrectReadings.map(wr => {
            const expectedWord = words[wr.index] || '';
            return compareWordPhonemes(wr.word, expectedWord, wr.index);
          });
          phonemeInferenceData = analyzePhonemePatterns(comparisons);
          
          if (phonemeInferenceData.problematicPhonemes.length > 0) {
            const topPhoneme = phonemeInferenceData.interventionPriority[0];
            if (topPhoneme) {
              const displayName = getPhonemeDisplayName(topPhoneme);
              setPhonemeMessages([`Keep practicing the ${displayName}! You're getting better! 💪`]);
            }
          }
        } catch (err) {
          console.error('Phoneme inference error:', err);
        }
      }
    }
    
    console.log('🎯 FINAL PHONEME SCORES:', {
      source: realPhonemeResult?.analysisSuccessful ? 'REAL AUDIO' : 'TEXT FALLBACK',
      phonemeCount: Object.keys(phonemeScores).length,
      problematicCount: phonemeInferenceData?.problematicPhonemes?.length || 0,
    });

    // Upload audio to storage for teacher playback
    let audioUrl: string | null = null;
    // Reuse audioChunkCount from phoneme analysis above
    
    if (audioChunksRef.current.length > 0) {
      try {
        const uploadAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('🎤 AUDIO DEBUG: Blob size:', uploadAudioBlob.size, 'bytes');
        
        if (uploadAudioBlob.size < 1000) {
          console.warn('⚠️ AUDIO WARNING: Blob too small, likely empty recording');
        }
        
        const timestamp = Date.now();
        const audioPath = `${user.id}/${timestamp}.webm`;
        
        console.log('🎤 AUDIO DEBUG: Uploading to path:', audioPath);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('aura-audio')
          .upload(audioPath, uploadAudioBlob, {
            contentType: 'audio/webm',
            upsert: false,
          });
        
        if (!uploadError && uploadData) {
          audioUrl = audioPath; // Store path, not signed URL (signed URL generated on demand)
          console.log('✅ AUDIO SUCCESS: Uploaded to', audioPath);
        } else {
          console.error('❌ AUDIO UPLOAD ERROR:', uploadError?.message, uploadError);
          // Try to get more error details
          toast({
            title: 'Audio save issue',
            description: 'Recording saved but audio playback may be unavailable',
            variant: 'default',
          });
        }
      } catch (err) {
        console.error('❌ AUDIO UPLOAD EXCEPTION:', err);
      }
    } else {
      console.warn('⚠️ AUDIO WARNING: No audio chunks collected');
    }

    // Save reading session WITH WCPM, miscue, prosody data, AND audio URL
    const { data: session, error: sessionError } = await supabase
      .from('reading_sessions')
      .insert({
        student_id: user.id,
        assignment_id: assignmentId || null,
        passage_text: passageText,
        words_read: wordsRead,
        duration_seconds: totalDuration,
        wpm,
        wcpm, // NEW: Words Correct Per Minute
        accuracy_percent: accuracy,
        fluency_score: prosodyMetrics.overallScore, // Now using real prosody score
        fluency_level: miscueAnalysis.fluencyLevel, // NEW: frustration/instructional/independent
        miscue_analysis: miscueAnalysis as any, // NEW: Full miscue breakdown
        prosody_metrics: prosodyMetrics as any, // NEW: Phrasing/expression/smoothness/pace
        cognitive_load_avg: cognitiveLoad, // ML OUTPUT: Cognitive load during session
        phoneme_accuracy: {
          ...phonemeScores,
          // Include enhanced phoneme inference data
          _inference: phonemeInferenceData ? {
            substitutions: phonemeInferenceData.substitutions.slice(0, 20), // Cap at 20 for storage
            problematicPhonemes: phonemeInferenceData.problematicPhonemes,
            interventionPriority: phonemeInferenceData.interventionPriority,
            overallAccuracy: phonemeInferenceData.overallPhonemeAccuracy,
          } : null,
        }, // ML OUTPUT: Per-phoneme accuracy scores + inference
        audio_url: audioUrl, // NEW: Path to audio recording for teacher playback
        reading_mode: battleMode ? 'rpg_battle' : screeningPeriodId ? 'screening' : assignmentId ? 'assignment' : 'word_by_word',
        grade_mode: gradeMode || 'k5',
      } as any)
      .select()
      .single();

    if (sessionError) {
      console.error('Session save error:', sessionError);
      toast({
        title: 'Error',
        description: 'Failed to save reading session',
        variant: 'destructive',
      });
      setIsProcessing(false);
      return;
    }

    // Save word readings WITH detected phonemes (using CMU dict for sync phoneme lookup)
    if (wordReadings.length > 0) {
      const wordInserts = wordReadings.map((wr) => {
        const expectedWord = words[wr.index] || wr.word;
        const expectedPhonemes = getIPAPronunciation(expectedWord)[0] || [];
        // Use CMU dictionary lookup for spoken word phonemes (sync, no ML needed)
        const detectedPhonemes = getIPAPronunciation(wr.word)[0] || [];
        
        return {
          session_id: session.id,
          word_text: wr.word,
          word_index: wr.index,
          start_time_ms: wr.startMs,
          end_time_ms: wr.endMs,
          phonemes_detected: detectedPhonemes, // CMU dict phonemes for spoken word
          phonemes_expected: expectedPhonemes,
          was_correct: wr.correct,
          hesitation_detected: wr.hesitation,
        };
      });

      await supabase.from('word_readings').insert(wordInserts);
      audioChunksRef.current = [];
    }

    // ========== ML INTEGRATION: SAVE TO AURA_RECORDS FOR ML TRAINING ==========
    // This feeds the train-ml-models edge function with reading session data
    try {
      await saveToAuraRecords({
        studentId: user.id,
        sessionId: session.id,
        wpm,
        wcpm,
        accuracy,
        wordsRead,
        durationSeconds: totalDuration,
        pauseCount: speechPausesRef.current.length,
        phonemeScores,
        miscueAnalysis: {
          fluencyLevel: miscueAnalysis.fluencyLevel,
          totalMiscues: miscueAnalysis.totalMiscues,
        },
        prosodyMetrics: {
          overallScore: prosodyMetrics.overallScore,
        },
        assignmentId,
        transcript: fullTranscriptRef.current,
        audioUrl,
      });
      console.log('[ML Integration] ✅ Reading session saved to aura_records for ML training');
    } catch (mlErr) {
      console.error('[ML Integration] Failed to save to aura_records:', mlErr);
    }

    // ========== ML INTEGRATION: TRIGGER Q-LEARNING UPDATE ==========
    // Update Q-table based on phoneme performance in this session
    try {
      // Build phoneme performance from word readings
      const phonemePerformance = wordReadings.flatMap((wr) => {
        const expectedWord = words[wr.index] || wr.word;
        const expectedPhonemes = getIPAPronunciation(expectedWord)[0] || [];
        return expectedPhonemes.map(phoneme => ({
          phoneme,
          correct: wr.correct,
          word: expectedWord,
        }));
      });

      // Determine mastered and struggling phonemes from this session
      const masteredPhonemes = Object.entries(phonemeScores)
        .filter(([_, score]) => score >= 80)
        .map(([phoneme]) => phoneme);
      const strugglingPhonemes = Object.entries(phonemeScores)
        .filter(([_, score]) => score < 60)
        .map(([phoneme]) => phoneme);

      await triggerQLearningUpdate(
        user.id,
        phonemePerformance,
        masteredPhonemes,
        strugglingPhonemes,
        1 // Default difficulty level
      );
      console.log('[ML Integration] ✅ Q-learning updated with phoneme performance');
    } catch (qlErr) {
      console.error('[ML Integration] Failed to update Q-learning:', qlErr);
    }

    // Update student stats with XP
    await updateStudentStats(user.id, wordsRead, accuracy, totalXpEarned);
    await generateDailyMissions(user.id);
    await updateMissionProgress(user.id, {
      wordsRead,
      durationSeconds: totalDuration,
    });

    // Check achievements
    const achievements = await checkAndAwardAchievements(user.id, {
      wpm,
      accuracy,
      wordsRead,
      isFirstSession: false,
    });

    if (achievements.length > 0) {
      setNewAchievements(achievements);
      setShowAchievementModal(true);
    }

    analyzeMispronunciationPatterns(user.id, session.id).catch(console.error);

    // ADAPTIVE DIFFICULTY: Calculate recommended next difficulty level
    let difficultyResult: any = null;
    try {
      difficultyResult = await adaptiveDifficultyEngine.calculateAdaptiveDifficulty({
        studentId: user.id,
        currentLevel: 1,
        recentGrades: [accuracy],
        completionRate: wordsRead / words.length,
        consistency: accuracy >= 70 ? 0.8 : 0.5,
        weeklyImprovement: 0,
        masteredPhonemes: [],
        strugglingPhonemes: [],
        recentPracticeMinutes: Math.round(totalDuration / 60),
        speakingFeatures: {
          fluency: accuracy,
          prosody: 70,
          confidence: accuracy,
          wpm,
          pauseCount: speechPausesRef.current.length,
          phonemeAccuracy: accuracy,
        }
      });
      setAdaptiveDifficulty(difficultyResult);
      console.log('ADAPTIVE DIFFICULTY:', difficultyResult);
    } catch (err) {
      console.error('Adaptive difficulty error:', err);
    }

    // PHASE 1 FIX: Update student_skill_vectors with ML data from reading session
    try {
      // Fetch existing skill vector
      const { data: existingVector } = await supabase
        .from('student_skill_vectors')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle();

      // Merge phoneme scores with existing
      const existingPhonemeScores = (existingVector?.phoneme_scores as Record<string, number>) || {};
      const mergedPhonemeScores = { ...existingPhonemeScores };
      Object.entries(phonemeScores).forEach(([phoneme, score]) => {
        if (existingPhonemeScores[phoneme] !== undefined) {
          // Weighted average (70% existing, 30% new)
          mergedPhonemeScores[phoneme] = Math.round(existingPhonemeScores[phoneme] * 0.7 + score * 0.3);
        } else {
          mergedPhonemeScores[phoneme] = score;
        }
      });

      // Calculate reading metrics with proper typing
      const existingReadingMetrics = existingVector?.reading_metrics as { 
        avg_wpm?: number; 
        avg_accuracy?: number; 
        sessions_count?: number;
        last_session_at?: string;
      } | null;
      
      const readingMetrics = {
        avg_wpm: existingReadingMetrics?.avg_wpm 
          ? Math.round((existingReadingMetrics.avg_wpm * 0.7) + (wpm * 0.3))
          : wpm,
        avg_accuracy: existingReadingMetrics?.avg_accuracy 
          ? Math.round((existingReadingMetrics.avg_accuracy * 0.7) + (accuracy * 0.3))
          : accuracy,
        sessions_count: (existingReadingMetrics?.sessions_count || 0) + 1,
        last_session_at: new Date().toISOString(),
      };

      // Calculate performance trend
      const previousTrend = existingVector?.performance_trend || 0;
      const performanceTrend = existingReadingMetrics?.avg_accuracy 
        ? Math.round((accuracy - existingReadingMetrics.avg_accuracy) * 10) / 10
        : 0;

      // Upsert skill vector
      await supabase
        .from('student_skill_vectors')
        .upsert({
          student_id: user.id,
          phoneme_scores: mergedPhonemeScores,
          reading_metrics: readingMetrics,
          current_difficulty_level: difficultyResult?.recommendedLevel || existingVector?.current_difficulty_level || 1,
          performance_trend: (previousTrend * 0.7) + (performanceTrend * 0.3),
          weekly_improvement: performanceTrend > 0 ? performanceTrend * 10 : 0,
          cross_modal_risk_score: accuracy < 70 ? Math.min(100, 100 - accuracy) : (existingVector?.cross_modal_risk_score || 0) * 0.9,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'student_id',
        });

      console.log('✅ SKILL VECTOR UPDATED:', {
        studentId: user.id,
        phonemeScores: Object.keys(mergedPhonemeScores).length,
        wpm,
        accuracy,
        difficultyLevel: difficultyResult?.recommendedLevel || 1,
      });
    } catch (err) {
      console.error('Skill vector update error:', err);
    }

    // ========== CALCULATE AI CONFIDENCE SCORE FOR TEACHER VERIFICATION ==========
    const wordConfidenceArray: Array<{ confidence: 'high' | 'medium' | 'low'; speechConfidence: number }> = 
      Array.from(wordConfidencesRef.current.entries()).map(([idx, conf]) => ({
        confidence: (conf < 0.7 ? 'low' : conf < 0.9 ? 'medium' : 'high') as 'high' | 'medium' | 'low',
        speechConfidence: conf,
      }));
    const sessionConfidence = calculateSessionConfidence(wordConfidenceArray);
    const flaggedWords = flaggedWordsRef.current;
    
    console.log('AI CONFIDENCE METRICS:', {
      sessionScore: sessionConfidence.score,
      sessionLevel: sessionConfidence.level,
      flaggedWordCount: flaggedWords.length,
      isStrictMode,
    });

    // ========== CREATE BENCHMARK RESULT IF IN SCREENING MODE ==========
    if (screeningPeriodId && screeningClassroomId) {
      try {
        const gradeLevel = screeningGradeLevel || 2;
        
        // Calculate benchmark status based on WCPM and grade level
        let benchmarkStatus: 'above' | 'at' | 'below' | 'well_below' = 'well_below';
        // Hasbrouck & Tindal approximate benchmarks (50th percentile)
        const benchmarks: Record<number, number> = {
          0: 23, 1: 53, 2: 72, 3: 92, 4: 112, 5: 127
        };
        const targetWCPM = benchmarks[gradeLevel] || 72;
        
        if (wcpm >= targetWCPM * 1.1) benchmarkStatus = 'above';
        else if (wcpm >= targetWCPM * 0.9) benchmarkStatus = 'at';
        else if (wcpm >= targetWCPM * 0.7) benchmarkStatus = 'below';
        else benchmarkStatus = 'well_below';
        
        // Prepare notes with confidence data AND flagged words JSON for teacher verification
        const flaggedWordsJson = flaggedWords.map(fw => ({
          index: fw.wordIndex,
          expected: fw.expected,
          spoken: fw.spoken,
          aiResult: fw.aiResult,
          confidence: fw.confidence < 0.5 ? 'low' : fw.confidence < 0.8 ? 'medium' : 'high',
          matchScore: Math.round(fw.confidence * 100),
          speechConfidence: fw.confidence,
          timestampMs: fw.timestamp || 0,
        }));
        
        const confidenceNote = JSON.stringify({
          aiConfidence: sessionConfidence.score,
          level: sessionConfidence.level,
          flaggedCount: flaggedWords.length,
          flaggedWords: flaggedWordsJson,
        });
        
        const { error: benchmarkError } = await supabase
          .from('student_benchmark_results')
          .insert({
            student_id: user.id,
            classroom_id: screeningClassroomId,
            period_id: screeningPeriodId,
            wcpm,
            accuracy_percentage: accuracy,
            // Convert percentage to NAEP 1-4 scale for database constraint compliance
            prosody_score: prosodyMetrics.overallScore >= 80 ? 4 :
                           prosodyMetrics.overallScore >= 65 ? 3 :
                           prosodyMetrics.overallScore >= 50 ? 2 : 1,
            fluency_level: miscueAnalysis.fluencyLevel,
            benchmark_status: benchmarkStatus,
            grade_level: gradeLevel,
            passage_title: screeningPassageTitle || 'Screening Passage',
            passage_difficulty: String(gradeLevel),
            miscue_count: miscueAnalysis.totalMiscues,
            self_corrections: miscueAnalysis.miscuesByType.self_correction,
            words_read: wordsRead,
            duration_seconds: totalDuration,
            audio_url: audioUrl, // Link audio for teacher playback
            notes: confidenceNote, // Store full confidence data + flagged words as JSON
          });
        
        if (benchmarkError) {
          console.error('❌ Benchmark result save error:', benchmarkError);
        } else {
          console.log('✅ BENCHMARK RESULT CREATED:', {
            wcpm,
            accuracy,
            benchmarkStatus,
            gradeLevel,
            periodId: screeningPeriodId,
            aiConfidence: sessionConfidence.score,
            flaggedWords: flaggedWords.length,
          });
        }
      } catch (err) {
        console.error('Benchmark creation error:', err);
      }
    }

    setIsProcessing(false);

    onComplete({
      sessionId: session.id,
      wpm,
      wcpm, // NEW: Words Correct Per Minute
      accuracy,
      wordsRead,
      durationSeconds: totalDuration,
      xpEarned: totalXpEarned,
      miscueAnalysis, // NEW: Full miscue breakdown
      prosodyMetrics, // NEW: Prosody scores
      fluencyLevel: miscueAnalysis.fluencyLevel, // NEW: Reading level
      // NEW: AI Confidence tracking for teacher verification
      aiConfidenceScore: sessionConfidence.score,
      flaggedWords: flaggedWords.map(fw => ({
        wordIndex: fw.wordIndex,
        expected: fw.expected,
        spoken: fw.spoken,
        confidence: fw.confidence,
        aiResult: fw.aiResult,
      })),
      // ENHANCED PHONEME INFERENCE: Specific substitution patterns
      phonemeInference: phonemeInferenceData ? {
        substitutions: phonemeInferenceData.substitutions.map((s: any) => ({
          expected: s.expected,
          spoken: s.spoken,
          word: s.word,
          position: s.position,
        })),
        problematicPhonemes: phonemeInferenceData.problematicPhonemes,
        phonemeAccuracyBySound: phonemeInferenceData.phonemeAccuracyBySound,
        overallPhonemeAccuracy: phonemeInferenceData.overallPhonemeAccuracy,
        interventionPriority: phonemeInferenceData.interventionPriority,
      } : undefined,
      // NEW: Word results with attempts for grading
      wordResults: wordReadings.map(wr => ({
        word: wr.word,
        correct: wr.correct,
        attempts: wr.attempts || wordAttemptsRef.current.get(wr.index) || 1,
        index: wr.index,
      })),
    });

    // Enhanced feedback with WCPM and prosody
    const fluencyEmoji = prosodyMetrics.level === 'advanced' ? '🌟' : 
                         prosodyMetrics.level === 'proficient' ? '🎉' :
                         prosodyMetrics.level === 'developing' ? '📚' : '💪';
                         prosodyMetrics.level === 'proficient' ? '🎉' :
                         prosodyMetrics.level === 'developing' ? '📚' : '💪';
    
    toast({
      title: `${fluencyEmoji} ${prosodyMetrics.level.charAt(0).toUpperCase() + prosodyMetrics.level.slice(1)} Reader!`,
      description: `${wcpm} WCPM | ${prosodyMetrics.overallScore}% fluency | +${totalXpEarned} XP`,
    });
  }, [wordReadings, passageText, assignmentId, onComplete, toast, words, realtimeWordStatus, totalXpEarned]);

  // Click handler to hear word pronunciation
  const handleWordClick = (word: string) => {
    // Clean the word (remove punctuation for pronunciation)
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    if (cleanWord) {
      toast({
        title: `🔊 ${cleanWord}`,
        description: 'Tap any word to hear it!',
        duration: 1500,
      });
      playCorrectPronunciation(cleanWord);
    }
  };

  const renderPassage = () => {
    return words.map((word, idx) => {
      const status = realtimeWordStatus.get(idx) || 'pending';
      let className = 'px-2 py-1 rounded-lg transition-all duration-200 inline-block text-lg mr-1 mb-1 cursor-pointer select-none ';
      
      if (status === 'correct') {
        className += 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-500/50 scale-105 hover:scale-110';
      } else if (status === 'incorrect') {
        className += 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg shadow-red-500/50 scale-105 hover:scale-110';
      } else if (status === 'pending-incorrect') {
        className += 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/50 scale-105 hover:scale-110';
      } else if (status === 'current' || idx === realtimeWordIndex) {
        className += 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 text-white font-bold ring-4 ring-primary ring-offset-2 animate-pulse scale-110 shadow-2xl shadow-yellow-500/50 hover:scale-115';
      } else {
        className += 'text-muted-foreground hover:text-foreground hover:bg-primary/10 bg-muted/30';
      }

      return (
        <span 
          key={idx} 
          className={className}
          onClick={() => handleWordClick(word)}
          title="Click to hear pronunciation"
        >
          {word}
        </span>
      );
    });
  };

  const progress = words.length > 0 ? (realtimeWordIndex / words.length) * 100 : 0;
  
  const calculateFluencyScore = (readings: WordReading[]): number => {
    if (readings.length === 0) return 0;
    const correctCount = readings.filter(r => r.correct).length;
    const hesitationPenalty = readings.filter(r => r.hesitation).length * 5;
    return Math.max(0, Math.round((correctCount / readings.length) * 100 - hesitationPenalty));
  };

  const updateStudentStats = async (studentId: string, wordsRead: number, accuracy: number, xpEarned: number) => {
    try {
      const { data: existingStats } = await supabase
        .from('student_reading_stats')
        .select('*')
        .eq('student_id', studentId)
        .eq('grade_mode', gradeMode || 'k5')
        .maybeSingle();

      const today = new Date().toISOString().split('T')[0];
      const lastActivityDate = existingStats?.last_activity_date;
      
      // Calculate streak
      let newStreak = 1;
      let longestStreak = existingStats?.longest_streak_days || 1;
      
      if (lastActivityDate) {
        const lastDate = new Date(lastActivityDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          // Same day - keep current streak
          newStreak = existingStats?.current_streak_days || 1;
        } else if (diffDays === 1) {
          // Consecutive day - increment streak
          newStreak = (existingStats?.current_streak_days || 0) + 1;
        } else {
          // Streak broken - reset to 1
          newStreak = 1;
        }
      }
      
      // Update longest streak if needed
      if (newStreak > longestStreak) {
        longestStreak = newStreak;
      }

      if (existingStats) {
        await supabase
          .from('student_reading_stats')
          .update({
            total_words_read: (existingStats.total_words_read || 0) + wordsRead,
            total_sessions: (existingStats.total_sessions || 0) + 1,
            current_streak_days: newStreak,
            longest_streak_days: longestStreak,
            last_activity_date: today,
            xp_points: (existingStats.xp_points || 0) + xpEarned,
            updated_at: new Date().toISOString(),
          })
          .eq('student_id', studentId)
          .eq('grade_mode', gradeMode || 'k5');
      } else {
        await supabase
          .from('student_reading_stats')
          .insert({
            student_id: studentId,
            total_words_read: wordsRead,
            total_sessions: 1,
            current_streak_days: 1,
            longest_streak_days: 1,
            last_activity_date: today,
            xp_points: xpEarned,
            grade_mode: gradeMode || 'k5',
          });
      }
      
      console.log('✅ STREAK UPDATED:', { studentId, newStreak, longestStreak, xpEarned });
    } catch (error) {
      console.error('Error updating student stats:', error);
    }
  };

  if (!browserSupport.isSupported) {
    return (
      <Card className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your browser doesn't support speech recognition. Please use Chrome or Edge.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Celebration Effects */}
      <CelebrationEffect trigger={celebrationTrigger} message={celebrationMessage} />
      <XPPopup trigger={xpPopupTrigger} xp={xpAmount} />
      
      {/* Achievement Modal */}
      <AchievementUnlockedModal
        achievements={newAchievements}
        isOpen={showAchievementModal}
        onClose={() => setShowAchievementModal(false)}
      />

      {/* AURA Coach */}
      <div className="flex justify-center">
        <AuraCharacter
          state={isRecording ? "excited" : "idle"}
          message={
            isRecording
              ? correctStreak >= 5
                ? `${correctStreak} in a row! Keep it up!`
                : "Great! Keep reading..."
              : "Click Start to begin reading!"
          }
        />
      </div>

      {/* Stats Bar with ML Status */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-4 text-sm">
          <Badge variant="outline" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            +{totalXpEarned} XP
          </Badge>
          <span className="text-muted-foreground">
            🔥 Streak: {correctStreak}
          </span>
          {/* ML Status Badge */}
          {(mlStatus.crossModalLoaded || mlStatus.qLearningLoaded) && (
            <Badge variant="secondary" className="flex items-center gap-1 bg-primary/10 text-primary">
              <Brain className="h-3 w-3" />
              ML-Powered
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {realtimeWordIndex} / {words.length} words
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progress} className="h-3" />

      {/* Passage Display */}
      <Card className="p-6">
        <div className="leading-relaxed">
          {renderPassage()}
        </div>
      </Card>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {!isRecording ? (
          <Button
            onClick={startReading}
            size="lg"
            className="gap-2"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Mic className="h-5 w-5" />
                Start Reading
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={stopReading}
            size="lg"
            variant="destructive"
            className="gap-2"
          >
            <StopCircle className="h-5 w-5" />
            Stop Reading
          </Button>
        )}
      </div>

      {/* Real-time Coaching */}
      {isRecording && (
        <RealtimeCoachingFeedback
          cognitiveLoad={cognitiveLoad}
          recentAccuracy={recentAccuracy}
          streakCount={correctStreak}
          isVisible={true}
        />
      )}
    </div>
  );
};

// Extract audio segment helper
async function extractAudioSegment(
  audioBlob: Blob,
  startMs: number,
  endMs: number
): Promise<Blob | null> {
  try {
    return audioBlob;
  } catch (error) {
    console.error('Error extracting audio segment:', error);
    return null;
  }
}