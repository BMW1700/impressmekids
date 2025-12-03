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
import { detectPhonemes } from '@/lib/phonemeDetection';
import { checkAndAwardAchievements, generateDailyMissions, updateMissionProgress } from '@/lib/achievementLogic';
import { AchievementUnlockedModal } from './AchievementUnlockedModal';
import { CelebrationEffect } from './CelebrationEffect';
import { XPPopup } from './XPPopup';
import { playCorrectPronunciation, SoundEffects } from '@/lib/pronunciationPlayer';
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

const isWordMatch = (spoken: string, expected: string, tolerance = 2): boolean => {
  const normalizedSpoken = normalizeWord(spoken);
  const normalizedExpected = normalizeWord(expected);
  
  if (normalizedSpoken === normalizedExpected) return true;
  
  const distance = levenshteinDistance(normalizedSpoken, normalizedExpected);
  const maxLen = Math.max(normalizedSpoken.length, normalizedExpected.length);
  
  // Allow tolerance based on word length
  const dynamicTolerance = Math.max(tolerance, Math.floor(maxLen * 0.3));
  return distance <= dynamicTolerance;
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

  // Process interim (real-time) results
  const processInterimResult = useCallback((transcript: string, timestamp: number) => {
    // Only process if there's new content
    if (transcript === lastInterimRef.current) return;
    
    const spokenWords = transcript.split(/\s+/).filter(w => w.length > 0);
    const newWordCount = spokenWords.length;
    const previousWordCount = lastInterimRef.current.split(/\s+/).filter(w => w.length > 0).length;
    
    lastInterimRef.current = transcript;
    
    // Process each new spoken word
    if (newWordCount > previousWordCount) {
      const latestSpokenWord = spokenWords[newWordCount - 1];
      const currentIdx = realtimeWordIndex;
      
      if (currentIdx >= words.length) return;
      
      const expectedWord = words[currentIdx];
      const isCorrect = isWordMatch(latestSpokenWord, expectedWord);
      
      // Update real-time status
      setRealtimeWordStatus(prev => {
        const newMap = new Map(prev);
        newMap.set(currentIdx, isCorrect ? 'correct' : 'incorrect');
        if (currentIdx + 1 < words.length) {
          newMap.set(currentIdx + 1, 'current');
        }
        return newMap;
      });
      
      // Immediate feedback
      if (isCorrect) {
        soundEffectsRef.current.correctWord();
        auraCharacter.reactToCorrect();
        
        // Add XP
        const xp = 1;
        setTotalXpEarned(prev => prev + xp);
        setXpAmount(xp);
        setXpPopupTrigger(Date.now());
        
        setCorrectStreak(prev => {
          const newStreak = prev + 1;
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
        
        // PHASE 1 FIX: Only play pronunciation ONCE per incorrect word
        if (!spokenIncorrectWordsRef.current.has(currentIdx)) {
          spokenIncorrectWordsRef.current.add(currentIdx);
          setTimeout(() => {
            playCorrectPronunciation(expectedWord);
          }, 500);
        }
      }
      
      setRealtimeWordIndex(prev => Math.min(prev + 1, words.length));
      setCurrentWordIndex(prev => Math.min(prev + 1, words.length));
    }
  }, [words, realtimeWordIndex, auraCharacter]);

  // Process final results - confirm and save word readings
  const processFinalResult = useCallback((transcript: string, timestamp: number) => {
    const spokenWords = transcript.split(/\s+/).filter(w => w.length > 0);
    
    // Create confirmed word readings
    const newReadings: WordReading[] = [];
    
    spokenWords.forEach((spokenWord, idx) => {
      const wordIndex = idx;
      if (wordIndex < words.length && !processedWordsRef.current.has(wordIndex)) {
        const expectedWord = words[wordIndex];
        const isCorrect = isWordMatch(spokenWord, expectedWord);
        
        newReadings.push({
          word: spokenWord,
          index: wordIndex,
          startMs: timestamp - 500,
          endMs: timestamp,
          correct: isCorrect,
          hesitation: false,
        });
        
        processedWordsRef.current.add(wordIndex);
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
    
    // Calculate stats from real-time tracking
    const correctCount = Array.from(realtimeWordStatus.values()).filter(s => s === 'correct').length;
    const incorrectCount = Array.from(realtimeWordStatus.values()).filter(s => s === 'incorrect').length;
    const wordsRead = correctCount + incorrectCount;
    const wpm = totalDuration > 0 ? Math.round((wordsRead / totalDuration) * 60) : 0;
    const accuracy = wordsRead > 0 ? Math.round((correctCount / wordsRead) * 100) : 0;

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

    // Save reading session
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

    // Save word readings
    if (wordReadings.length > 0) {
      const wordInserts = wordReadings.map((wr) => {
        const expectedWord = words[wr.index] || wr.word;
        const expectedPhonemes = getIPAPronunciation(expectedWord)[0] || [];
        
        return {
          session_id: session.id,
          word_text: wr.word,
          word_index: wr.index,
          start_time_ms: wr.startMs,
          end_time_ms: wr.endMs,
          phonemes_detected: [],
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

  const renderPassage = () => {
    return words.map((word, idx) => {
      const status = realtimeWordStatus.get(idx) || 'pending';
      let className = 'px-2 py-1 rounded-lg transition-all duration-200 inline-block text-lg mr-1 mb-1 ';
      
      if (status === 'correct') {
        className += 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-500/50 scale-105';
      } else if (status === 'incorrect') {
        className += 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg shadow-red-500/50 scale-105';
      } else if (status === 'current' || idx === realtimeWordIndex) {
        className += 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 text-white font-bold ring-4 ring-primary ring-offset-2 animate-pulse scale-110 shadow-2xl shadow-yellow-500/50';
      } else {
        className += 'text-muted-foreground hover:text-foreground bg-muted/30';
      }

      return (
        <span key={idx} className={className}>
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
          recentAccuracy={0.8}
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