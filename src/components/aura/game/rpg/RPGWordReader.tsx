import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Check, X, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { playCorrectPronunciation, SoundEffects } from "@/lib/pronunciationPlayer";
import { unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";

interface RPGWordReaderProps {
  words: string[];
  onResult: (correct: boolean, spokenWord: string, wordIndex: number) => void;
  disabled?: boolean;
  streak?: number;
  batchSize?: number;
}

type RecognitionState = 'idle' | 'starting' | 'listening' | 'processing' | 'paused' | 'error';

const soundEffects = new SoundEffects();

export const RPGWordReader = ({
  words,
  onResult,
  disabled = false,
  streak = 0,
  batchSize = 10,
}: RPGWordReaderProps) => {
  // Recognition state machine
  const [recognitionState, setRecognitionState] = useState<RecognitionState>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [spokenText, setSpokenText] = useState<string>("");
  
  // Refs for stable callbacks
  const recognitionRef = useRef<any>(null);
  const stateRef = useRef<RecognitionState>('idle');
  const currentIndexRef = useRef(0);
  const isProcessingRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // CRITICAL: Lock the target word when recognition starts to prevent mismatch
  const lockedTargetWordRef = useRef<string>("");
  const lockedTargetIndexRef = useRef<number>(0);

  // Keep refs in sync
  useEffect(() => {
    stateRef.current = recognitionState;
  }, [recognitionState]);
  
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Get current batch of words
  const currentBatch = words?.slice(0, Math.min(batchSize, words?.length || 0)) || [];
  const currentWord = currentBatch[currentIndex] || "";
  const cleanWord = currentWord.replace(/[^a-zA-Z']/g, '');

  // Cleanup function
  const cleanup = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  // Stop recognition
  const stopRecognition = useCallback(() => {
    cleanup();
    setRecognitionState('idle');
  }, [cleanup]);

  // Process correct word
  const handleCorrect = useCallback((word: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    cleanup();
    setRecognitionState('processing');
    setFeedback('correct');
    soundEffects.correctWord();
    
    const newStreak = streak + 1;
    if (newStreak > 0 && newStreak % 5 === 0) {
      soundEffects.streakAchieved();
    }
    
    // Use the locked index, not currentIndexRef which may have changed
    onResult(true, word, lockedTargetIndexRef.current);
    
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setSpokenText(""); // Clear for next word
      isProcessingRef.current = false;
      
      const nextIndex = lockedTargetIndexRef.current + 1;
      if (nextIndex < currentBatch.length) {
        setCurrentIndex(nextIndex);
        currentIndexRef.current = nextIndex;
        setRecognitionState('idle');
        // Auto-restart after brief delay
        restartTimeoutRef.current = setTimeout(() => {
          if (stateRef.current === 'idle') {
            startRecognition();
          }
        }, 200);
      } else {
        setRecognitionState('idle');
        setCurrentIndex(0);
        currentIndexRef.current = 0;
      }
    }, 400);
  }, [streak, currentBatch.length, onResult, cleanup]);

  // Process incorrect word
  const handleIncorrect = useCallback((spoken: string, word: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    cleanup();
    setRecognitionState('processing');
    setFeedback('incorrect');
    setSpokenText(spoken);
    soundEffects.incorrectWord();
    
    setTimeout(() => {
      playCorrectPronunciation(word);
    }, 300);
    
    // Use the locked index, not currentIndexRef which may have changed
    onResult(false, spoken, lockedTargetIndexRef.current);
    
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setSpokenText(""); // Clear for next word
      isProcessingRef.current = false;
      
      const nextIndex = lockedTargetIndexRef.current + 1;
      if (nextIndex < currentBatch.length) {
        setCurrentIndex(nextIndex);
        currentIndexRef.current = nextIndex;
        setRecognitionState('idle');
        restartTimeoutRef.current = setTimeout(() => {
          if (stateRef.current === 'idle') {
            startRecognition();
          }
        }, 300);
      } else {
        setRecognitionState('idle');
        setCurrentIndex(0);
        currentIndexRef.current = 0;
      }
    }, 800);
  }, [currentBatch.length, onResult, cleanup]);

  // Start recognition - the core function
  const startRecognition = useCallback(() => {
    if (disabled || isProcessingRef.current) return;
    if (stateRef.current === 'listening' || stateRef.current === 'starting') return;
    
    const wordToMatch = currentBatch[currentIndexRef.current]?.replace(/[^a-zA-Z']/g, '');
    if (!wordToMatch) return;
    
    // CRITICAL: Lock the target word and index at the START of recognition
    // This prevents any mismatch if index changes during async recognition
    lockedTargetWordRef.current = wordToMatch;
    lockedTargetIndexRef.current = currentIndexRef.current;
    
    cleanup();
    unlockSpeechSynthesis();
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    setRecognitionState('starting');
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      if (stateRef.current === 'starting') {
        setRecognitionState('listening');
        setSpokenText("");
        setFeedback(null);
      }
    };

    recognition.onresult = (event: any) => {
      if (isProcessingRef.current) return;
      
      const result = event.results[0];
      const transcript = result[0].transcript.trim().toLowerCase();
      
      // Only update spoken text if we have a locked target word
      // This prevents showing spoken text from a previous word
      if (lockedTargetWordRef.current) {
        setSpokenText(transcript);
      }

      if (result.isFinal) {
        // CRITICAL: Use the LOCKED target word, not current index
        // This ensures we always compare against the word that was displayed when recognition started
        const targetWord = lockedTargetWordRef.current;
        
        // Safety check: if locked word doesn't match current display, something went wrong
        if (!targetWord) {
          console.warn('No locked target word - ignoring result');
          return;
        }
        
        let matched = false;
        
        // Check all alternatives
        for (let i = 0; i < result.length && !matched; i++) {
          const alt = result[i]?.transcript?.trim().toLowerCase() || '';
          const altWords = alt.split(/\s+/).filter((w: string) => w.length > 0);
          for (const spokenWord of altWords) {
            if (isWordMatchLenient(spokenWord, targetWord)) {
              matched = true;
              break;
            }
          }
        }

        // Check original transcript
        if (!matched) {
          const wordsSpoken = transcript.split(/\s+/).filter((w: string) => w.length > 0);
          for (const spokenWord of wordsSpoken) {
            if (isWordMatchLenient(spokenWord, targetWord)) {
              matched = true;
              break;
            }
          }
        }

        if (matched) {
          handleCorrect(targetWord);
        } else {
          handleIncorrect(transcript, targetWord);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'aborted') {
        // Auto-restart on recoverable errors
        if (stateRef.current === 'listening' && !isProcessingRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            if (stateRef.current !== 'paused' && stateRef.current !== 'processing') {
              startRecognition();
            }
          }, 300);
        }
      } else {
        setRecognitionState('error');
      }
    };

    recognition.onend = () => {
      if (!isProcessingRef.current && stateRef.current === 'listening') {
        // Unexpected end - restart
        restartTimeoutRef.current = setTimeout(() => {
          if (stateRef.current !== 'paused' && stateRef.current !== 'processing' && stateRef.current !== 'idle') {
            startRecognition();
          }
        }, 100);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      setRecognitionState('error');
    }
  }, [disabled, currentBatch, cleanup, handleCorrect, handleIncorrect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Control functions
  const startReading = () => {
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    isProcessingRef.current = false;
    startRecognition();
  };

  const pauseReading = () => {
    cleanup();
    setRecognitionState('paused');
  };

  const resumeReading = () => {
    startRecognition();
  };

  const hearWord = useCallback(() => {
    if (cleanWord) {
      playCorrectPronunciation(cleanWord);
    }
  }, [cleanWord]);

  // Safety check
  if (!currentBatch || currentBatch.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <p className="text-slate-400">No words to read.</p>
      </div>
    );
  }

  const isListening = recognitionState === 'listening' || recognitionState === 'starting';
  const isPaused = recognitionState === 'paused';
  const isIdle = recognitionState === 'idle';
  const isProcessing = recognitionState === 'processing';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Word Queue */}
      <div className="flex flex-wrap gap-2 justify-center max-w-md">
        {currentBatch.map((word, index) => {
          const clean = word.replace(/[^a-zA-Z']/g, '');
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          
          return (
            <motion.div
              key={`${word}-${index}`}
              className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all
                ${isActive 
                  ? 'bg-blue-500 text-white scale-110 shadow-lg shadow-blue-500/30' 
                  : isCompleted 
                    ? 'bg-emerald-500/50 text-emerald-200' 
                    : 'bg-slate-700/60 text-slate-400'
                }`}
              animate={isActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: isActive ? Infinity : 0, duration: 1.5 }}
            >
              {clean}
            </motion.div>
          );
        })}
      </div>

      {/* Current Word */}
      <motion.div
        className={`relative px-12 py-6 rounded-2xl border-2 text-center min-w-[280px]
          ${feedback === 'correct' 
            ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.4)]' 
            : feedback === 'incorrect'
            ? 'bg-red-500/20 border-red-400 shadow-[0_0_30px_rgba(248,113,113,0.4)]'
            : 'bg-slate-800/80 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
          }`}
        animate={
          feedback === 'correct' ? { scale: [1, 1.05, 1] } :
          feedback === 'incorrect' ? { x: [-5, 5, -5, 5, 0] } : {}
        }
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center
                ${feedback === 'correct' ? 'bg-emerald-500' : 'bg-red-500'}`}
            >
              {feedback === 'correct' ? <Check className="h-6 w-6 text-white" /> : <X className="h-6 w-6 text-white" />}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.p className="text-4xl md:text-5xl font-bold text-white tracking-wide">
          {cleanWord || "Ready"}
        </motion.p>

        {spokenText && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mt-2 text-sm ${feedback === 'correct' ? 'text-emerald-300' : 'text-red-300'}`}
          >
            You said: "{spokenText}"
          </motion.p>
        )}
      </motion.div>

      <div className="text-center text-sm text-slate-400">
        Word {currentIndex + 1} of {currentBatch.length}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={hearWord}
          disabled={isListening || isProcessing || !cleanWord}
          className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
        >
          <Volume2 className="h-5 w-5 mr-2" />
          Hear
        </Button>

        {(isIdle || recognitionState === 'error') && (
          <Button
            size="lg"
            onClick={startReading}
            disabled={disabled || isProcessing || !cleanWord}
            className="min-w-[180px] font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
          >
            <Play className="h-5 w-5 mr-2" />
            Start Reading
          </Button>
        )}

        {isListening && (
          <Button
            size="lg"
            onClick={pauseReading}
            className="min-w-[180px] font-bold bg-gradient-to-r from-amber-500 to-orange-600"
          >
            <Pause className="h-5 w-5 mr-2" />
            Pause
          </Button>
        )}

        {isPaused && (
          <Button
            size="lg"
            onClick={resumeReading}
            disabled={disabled}
            className="min-w-[180px] font-bold bg-gradient-to-r from-emerald-500 to-green-600"
          >
            <Play className="h-5 w-5 mr-2" />
            Resume
          </Button>
        )}
      </div>

      {/* Listening Indicator */}
      <AnimatePresence>
        {isListening && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 text-emerald-400"
          >
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
              <Mic className="h-5 w-5" />
            </motion.div>
            <span className="text-sm font-medium">Listening... Say the word!</span>
            <div className="flex items-center gap-0.5 ml-2">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-emerald-400 rounded-full"
                  animate={{ height: ['8px', '20px', '8px'] }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {isPaused && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 text-amber-400"
          >
            <MicOff className="h-5 w-5" />
            <span className="text-sm font-medium">Paused - Click Resume to continue</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
