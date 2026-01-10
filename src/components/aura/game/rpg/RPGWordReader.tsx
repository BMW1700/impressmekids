import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Check, X, Pause, Play, RotateCcw, AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { playCorrectPronunciation, SoundEffects } from "@/lib/pronunciationPlayer";
import { unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";
import { ensureMicrophoneAccess } from "@/lib/micDiagnostics";
import { MicTroubleshooterModal } from "@/components/mic/MicTroubleshooterModal";
import { getWordEmoji } from "@/lib/wordEmojiMap";
import { RPGEmojiPop } from "./RPGEmojiPop";

interface EmojiPopup {
  id: number;
  emoji: string;
  word: string;
}

interface RPGWordReaderProps {
  words: string[];
  onResult: (correct: boolean, spokenWord: string, wordIndex: number) => void;
  disabled?: boolean;
  streak?: number;
  batchSize?: number;
  enableEchoRetry?: boolean;
  mode?: 'normal' | 'fast'; // Fast mode for Elara - more lenient, quicker feedback
}

type RecognitionState = 'idle' | 'listening' | 'processing' | 'paused' | 'echo_retry';

const soundEffects = new SoundEffects();
let emojiPopId = 0;

export const RPGWordReader = ({
  words,
  onResult,
  disabled = false,
  streak = 0,
  batchSize = 5,
  enableEchoRetry = true,
  mode = 'normal',
}: RPGWordReaderProps) => {
  // Core state
  const [recognitionState, setRecognitionState] = useState<RecognitionState>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [spokenText, setSpokenText] = useState<string>("");
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());
  const [micError, setMicError] = useState<string | null>(null);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);
  
  // Emoji pop state
  const [emojiPopups, setEmojiPopups] = useState<EmojiPopup[]>([]);
  
  // Echo retry state
  const [echoCountdown, setEchoCountdown] = useState(0);
  
  // Refs - the key is keeping ONE recognition instance alive
  const recognitionRef = useRef<any>(null);
  const isRecognitionRunningRef = useRef(false);
  const currentIndexRef = useRef(0);
  const isProcessingRef = useRef(false);
  const shouldBeListeningRef = useRef(false);
  
  // Timeout refs
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const echoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const echoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Word generation tracking
  const wordGenerationRef = useRef(0);
  
  // Stable key for detecting actual word content changes (not just array reference)
  const wordsKey = useMemo(() => words?.join("|") || "", [words]);
  const prevWordsKeyRef = useRef(wordsKey);

  // Keep refs in sync
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Only reset when word CONTENT actually changes, not on every render
  useEffect(() => {
    if (prevWordsKeyRef.current !== wordsKey) {
      console.log('[RPGWordReader] Words changed, resetting. Old:', prevWordsKeyRef.current.substring(0, 50), 'New:', wordsKey.substring(0, 50));
      prevWordsKeyRef.current = wordsKey;
      wordGenerationRef.current += 1;
      setCurrentIndex(0);
      currentIndexRef.current = 0;
      setSpokenText("");
      setFeedback(null);
      setCompletedWords(new Set());
      isProcessingRef.current = false;
    }
  }, [wordsKey]);

  // Get current batch - memoized for stability
  const currentBatch = useMemo(() => {
    return words?.slice(0, Math.min(batchSize, words?.length || 0)) || [];
  }, [words, batchSize]);
  const currentWord = currentBatch[currentIndex] || "";
  const cleanWord = currentWord.replace(/[^a-zA-Z']/g, '');

  // Clear all timeouts
  const clearAllTimeouts = useCallback(() => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    if (echoTimeoutRef.current) {
      clearTimeout(echoTimeoutRef.current);
      echoTimeoutRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (echoIntervalRef.current) {
      clearInterval(echoIntervalRef.current);
      echoIntervalRef.current = null;
    }
  }, []);

  // Stop recognition completely
  const stopRecognitionSession = useCallback(() => {
    shouldBeListeningRef.current = false;
    clearAllTimeouts();
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore - may already be stopped
      }
    }
    isRecognitionRunningRef.current = false;
  }, [clearAllTimeouts]);

  // Advance to next word (UI only, doesn't touch recognition)
  const advanceToNextWord = useCallback((fromIndex: number) => {
    const nextIndex = fromIndex + 1;
    if (nextIndex < currentBatch.length) {
      setCurrentIndex(nextIndex);
      currentIndexRef.current = nextIndex;
      return true;
    } else {
      // Batch complete
      setCurrentIndex(0);
      currentIndexRef.current = 0;
      stopRecognitionSession();
      setRecognitionState('idle');
      return false;
    }
  }, [currentBatch.length, stopRecognitionSession]);

  // Handle correct word
  const handleCorrect = useCallback((spokenWord: string, wordIndex: number) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    setFeedback('correct');
    setSpokenText(spokenWord);
    setEchoCountdown(0);
    soundEffects.correctWord();
    
    // Clear echo timeout if active
    if (echoTimeoutRef.current) {
      clearTimeout(echoTimeoutRef.current);
      echoTimeoutRef.current = null;
    }
    if (echoIntervalRef.current) {
      clearInterval(echoIntervalRef.current);
      echoIntervalRef.current = null;
    }
    
    const newStreak = streak + 1;
    if (newStreak > 0 && newStreak % 5 === 0) {
      soundEffects.streakAchieved();
    }
    
    // EMOJI LEARNING: Trigger emoji pop for meaningful words
    const targetWord = currentBatch[wordIndex]?.replace(/[^a-zA-Z']/g, '') || '';
    const emoji = getWordEmoji(targetWord);
    if (emoji) {
      const newPopup: EmojiPopup = {
        id: ++emojiPopId,
        emoji,
        word: targetWord,
      };
      setEmojiPopups(prev => [...prev, newPopup]);
    }
    
    // Mark word as completed
    setCompletedWords(prev => new Set([...prev, wordIndex]));
    onResult(true, spokenWord, wordIndex);
    
    // CRITICAL FIX: Advance index IMMEDIATELY so next speech results compare to next word
    const nextIndex = wordIndex + 1;
    const batch = words?.slice(0, Math.min(batchSize, words?.length || 0)) || [];
    const hasMoreWords = nextIndex < batch.length;
    
    if (hasMoreWords) {
      // Update refs IMMEDIATELY before any async delays
      setCurrentIndex(nextIndex);
      currentIndexRef.current = nextIndex;
      console.log('[RPGWordReader] Advanced to word index:', nextIndex, 'target:', batch[nextIndex]);
    }
    
    // Brief pause to show feedback, then clear UI
    // FAST MODE: shorter delays for Elara
    const feedbackDelay = mode === 'fast' ? 150 : 300;
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setSpokenText("");
      isProcessingRef.current = false;
      
      if (hasMoreWords) {
        setRecognitionState('listening');
      } else {
        // Batch complete
        setCurrentIndex(0);
        currentIndexRef.current = 0;
        stopRecognitionSession();
        setRecognitionState('idle');
      }
    }, feedbackDelay);
  }, [streak, onResult, words, batchSize, stopRecognitionSession, mode]);

  // Handle incorrect word (after echo fails or no echo)
  const handleIncorrectFinal = useCallback((spokenWord: string, expectedWord: string, wordIndex: number) => {
    isProcessingRef.current = true;
    
    setFeedback('incorrect');
    setSpokenText(spokenWord);
    setEchoCountdown(0);
    soundEffects.incorrectWord();
    
    // Play correct pronunciation
    setTimeout(() => {
      playCorrectPronunciation(expectedWord);
    }, 300);
    
    onResult(false, spokenWord, wordIndex);
    
    // CRITICAL FIX: Advance index IMMEDIATELY so next speech results compare to next word
    const nextIndex = wordIndex + 1;
    const batch = words?.slice(0, Math.min(batchSize, words?.length || 0)) || [];
    const hasMoreWords = nextIndex < batch.length;
    
    if (hasMoreWords) {
      // Update refs IMMEDIATELY before any async delays
      setCurrentIndex(nextIndex);
      currentIndexRef.current = nextIndex;
      console.log('[RPGWordReader] Advanced to word index:', nextIndex, 'target:', batch[nextIndex]);
    }
    
    // FAST MODE: shorter delays for Elara
    const feedbackDelay = mode === 'fast' ? 350 : 700;
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setSpokenText("");
      isProcessingRef.current = false;
      
      if (hasMoreWords) {
        setRecognitionState('listening');
      } else {
        // Batch complete
        setCurrentIndex(0);
        currentIndexRef.current = 0;
        stopRecognitionSession();
        setRecognitionState('idle');
      }
    }, feedbackDelay);
  }, [onResult, words, batchSize, stopRecognitionSession, mode]);

  // Start echo retry mode
  const startEchoRetry = useCallback((spokenWord: string, expectedWord: string, wordIndex: number) => {
    setRecognitionState('echo_retry');
    setSpokenText(spokenWord);
    setEchoCountdown(1.5);
    
    // Countdown display
    let remaining = 1.5;
    echoIntervalRef.current = setInterval(() => {
      remaining -= 0.1;
      setEchoCountdown(Math.max(0, remaining));
      if (remaining <= 0 && echoIntervalRef.current) {
        clearInterval(echoIntervalRef.current);
        echoIntervalRef.current = null;
      }
    }, 100);
    
    // Timeout - if echo window expires, finalize as incorrect
    echoTimeoutRef.current = setTimeout(() => {
      if (echoIntervalRef.current) {
        clearInterval(echoIntervalRef.current);
        echoIntervalRef.current = null;
      }
      // Only process if still in echo retry (not already handled)
      if (!isProcessingRef.current) {
        handleIncorrectFinal(spokenWord, expectedWord, wordIndex);
      }
    }, 1500);
  }, [handleIncorrectFinal]);

  // Get target word from ref-synced index (avoids stale closure)
  const getTargetWord = useCallback((index: number) => {
    const batch = words?.slice(0, Math.min(batchSize, words?.length || 0)) || [];
    return batch[index]?.replace(/[^a-zA-Z']/g, '') || '';
  }, [words, batchSize]);

  // State ref for echo retry (avoid stale closure)
  const recognitionStateRef = useRef<RecognitionState>('idle');
  useEffect(() => {
    recognitionStateRef.current = recognitionState;
  }, [recognitionState]);

  // Process speech result
  const processResult = useCallback((transcript: string, alternatives: string[]) => {
    if (isProcessingRef.current) return;
    
    const wordIndex = currentIndexRef.current;
    const targetWord = getTargetWord(wordIndex);
    
    console.log('[RPGWordReader] Processing:', { transcript, targetWord, wordIndex });
    
    if (!targetWord) return;
    
    // Check all alternatives for a match
    let matched = false;
    let bestSpoken = transcript;
    
    // Check alternatives first
    for (const alt of alternatives) {
      const altWords = alt.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      for (const word of altWords) {
        if (isWordMatchLenient(word, targetWord)) {
          matched = true;
          bestSpoken = word;
          break;
        }
      }
      if (matched) break;
    }
    
    // Check main transcript words
    if (!matched) {
      const wordsSpoken = transcript.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      for (const word of wordsSpoken) {
        if (isWordMatchLenient(word, targetWord)) {
          matched = true;
          bestSpoken = word;
          break;
        }
      }
    }
    
    console.log('[RPGWordReader] Match result:', { matched, bestSpoken, targetWord });
    
    if (matched) {
      handleCorrect(bestSpoken, wordIndex);
    } else {
      // Check if we should do echo retry - use ref to avoid stale state
      const currentRecState = recognitionStateRef.current;
      if (enableEchoRetry && currentRecState !== 'echo_retry') {
        startEchoRetry(transcript, targetWord, wordIndex);
      } else if (currentRecState === 'echo_retry') {
        // Already in echo - this attempt also failed, but let timeout handle final
        setSpokenText(transcript);
      } else {
        handleIncorrectFinal(transcript, targetWord, wordIndex);
      }
    }
  }, [getTargetWord, enableEchoRetry, handleCorrect, handleIncorrectFinal, startEchoRetry]);

  // Create and start the recognition session (ONE instance, kept alive)
  // FIXED: Now requires mic access before starting
  const startRecognitionSession = useCallback(async () => {
    if (disabled) return;
    if (isRecognitionRunningRef.current) return;
    
    setMicError(null);
    
    // STEP 1: Ensure mic access first
    const micResult = await ensureMicrophoneAccess(false);
    if (!micResult.success) {
      console.error('[RPGWordReader] Mic access failed:', micResult.error);
      setMicError(micResult.error?.userMessage || 'Microphone access failed');
      setRecognitionState('idle');
      return;
    }
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      console.error('[RPGWordReader] Speech recognition not supported');
      setMicError('Speech recognition not supported in this browser');
      return;
    }
    
    unlockSpeechSynthesis();
    shouldBeListeningRef.current = true;
    
    // Create ONE recognition instance
    const recognition = new SpeechRecognition();
    recognition.continuous = true;  // KEY: Keep listening continuously
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 5;
    
    recognition.onstart = () => {
      console.log('[RPGWordReader] Recognition started');
      isRecognitionRunningRef.current = true;
      if (!isProcessingRef.current) {
        setRecognitionState('listening');
      }
    };
    
    // Track which results we've already processed to avoid double-processing
    const processedResultsRef = { current: new Set<number>() };
    
    recognition.onresult = (event: any) => {
      // CRITICAL FIX: Use event.resultIndex to only process NEW results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript?.trim() || '';
        
        // Show interim results for the latest
        if (!result.isFinal) {
          if (!isProcessingRef.current && i === event.results.length - 1) {
            setSpokenText(transcript.toLowerCase());
            
            // FAST MODE: Process interim results for quicker matching (Elara only)
            if (mode === 'fast' && !isProcessingRef.current) {
              const wordIdx = currentIndexRef.current;
              const targetWord = getTargetWord(wordIdx);
              if (targetWord) {
                const wordsSpoken = transcript.toLowerCase().split(/\s+/).filter(w => w.length > 0);
                for (const word of wordsSpoken) {
                  if (isWordMatchLenient(word, targetWord)) {
                    // Match found in interim - process immediately!
                    processedResultsRef.current.add(i);
                    handleCorrect(word, wordIdx);
                    return;
                  }
                }
              }
            }
          }
          continue;
        }
        
        // Skip if we already processed this result index
        if (processedResultsRef.current.has(i)) {
          continue;
        }
        processedResultsRef.current.add(i);
        
        // Final result - process it
        const wordIdx = currentIndexRef.current;
        console.log('[RPGWordReader] Final transcript:', transcript, '| wordIndex:', wordIdx, '| target:', getTargetWord(wordIdx));
        
        // Collect alternatives
        const alternatives: string[] = [];
        for (let j = 0; j < result.length; j++) {
          const alt = result[j]?.transcript?.trim() || '';
          if (alt) alternatives.push(alt);
        }
        
        processResult(transcript, alternatives);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.log('[RPGWordReader] Recognition error:', event.error);
      
      if (event.error === 'aborted') {
        isRecognitionRunningRef.current = false;
        return;
      }
      
      // Handle permission errors
      if (event.error === 'not-allowed') {
        setMicError('Microphone access was denied.');
        isRecognitionRunningRef.current = false;
        setRecognitionState('idle');
        return;
      }
      
      // For recoverable errors, try to restart
      if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'network') {
        isRecognitionRunningRef.current = false;
        
        if (shouldBeListeningRef.current && !isProcessingRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            if (shouldBeListeningRef.current) {
              startRecognitionSession();
            }
          }, 300);
        }
      }
    };
    
    recognition.onend = () => {
      console.log('[RPGWordReader] Recognition ended');
      isRecognitionRunningRef.current = false;
      
      // Auto-restart if we should still be listening
      if (shouldBeListeningRef.current && !isProcessingRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          if (shouldBeListeningRef.current && !isRecognitionRunningRef.current) {
            console.log('[RPGWordReader] Auto-restarting recognition');
            startRecognitionSession();
          }
        }, 100);
      }
    };
    
    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      console.error('[RPGWordReader] Failed to start:', e);
      isRecognitionRunningRef.current = false;
      
      // Retry after delay
      if (shouldBeListeningRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          if (shouldBeListeningRef.current) {
            startRecognitionSession();
          }
        }, 500);
      }
    }
  }, [disabled, processResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldBeListeningRef.current = false;
      clearAllTimeouts();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [clearAllTimeouts]);

  // Control functions
  const startReading = useCallback(() => {
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    isProcessingRef.current = false;
    setCompletedWords(new Set());
    setFeedback(null);
    setSpokenText("");
    startRecognitionSession();
  }, [startRecognitionSession]);

  const pauseReading = useCallback(() => {
    stopRecognitionSession();
    setRecognitionState('paused');
  }, [stopRecognitionSession]);

  const resumeReading = useCallback(() => {
    startRecognitionSession();
  }, [startRecognitionSession]);

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

  const isListening = recognitionState === 'listening';
  const isPaused = recognitionState === 'paused';
  const isIdle = recognitionState === 'idle';
  const isEchoRetry = recognitionState === 'echo_retry';
  const isActive = isListening || isEchoRetry;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Active Indicator */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full
            ${isEchoRetry 
              ? 'bg-amber-500/20 border border-amber-500/40' 
              : 'bg-emerald-500/20 border border-emerald-500/40'
            }`}
        >
          <motion.div
            className={`w-3 h-3 rounded-full ${isEchoRetry ? 'bg-amber-400' : 'bg-emerald-400'}`}
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
          <span className={`text-sm font-medium ${isEchoRetry ? 'text-amber-300' : 'text-emerald-300'}`}>
            {isEchoRetry ? 'Try Again!' : 'Mic Active - Keep Reading!'}
          </span>
        </motion.div>
      )}
      
      {/* Multi-Word Queue Display */}
      <div className="flex flex-wrap gap-2 justify-center max-w-md">
        {currentBatch.map((word, index) => {
          const clean = word.replace(/[^a-zA-Z']/g, '');
          const isActiveWord = index === currentIndex;
          const isCompleted = completedWords.has(index);
          
          return (
            <motion.div
              key={`${word}-${index}`}
              className={`px-4 py-2 rounded-lg font-medium transition-all
                ${isActiveWord 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white scale-110 shadow-lg shadow-blue-500/40' 
                  : isCompleted 
                    ? 'bg-emerald-500/60 text-emerald-100 scale-95' 
                    : 'bg-slate-700/60 text-slate-400'
                }`}
              animate={isActiveWord ? { scale: [1.1, 1.15, 1.1] } : {}}
              transition={{ repeat: isActiveWord ? Infinity : 0, duration: 1.2 }}
            >
              <div className="flex items-center gap-1.5">
                {isCompleted && <Check className="h-3.5 w-3.5" />}
                <span className={isActiveWord ? 'text-lg' : 'text-sm'}>{clean}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Current Word - Large Display */}
      <motion.div
        className={`relative px-12 py-6 rounded-2xl border-2 text-center min-w-[280px]
          ${feedback === 'correct' 
            ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)]' 
            : feedback === 'incorrect'
            ? 'bg-red-500/20 border-red-400 shadow-[0_0_30px_rgba(248,113,113,0.5)]'
            : isEchoRetry
            ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.5)]'
            : 'bg-slate-800/80 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
          }`}
        animate={
          feedback === 'correct' ? { scale: [1, 1.05, 1] } :
          feedback === 'incorrect' ? { x: [-5, 5, -5, 5, 0] } :
          isEchoRetry ? { scale: [1, 1.02, 1] } : {}
        }
        transition={{ duration: 0.3, repeat: isEchoRetry ? Infinity : 0 }}
      >
        {/* Feedback Icon */}
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

        {/* Echo Retry Countdown */}
        {isEchoRetry && echoCountdown > 0 && (
          <motion.div
            className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-amber-600 px-3 py-1 rounded-full"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <RotateCcw className="h-4 w-4 text-white animate-spin" />
            <span className="text-white text-sm font-bold">ECHO! {echoCountdown.toFixed(1)}s</span>
          </motion.div>
        )}

        <motion.p className="text-4xl md:text-5xl font-bold text-white tracking-wide">
          {cleanWord || "Ready"}
        </motion.p>

        {spokenText && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mt-2 text-sm 
              ${feedback === 'correct' ? 'text-emerald-300' : 
                feedback === 'incorrect' ? 'text-red-300' :
                isEchoRetry ? 'text-amber-300' : 'text-slate-400'}`}
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
          disabled={isActive || feedback !== null || !cleanWord}
          className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
        >
          <Volume2 className="h-5 w-5 mr-2" />
          Hear
        </Button>

        {isIdle && (
          <Button
            size="lg"
            onClick={startReading}
            disabled={disabled || !cleanWord}
            className="min-w-[180px] font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
          >
            <Play className="h-5 w-5 mr-2" />
            Start Reading
          </Button>
        )}

        {isActive && (
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
        {isActive && feedback === null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`flex items-center gap-2 ${isEchoRetry ? 'text-amber-400' : 'text-emerald-400'}`}
          >
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
              <Mic className="h-5 w-5" />
            </motion.div>
            <span className="text-sm font-medium">
              {isEchoRetry ? "Try again! Say the word!" : "Listening... Say the word!"}
            </span>
            <div className="flex items-center gap-0.5 ml-2">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`w-1 rounded-full ${isEchoRetry ? 'bg-amber-400' : 'bg-emerald-400'}`}
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

      {/* Mic Error Display */}
      {micError && (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-2 bg-red-500/20 text-red-300 px-4 py-2 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{micError}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTroubleshooter(true)}
            className="text-red-300 border-red-400/50"
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Fix
          </Button>
        </div>
      )}

      {/* Mic Troubleshooter Modal */}
      <MicTroubleshooterModal
        open={showTroubleshooter}
        onOpenChange={setShowTroubleshooter}
        lastError={micError || undefined}
        onRetry={startReading}
      />
      
      {/* Emoji Learning Popups */}
      <AnimatePresence>
        {emojiPopups.map(popup => (
          <RPGEmojiPop
            key={popup.id}
            emoji={popup.emoji}
            word={popup.word}
            onComplete={() => setEmojiPopups(prev => prev.filter(p => p.id !== popup.id))}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
