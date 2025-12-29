import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Check, X, Loader2, Pause, Play } from "lucide-react";
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

const soundEffects = new SoundEffects();

export const RPGWordReader = ({
  words,
  onResult,
  disabled = false,
  streak = 0,
  batchSize = 10,
}: RPGWordReaderProps) => {
  const [readingMode, setReadingMode] = useState<'idle' | 'continuous' | 'paused'>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [spokenText, setSpokenText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isProcessingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current batch of words to display
  const currentBatch = words.slice(0, Math.min(batchSize, words.length));
  const currentWord = currentBatch[currentIndex] || "";
  const cleanWord = currentWord.replace(/[^a-zA-Z']/g, '');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Auto-start listening when in continuous mode and not processing
  useEffect(() => {
    if (readingMode === 'continuous' && !isProcessing && !isProcessingRef.current && currentIndex < currentBatch.length) {
      startListening();
    }
  }, [readingMode, currentIndex, isProcessing]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      recognitionRef.current = null;
    }
  }, []);

  const handleCorrect = useCallback(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    
    setFeedback('correct');
    soundEffects.correctWord();
    
    const newStreak = streak + 1;
    if (newStreak > 0 && newStreak % 5 === 0) {
      soundEffects.streakAchieved();
    }
    
    stopListening();
    
    // Report result
    onResult(true, cleanWord, currentIndex);
    
    timeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setSpokenText("");
      setIsProcessing(false);
      isProcessingRef.current = false;
      
      // Auto-advance to next word
      if (currentIndex < currentBatch.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Finished all words in batch
        setReadingMode('idle');
        setCurrentIndex(0);
      }
    }, 400);
  }, [onResult, cleanWord, stopListening, streak, currentIndex, currentBatch.length]);

  const handleIncorrect = useCallback((spoken: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    
    setFeedback('incorrect');
    setSpokenText(spoken);
    soundEffects.incorrectWord();
    
    stopListening();
    
    // Play correct pronunciation after showing incorrect
    setTimeout(() => {
      playCorrectPronunciation(cleanWord);
    }, 300);
    
    // Report result
    onResult(false, spoken, currentIndex);
    
    timeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setSpokenText("");
      setIsProcessing(false);
      isProcessingRef.current = false;
      
      // Auto-advance even on incorrect
      if (currentIndex < currentBatch.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setReadingMode('idle');
        setCurrentIndex(0);
      }
    }, 800);
  }, [onResult, cleanWord, stopListening, currentIndex, currentBatch.length]);

  const startListening = useCallback(() => {
    if (disabled || isProcessing || isProcessingRef.current) return;
    
    unlockSpeechSynthesis();
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      setSpokenText("");
      setFeedback(null);
    };

    recognition.onresult = (event: any) => {
      if (isProcessingRef.current) return;

      const result = event.results[0];
      const transcript = result[0].transcript.trim().toLowerCase();
      setSpokenText(transcript);

      if (result.isFinal) {
        // Check all alternatives for a match
        let matched = false;
        for (let i = 0; i < result.length && !matched; i++) {
          const alt = result[i]?.transcript?.trim().toLowerCase() || '';
          const altWords = alt.split(/\s+/).filter((w: string) => w.length > 0);
          
          for (const spokenWord of altWords) {
            if (isWordMatchLenient(spokenWord, cleanWord)) {
              matched = true;
              break;
            }
          }
        }

        // Also check original transcript
        if (!matched) {
          const wordsSpoken = transcript.split(/\s+/).filter((w: string) => w.length > 0);
          for (const spokenWord of wordsSpoken) {
            if (isWordMatchLenient(spokenWord, cleanWord)) {
              matched = true;
              break;
            }
          }
        }

        if (matched) {
          handleCorrect();
        } else {
          handleIncorrect(transcript);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        // Restart listening if in continuous mode
        if (readingMode === 'continuous') {
          setTimeout(() => startListening(), 500);
        }
      }
    };

    recognition.onend = () => {
      if (!isProcessingRef.current && readingMode === 'continuous') {
        // Restart listening automatically
        setTimeout(() => startListening(), 100);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }, [disabled, isProcessing, cleanWord, handleCorrect, handleIncorrect, readingMode]);

  const startContinuousReading = () => {
    setReadingMode('continuous');
    setCurrentIndex(0);
  };

  const pauseReading = () => {
    setReadingMode('paused');
    stopListening();
  };

  const resumeReading = () => {
    setReadingMode('continuous');
  };

  const hearWord = useCallback(() => {
    playCorrectPronunciation(cleanWord);
  }, [cleanWord]);

  if (currentBatch.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Word Queue Display */}
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

      {/* Current Word Display */}
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
          feedback === 'incorrect' ? { x: [-5, 5, -5, 5, 0] } :
          {}
        }
        transition={{ duration: 0.3 }}
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
              {feedback === 'correct' ? (
                <Check className="h-6 w-6 text-white" />
              ) : (
                <X className="h-6 w-6 text-white" />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Word */}
        <motion.p 
          className="text-4xl md:text-5xl font-bold text-white tracking-wide"
          style={{ 
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          {cleanWord}
        </motion.p>

        {/* Spoken Text Feedback */}
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

      {/* Progress */}
      <div className="text-center text-sm text-slate-400">
        Word {currentIndex + 1} of {currentBatch.length}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Hear Word Button */}
        <Button
          variant="outline"
          size="lg"
          onClick={hearWord}
          disabled={readingMode === 'continuous' || isProcessing}
          className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20 hover:text-blue-200
            shadow-lg shadow-blue-500/20"
        >
          <Volume2 className="h-5 w-5 mr-2" />
          Hear
        </Button>

        {/* Main Read Button - Modes: Start / Pause / Resume */}
        {readingMode === 'idle' && (
          <Button
            size="lg"
            onClick={startContinuousReading}
            disabled={disabled || isProcessing}
            className="min-w-[180px] font-bold text-lg shadow-lg transition-all
              bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 
              shadow-emerald-500/30"
          >
            <Play className="h-5 w-5 mr-2" />
            Start Reading
          </Button>
        )}

        {readingMode === 'continuous' && (
          <Button
            size="lg"
            onClick={pauseReading}
            disabled={isProcessing}
            className="min-w-[180px] font-bold text-lg shadow-lg transition-all
              bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 
              shadow-amber-500/30"
          >
            <Pause className="h-5 w-5 mr-2" />
            Pause
          </Button>
        )}

        {readingMode === 'paused' && (
          <Button
            size="lg"
            onClick={resumeReading}
            disabled={disabled || isProcessing}
            className="min-w-[180px] font-bold text-lg shadow-lg transition-all
              bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 
              shadow-emerald-500/30"
          >
            <Play className="h-5 w-5 mr-2" />
            Resume
          </Button>
        )}
      </div>

      {/* Listening Indicator */}
      <AnimatePresence>
        {readingMode === 'continuous' && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 text-emerald-400"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              <Mic className="h-5 w-5" />
            </motion.div>
            <span className="text-sm font-medium">Listening... Say the word!</span>
            
            {/* Audio Wave Animation */}
            <div className="flex items-center gap-0.5 ml-2">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-emerald-400 rounded-full"
                  animate={{
                    height: ['8px', '20px', '8px'],
                  }}
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

        {readingMode === 'paused' && (
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
