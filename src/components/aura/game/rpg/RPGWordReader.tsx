import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Check, X, Pause, Play, RotateCcw, AlertCircle, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { playCorrectPronunciation, SoundEffects } from "@/lib/pronunciationPlayer";
import { unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";
import { MicTroubleshooterModal } from "@/components/mic/MicTroubleshooterModal";
import { getWordEmoji } from "@/lib/wordEmojiMap";
import { RPGEmojiManager } from "./RPGEmojiPop";
import type { EmojiPopup as EmojiPopupType } from "./RPGEmojiPop";
import { WordFeedbackOverlay } from "./WordFeedbackOverlay";

interface LocalEmojiPopup {
  id: number;
  emoji: string;
  word: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
}

// Track word result state for color coding
export type WordResultState = 'pending' | 'correct' | 'missed' | 'retried';

export interface WordAttempt {
  word: string;
  result: WordResultState;
  spokenAs?: string;
  attempts: number;
}

interface RPGWordReaderProps {
  words: string[];
  /** Called with response time in ms for speed-based damage calculation */
  onResult: (correct: boolean, spokenWord: string, wordIndex: number, responseTimeMs?: number) => void;
  onBatchComplete?: (results: WordAttempt[]) => void;
  onRetrySuccess?: (wordIndex: number) => void; // Called when a retried word is read correctly (for HP healing)
  onMiss?: (spokenWord: string, wordIndex: number) => void; // Called immediately when first attempt is incorrect (for accuracy tracking)
  disabled?: boolean;
  streak?: number;
  batchSize?: number;
  enableEchoRetry?: boolean;
  mode?: 'normal' | 'fast'; // Fast mode for Elara - more lenient, quicker feedback
}

type RecognitionState = 'idle' | 'listening' | 'processing' | 'paused' | 'echo_retry' | 'waiting_action';

const soundEffects = new SoundEffects();
let emojiPopId = 0;
const WORD_TRANSITION_ARM_MS = 260;

interface SpeechTargetToken {
  id: number;
  generation: number;
  index: number;
  word: string;
  armedAt: number;
}

// Helper: Simple phonetic breakdown for learning hints
const getPhoneticHint = (word: string): string => {
  const vowels = 'aeiouy';
  let syllables: string[] = [];
  let currentSyllable = '';
  let prevWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i].toLowerCase();
    const isVowel = vowels.includes(char);
    currentSyllable += word[i];
    
    if (isVowel && !prevWasVowel && currentSyllable.length > 1) {
      if (i + 1 < word.length && !vowels.includes(word[i + 1].toLowerCase())) {
        syllables.push(currentSyllable);
        currentSyllable = '';
      }
    }
    prevWasVowel = isVowel;
  }
  
  if (currentSyllable) {
    syllables.push(currentSyllable);
  }
  
  if (syllables.length <= 1) {
    return word.toUpperCase();
  }
  
  return syllables.join(' • ');
};

// Helper: Get a helpful tip for the word
const getWordTip = (word: string): string => {
  const lowerWord = word.toLowerCase();
  
  if (lowerWord.includes('kn')) return "The 'k' in 'kn' is silent!";
  if (lowerWord.includes('wr')) return "The 'w' in 'wr' is silent!";
  if (lowerWord.includes('gh') && !lowerWord.endsWith('gh')) return "The 'gh' is often silent!";
  if (lowerWord.includes('mb') && lowerWord.endsWith('mb')) return "The 'b' at the end is silent!";
  if (lowerWord.includes('th')) return "Make the 'th' sound with your tongue!";
  if (lowerWord.includes('ough')) return "The 'ough' has a special sound!";
  if (lowerWord.includes('tion')) return "The 'tion' sounds like 'shun'!";
  if (lowerWord.includes('ight')) return "The 'ight' sounds like 'ite'!";
  if (/(.)\1/.test(lowerWord)) return "Notice the double letters!";
  if (word.length >= 8) return "Break it into smaller parts!";
  
  return "Sound it out slowly!";
};

export const RPGWordReader = ({
  words,
  onResult,
  onBatchComplete,
  onRetrySuccess,
  onMiss,
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
  
  // Word result tracking for color states (green/yellow/red)
  const [wordResults, setWordResults] = useState<Map<number, WordAttempt>>(new Map());
  const [canRetry, setCanRetry] = useState(true);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [pendingIncorrectWord, setPendingIncorrectWord] = useState<{ word: string; spoken: string; index: number } | null>(null);
  
  // Emoji pop state
  const [emojiPopups, setEmojiPopups] = useState<LocalEmojiPopup[]>([]);
  const wordQueueRef = useRef<HTMLDivElement | null>(null);
  
  // Echo retry state
  const [echoCountdown, setEchoCountdown] = useState(0);
  
  // Refs - the key is keeping ONE recognition instance alive
  const recognitionRef = useRef<any>(null);
  const isRecognitionRunningRef = useRef(false);
  const isRecognitionStartingRef = useRef(false);
  const speechSessionIdRef = useRef(0);
  const currentIndexRef = useRef(0);
  const isProcessingRef = useRef(false);
  const shouldBeListeningRef = useRef(false);
  const isWordTransitioningRef = useRef(false);
  const speechTargetTokenRef = useRef<SpeechTargetToken>({
    id: 0,
    generation: 0,
    index: 0,
    word: '',
    armedAt: Date.now() + WORD_TRANSITION_ARM_MS,
  });
  const startRecognitionRef = useRef<(() => void) | null>(null);
  
  // Timeout refs
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const echoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const echoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const targetArmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Response time tracking for patent-critical speed-based damage
  const wordDisplayTimestampRef = useRef<number>(0);
  
  // Word generation tracking
  const wordGenerationRef = useRef(0);
  
  // Stable key for detecting actual word content changes (not just array reference)
  const wordsKey = useMemo(() => words?.join("|") || "", [words]);
  const prevWordsKeyRef = useRef(wordsKey);
  // Guard against duplicate onBatchComplete from late-arriving final transcripts
  const batchCompletedRef = useRef(false);

  // CRITICAL: Refs to current props so the long-lived recognition.onresult
  // closure always reads the *current* batch, not the batch that existed
  // when recognition was first started. Without this, after batch N
  // completes the live mic still grades batch N+1's first word against
  // batch N's first word (already completed) and marks it wrong.
  const wordsRef = useRef(words);
  const batchSizeRef = useRef(batchSize);
  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { batchSizeRef.current = batchSize; }, [batchSize]);

  // Keep refs in sync
  useEffect(() => {
    currentIndexRef.current = currentIndex;
    // Record timestamp when a new word becomes the active target
    wordDisplayTimestampRef.current = Date.now();
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
      setWordResults(new Map());
      setCanRetry(true);
      setShowFeedbackOverlay(false);
      setPendingIncorrectWord(null);
      isRetryAttemptRef.current = false;
      isProcessingRef.current = false;
      isWordTransitioningRef.current = true;
      batchCompletedRef.current = false;
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = null;
      }
      if (echoTimeoutRef.current) {
        clearTimeout(echoTimeoutRef.current);
        echoTimeoutRef.current = null;
      }
      if (echoIntervalRef.current) {
        clearInterval(echoIntervalRef.current);
        echoIntervalRef.current = null;
      }
      // Clear processed-finals tracker so the next batch's first final
      // result isn't accidentally skipped as "already handled".
      processedFinalsRef.current.clear();
      const activeRecognition = recognitionRef.current;
      if (activeRecognition) {
        speechSessionIdRef.current += 1;
        recognitionRef.current = null;
        isRecognitionRunningRef.current = false;
        isRecognitionStartingRef.current = false;
        try {
          if (typeof activeRecognition.abort === 'function') activeRecognition.abort();
          else activeRecognition.stop();
        } catch (e) {}
      }
      if (shouldBeListeningRef.current) {
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = setTimeout(() => {
          if (shouldBeListeningRef.current && !recognitionRef.current && !isRecognitionRunningRef.current && !isRecognitionStartingRef.current) {
            startRecognitionRef.current?.();
          }
        }, WORD_TRANSITION_ARM_MS + 120);
      }
    }
  }, [wordsKey]);

  // Get current batch - memoized for stability
  const currentBatch = useMemo(() => {
    return words?.slice(0, Math.min(batchSize, words?.length || 0)) || [];
  }, [words, batchSize]);
  const currentWord = currentBatch[currentIndex] || "";
  const cleanWord = currentWord.replace(/[^a-zA-Z']/g, '');

  useEffect(() => {
    const tokenId = speechTargetTokenRef.current.id + 1;
    const generation = wordGenerationRef.current;
    const armedAt = Date.now() + WORD_TRANSITION_ARM_MS;
    const targetWord = cleanWord;

    isWordTransitioningRef.current = true;
    speechTargetTokenRef.current = { id: tokenId, generation, index: currentIndex, word: targetWord, armedAt };

    if (targetArmTimeoutRef.current) clearTimeout(targetArmTimeoutRef.current);
    targetArmTimeoutRef.current = setTimeout(() => {
      const token = speechTargetTokenRef.current;
      if (token.id === tokenId && token.generation === generation && token.index === currentIndex && token.word === targetWord) {
        isWordTransitioningRef.current = false;
        wordDisplayTimestampRef.current = Date.now();
      }
      targetArmTimeoutRef.current = null;
    }, WORD_TRANSITION_ARM_MS);

    return () => {
      if (targetArmTimeoutRef.current) {
        clearTimeout(targetArmTimeoutRef.current);
        targetArmTimeoutRef.current = null;
      }
    };
  }, [cleanWord, currentIndex, wordsKey]);

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
    if (targetArmTimeoutRef.current) {
      clearTimeout(targetArmTimeoutRef.current);
      targetArmTimeoutRef.current = null;
    }
  }, []);

  const abortActiveRecognitionForBatchTransition = useCallback(() => {
    speechSessionIdRef.current += 1;
    processedFinalsRef.current.clear();
    isRecognitionRunningRef.current = false;
    isRecognitionStartingRef.current = false;
    const activeRecognition = recognitionRef.current;
    recognitionRef.current = null;
    if (activeRecognition) {
      try {
        if (typeof activeRecognition.abort === 'function') activeRecognition.abort();
        else activeRecognition.stop();
      } catch (e) {}
    }
  }, []);

  const getEmojiPopupOrigin = useCallback(() => {
    const viewportWidth = typeof window === 'undefined' ? 878 : window.innerWidth;
    const viewportHeight = typeof window === 'undefined' ? 684 : window.innerHeight;
    const queueRect = wordQueueRef.current?.getBoundingClientRect();

    const targetX = viewportWidth * 0.5 + (Math.random() - 0.5) * Math.min(120, viewportWidth * 0.12);
    const targetY = viewportHeight * 0.18 + (Math.random() - 0.5) * Math.min(40, viewportHeight * 0.04);

    if (queueRect) {
      return {
        startX: queueRect.left + queueRect.width * (0.25 + Math.random() * 0.5),
        startY: queueRect.top + queueRect.height * 0.5 + 28 + (Math.random() - 0.5) * 22,
        x: targetX,
        y: targetY,
      };
    }

    return {
      startX: viewportWidth * 0.5 + (Math.random() - 0.5) * 120,
      startY: viewportHeight * 0.7 + (Math.random() - 0.5) * 28,
      x: targetX,
      y: targetY,
    };
  }, []);

  // Stop recognition completely
  const stopRecognitionSession = useCallback(() => {
    speechSessionIdRef.current += 1;
    shouldBeListeningRef.current = false;
    clearAllTimeouts();
    
    const activeRecognition = recognitionRef.current;
    recognitionRef.current = null;
    if (activeRecognition) {
      try {
        activeRecognition.stop();
      } catch (e) {
        // Ignore - may already be stopped
      }
    }
    isRecognitionRunningRef.current = false;
    isRecognitionStartingRef.current = false;
  }, [clearAllTimeouts]);

  // Advance to next word (UI only, doesn't touch recognition)
  const advanceToNextWord = useCallback((fromIndex: number) => {
    const nextIndex = fromIndex + 1;
    if (nextIndex < currentBatch.length) {
      setCurrentIndex(nextIndex);
      currentIndexRef.current = nextIndex;
      setCanRetry(true); // Reset retry for next word
      return true;
    } else {
      // Batch complete - report results (deduped)
      if (!batchCompletedRef.current) {
        batchCompletedRef.current = true;
        const results = Array.from(wordResults.values());
        onBatchComplete?.(results);
      }

      // Keep mic alive for the next batch — do NOT stop recognition here.
      // Parent will swap in new words; the wordsKey effect will reset state
      // and clear batchCompletedRef. Recognition keeps listening seamlessly.
      setCurrentIndex(0);
      currentIndexRef.current = 0;
      return false;
    }
  }, [currentBatch.length, stopRecognitionSession, wordResults, onBatchComplete]);

  // Handle correct word (first try - deals damage, gives coins)
  const handleCorrect = useCallback((spokenWord: string, wordIndex: number) => {
    if (isProcessingRef.current) return;
    
    const targetWord = currentBatch[wordIndex]?.replace(/[^a-zA-Z']/g, '') || '';
    
    // SAFETY CHECK: If this is a retry attempt, redirect to handleRetrySuccess (belt-and-suspenders)
    // This prevents any code path from accidentally marking a retry as "correct" (green)
    if (isRetryAttemptRef.current || !canRetryRef.current) {
      console.log('[RPGWordReader] handleCorrect redirecting to handleRetrySuccess (isRetryAttempt or !canRetry)');
      handleRetrySuccess(spokenWord, wordIndex);
      return;
    }
    
    isProcessingRef.current = true;
    
    // Track as correct (GREEN) - only reaches here on genuine first-try success
    setWordResults(prev => new Map(prev).set(wordIndex, {
      word: targetWord,
      result: 'correct',
      spokenAs: spokenWord,
      attempts: 1
    }));
    
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
    const emoji = getWordEmoji(targetWord);
    if (emoji) {
      const { x, y, startX, startY } = getEmojiPopupOrigin();

      const newPopup: LocalEmojiPopup = {
        id: ++emojiPopId,
        emoji,
        word: targetWord,
        x,
        y,
        startX,
        startY,
      };
      setEmojiPopups(prev => {
        // Limit to 3 concurrent popups to prevent pile-up
        const limited = prev.length >= 3 ? prev.slice(1) : prev;
        return [...limited, newPopup];
      });
    }
    
    // Calculate response time (ms between word display and correct speech match)
    const responseTimeMs = wordDisplayTimestampRef.current > 0
      ? Date.now() - wordDisplayTimestampRef.current
      : undefined;
    
    // CRITICAL FIX: Advance index IMMEDIATELY so next speech results compare to next word
    const nextIndex = wordIndex + 1;
    const batch = words?.slice(0, Math.min(batchSize, words?.length || 0)) || [];
    const hasMoreWords = nextIndex < batch.length;
    
    // Mark word as completed and report to parent (deals damage, gives coins)
    setCompletedWords(prev => new Set([...prev, wordIndex]));
    onResult(true, spokenWord, wordIndex, responseTimeMs);

    if (!hasMoreWords) {
      isWordTransitioningRef.current = true;
      abortActiveRecognitionForBatchTransition();
    }
    
    if (hasMoreWords) {
      // Update refs IMMEDIATELY before any async delays
      setCurrentIndex(nextIndex);
      currentIndexRef.current = nextIndex;
      setCanRetry(true);
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
        // Batch complete - report results (deduped); next batch will restart the mic after render
        if (!batchCompletedRef.current) {
          batchCompletedRef.current = true;
          const results = Array.from(wordResults.values());
          onBatchComplete?.(results);
        }
        setCurrentIndex(0);
        currentIndexRef.current = 0;
        setRecognitionState('listening');
      }
    }, feedbackDelay);
  }, [streak, onResult, onBatchComplete, words, batchSize, stopRecognitionSession, mode, currentBatch, wordResults, abortActiveRecognitionForBatchTransition]);

  // Handle incorrect word (after echo fails or no echo) - NOW PAUSES FOR USER ACTION
  const handleIncorrectFinal = useCallback((spokenWord: string, expectedWord: string, wordIndex: number) => {
    const token = speechTargetTokenRef.current;
    if (isWordTransitioningRef.current || Date.now() < token.armedAt || token.index !== wordIndex || token.word !== expectedWord) {
      console.log('[RPGWordReader] Ignoring stale incorrect during transition', { spokenWord, expectedWord, wordIndex, token });
      return;
    }

    isProcessingRef.current = true;
    
    // Track as missed (RED) - can become 'retried' (YELLOW) if they try again
    setWordResults(prev => new Map(prev).set(wordIndex, {
      word: expectedWord,
      result: 'missed',
      spokenAs: spokenWord,
      attempts: 1
    }));
    
    setFeedback('incorrect');
    setSpokenText(spokenWord);
    setEchoCountdown(0);
    soundEffects.incorrectWord();
    
    // Play correct pronunciation
    setTimeout(() => {
      playCorrectPronunciation(expectedWord);
    }, 300);
    
    // IMMEDIATELY report miss for accuracy tracking (before user decides Try Again or Continue)
    // This ensures the miss counts toward wordsRead even if the user later succeeds on retry
    onMiss?.(spokenWord, wordIndex);
    
    // PAUSE - Don't auto-advance! Wait for user action
    stopRecognitionSession();
    setRecognitionState('waiting_action');
    setPendingIncorrectWord({ word: expectedWord, spoken: spokenWord, index: wordIndex });
    setShowFeedbackOverlay(true);
    
    // DO NOT call onResult yet - wait for user to choose Continue (which triggers enemy attack)
  }, [stopRecognitionSession, onMiss]);

  // Handle "Try Again" - retry the word for practice (no game rewards)
  // Note: Uses ref to avoid circular dependency with startRecognitionSession
  
  const handleTryAgain = useCallback(() => {
    if (!pendingIncorrectWord) return;
    
    setShowFeedbackOverlay(false);
    setFeedback(null);
    setSpokenText("");
    setCanRetry(false); // Only one retry allowed per word
    canRetryRef.current = false; // Synchronous update to prevent race condition!
    isRetryAttemptRef.current = true;
    isProcessingRef.current = false;
    
    // Stay on the same word index
    setRecognitionState('listening');
    startRecognitionRef.current?.();
  }, [pendingIncorrectWord]);

  // Handle retry success - mark as retried (YELLOW), no damage/coins, but heal HP
  const handleRetrySuccess = useCallback((spokenWord: string, wordIndex: number) => {
    // PROCESSING GUARD: Prevent duplicate executions from rapid interim updates
    if (isProcessingRef.current) {
      console.log('[RPGWordReader] handleRetrySuccess - skipping (already processing)');
      return;
    }
    isProcessingRef.current = true;
    
    const targetWord = currentBatch[wordIndex]?.replace(/[^a-zA-Z']/g, '') || '';
    
    // Update to retried (YELLOW)
    setWordResults(prev => {
      const updated = new Map(prev);
      const existing = updated.get(wordIndex);
      const newEntry = {
        word: targetWord,
        result: 'retried' as const,
        spokenAs: spokenWord,
        attempts: (existing?.attempts || 1) + 1
      };
      updated.set(wordIndex, newEntry);
      console.log('[RPGWordReader] SET RETRIED (YELLOW):', { wordIndex, targetWord, newEntry });
      return updated;
    });
    
    setFeedback('correct');
    setSpokenText(spokenWord);
    soundEffects.correctWord();
    setCompletedWords(prev => new Set([...prev, wordIndex]));
    
    // NO damage dealt, NO coins given - just practice
    // Don't call onResult(true, ...) since this doesn't count as a real correct
    // BUT call onRetrySuccess to trigger HP healing!
    onRetrySuccess?.(wordIndex);

    // Retry is now resolved.
    isRetryAttemptRef.current = false;
    
    setPendingIncorrectWord(null);
    
    // Advance to next word after brief pause
    const batch = words?.slice(0, Math.min(batchSize, words?.length || 0)) || [];
    const nextIndex = wordIndex + 1;
    const hasMoreWords = nextIndex < batch.length;
    
    if (hasMoreWords) {
      setCurrentIndex(nextIndex);
      currentIndexRef.current = nextIndex;
      setCanRetry(true);
    } else {
      isWordTransitioningRef.current = true;
      abortActiveRecognitionForBatchTransition();
    }
    
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setSpokenText("");
      isProcessingRef.current = false;
      
      if (hasMoreWords) {
        setRecognitionState('listening');
      } else {
        // Batch complete (deduped); next batch will restart the mic after render
        if (!batchCompletedRef.current) {
          batchCompletedRef.current = true;
          const results = Array.from(wordResults.values());
          onBatchComplete?.(results);
        }
        setCurrentIndex(0);
        currentIndexRef.current = 0;
        setRecognitionState('listening');
      }
    }, 300);
  }, [currentBatch, words, batchSize, stopRecognitionSession, wordResults, onBatchComplete, onRetrySuccess, abortActiveRecognitionForBatchTransition]);

  // Handle "Continue" (Skip) - accept miss and trigger enemy attack
  const handleContinueAfterMiss = useCallback(() => {
    if (!pendingIncorrectWord) return;
    
    const { spoken, index } = pendingIncorrectWord;
    
    setShowFeedbackOverlay(false);

    // If they choose to continue after a miss, any retry attempt is resolved.
    isRetryAttemptRef.current = false;
    
    // NOW trigger the enemy attack via onResult(false, ...)
    onResult(false, spoken, index, undefined);
    
    // Advance to next word
    const batch = words?.slice(0, Math.min(batchSize, words?.length || 0)) || [];
    const nextIndex = index + 1;
    const hasMoreWords = nextIndex < batch.length;
    
    if (hasMoreWords) {
      setCurrentIndex(nextIndex);
      currentIndexRef.current = nextIndex;
      setCanRetry(true);
    }
    
    setFeedback(null);
    setSpokenText("");
    setPendingIncorrectWord(null);
    isProcessingRef.current = false;
    
    if (hasMoreWords) {
      setRecognitionState('listening');
      startRecognitionRef.current?.();
    } else {
      // Batch complete
      const results = Array.from(wordResults.values());
      onBatchComplete?.(results);
      
      setCurrentIndex(0);
      currentIndexRef.current = 0;
      setRecognitionState('idle');
    }
  }, [pendingIncorrectWord, onResult, words, batchSize, wordResults, onBatchComplete]);

  // Start echo retry mode
  const startEchoRetry = useCallback((spokenWord: string, expectedWord: string, wordIndex: number) => {
    const token = speechTargetTokenRef.current;
    if (isWordTransitioningRef.current || Date.now() < token.armedAt || token.index !== wordIndex || token.word !== expectedWord) {
      console.log('[RPGWordReader] Suppressing echo retry during transition', { spokenWord, expectedWord, wordIndex, token });
      return;
    }

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

  // Get target word from refs — stable identity, always reads the *current*
  // words/batchSize props. This is critical because the long-lived
  // SpeechRecognition.onresult closure captures this function, and we must
  // never grade the new batch's word against the previous batch's array.
  const getTargetWord = useCallback((index: number) => {
    const w = wordsRef.current;
    const bs = batchSizeRef.current;
    const batch = w?.slice(0, Math.min(bs, w?.length || 0)) || [];
    return batch[index]?.replace(/[^a-zA-Z']/g, '') || '';
  }, []);

  // State ref for echo retry (avoid stale closure)
  const recognitionStateRef = useRef<RecognitionState>('idle');
  useEffect(() => {
    recognitionStateRef.current = recognitionState;
  }, [recognitionState]);

  // Ref for canRetry to check in processResult
  const canRetryRef = useRef(canRetry);
  useEffect(() => {
    canRetryRef.current = canRetry;
  }, [canRetry]);

  // Explicit ref: are we currently doing the one allowed retry attempt?
  const isRetryAttemptRef = useRef(false);

  // Refs to the latest handler implementations so the long-lived
  // SpeechRecognition.onresult closure always invokes the current versions
  // (which read the current `words` prop). Without these, the new batch's
  // first word is graded against the previous batch's array.
  const processResultRef = useRef<((t: string, alts: string[]) => void) | null>(null);
  const handleCorrectRef = useRef<((s: string, i: number) => void) | null>(null);
  const handleRetrySuccessRef = useRef<((s: string, i: number) => void) | null>(null);

  // Shared ref for tracking processed final-result indices across the
  // long-lived recognition session. Lives outside startRecognitionSession
  // so we can clear it on batch transitions.
  const processedFinalsRef = useRef<Set<number>>(new Set());

  // Process speech result
  const processResult = useCallback((transcript: string, alternatives: string[]) => {
    if (isProcessingRef.current) return;
    const cleanTranscript = transcript.trim();
    if (!cleanTranscript) return;
    
    const wordIndex = currentIndexRef.current;
    const targetWord = getTargetWord(wordIndex);
    const token = speechTargetTokenRef.current;
    const now = Date.now();
    if (
      isWordTransitioningRef.current ||
      now < token.armedAt ||
      token.generation !== wordGenerationRef.current ||
      token.index !== wordIndex ||
      token.word !== targetWord
    ) {
      console.log('[RPGWordReader] Ignoring speech while target is not armed', { transcript: cleanTranscript, wordIndex, targetWord, token });
      return;
    }
    
    console.log('[RPGWordReader] Processing:', { transcript: cleanTranscript, targetWord, wordIndex, canRetry: canRetryRef.current });
    
    if (!targetWord) return;
    
    // Check all alternatives for a match
    let matched = false;
    let bestSpoken = cleanTranscript;
    
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
      const wordsSpoken = cleanTranscript.toLowerCase().split(/\s+/).filter(w => w.length > 0);
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
      // Check if this is a retry attempt (canRetry was set to false when Try Again was clicked)
      if (isRetryAttemptRef.current || !canRetryRef.current) {
        // This is a retry success - use handleRetrySuccess (YELLOW, no rewards)
        handleRetrySuccess(bestSpoken, wordIndex);
      } else {
        // Normal first-try success (GREEN, deals damage, gives coins)
        handleCorrect(bestSpoken, wordIndex);
      }
    } else {
      // Check if we should do echo retry - use ref to avoid stale state
      const currentRecState = recognitionStateRef.current;
      
      // If this is a retry attempt and they got it wrong again, show overlay
      if (isRetryAttemptRef.current || !canRetryRef.current) {
        // Failed retry - go straight to continue (they already had their chance)
        handleIncorrectFinal(cleanTranscript, targetWord, wordIndex);
      } else if (enableEchoRetry && currentRecState !== 'echo_retry') {
        startEchoRetry(cleanTranscript, targetWord, wordIndex);
      } else if (currentRecState === 'echo_retry') {
        // Already in echo - this attempt also failed, but let timeout handle final
        setSpokenText(cleanTranscript);
      } else {
        handleIncorrectFinal(cleanTranscript, targetWord, wordIndex);
      }
    }
  }, [getTargetWord, enableEchoRetry, handleCorrect, handleRetrySuccess, handleIncorrectFinal, startEchoRetry]);

  // Keep refs to the latest handlers so the long-lived recognition.onresult
  // closure (created once when the mic starts) always invokes the current
  // implementations — which in turn read the current `words` prop. This is
  // what fixes "first word of next batch is marked wrong" after batch swap.
  useEffect(() => {
    processResultRef.current = processResult;
    handleCorrectRef.current = handleCorrect;
    handleRetrySuccessRef.current = handleRetrySuccess;
  }, [processResult, handleCorrect, handleRetrySuccess]);

  // Create and start the recognition session (ONE instance, kept alive)
  const startRecognitionSession = useCallback(() => {
    if (disabled) return;
    if (isRecognitionRunningRef.current || isRecognitionStartingRef.current) return;
    
    setMicError(null);

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      console.error('[RPGWordReader] Speech recognition not supported');
      setMicError('Speech recognition not supported in this browser');
      return;
    }
    
    unlockSpeechSynthesis();
    shouldBeListeningRef.current = true;
    isRecognitionStartingRef.current = true;
    const sessionId = ++speechSessionIdRef.current;
    
    // Create ONE recognition instance
    const recognition = new SpeechRecognition();
    recognition.continuous = true;  // KEY: Keep listening continuously
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 5;

    const isCurrentSession = () => recognitionRef.current === recognition && speechSessionIdRef.current === sessionId;

    const scheduleRestart = (delayMs: number) => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }

      restartTimeoutRef.current = setTimeout(() => {
        if (!isCurrentSession() || !shouldBeListeningRef.current || isRecognitionRunningRef.current || isProcessingRef.current) {
          return;
        }

        try {
          console.log('[RPGWordReader] Restarting active speech session', { sessionId, wordIndex: currentIndexRef.current, target: getTargetWord(currentIndexRef.current) });
          isRecognitionStartingRef.current = true;
          recognition.start();
        } catch (e) {
          console.log('[RPGWordReader] Active-session restart skipped:', e);
          isRecognitionStartingRef.current = false;
        }
      }, delayMs);
    };
    
    recognition.onstart = () => {
      if (!isCurrentSession()) {
        console.log('[RPGWordReader] Ignoring stale onstart', { sessionId });
        return;
      }
      console.log('[RPGWordReader] Recognition started');
      isRecognitionRunningRef.current = true;
      isRecognitionStartingRef.current = false;
      processedFinalsRef.current.clear();
      if (!isProcessingRef.current) {
        setRecognitionState('listening');
      }
    };

    recognition.onresult = (event: any) => {
      if (!isCurrentSession()) {
        console.log('[RPGWordReader] Ignoring stale result', { sessionId });
        return;
      }
      // CRITICAL FIX: Use event.resultIndex to only process NEW results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript?.trim() || '';

        // Show interim results for the latest
        if (!result.isFinal) {
          if (!isProcessingRef.current && i === event.results.length - 1) {
            const wordIdx = currentIndexRef.current;
            const targetWord = getTargetWord(wordIdx);
            const token = speechTargetTokenRef.current;
            const targetIsArmed = Boolean(
              transcript &&
              targetWord &&
              !isWordTransitioningRef.current &&
              Date.now() >= token.armedAt &&
              token.generation === wordGenerationRef.current &&
              token.index === wordIdx &&
              token.word === targetWord
            );

            if (targetIsArmed) {
              setSpokenText(transcript.toLowerCase());
            }

            // FAST MODE: Process interim results for quicker matching (Elara only)
            // CRITICAL FIX: Must respect retry state - route through proper handlers
            if (mode === 'fast' && !isProcessingRef.current && targetIsArmed) {
              if (targetWord) {
                const wordsSpoken = transcript.toLowerCase().split(/\s+/).filter(w => w.length > 0);
                for (const word of wordsSpoken) {
                  if (isWordMatchLenient(word, targetWord)) {
                    // Match found in interim - process immediately, but respect retry state!
                    processedFinalsRef.current.add(i);

                    // Always invoke through refs so we hit the handlers that
                    // close over the *current* batch's words.
                    if (isRetryAttemptRef.current || !canRetryRef.current) {
                      console.log('[RPGWordReader] FAST MODE: Routing to handleRetrySuccess (retry attempt)');
                      handleRetrySuccessRef.current?.(word, wordIdx);
                    } else {
                      handleCorrectRef.current?.(word, wordIdx);
                    }
                    return;
                  }
                }
              }
            }
          }
          continue;
        }

        // Skip if we already processed this result index
        if (processedFinalsRef.current.has(i)) {
          continue;
        }
        processedFinalsRef.current.add(i);

        // Final result - process it
        const wordIdx = currentIndexRef.current;
        console.log('[RPGWordReader] Final transcript:', transcript, '| wordIndex:', wordIdx, '| target:', getTargetWord(wordIdx));

        // Collect alternatives
        const alternatives: string[] = [];
        for (let j = 0; j < result.length; j++) {
          const alt = result[j]?.transcript?.trim() || '';
          if (alt) alternatives.push(alt);
        }
        
        // Invoke through ref so we use the latest processResult (which
        // closes over the current `words` prop / batch).
        processResultRef.current?.(transcript, alternatives);
      }
    };
    
    recognition.onerror = (event: any) => {
      if (!isCurrentSession()) {
        console.log('[RPGWordReader] Ignoring stale error', { sessionId, error: event.error });
        return;
      }
      console.log('[RPGWordReader] Recognition error:', event.error);
      isRecognitionStartingRef.current = false;
      
      if (event.error === 'aborted') {
        isRecognitionRunningRef.current = false;
        return;
      }
      
      // Handle permission errors
      if (event.error === 'not-allowed') {
        shouldBeListeningRef.current = false;
        setMicError('Microphone access was denied.');
        isRecognitionRunningRef.current = false;
        setRecognitionState('idle');
        return;
      }
      
      // For recoverable errors, try to restart
      if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'network') {
        isRecognitionRunningRef.current = false;
        
        if (shouldBeListeningRef.current && !isProcessingRef.current) {
          scheduleRestart(300);
        }
      }
    };
    
    recognition.onend = () => {
      if (!isCurrentSession()) {
        console.log('[RPGWordReader] Ignoring stale onend', { sessionId });
        return;
      }
      console.log('[RPGWordReader] Recognition ended');
      isRecognitionRunningRef.current = false;
      isRecognitionStartingRef.current = false;
      
      // Auto-restart if we should still be listening
      if (shouldBeListeningRef.current && !isProcessingRef.current) {
        scheduleRestart(100);
      }
    };
    
    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      console.error('[RPGWordReader] Failed to start:', e);
      isRecognitionRunningRef.current = false;
      isRecognitionStartingRef.current = false;
      
      // Retry after delay
      if (shouldBeListeningRef.current) {
        scheduleRestart(500);
      }
    }
  }, [disabled, mode, getTargetWord, handleRetrySuccess, handleCorrect, processResult]);

  // Set the ref for use in handlers that are defined before startRecognitionSession
  useEffect(() => {
    startRecognitionRef.current = startRecognitionSession;
  }, [startRecognitionSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSessionIdRef.current += 1;
      shouldBeListeningRef.current = false;
      clearAllTimeouts();
      const activeRecognition = recognitionRef.current;
      recognitionRef.current = null;
      if (activeRecognition) {
        try {
          activeRecognition.stop();
        } catch (e) {}
      }
      isRecognitionRunningRef.current = false;
      isRecognitionStartingRef.current = false;
    };
  }, [clearAllTimeouts]);

  // Force-stop recognition the moment `disabled` flips true (e.g. while a
  // PvP RPC is in flight). Without this, an already-running recognition
  // session can keep emitting results during the sync window and cause
  // double submissions or stale word advancement.
  useEffect(() => {
    if (!disabled) return;
    speechSessionIdRef.current += 1;
    shouldBeListeningRef.current = false;
    clearAllTimeouts();
    const activeRecognition = recognitionRef.current;
    recognitionRef.current = null;
    if (activeRecognition) {
      try { activeRecognition.stop(); } catch (e) {}
    }
    isRecognitionRunningRef.current = false;
    isRecognitionStartingRef.current = false;
    isProcessingRef.current = false;
    setRecognitionState('idle');
  }, [disabled, clearAllTimeouts]);

  // Control functions
  const startReading = useCallback(() => {
    // Preserve the current index when restarting the mic mid-batch. Resetting
    // here made the UI jump back to word 1 after an automatic mic stop.
    isProcessingRef.current = false;
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
      
      {/* Multi-Word Queue Display with Color Coding */}
      <div ref={wordQueueRef} className="flex flex-wrap gap-2 justify-center max-w-md">
        {currentBatch.map((word, index) => {
          const clean = word.replace(/[^a-zA-Z']/g, '');
          const isActiveWord = index === currentIndex;
          const wordResult = wordResults.get(index);
          
          // Determine color based on result state
          let colorClass = 'bg-slate-700/60 text-slate-400'; // Grey - pending
          let icon = null;
          
          // Completed words (correct/retried/missed) ALWAYS show their result color
          // Active word shows blue ONLY if it has no result yet
          const hasResult = wordResult?.result && wordResult.result !== 'pending';
          
          if (wordResult?.result === 'correct') {
            colorClass = 'bg-emerald-500/60 text-emerald-100'; // Green - first try success
            icon = <Check className="h-3.5 w-3.5" />;
          } else if (wordResult?.result === 'retried') {
            colorClass = 'bg-yellow-500/60 text-yellow-100'; // Yellow - retry success
            icon = <RotateCcw className="h-3.5 w-3.5" />;
          } else if (wordResult?.result === 'missed') {
            colorClass = 'bg-red-500/60 text-red-100'; // Red - missed/skipped
            icon = <X className="h-3.5 w-3.5" />;
          } else if (isActiveWord) {
            // Active word shows blue ONLY if no result yet
            colorClass = 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white scale-110 shadow-lg shadow-blue-500/40';
            icon = null;
          }
          
          const shouldPulse = isActiveWord && !hasResult;
          
          return (
            <motion.div
              key={`${word}-${index}`}
              className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${colorClass}`}
              animate={shouldPulse ? { scale: [1.1, 1.15, 1.1] } : {}}
              transition={{ repeat: shouldPulse ? Infinity : 0, duration: 1.2 }}
              onClick={() => playCorrectPronunciation(clean)}
            >
              <div className="flex items-center gap-1.5">
                {icon}
                <span className={shouldPulse ? 'text-lg' : 'text-sm'}>{clean}</span>
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

        <motion.p 
          className="text-4xl md:text-5xl font-bold text-white tracking-wide cursor-pointer"
          onClick={() => cleanWord && playCorrectPronunciation(cleanWord)}
        >
          {cleanWord || "Ready"}
        </motion.p>

        {/* Phonetic hint when incorrect */}
        {feedback === 'incorrect' && cleanWord && (
          <motion.p 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-lg text-purple-300 font-medium"
          >
            {getPhoneticHint(cleanWord)}
          </motion.p>
        )}

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

        {/* Word tip when incorrect */}
        {feedback === 'incorrect' && cleanWord && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-xs text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full"
          >
            💡 {getWordTip(cleanWord)}
          </motion.div>
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

        {(isIdle || isActive) && (
          <motion.div
            animate={isActive ? { 
              boxShadow: ['0 0 0px rgba(251, 191, 36, 0)', '0 0 20px rgba(251, 191, 36, 0.6)', '0 0 0px rgba(251, 191, 36, 0)'] 
            } : {}}
            transition={isActive ? { repeat: Infinity, duration: 1 } : {}}
            className="rounded-xl"
          >
            <Button
              size="lg"
              onClick={isActive ? pauseReading : startReading}
              disabled={disabled || !cleanWord}
              className={`min-w-[180px] font-bold transition-all ${
                isActive 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700' 
                  : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'
              }`}
            >
              {isActive ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                  >
                    <Mic className="h-5 w-5 mr-2" />
                  </motion.div>
                  Reading...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Start Reading
                </>
              )}
            </Button>
          </motion.div>
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
      
      {/* Emoji Learning Popups - positioned and auto-removing */}
      <RPGEmojiManager
        popups={emojiPopups}
        onPopupComplete={(id) => setEmojiPopups(prev => prev.filter(p => p.id !== id))}
      />

      {/* Word Feedback Overlay - Pauses on incorrect for learning */}
      <WordFeedbackOverlay
        isVisible={showFeedbackOverlay}
        expectedWord={pendingIncorrectWord?.word || ''}
        spokenWord={pendingIncorrectWord?.spoken}
        isCorrect={false}
        canRetry={canRetry}
        onContinue={handleContinueAfterMiss}
        onTryAgain={handleTryAgain}
        onPlayAudio={() => pendingIncorrectWord?.word && playCorrectPronunciation(pendingIncorrectWord.word)}
      />
    </div>
  );
};
