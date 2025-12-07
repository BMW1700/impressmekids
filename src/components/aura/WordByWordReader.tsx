import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, StopCircle, Loader2, AlertCircle, Sparkles } from 'lucide-react';
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
}

interface ReadingSessionResult {
  sessionId: string;
  wpm: number;
  accuracy: number;
  wordsRead: number;
  durationSeconds: number;
  xpEarned: number;
}

interface WordReading {
  word: string;
  index: number;
  startMs: number;
  endMs: number;
  correct: boolean;
  hesitation: boolean;
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

// VERY LENIENT word matching - prioritize student confidence over strict accuracy
const isWordMatch = (spoken: string, expected: string): boolean => {
  const normalizedSpoken = normalizeWord(spoken);
  const normalizedExpected = normalizeWord(expected);
  
  // Exact match - definitely correct
  if (normalizedSpoken === normalizedExpected) return true;
  
  // Empty check - if no speech detected, benefit of doubt
  if (!normalizedSpoken) return true;
  if (!normalizedExpected) return false;
  
  // SHORT WORDS (1-3 chars): Always correct (too easy to mishear)
  if (normalizedExpected.length <= 3) {
    return true;
  }
  
  // Check if spoken starts with expected or vice versa (partial matches are fine)
  if (normalizedSpoken.startsWith(normalizedExpected) || normalizedExpected.startsWith(normalizedSpoken)) {
    return true;
  }
  
  // Check if spoken contains expected or vice versa
  if (normalizedSpoken.includes(normalizedExpected) || normalizedExpected.includes(normalizedSpoken)) {
    return true;
  }
  
  const distance = levenshteinDistance(normalizedSpoken, normalizedExpected);
  
  // MEDIUM WORDS (4-6 chars): 70% tolerance (very lenient)
  if (normalizedExpected.length <= 6) {
    return distance <= Math.ceil(normalizedExpected.length * 0.7);
  }
  
  // LONG WORDS (7+ chars): 65% tolerance (very lenient)
  return distance <= Math.ceil(normalizedExpected.length * 0.65);
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

export const WordByWordReader = ({ passageText, assignmentId, onComplete }: WordByWordReaderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordReadings, setWordReadings] = useState<WordReading[]>([]);
  const [browserSupport] = useState(checkBrowserSupport());
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  
  // Real-time tracking states
  const [realtimeWordIndex, setRealtimeWordIndex] = useState(0);
  const [realtimeWordStatus, setRealtimeWordStatus] = useState<Map<number, 'correct' | 'incorrect' | 'current' | 'pending'>>(new Map());
  const [correctStreak, setCorrectStreak] = useState(0);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);
  const [xpPopupTrigger, setXpPopupTrigger] = useState(0);
  const [xpAmount, setXpAmount] = useState(0);
  const [celebrationMessage, setCelebrationMessage] = useState('Amazing!');
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const soundEffectsRef = useRef<SoundEffects>(new SoundEffects());
  const auraCharacter = useAuraCharacterState();
  const words = passageText.split(/\s+/).filter(w => w.length > 0);
  const { toast } = useToast();
  
  // Track processed words to avoid duplicates
  const processedWordsRef = useRef<Set<number>>(new Set());
  const lastInterimRef = useRef<string>('');
  
  // PHASE 1 FIX: Track which incorrect words have already had pronunciation played
  const spokenIncorrectWordsRef = useRef<Set<number>>(new Set());
  
  // CRITICAL FIX: Use refs to avoid stale closure issues in callbacks
  const realtimeWordStatusRef = useRef<Map<number, 'correct' | 'incorrect' | 'current' | 'pending'>>(new Map());
  const realtimeWordIndexRef = useRef(0);
  const correctStreakRef = useRef(0);
  
  // Phase 3: Smart Coach states
  const [cognitiveLoad, setCognitiveLoad] = useState(0);
  const [hesitationCount, setHesitationCount] = useState(0);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<any>(null);
  const [generatedExercises, setGeneratedExercises] = useState<any[]>([]);
  const [recentAccuracy, setRecentAccuracy] = useState(0.5);
  
  // Track speech pauses for cognitive load
  const speechPausesRef = useRef<number[]>([]);
  const lastSpeechTimeRef = useRef<number>(0);

  // Initialize word status
  useEffect(() => {
    const initialStatus = new Map<number, 'correct' | 'incorrect' | 'current' | 'pending'>();
    words.forEach((_, idx) => initialStatus.set(idx, 'pending'));
    setRealtimeWordStatus(initialStatus);
    realtimeWordStatusRef.current = initialStatus;
    realtimeWordIndexRef.current = 0;
    correctStreakRef.current = 0;
  }, [words.length]);
  
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
    setTotalXpEarned(0);

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      recorder.start(100);
      mediaRecorderRef.current = recorder;
    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        title: 'Microphone Error',
        description: 'Please allow microphone access to use this feature.',
        variant: 'destructive',
      });
      return;
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
        
        // REAL-TIME WORD TRACKING - Process interim results immediately
        if (!isFinal) {
          processInterimResult(transcript, timestamp);
        } else {
          // Final result - confirm word readings
          processFinalResult(transcript, timestamp);
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

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);

    toast({
      title: 'Start Reading!',
      description: 'Read the passage aloud, word by word. I\'ll highlight as you go!',
    });
  }, [words, toast, browserSupport]);

  // Track pending word for stability check
  const pendingWordRef = useRef<{ word: string; index: number; timestamp: number } | null>(null);
  const stabilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track last confirmed word count to prevent skipping
  const lastConfirmedWordCountRef = useRef(0);
  
  // Process interim (real-time) results - VISUAL ONLY, no robot voice
  const processInterimResult = useCallback((transcript: string, timestamp: number) => {
    // Only process if there's new content
    if (transcript === lastInterimRef.current) return;
    
    const spokenWords = transcript.split(/\s+/).filter(w => w.length > 0);
    const newWordCount = spokenWords.length;
    const previousWordCount = lastInterimRef.current.split(/\s+/).filter(w => w.length > 0).length;
    
    lastInterimRef.current = transcript;
    
    // Track speech time for cognitive load estimation
    lastSpeechTimeRef.current = Date.now();
    
    // Process if word count increased (allow faster advancement)
    if (newWordCount <= previousWordCount) return;
    
    const latestSpokenWord = spokenWords[newWordCount - 1];
    const currentIdx = realtimeWordIndexRef.current;
    
    if (currentIdx >= words.length) return;
    
    const expectedWord = words[currentIdx];
    const isCorrect = isWordMatch(latestSpokenWord, expectedWord);
    
    // STABILITY CHECK: Don't advance immediately - wait for word to stabilize
    // Clear any pending advancement
    if (stabilityTimeoutRef.current) {
      clearTimeout(stabilityTimeoutRef.current);
    }
    
    // Set pending word - we'll confirm it after stability delay
    pendingWordRef.current = { word: latestSpokenWord, index: currentIdx, timestamp };
    
    // REAL-TIME PHONEME DETECTION: Log for analysis
    const expectedPhonemes = getIPAPronunciation(expectedWord)[0] || [];
    if (!isCorrect && expectedPhonemes.length > 0) {
      console.log('PHONEME DEBUG:', { 
        spoken: latestSpokenWord, 
        expected: expectedWord, 
        expectedPhonemes,
        wordIndex: currentIdx 
      });
    }
    
    // FASTER STABILITY DELAYS - responsive but stable
    const expectedWordLen = words[currentIdx]?.length || 4;
    const stabilityDelay = expectedWordLen <= 3 ? 180 : expectedWordLen <= 5 ? 150 : 120;
    
    stabilityTimeoutRef.current = setTimeout(() => {
      const pending = pendingWordRef.current;
      if (!pending || pending.index !== realtimeWordIndexRef.current) return;
      
      const finalExpectedWord = words[pending.index];
      const finalIsCorrect = isWordMatch(pending.word, finalExpectedWord);
      
      // Update word status
      setRealtimeWordStatus(prev => {
        const newMap = new Map(prev);
        newMap.set(pending.index, finalIsCorrect ? 'correct' : 'incorrect');
        if (pending.index + 1 < words.length) {
          newMap.set(pending.index + 1, 'current');
        }
        realtimeWordStatusRef.current = newMap;
        return newMap;
      });
      
      // Update confirmed word count
      lastConfirmedWordCountRef.current = newWordCount;
      
      // Sound effects only (NO robot voice here - that's in final results)
      if (finalIsCorrect) {
        soundEffectsRef.current.correctWord();
        auraCharacter.reactToCorrect();
        
        // Add XP
        setTotalXpEarned(prev => prev + 1);
        setXpAmount(1);
        setXpPopupTrigger(Date.now());
        
        setCorrectStreak(prev => {
          const newStreak = prev + 1;
          correctStreakRef.current = newStreak;
          if (newStreak === 5) {
            setCelebrationMessage('On Fire! 🔥');
            setCelebrationTrigger(Date.now());
            soundEffectsRef.current.streakAchieved();
            setTotalXpEarned(p => p + 5);
          } else if (newStreak === 10) {
            setCelebrationMessage('Unstoppable! ⚡');
            setCelebrationTrigger(Date.now());
            soundEffectsRef.current.celebrationSound();
            setTotalXpEarned(p => p + 10);
          } else if (newStreak % 15 === 0 && newStreak > 0) {
            setCelebrationMessage('Reading Master! 🌟');
            setCelebrationTrigger(Date.now());
            setTotalXpEarned(p => p + 15);
          }
          return newStreak;
        });
      } else {
        soundEffectsRef.current.incorrectWord();
        auraCharacter.reactToIncorrect();
        setCorrectStreak(0);
        correctStreakRef.current = 0;
      }
      
      // VOICE MASCOT: Check if we should speak this word (SEPARATE from correct/incorrect marking)
      // This runs for BOTH correct and incorrect words - voice is independent of scoring
      const shouldSpeak = shouldSpeakWord(pending.word, finalExpectedWord);
      if (shouldSpeak && !spokenIncorrectWordsRef.current.has(pending.index)) {
        spokenIncorrectWordsRef.current.add(pending.index);
        console.log('🔊 VOICE MASCOT PLAYING:', finalExpectedWord);
        // DEBUG toast to confirm voice is triggering
        toast({ title: `🔊 Saying: ${finalExpectedWord}`, description: `(heard: ${pending.word})`, duration: 2000 });
        // Play pronunciation - use clean word (not normalized - keep case for better pronunciation)
        const cleanWord = finalExpectedWord.replace(/[^a-zA-Z]/g, '');
        setTimeout(() => {
          playCorrectPronunciation(cleanWord);
        }, 50);
      }
      
      // Advance word index
      setRealtimeWordIndex(prev => {
        const newIdx = Math.min(prev + 1, words.length);
        realtimeWordIndexRef.current = newIdx;
        return newIdx;
      });
      setCurrentWordIndex(prev => Math.min(prev + 1, words.length));
      
      pendingWordRef.current = null;
    }, stabilityDelay);
  }, [words, auraCharacter]);

  // Process final results - confirm word readings AND play robot voice for errors
  // CRITICAL: Final results can OVERRIDE incorrect interim markings if word was actually correct
  const processFinalResult = useCallback((transcript: string, timestamp: number) => {
    const spokenWords = transcript.split(/\s+/).filter(w => w.length > 0);
    
    // Create confirmed word readings
    const newReadings: WordReading[] = [];
    
    spokenWords.forEach((spokenWord, idx) => {
      const wordIndex = idx;
      if (wordIndex < words.length) {
        const expectedWord = words[wordIndex];
        const isCorrect = isWordMatch(spokenWord, expectedWord);
        
        // OVERRIDE FIX: If final result shows correct but interim marked incorrect, fix it!
        const currentStatus = realtimeWordStatusRef.current.get(wordIndex);
        if (isCorrect && currentStatus === 'incorrect') {
          // Override the incorrect status with correct
          setRealtimeWordStatus(prev => {
            const newMap = new Map(prev);
            newMap.set(wordIndex, 'correct');
            realtimeWordStatusRef.current = newMap;
            return newMap;
          });
          console.log('OVERRIDE: Word was marked incorrect but final result shows correct:', expectedWord);
        }
        
        if (!processedWordsRef.current.has(wordIndex)) {
          newReadings.push({
            word: spokenWord,
            index: wordIndex,
            startMs: timestamp - 500,
            endMs: timestamp,
            correct: isCorrect,
            hesitation: false,
          });
          
          processedWordsRef.current.add(wordIndex);
          
          // Voice mascot check in final results (backup if interim didn't catch it)
          const shouldSpeak = shouldSpeakWord(spokenWord, expectedWord);
          if (shouldSpeak && !spokenIncorrectWordsRef.current.has(wordIndex)) {
            spokenIncorrectWordsRef.current.add(wordIndex);
            console.log('🔊 VOICE (final):', expectedWord);
            // DEBUG toast to confirm voice is triggering
            toast({ title: `🔊 Saying: ${expectedWord}`, description: `(heard: ${spokenWord})`, duration: 2000 });
            const cleanWord = expectedWord.replace(/[^a-zA-Z]/g, '');
            setTimeout(() => {
              playCorrectPronunciation(cleanWord);
            }, 100);
          }
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
  }, [words]);

  const stopReading = useCallback(async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      await new Promise(resolve => setTimeout(resolve, 300));
    }

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
    
    console.log('SCORING DEBUG:', { correctCount, incorrectCount, wordsRead, wpm, accuracy, totalDuration });

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

    // Calculate phoneme accuracy from word readings for analytics
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

    // Convert to percentage scores
    const phonemeScores: Record<string, number> = {};
    Object.entries(phonemeAccuracy).forEach(([phoneme, stats]) => {
      phonemeScores[phoneme] = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    });

    // Save reading session WITH ML outputs
    const { data: session, error: sessionError } = await supabase
      .from('reading_sessions')
      .insert({
        student_id: user.id,
        assignment_id: assignmentId || null,
        passage_text: passageText,
        words_read: wordsRead,
        duration_seconds: totalDuration,
        wpm,
        accuracy_percent: accuracy,
        fluency_score: calculateFluencyScore(wordReadings),
        cognitive_load_avg: cognitiveLoad, // ML OUTPUT: Cognitive load during session
        phoneme_accuracy: phonemeScores, // ML OUTPUT: Per-phoneme accuracy scores
      })
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

    // Update student stats
    await updateStudentStats(user.id, wordsRead, accuracy);
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
    try {
      const difficultyResult = await adaptiveDifficultyEngine.calculateAdaptiveDifficulty({
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

    setIsProcessing(false);

    onComplete({
      sessionId: session.id,
      wpm,
      accuracy,
      wordsRead,
      durationSeconds: totalDuration,
      xpEarned: totalXpEarned,
    });

    toast({
      title: accuracy >= 80 ? `Great job! 🎉` : accuracy >= 50 ? `Good effort! 📚` : `Keep practicing! 💪`,
      description: `${wpm} WPM, ${accuracy}% accuracy, +${totalXpEarned} XP`,
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

  const updateStudentStats = async (studentId: string, wordsRead: number, accuracy: number) => {
    try {
      const { data: existingStats } = await supabase
        .from('student_reading_stats')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (existingStats) {
        await supabase
          .from('student_reading_stats')
          .update({
            total_words_read: (existingStats.total_words_read || 0) + wordsRead,
            total_sessions: (existingStats.total_sessions || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('student_id', studentId);
      } else {
        await supabase
          .from('student_reading_stats')
          .insert({
            student_id: studentId,
            total_words_read: wordsRead,
            total_sessions: 1,
          });
      }
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

      {/* Stats Bar */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-4 text-sm">
          <Badge variant="outline" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            +{totalXpEarned} XP
          </Badge>
          <span className="text-muted-foreground">
            🔥 Streak: {correctStreak}
          </span>
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