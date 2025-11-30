import { useState, useRef, useCallback } from 'react';
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
import { cognitiveLoadEstimator, detectHesitationMarkers, calculatePauseDurations } from '@/lib/cognitiveLoadEstimator';
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
  assignmentId?: string;
  onComplete: (sessionData: ReadingSessionResult) => void;
}

interface ReadingSessionResult {
  sessionId: string;
  wpm: number;
  accuracy: number;
  wordsRead: number;
  durationSeconds: number;
}

interface WordReading {
  word: string;
  index: number;
  startMs: number;
  endMs: number;
  correct: boolean;
  hesitation: boolean;
}

export const WordByWordReader = ({ passageText, assignmentId, onComplete }: WordByWordReaderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordReadings, setWordReadings] = useState<WordReading[]>([]);
  const [browserSupport] = useState(checkBrowserSupport());
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  
  // Phase 1: Real-time feedback states
  const [correctStreak, setCorrectStreak] = useState(0);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);
  const [xpPopupTrigger, setXpPopupTrigger] = useState(0);
  const [xpAmount, setXpAmount] = useState(0);
  const [celebrationMessage, setCelebrationMessage] = useState('Amazing!');
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const soundEffectsRef = useRef<SoundEffects>(new SoundEffects());
  const auraCharacter = useAuraCharacterState();
  const words = passageText.split(/\s+/).filter(w => w.length > 0);
  const { toast } = useToast();
  
  // Phase 3: Smart Coach states
  const [cognitiveLoad, setCognitiveLoad] = useState(0);
  const [volumeHistory, setVolumeHistory] = useState<number[]>([]);
  const [hesitationCount, setHesitationCount] = useState(0);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<any>(null);
  const [generatedExercises, setGeneratedExercises] = useState<any[]>([]);

  const startReading = useCallback(async () => {
    // Check browser support
    if (!browserSupport.isSupported) {
      toast({
        title: 'Browser not supported',
        description: `Missing: ${browserSupport.missing.join(', ')}. Please use Chrome or Edge.`,
        variant: 'destructive',
      });
      return;
    }

    // AURA starts listening
    auraCharacter.setThinking();

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    // Start audio recording for phoneme detection
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      recorder.start(100); // Capture every 100ms for fine-grained segmentation
      mediaRecorderRef.current = recorder;
    } catch (error) {
      console.error('Microphone access error:', error);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        toast({
          title: 'Microphone access denied',
          description: 'Please allow microphone access to use this feature.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Microphone Error',
          description: 'Please check your microphone and try again.',
          variant: 'destructive',
        });
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    startTimeRef.current = Date.now();
    let wordTimestamps: Array<{ word: string; time: number }> = [];

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        // PHASE 1: Real-time feedback on interim results
        const transcript = event.results[i][0].transcript.trim().toLowerCase();
        const timestamp = Date.now() - startTimeRef.current;

        if (event.results[i].isFinal) {
          const spokenWords = transcript.split(/\s+/);
          spokenWords.forEach((spokenWord) => {
            wordTimestamps.push({ word: spokenWord, time: timestamp });
          });

          const matchedReadings = matchWordsToPassage(
            wordTimestamps,
            words,
            currentWordIndex
          );

          // Process each matched word for instant feedback
          matchedReadings.forEach((reading, idx) => {
            const wordIndex = currentWordIndex + idx;
            if (wordIndex < words.length) {
              // Phase 3: Update cognitive load on each word
              const recentTranscript = transcript.slice(-100);
              const hesitations = detectHesitationMarkers(recentTranscript);
              setHesitationCount(hesitations.length);
              
              const loadResult = cognitiveLoadEstimator.estimateLoad({
                speechPauses: [],
                speechConfidence: event.results[i][0].confidence || 0.8,
                hesitationMarkers: hesitations,
                taskDifficulty: 0.5,
                previousAttempts: wordReadings.filter(w => !w.correct).length,
              });
              
              setCognitiveLoad(loadResult.loadScore);
              
              if (reading.correct) {
                // Correct word!
                soundEffectsRef.current.correctWord();
                auraCharacter.reactToCorrect();
                
                setCorrectStreak(prev => {
                  const newStreak = prev + 1;
                  
                  // Trigger celebrations at milestones
                  if (newStreak === 5) {
                    setCelebrationMessage('On Fire! 🔥');
                    setCelebrationTrigger(Date.now());
                    soundEffectsRef.current.streakAchieved();
                    auraCharacter.reactToStreak(5);
                    setXpAmount(5);
                    setXpPopupTrigger(Date.now());
                  } else if (newStreak === 10) {
                    setCelebrationMessage('Unstoppable! ⚡');
                    setCelebrationTrigger(Date.now());
                    soundEffectsRef.current.celebrationSound();
                    auraCharacter.reactToStreak(10);
                    setXpAmount(10);
                    setXpPopupTrigger(Date.now());
                  } else if (newStreak % 15 === 0) {
                    setCelebrationMessage('Reading Master! 🌟');
                    setCelebrationTrigger(Date.now());
                    soundEffectsRef.current.celebrationSound();
                    auraCharacter.reactToStreak(newStreak);
                    setXpAmount(15);
                    setXpPopupTrigger(Date.now());
                  } else {
                    // Small XP for each correct word
                    setXpAmount(1);
                    setXpPopupTrigger(Date.now());
                  }
                  
                  return newStreak;
                });
              } else {
                // Incorrect word - instant feedback!
                soundEffectsRef.current.incorrectWord();
                auraCharacter.reactToIncorrect();
                setCorrectStreak(0); // Reset streak
                
                // Play correct pronunciation
                const expectedWord = words[wordIndex];
                setTimeout(() => {
                  playCorrectPronunciation(expectedWord);
                }, 300);
              }
            }
          });

          setWordReadings(prev => [...prev, ...matchedReadings]);
          setCurrentWordIndex(prev => Math.min(prev + matchedReadings.length, words.length));
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
      description: 'Read the passage aloud, word by word',
    });
  }, [currentWordIndex, words, toast]);

  const stopReading = useCallback(async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      // Give it time to finish capturing
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsRecording(false);
    setIsProcessing(true);

    const totalDuration = (Date.now() - startTimeRef.current) / 1000;
    const wordsRead = wordReadings.length;
    const wpm = Math.round((wordsRead / totalDuration) * 60);
    const correctWords = wordReadings.filter(w => w.correct).length;
    const accuracy = wordsRead > 0 ? Math.round((correctWords / wordsRead) * 100) : 0;
    const fluencyScore = calculateFluencyScore(wordReadings);

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

    const { data: session, error: sessionError } = await supabase
      .from('reading_sessions')
      .insert({
        student_id: user.id,
        assignment_id: assignmentId,
        passage_text: passageText,
        words_read: wordsRead,
        duration_seconds: totalDuration,
        wpm,
        accuracy_percent: accuracy,
        fluency_score: fluencyScore,
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

    if (wordReadings.length > 0) {
      // Combine audio chunks into single blob
      const fullAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Process each word with phoneme detection
      const wordInserts = await Promise.all(
        wordReadings.map(async (wr, idx) => {
          // Get expected phonemes for the word
          const expectedWord = words[wr.index] || wr.word;
          const expectedPhonemes = getIPAPronunciation(expectedWord)[0] || [];
          
          // Detect hesitation based on time gap (>800ms between words)
          const previousReading = idx > 0 ? wordReadings[idx - 1] : null;
          const timeGap = previousReading ? wr.startMs - previousReading.endMs : 0;
          const hasHesitation = timeGap > 800;
          
          // Extract audio segment for this word and detect phonemes
          let detectedPhonemes: string[] = [];
          try {
            const wordAudioBlob = await extractAudioSegment(
              fullAudioBlob,
              wr.startMs,
              wr.endMs
            );
            
            if (wordAudioBlob) {
              const phonemeResults = await detectPhonemes(wordAudioBlob);
              detectedPhonemes = phonemeResults.map(p => p.phoneme);
            }
          } catch (error) {
            console.error('Phoneme detection error for word:', wr.word, error);
          }
          
          return {
            session_id: session.id,
            word_text: wr.word,
            word_index: wr.index,
            start_time_ms: wr.startMs,
            end_time_ms: wr.endMs,
            phonemes_detected: detectedPhonemes,
            phonemes_expected: expectedPhonemes,
            was_correct: wr.correct,
            hesitation_detected: hasHesitation,
          };
        })
      );

      await supabase.from('word_readings').insert(wordInserts);
      
      // Clear audio chunks for next session
      audioChunksRef.current = [];
    }

    const { data: statsCheck } = await supabase
      .from('student_reading_stats')
      .select('total_sessions')
      .eq('student_id', user.id)
      .single();

    const isFirstSession = !statsCheck || statsCheck.total_sessions === 0;

    await updateStudentStats(user.id, wordsRead, accuracy);

    // Generate daily missions if not already created
    await generateDailyMissions(user.id);

    // Update mission progress
    await updateMissionProgress(user.id, {
      wordsRead,
      durationSeconds: totalDuration,
    });

    // Check and award achievements
    const achievements = await checkAndAwardAchievements(user.id, {
      wpm,
      accuracy,
      wordsRead,
      isFirstSession,
    });

    if (achievements.length > 0) {
      setNewAchievements(achievements);
      setShowAchievementModal(true);
    }

    // Analyze mispronunciation patterns in background
    analyzeMispronunciationPatterns(user.id, session.id).catch(console.error);
    
    // Phase 3: Calculate adaptive difficulty and generate exercises
    await calculateAdaptiveDifficultyAndExercises(user.id, session.id, accuracy, wpm);

    setIsProcessing(false);

    onComplete({
      sessionId: session.id,
      wpm,
      accuracy,
      wordsRead,
      durationSeconds: totalDuration,
    });

    toast({
      title: `Great job! 🎉`,
      description: `${wpm} WPM, ${accuracy}% accuracy, +${wordsRead} XP`,
    });
  }, [wordReadings, passageText, assignmentId, onComplete, toast]);

  const renderPassage = () => {
    return words.map((word, idx) => {
      let className = 'px-2 py-1 rounded-lg transition-all duration-200 inline-block text-lg ';
      
      if (idx < currentWordIndex) {
        const wordReading = wordReadings.find(wr => wr.index === idx);
        if (wordReading?.correct) {
          // Correct word - green with glow
          className += 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-500/50 scale-105';
        } else {
          // Incorrect word - red with glow
          className += 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg shadow-red-500/50 scale-105';
        }
      } else if (idx === currentWordIndex && isRecording) {
        // Current word - pulsing highlight
        className += 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 text-white font-bold ring-4 ring-primary ring-offset-2 animate-pulse scale-110 shadow-2xl shadow-yellow-500/50';
      } else {
        className += 'text-muted-foreground hover:text-foreground';
      }

      return (
        <span key={idx} className={className}>
          {word}{' '}
        </span>
      );
    });
  };

  const progress = words.length > 0 ? (currentWordIndex / words.length) * 100 : 0;
  
  const calculateAdaptiveDifficultyAndExercises = async (
    studentId: string,
    sessionId: string,
    accuracy: number,
    wpm: number
  ) => {
    try {
      // Calculate difficulty
      const masteredPhonemes = Array.from(
        new Set(
          wordReadings
            .filter(w => w.correct)
            .flatMap(() => ['t', 'p', 'k'])
        )
      );
      
      const strugglingPhonemes = Array.from(
        new Set(
          wordReadings
            .filter(w => !w.correct)
            .flatMap(() => ['th', 'r', 'l'])
        )
      );

      const difficultyResult = await adaptiveDifficultyEngine.calculateAdaptiveDifficulty({
        studentId,
        currentLevel: 2,
        recentGrades: [accuracy],
        completionRate: currentWordIndex / words.length,
        consistency: 0.7,
        weeklyImprovement: 0.05,
        masteredPhonemes,
        strugglingPhonemes,
        recentPracticeMinutes: 15,
        readingFeatures: {
          highlightCount: 0,
          comprehensionScore: accuracy,
          annotationQuality: accuracy,
          criticalThinkingScore: accuracy * 0.8,
          avgAnnotationLength: 50,
          vocabularyComplexity: 60,
          readingTime: (Date.now() - startTimeRef.current) / 1000,
        },
        speakingFeatures: {
          wpm,
          fluency: accuracy * 0.9,
          prosody: 70,
          confidence: (1 - cognitiveLoad) * 100,
          pauseCount: hesitationCount,
          phonemeAccuracy: accuracy,
        },
      });

      setAdaptiveDifficulty(difficultyResult);

      // Generate exercises
      if (strugglingPhonemes.length > 0) {
        const { data } = await supabase.functions.invoke('generate-practice-exercises', {
          body: {
            studentId,
            phonemeGaps: strugglingPhonemes,
            grade: 3,
          },
        });

        if (data?.exercises) {
          setGeneratedExercises(data.exercises);
        }
      }
    } catch (error) {
      console.error('Phase 3 calculation error:', error);
    }
  };

  return (
    <>
      {/* Phase 1: Celebration effects */}
      <CelebrationEffect trigger={celebrationTrigger} message={celebrationMessage} />
      <XPPopup xp={xpAmount} trigger={xpPopupTrigger} />
      
      <Card className="p-6 space-y-4 relative overflow-hidden">
        {/* Animated background on streak */}
        {correctStreak >= 5 && isRecording && (
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 animate-pulse pointer-events-none" />
        )}
        
        {!browserSupport.isSupported && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your browser doesn't support word-by-word reading practice. 
              Missing: {browserSupport.missing.join(', ')}. 
              Please use Chrome, Edge, or another modern browser.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Word-by-Word Reading Practice</h3>
            {correctStreak >= 5 && isRecording && (
              <Badge variant="default" className="animate-bounce bg-gradient-to-r from-amber-500 to-orange-500">
                <Sparkles className="h-3 w-3 mr-1" />
                {correctStreak} Streak!
              </Badge>
            )}
          </div>
          <Badge variant="secondary" className="text-base px-4 py-1">
            {currentWordIndex} / {words.length} words
          </Badge>
        </div>

        {/* Real-time animated progress bar */}
        <div className="relative">
          <Progress 
            value={progress} 
            className="h-3 transition-all duration-300"
          />
          {progress > 0 && (
            <div 
              className="absolute top-0 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-300 shadow-lg"
              style={{ width: `${progress}%` }}
            />
          )}
        </div>

        {/* AURA Character */}
        {isRecording && (
          <div className="flex justify-center py-2">
            <AuraCharacter 
              state={auraCharacter.state} 
              message={auraCharacter.message}
              enableVoice={true}
            />
          </div>
        )}
        
        {/* Phase 3: Real-time Coaching Feedback */}
        <RealtimeCoachingFeedback
          cognitiveLoad={cognitiveLoad}
          recentAccuracy={wordReadings.filter(w => w.correct).length / Math.max(wordReadings.length, 1)}
          streakCount={correctStreak}
          isVisible={isRecording && wordReadings.length > 2}
        />
        
        {/* Phase 3: Difficulty Level Display (shown after session) */}
        {!isRecording && !isProcessing && adaptiveDifficulty && (
          <DifficultyLevelDisplay
            currentLevel={adaptiveDifficulty.currentLevel || 2}
            recommendedLevel={adaptiveDifficulty.newLevel}
            confidence={adaptiveDifficulty.confidence}
            reasoning={adaptiveDifficulty.reasoning}
          />
        )}
        
        {/* Phase 3: Smart Exercises Panel (shown after session) */}
        {!isRecording && !isProcessing && generatedExercises.length > 0 && (
          <SmartExercisesPanel
            exercises={generatedExercises}
            onStartExercise={(exercise) => {
              toast({
                title: "Exercise Ready!",
                description: "Practice this to improve your reading skills.",
              });
            }}
          />
        )}

        <div className="prose max-w-none bg-gradient-to-br from-muted/50 to-muted p-6 rounded-xl shadow-inner text-base leading-loose border border-border/50">
          {renderPassage()}
        </div>

        <div className="flex gap-2 relative z-10">
        {!isRecording && !isProcessing && (
          <Button 
            onClick={startReading} 
            className="flex-1"
            disabled={!browserSupport.isSupported}
          >
            <Mic className="mr-2 h-4 w-4" />
            Start Reading
          </Button>
        )}
        
        {isRecording && (
          <Button onClick={stopReading} variant="destructive" className="flex-1">
            <StopCircle className="mr-2 h-4 w-4" />
            Stop Reading
          </Button>
        )}

        {isProcessing && (
          <Button disabled className="flex-1">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </Button>
        )}
      </div>

        {isRecording && (
          <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg animate-pulse relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
              <p className="text-base font-medium">
                🎤 Reading... Follow the glowing word
              </p>
            </div>
            {correctStreak > 0 && (
              <Badge variant="outline" className="text-sm">
                {correctStreak} correct in a row! 🔥
              </Badge>
            )}
          </div>
        )}

        <AchievementUnlockedModal
          isOpen={showAchievementModal}
          onClose={() => setShowAchievementModal(false)}
          achievements={newAchievements}
        />
      </Card>
    </>
  );
};

function matchWordsToPassage(
  timestamps: Array<{ word: string; time: number }>,
  expectedWords: string[],
  startIndex: number
): WordReading[] {
  const matched: WordReading[] = [];
  
  timestamps.forEach((ts, idx) => {
    const expectedIndex = startIndex + idx;
    if (expectedIndex >= expectedWords.length) return;
    
    const expected = expectedWords[expectedIndex].toLowerCase().replace(/[^\w]/g, '');
    const spoken = ts.word.toLowerCase().replace(/[^\w]/g, '');
    
    const isCorrect = calculateWordSimilarity(spoken, expected) > 0.75;
    
    matched.push({
      word: spoken,
      index: expectedIndex,
      startMs: idx > 0 ? timestamps[idx - 1].time : 0,
      endMs: ts.time,
      correct: isCorrect,
      hesitation: false,
    });
  });
  
  return matched;
}

function calculateWordSimilarity(word1: string, word2: string): number {
  const maxLen = Math.max(word1.length, word2.length);
  if (maxLen === 0) return 1.0;
  
  const distance = levenshteinDistance(word1, word2);
  return 1.0 - (distance / maxLen);
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
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
}

function calculateFluencyScore(readings: WordReading[]): number {
  if (readings.length === 0) return 0;
  
  const accuracy = readings.filter(r => r.correct).length / readings.length;
  const avgDuration = readings.reduce((sum, r) => sum + (r.endMs - r.startMs), 0) / readings.length;
  const hesitations = readings.filter(r => r.hesitation).length;
  
  const accuracyScore = accuracy * 50;
  const paceScore = Math.min(50, (300 / Math.max(avgDuration, 100)) * 25);
  const hesitationPenalty = hesitations * 2;
  
  return Math.max(0, Math.min(100, accuracyScore + paceScore - hesitationPenalty));
}

async function updateStudentStats(studentId: string, wordsRead: number, accuracy: number) {
  const xpGained = wordsRead + Math.round((accuracy / 100) * wordsRead * 0.5);
  
  const { data: stats } = await supabase
    .from('student_reading_stats')
    .select('*')
    .eq('student_id', studentId)
    .single();

  const today = new Date().toISOString().split('T')[0];
  const lastActivityDate = stats?.last_activity_date;
  
  const isNewDay = !lastActivityDate || lastActivityDate !== today;
  const yesterday = getPreviousDate(today);
  const newStreak = isNewDay && lastActivityDate === yesterday
    ? (stats?.current_streak_days || 0) + 1
    : isNewDay
    ? 1
    : stats?.current_streak_days || 1;

  await supabase
    .from('student_reading_stats')
    .upsert({
      student_id: studentId,
      total_words_read: (stats?.total_words_read || 0) + wordsRead,
      total_sessions: (stats?.total_sessions || 0) + 1,
      current_streak_days: newStreak,
      longest_streak_days: Math.max(newStreak, stats?.longest_streak_days || 0),
      xp_points: (stats?.xp_points || 0) + xpGained,
      level: Math.floor(((stats?.xp_points || 0) + xpGained) / 1000) + 1,
      last_activity_date: today,
      updated_at: new Date().toISOString(),
    });
}

function getPreviousDate(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

/**
 * Extract a specific time segment from an audio blob
 */
async function extractAudioSegment(
  audioBlob: Blob,
  startMs: number,
  endMs: number
): Promise<Blob | null> {
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor((startMs / 1000) * sampleRate);
    const endSample = Math.floor((endMs / 1000) * sampleRate);
    const segmentLength = endSample - startSample;
    
    if (segmentLength <= 0 || startSample >= audioBuffer.length) {
      return null;
    }
    
    // Create new buffer for the segment
    const segmentBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      segmentLength,
      sampleRate
    );
    
    // Copy audio data for this segment
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const sourceData = audioBuffer.getChannelData(channel);
      const targetData = segmentBuffer.getChannelData(channel);
      
      for (let i = 0; i < segmentLength; i++) {
        const sourceIndex = startSample + i;
        if (sourceIndex < sourceData.length) {
          targetData[i] = sourceData[sourceIndex];
        }
      }
    }
    
    // Convert buffer back to blob
    return await audioBufferToBlob(segmentBuffer);
  } catch (error) {
    console.error('Audio segment extraction error:', error);
    return null;
  }
}

/**
 * Convert AudioBuffer to Blob
 */
async function audioBufferToBlob(audioBuffer: AudioBuffer): Promise<Blob> {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();
  
  const renderedBuffer = await offlineContext.startRendering();
  
  // Convert to WAV format
  const wavData = audioBufferToWav(renderedBuffer);
  return new Blob([wavData], { type: 'audio/wav' });
}

/**
 * Convert AudioBuffer to WAV format
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const length = buffer.length * buffer.numberOfChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, buffer.numberOfChannels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
  view.setUint16(32, buffer.numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length, true);
  
  // Audio data
  const channels = [];
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  
  return arrayBuffer;
}
