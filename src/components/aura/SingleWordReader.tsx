import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Mic, StopCircle, SkipForward, RotateCcw, Volume2, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { AuraCharacter } from './AuraCharacter';
import { CelebrationEffect } from './CelebrationEffect';
import { XPPopup } from './XPPopup';
import { playCorrectPronunciation, SoundEffects, unlockSpeechSynthesis } from '@/lib/pronunciationPlayer';
import { isWordMatchLenient } from '@/lib/wordMatchingModes';
import { getPhoneticGuide } from '@/lib/phoneticGuide';
import { cleanupTranscript } from '@/lib/transcriptCleanup';

interface SingleWordReaderProps {
  passageText: string;
  onComplete: (sessionData: SingleWordSessionResult) => void;
}

interface SingleWordSessionResult {
  sessionId: string;
  wpm: number;
  wcpm: number;
  accuracy: number;
  wordsRead: number;
  durationSeconds: number;
  xpEarned: number;
  wordResults: Array<{
    word: string;
    correct: boolean;
    attempts: number;
    skipped: boolean;
  }>;
}

interface WordResult {
  word: string;
  correct: boolean;
  attempts: number;
  skipped: boolean;
}

export const SingleWordReader = ({ passageText, onComplete }: SingleWordReaderProps) => {
  // Split on whitespace, then further split hyphenated words into separate words
  const words = passageText
    .split(/\s+/)
    .filter(w => w.length > 0)
    .flatMap(word => {
      // If word contains hyphens between text (not just leading/trailing), split it
      if (word.includes('-') && !word.startsWith('-') && !word.endsWith('-')) {
        return word.split('-').filter(part => part.length > 0);
      }
      return [word];
    });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);
  const [xpPopupTrigger, setXpPopupTrigger] = useState(0);
  const [xpAmount, setXpAmount] = useState(0);
  const [celebrationMessage, setCelebrationMessage] = useState('Amazing!');
  const [wordsPerGroup, setWordsPerGroup] = useState(1);
  const [currentWordInGroup, setCurrentWordInGroup] = useState(0); // Which word in the current group is active
  
  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const soundEffectsRef = useRef<SoundEffects>(new SoundEffects());
  const currentIndexRef = useRef(currentIndex);
  const currentWordInGroupRef = useRef(currentWordInGroup);
  const wordsPerGroupRef = useRef(wordsPerGroup);
  const isProcessingRef = useRef(false);
  const correctStreakRef = useRef(0);
  const attemptsRef = useRef(0);
  const { toast } = useToast();

  // Keep refs in sync with state
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  
  useEffect(() => {
    currentWordInGroupRef.current = currentWordInGroup;
  }, [currentWordInGroup]);
  
  useEffect(() => {
    wordsPerGroupRef.current = wordsPerGroup;
  }, [wordsPerGroup]);

  // Calculate current group of words to display
  const groupStartIndex = currentIndex;
  const groupEndIndex = Math.min(currentIndex + wordsPerGroup, words.length);
  const currentGroupWords = words.slice(groupStartIndex, groupEndIndex);
  
  // The active word within the group
  const activeWordIndex = currentIndex + currentWordInGroup;
  const currentWord = words[activeWordIndex] || '';
  const cleanWord = currentWord.replace(/[^a-zA-Z']/g, '');
  const isComplete = currentIndex >= words.length;

  // Start session timer and auto-start listening on first word
  useEffect(() => {
    if (startTimeRef.current === 0 && !isComplete) {
      startTimeRef.current = Date.now();
    }
  }, [isComplete]);

  const handleCorrect = useCallback(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    setFeedback('correct');
    soundEffectsRef.current.correctWord();
    
    const newStreak = correctStreakRef.current + 1;
    correctStreakRef.current = newStreak;
    setCorrectStreak(newStreak);
    
    // XP calculation
    let xp = 2;
    if (newStreak >= 5) xp = 5;
    if (newStreak >= 10) xp = 10;
    
    setXpAmount(xp);
    setTotalXpEarned(prev => prev + xp);
    setXpPopupTrigger(prev => prev + 1);
    
    // Celebration for streaks
    if (newStreak === 5 || newStreak === 10 || newStreak % 15 === 0) {
      setCelebrationMessage(newStreak >= 10 ? "Incredible!" : "Amazing!");
      setCelebrationTrigger(prev => prev + 1);
    }
    
    // Save result with the original word (with punctuation for display)
    const wordToSave = words[currentIndexRef.current + currentWordInGroupRef.current] || cleanWord;
    setWordResults(prev => [...prev, {
      word: wordToSave,
      correct: true,
      attempts: attemptsRef.current + 1,
      skipped: false,
    }]);
    
    // Move to next word after brief delay
    setTimeout(() => {
      setFeedback(null);
      setAttempts(0);
      
      // Check if there are more words in the current group
      const nextWordInGroup = currentWordInGroupRef.current + 1;
      if (nextWordInGroup < wordsPerGroupRef.current && (currentIndexRef.current + nextWordInGroup) < words.length) {
        // Move to next word in current group
        setCurrentWordInGroup(nextWordInGroup);
        currentWordInGroupRef.current = nextWordInGroup;
      } else {
        // Move to next group
        const nextGroupStart = currentIndexRef.current + wordsPerGroupRef.current;
        setCurrentIndex(nextGroupStart);
        currentIndexRef.current = nextGroupStart;
        setCurrentWordInGroup(0);
        currentWordInGroupRef.current = 0;
      }
      
      isProcessingRef.current = false;
    }, 350);
  }, [cleanWord, words]);

  const handleIncorrect = useCallback((_spokenWord: string) => {
    if (isProcessingRef.current) return;

    // Compute expected word at execution time using the active word index
    const activeIdx = currentIndexRef.current + currentWordInGroupRef.current;
    const actualWord = (words[activeIdx] || '').replace(/[^a-zA-Z']/g, '');

    setFeedback('incorrect');
    soundEffectsRef.current.incorrectWord();
    correctStreakRef.current = 0;
    setCorrectStreak(0);
    attemptsRef.current += 1;
    setAttempts(prev => prev + 1);

    // Play correct pronunciation of the current word
    setTimeout(() => {
      playCorrectPronunciation(actualWord);
    }, 500);

    // Reset feedback after delay to continue listening
    setTimeout(() => {
      setFeedback(null);
    }, 1200);
  }, [words]);

  const handleSkip = useCallback(() => {
    const activeIdx = currentIndexRef.current + currentWordInGroupRef.current;
    const wordToSkip = words[activeIdx] || cleanWord;
    
    setWordResults(prev => [...prev, {
      word: wordToSkip,
      correct: false,
      attempts: attempts,
      skipped: true,
    }]);

    correctStreakRef.current = 0;
    setCorrectStreak(0);
    setFeedback(null);
    attemptsRef.current = 0;
    setAttempts(0);
    
    // Check if there are more words in the current group
    const nextWordInGroup = currentWordInGroupRef.current + 1;
    if (nextWordInGroup < wordsPerGroupRef.current && (currentIndexRef.current + nextWordInGroup) < words.length) {
      // Move to next word in current group
      setCurrentWordInGroup(nextWordInGroup);
      currentWordInGroupRef.current = nextWordInGroup;
    } else {
      // Move to next group
      const nextGroupStart = currentIndexRef.current + wordsPerGroupRef.current;
      setCurrentIndex(nextGroupStart);
      currentIndexRef.current = nextGroupStart;
      setCurrentWordInGroup(0);
      currentWordInGroupRef.current = 0;
    }
  }, [words, cleanWord, attempts]);

  const startContinuousListening = useCallback(() => {
    unlockSpeechSynthesis();
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: 'Browser not supported',
        description: 'Please use Chrome or Edge for speech recognition.',
        variant: 'destructive',
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      if (isProcessingRef.current) return;
      
      // Get the latest result
      const latestResult = event.results[event.results.length - 1];
      if (!latestResult.isFinal) return;
      
      const transcript = latestResult[0].transcript.trim().toLowerCase();
      const cleanedTranscript = cleanupTranscript(transcript);
      const spokenWords = cleanedTranscript.split(/\s+/).filter((w: string) => w.length > 0);
      
      // Get current expected word from ref to avoid stale closure
      const activeIdx = currentIndexRef.current + currentWordInGroupRef.current;
      const expectedWord = words[activeIdx]?.replace(/[^a-zA-Z']/g, '') || '';
      
      // Check all alternatives
      let matched = false;
      for (let i = 0; i < latestResult.length && !matched; i++) {
        const alt = latestResult[i]?.transcript?.trim().toLowerCase() || '';
        const cleanedAlt = cleanupTranscript(alt);
        const altWords = cleanedAlt.split(/\s+/).filter((w: string) => w.length > 0);
        
        for (const word of altWords) {
          if (isWordMatchLenient(word, expectedWord)) {
            matched = true;
            break;
          }
        }
      }
      
      // Also check if any word in spoken matches
      if (!matched) {
        for (const word of spokenWords) {
          if (isWordMatchLenient(word, expectedWord)) {
            matched = true;
            break;
          }
        }
      }
      
      if (matched) {
        handleCorrect();
      } else if (spokenWords.length > 0) {
        handleIncorrect(spokenWords[0] || transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Restart recognition if no speech detected
        setTimeout(() => {
          if (recognitionRef.current && !isComplete) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Already running
            }
          }
        }, 100);
      } else if (event.error !== 'aborted') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if not complete and not manually stopped
      if (!isComplete && !isProcessingRef.current) {
        setTimeout(() => {
          if (recognitionRef.current && !isComplete) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Create new recognition if needed
              startContinuousListening();
            }
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [words, currentIndex, handleCorrect, handleIncorrect, toast, isComplete]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  const hearWord = useCallback(() => {
    const activeIdx = currentIndexRef.current + currentWordInGroupRef.current;
    const actualWord = (words[activeIdx] || '').replace(/[^a-zA-Z']/g, '');
    playCorrectPronunciation(actualWord);
  }, [words]);

  // Complete session
  useEffect(() => {
    if (isComplete && wordResults.length > 0) {
      const duration = (Date.now() - startTimeRef.current) / 1000;
      const correctCount = wordResults.filter(r => r.correct).length;
      const accuracy = Math.round((correctCount / wordResults.length) * 100);
      const wpm = Math.round((wordResults.length / duration) * 60);
      const wcpm = Math.round((correctCount / duration) * 60);

      onComplete({
        sessionId: `single-word-${Date.now()}`,
        wpm,
        wcpm,
        accuracy,
        wordsRead: wordResults.length,
        durationSeconds: Math.round(duration),
        xpEarned: totalXpEarned,
        wordResults,
      });
    }
  }, [isComplete, wordResults, totalXpEarned, onComplete]);

  const progress = (currentIndex / words.length) * 100;

  // Get display for previous words (show more words for better story progress)
  const previousWords = wordResults.slice(-8);

  if (isComplete) {
    return null; // Parent handles completion display
  }

  return (
    <div className="space-y-6">
      {/* Celebration Effects */}
      <CelebrationEffect trigger={celebrationTrigger} message={celebrationMessage} />
      <XPPopup trigger={xpPopupTrigger} xp={xpAmount} />

      {/* AURA Coach */}
      <div className="flex justify-center">
        <AuraCharacter
          state={feedback === 'correct' ? 'excited' : feedback === 'incorrect' ? 'thinking' : 'idle'}
          message={
            feedback === 'correct'
              ? correctStreak >= 5 ? `${correctStreak} in a row! Incredible!` : "Perfect! 🎉"
              : feedback === 'incorrect'
              ? "Listen and try again!"
              : isListening
              ? "Listening... say the word!"
              : "Press Start to begin!"
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
          {currentIndex} / {words.length} words
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progress} className="h-3" />

      {/* Words Per Group Slider */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Words at a time</span>
          <Badge variant="secondary" className="text-sm">
            {wordsPerGroup} word{wordsPerGroup > 1 ? 's' : ''}
          </Badge>
        </div>
        <Slider
          value={[wordsPerGroup]}
          onValueChange={(value) => setWordsPerGroup(value[0])}
          min={1}
          max={10}
          step={1}
          className="w-full"
          disabled={isListening}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>

      {/* Previous Words - Story Progress */}
      <div className="flex flex-wrap justify-center gap-1.5 min-h-[32px] max-w-2xl mx-auto px-2">
        <AnimatePresence mode="popLayout">
          {previousWords.map((result, idx) => (
            <motion.div
              key={`prev-${wordResults.length - previousWords.length + idx}`}
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ duration: 0.15 }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm ${
                result.correct
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                  : 'bg-red-500/20 text-red-600 dark:text-red-400'
              }`}
            >
              {result.correct ? (
                <CheckCircle className="h-3 w-3 shrink-0" />
              ) : (
                <XCircle className="h-3 w-3 shrink-0" />
              )}
              <span className="truncate max-w-[80px]">{result.word}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Current Word Display */}
      <Card className="p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            className="text-center space-y-6"
          >
            {/* The Words */}
            <div className={`py-8 px-4 rounded-xl transition-all ${
              feedback === 'correct'
                ? 'bg-green-500/10'
                : feedback === 'incorrect'
                ? 'bg-red-500/10'
                : ''
            }`}>
              <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4">
                {currentGroupWords.map((word, idx) => {
                  const isActive = idx === currentWordInGroup;
                  const isPast = idx < currentWordInGroup;
                  
                  return (
                    <motion.div
                      key={`${currentIndex}-${idx}`}
                      className="flex flex-col items-center"
                      animate={
                        isActive && feedback === 'correct'
                          ? { scale: [1, 1.1, 1] }
                          : isActive && feedback === 'incorrect'
                          ? { x: [-5, 5, -5, 5, 0] }
                          : {}
                      }
                    >
                      {/* Main word display */}
                      <span
                        className={`
                          ${wordsPerGroup === 1 ? 'text-6xl md:text-7xl' : wordsPerGroup <= 3 ? 'text-4xl md:text-5xl' : 'text-2xl md:text-3xl'}
                          font-bold transition-all duration-200
                          ${isActive 
                            ? feedback === 'correct'
                              ? 'text-green-600 dark:text-green-400'
                              : feedback === 'incorrect'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-primary underline underline-offset-8 decoration-4'
                            : isPast
                            ? 'text-green-600/50 dark:text-green-400/50 line-through'
                            : 'text-muted-foreground/60'
                          }
                        `}
                      >
                        {word}
                      </span>
                      
                      {/* Phonetic sound-out display */}
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3"
                        >
                          <span className={`
                            ${wordsPerGroup === 1 ? 'text-lg md:text-xl' : wordsPerGroup <= 3 ? 'text-base md:text-lg' : 'text-sm md:text-base'}
                            font-medium text-muted-foreground/80 italic
                          `}>
                            {getPhoneticGuide(word)}
                          </span>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Feedback Icons */}
            <AnimatePresence>
              {feedback === 'correct' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="flex justify-center"
                >
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </motion.div>
              )}
              {feedback === 'incorrect' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="flex justify-center"
                >
                  <XCircle className="h-16 w-16 text-red-500" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Attempts indicator */}
            {attempts > 0 && !feedback && (
              <p className="text-sm text-muted-foreground">
                Attempt {attempts + 1} • Listen and try again
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {/* Hear Word */}
        <Button
          variant="outline"
          size="lg"
          onClick={hearWord}
          disabled={!!feedback}
          className="gap-2"
        >
          <Volume2 className="h-5 w-5" />
          Hear It
        </Button>

        {/* Main Microphone Button */}
        {!isListening ? (
          <Button
            onClick={startContinuousListening}
            size="lg"
            className="gap-2 min-w-[160px]"
            disabled={!!feedback}
          >
            <Mic className="h-5 w-5" />
            Start
          </Button>
        ) : (
          <Button
            onClick={stopListening}
            size="lg"
            variant="secondary"
            className="gap-2 min-w-[160px]"
          >
            <StopCircle className="h-5 w-5" />
            <span className="flex items-center gap-1">
              Listening
              <span className="animate-pulse">●</span>
            </span>
          </Button>
        )}

        {/* Skip Button */}
        <Button
          variant="outline"
          size="lg"
          onClick={handleSkip}
          disabled={!!feedback}
          className="gap-2"
        >
          <SkipForward className="h-5 w-5" />
          Skip
        </Button>
      </div>

      {/* Retry hint after multiple attempts */}
      {attempts >= 2 && !feedback && isListening && (
        <p className="text-center text-sm text-muted-foreground">
          Having trouble? Try clicking "Hear It" to hear the correct pronunciation.
        </p>
      )}
    </div>
  );
};
