import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Mic, StopCircle, SkipForward, RotateCcw, Volume2, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { AuraCharacter } from './AuraCharacter';
import { CelebrationEffect } from './CelebrationEffect';
import { XPPopup } from './XPPopup';
import { playCorrectPronunciation, SoundEffects, unlockSpeechSynthesis } from '@/lib/pronunciationPlayer';
import { isWordMatchLenient } from '@/lib/wordMatchingModes';
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
  const words = passageText.split(/\s+/).filter(w => w.length > 0);
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
  
  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const soundEffectsRef = useRef<SoundEffects>(new SoundEffects());
  const { toast } = useToast();

  const currentWord = words[currentIndex] || '';
  const cleanWord = currentWord.replace(/[^a-zA-Z']/g, '');
  const isComplete = currentIndex >= words.length;

  // Start session timer on first word
  useEffect(() => {
    if (startTimeRef.current === 0 && !isComplete) {
      startTimeRef.current = Date.now();
    }
  }, [isComplete]);

  const handleCorrect = useCallback(() => {
    setFeedback('correct');
    soundEffectsRef.current.correctWord();
    
    const newStreak = correctStreak + 1;
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
    
    // Save result
    setWordResults(prev => [...prev, {
      word: cleanWord,
      correct: true,
      attempts: attempts + 1,
      skipped: false,
    }]);
    
    // Move to next word after brief delay
    setTimeout(() => {
      setFeedback(null);
      setAttempts(0);
      setCurrentIndex(prev => prev + 1);
    }, 800);
  }, [correctStreak, cleanWord, attempts]);

  const handleIncorrect = useCallback((spokenWord: string) => {
    setFeedback('incorrect');
    soundEffectsRef.current.incorrectWord();
    setCorrectStreak(0);
    setAttempts(prev => prev + 1);
    
    // Play correct pronunciation
    setTimeout(() => {
      playCorrectPronunciation(cleanWord);
    }, 500);
    
    // Reset feedback after delay to allow retry
    setTimeout(() => {
      setFeedback(null);
    }, 1500);
  }, [cleanWord]);

  const handleSkip = useCallback(() => {
    setWordResults(prev => [...prev, {
      word: cleanWord,
      correct: false,
      attempts: attempts,
      skipped: true,
    }]);
    
    setCorrectStreak(0);
    setFeedback(null);
    setAttempts(0);
    setCurrentIndex(prev => prev + 1);
  }, [cleanWord, attempts]);

  const startListening = useCallback(() => {
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
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const result = event.results[0];
      const transcript = result[0].transcript.trim().toLowerCase();
      const cleanedTranscript = cleanupTranscript(transcript);
      const spokenWords = cleanedTranscript.split(/\s+/).filter((w: string) => w.length > 0);
      
      // Check all alternatives
      let matched = false;
      for (let i = 0; i < result.length && !matched; i++) {
        const alt = result[i]?.transcript?.trim().toLowerCase() || '';
        const cleanedAlt = cleanupTranscript(alt);
        const altWords = cleanedAlt.split(/\s+/).filter((w: string) => w.length > 0);
        
        for (const word of altWords) {
          if (isWordMatchLenient(word, cleanWord)) {
            matched = true;
            break;
          }
        }
      }
      
      // Also check if any word in spoken matches
      if (!matched) {
        for (const word of spokenWords) {
          if (isWordMatchLenient(word, cleanWord)) {
            matched = true;
            break;
          }
        }
      }
      
      if (matched) {
        handleCorrect();
      } else {
        handleIncorrect(spokenWords[0] || transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        toast({
          title: 'Recognition error',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [cleanWord, handleCorrect, handleIncorrect, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const hearWord = useCallback(() => {
    playCorrectPronunciation(cleanWord);
  }, [cleanWord]);

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

  // Get display for previous words (last 3)
  const previousWords = wordResults.slice(-3);

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
              ? "Listen carefully and try again!"
              : isListening
              ? "Say the word..."
              : "Click the microphone to speak!"
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

      {/* Previous Words (small, with indicators) */}
      <div className="flex justify-center gap-2 min-h-[32px]">
        <AnimatePresence mode="popLayout">
          {previousWords.map((result, idx) => (
            <motion.div
              key={`prev-${currentIndex - previousWords.length + idx}`}
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 0.6, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -20 }}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                result.correct
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                  : 'bg-red-500/20 text-red-600 dark:text-red-400'
              }`}
            >
              {result.correct ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {result.word}
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
            {/* The Word */}
            <motion.div
              className={`text-6xl md:text-7xl font-bold py-8 px-4 rounded-xl transition-all ${
                feedback === 'correct'
                  ? 'text-green-600 dark:text-green-400 bg-green-500/10'
                  : feedback === 'incorrect'
                  ? 'text-red-600 dark:text-red-400 bg-red-500/10'
                  : 'text-foreground'
              }`}
              animate={
                feedback === 'correct'
                  ? { scale: [1, 1.1, 1] }
                  : feedback === 'incorrect'
                  ? { x: [-5, 5, -5, 5, 0] }
                  : {}
              }
            >
              {currentWord}
            </motion.div>

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
          disabled={isListening || !!feedback}
          className="gap-2"
        >
          <Volume2 className="h-5 w-5" />
          Hear It
        </Button>

        {/* Main Microphone Button */}
        {!isListening ? (
          <Button
            onClick={startListening}
            size="lg"
            className="gap-2 min-w-[160px]"
            disabled={!!feedback}
          >
            <Mic className="h-5 w-5" />
            Speak
          </Button>
        ) : (
          <Button
            onClick={stopListening}
            size="lg"
            variant="destructive"
            className="gap-2 min-w-[160px] animate-pulse"
          >
            <StopCircle className="h-5 w-5" />
            Listening...
          </Button>
        )}

        {/* Skip Button */}
        <Button
          variant="outline"
          size="lg"
          onClick={handleSkip}
          disabled={isListening || !!feedback}
          className="gap-2"
        >
          <SkipForward className="h-5 w-5" />
          Skip
        </Button>
      </div>

      {/* Retry hint after multiple attempts */}
      {attempts >= 2 && !feedback && (
        <p className="text-center text-sm text-muted-foreground">
          Having trouble? Try clicking "Hear It" first, then speak the word.
        </p>
      )}
    </div>
  );
};
