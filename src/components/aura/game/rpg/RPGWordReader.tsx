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
  baseWordIndex?: number;
}

type RecognitionState = 'idle' | 'starting' | 'listening' | 'processing' | 'paused' | 'error';

const soundEffects = new SoundEffects();

export const RPGWordReader = ({
  words,
  onResult,
  disabled = false,
  streak = 0,
  batchSize = 10,
  baseWordIndex = 0,
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
  const watchdogTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // CRITICAL: Lock the target word when recognition starts to prevent mismatch
  const lockedTargetWordRef = useRef<string>("");
  const lockedTargetIndexRef = useRef<number>(0);
  // Word generation ID - increments when words prop changes to ignore late events
  const wordGenerationRef = useRef<number>(0);
  const lockedGenerationRef = useRef<number>(0);
  
  // PERSISTENT MIC: Single source of truth for "should mic be on"
  const wantsListeningRef = useRef(false);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Keep refs in sync
  useEffect(() => {
    stateRef.current = recognitionState;
  }, [recognitionState]);
  
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // CRITICAL: When words array changes, increment generation to invalidate old recognition
  useEffect(() => {
    wordGenerationRef.current += 1;
    // Reset state when words change
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setSpokenText("");
    setFeedback(null);
  }, [words]);

  // Get current batch of words
  const currentBatch = words?.slice(0, Math.min(batchSize, words?.length || 0)) || [];
  const currentWord = currentBatch[currentIndex] || "";
  const cleanWord = currentWord.replace(/[^a-zA-Z']/g, '');

  // Clear all timeouts
  const clearAllTimeouts = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    if (watchdogTimeoutRef.current) {
      clearTimeout(watchdogTimeoutRef.current);
      watchdogTimeoutRef.current = null;
    }
  }, []);

  // Abort current recognition
  const abortRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  // Full cleanup
  const cleanup = useCallback(() => {
    clearAllTimeouts();
    abortRecognition();
  }, [clearAllTimeouts, abortRecognition]);

  // Stop recognition completely (user pause or component unmount)
  const stopRecognition = useCallback(() => {
    wantsListeningRef.current = false;
    cleanup();
    setRecognitionState('idle');
    // Release mic stream
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
  }, [cleanup]);

  // CENTRALIZED restart logic
  const scheduleRestart = useCallback((reason: string, delay: number = 150) => {
    if (!wantsListeningRef.current) return;
    if (isProcessingRef.current) return;
    
    console.log(`[RPGWordReader] Scheduling restart (${reason}) in ${delay}ms`);
    
    restartTimeoutRef.current = setTimeout(() => {
      if (wantsListeningRef.current && !isProcessingRef.current) {
        startRecognition();
      }
    }, delay);
  }, []);

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
    
    // Report absolute index: baseWordIndex + local index
    onResult(true, word, baseWordIndex + lockedTargetIndexRef.current);
    
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setSpokenText("");
      isProcessingRef.current = false;
      
      const nextIndex = lockedTargetIndexRef.current + 1;
      if (nextIndex < currentBatch.length) {
        setCurrentIndex(nextIndex);
        currentIndexRef.current = nextIndex;
        setRecognitionState('idle');
        // Auto-restart immediately if wantsListening
        scheduleRestart('correct-next', 100);
      } else {
        // Batch complete - notify parent can load next batch
        setRecognitionState('idle');
        setCurrentIndex(0);
        currentIndexRef.current = 0;
      }
    }, 350);
  }, [streak, currentBatch.length, onResult, cleanup, baseWordIndex, scheduleRestart]);

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
    
    // Report absolute index
    onResult(false, spoken, baseWordIndex + lockedTargetIndexRef.current);
    
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setSpokenText("");
      isProcessingRef.current = false;
      
      const nextIndex = lockedTargetIndexRef.current + 1;
      if (nextIndex < currentBatch.length) {
        setCurrentIndex(nextIndex);
        currentIndexRef.current = nextIndex;
        setRecognitionState('idle');
        scheduleRestart('incorrect-next', 200);
      } else {
        setRecognitionState('idle');
        setCurrentIndex(0);
        currentIndexRef.current = 0;
      }
    }, 600);
  }, [currentBatch.length, onResult, cleanup, baseWordIndex, scheduleRestart]);

  // Start recognition - the core function
  const startRecognition = useCallback(() => {
    if (disabled || isProcessingRef.current) return;
    if (stateRef.current === 'listening' || stateRef.current === 'starting') return;
    
    const wordToMatch = currentBatch[currentIndexRef.current]?.replace(/[^a-zA-Z']/g, '');
    if (!wordToMatch) return;
    
    // CRITICAL: Lock the target word, index, AND generation at the START of recognition
    lockedTargetWordRef.current = wordToMatch;
    lockedTargetIndexRef.current = currentIndexRef.current;
    lockedGenerationRef.current = wordGenerationRef.current;
    
    cleanup();
    unlockSpeechSynthesis();
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    setRecognitionState('starting');
    setSpokenText("");
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 5;
    
    const capturedGeneration = wordGenerationRef.current;

    recognition.onstart = () => {
      if (stateRef.current === 'starting') {
        setRecognitionState('listening');
        setSpokenText("");
        setFeedback(null);
        
        // Start silence watchdog - if no final result in 5s, restart
        watchdogTimeoutRef.current = setTimeout(() => {
          if (wantsListeningRef.current && stateRef.current === 'listening' && !isProcessingRef.current) {
            console.log('[RPGWordReader] Watchdog: no result, restarting...');
            abortRecognition();
            scheduleRestart('watchdog', 100);
          }
        }, 5000);
      }
    };

    recognition.onresult = (event: any) => {
      if (isProcessingRef.current) return;
      
      // Clear watchdog on any result
      if (watchdogTimeoutRef.current) {
        clearTimeout(watchdogTimeoutRef.current);
        watchdogTimeoutRef.current = null;
      }
      
      // CRITICAL: Ignore late results from a previous word generation
      if (capturedGeneration !== wordGenerationRef.current) {
        console.warn('[RPGWordReader] Ignoring stale recognition result');
        return;
      }
      
      const result = event.results[0];
      const transcript = result[0].transcript.trim().toLowerCase();
      
      if (lockedTargetWordRef.current && lockedGenerationRef.current === wordGenerationRef.current) {
        setSpokenText(transcript);
      }

      if (result.isFinal) {
        const targetWord = lockedTargetWordRef.current;
        
        if (!targetWord) {
          console.warn('No locked target word - ignoring result');
          return;
        }
        
        if (lockedGenerationRef.current !== wordGenerationRef.current) {
          console.warn('[RPGWordReader] Ignoring stale final result');
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
      // Clear watchdog
      if (watchdogTimeoutRef.current) {
        clearTimeout(watchdogTimeoutRef.current);
        watchdogTimeoutRef.current = null;
      }
      
      if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'aborted') {
        // Recoverable - schedule restart if we still want to listen
        if (wantsListeningRef.current && !isProcessingRef.current) {
          scheduleRestart(`error-${event.error}`, 200);
        }
      } else {
        console.error('[RPGWordReader] Recognition error:', event.error);
        setRecognitionState('error');
      }
    };

    recognition.onend = () => {
      // Clear watchdog
      if (watchdogTimeoutRef.current) {
        clearTimeout(watchdogTimeoutRef.current);
        watchdogTimeoutRef.current = null;
      }
      
      // If we still want to listen and not processing, restart
      if (wantsListeningRef.current && !isProcessingRef.current && stateRef.current !== 'paused') {
        scheduleRestart('onend', 100);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      setRecognitionState('error');
      // Try again after delay
      if (wantsListeningRef.current) {
        scheduleRestart('start-failed', 500);
      }
    }
  }, [disabled, currentBatch, cleanup, handleCorrect, handleIncorrect, abortRecognition, scheduleRestart]);

  // Warm up mic permission to reduce errors
  const warmUpMic = useCallback(async () => {
    try {
      if (!micStreamRef.current) {
        micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('[RPGWordReader] Mic warmed up');
      }
    } catch (e) {
      console.warn('[RPGWordReader] Could not warm up mic:', e);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, [stopRecognition]);

  // Control functions
  const startReading = async () => {
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    isProcessingRef.current = false;
    wantsListeningRef.current = true;
    
    // Warm up mic first
    await warmUpMic();
    
    startRecognition();
  };

  const pauseReading = () => {
    wantsListeningRef.current = false;
    cleanup();
    setRecognitionState('paused');
  };

  const resumeReading = () => {
    wantsListeningRef.current = true;
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
            className="flex flex-col items-center gap-2"
          >
            <motion.div
              className="flex items-center gap-2 text-emerald-400"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Mic className="h-5 w-5" />
              <span className="font-medium">Listening...</span>
            </motion.div>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(i => (
                <motion.div
                  key={i}
                  className="w-1 bg-emerald-400 rounded-full"
                  animate={{ height: [8, 20, 8] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.5,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paused Indicator */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-amber-400"
          >
            <MicOff className="h-5 w-5" />
            <span>Paused - tap Resume to continue</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
