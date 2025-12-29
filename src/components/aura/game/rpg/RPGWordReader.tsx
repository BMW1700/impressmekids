import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { playCorrectPronunciation, SoundEffects } from "@/lib/pronunciationPlayer";
import { unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";

interface RPGWordReaderProps {
  word: string;
  onResult: (correct: boolean, spokenWord: string) => void;
  disabled?: boolean;
  streak?: number;
}

const soundEffects = new SoundEffects();

export const RPGWordReader = ({
  word,
  onResult,
  disabled = false,
  streak = 0,
}: RPGWordReaderProps) => {
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [spokenText, setSpokenText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isProcessingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanWord = word.replace(/[^a-zA-Z']/g, '');

  // Cleanup on unmount or word change
  useEffect(() => {
    return () => {
      stopListening();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [word]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const handleCorrect = useCallback(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    
    setFeedback('correct');
    soundEffects.correctWord();
    
    if (streak > 0 && (streak + 1) % 5 === 0) {
      soundEffects.streakAchieved();
    }
    
    stopListening();
    
    timeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setSpokenText("");
      setIsProcessing(false);
      isProcessingRef.current = false;
      onResult(true, cleanWord);
    }, 600);
  }, [onResult, cleanWord, stopListening, streak]);

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
    }, 400);
    
    timeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setSpokenText("");
      setIsProcessing(false);
      isProcessingRef.current = false;
      onResult(false, spoken);
    }, 1200);
  }, [onResult, cleanWord, stopListening]);

  const startListening = useCallback(() => {
    if (disabled || isProcessing) return;
    
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
      setIsListening(true);
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
          const words = transcript.split(/\s+/).filter((w: string) => w.length > 0);
          for (const spokenWord of words) {
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
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (!isProcessingRef.current) {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }, [disabled, isProcessing, cleanWord, handleCorrect, handleIncorrect]);

  const hearWord = useCallback(() => {
    playCorrectPronunciation(cleanWord);
  }, [cleanWord]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Word Display */}
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

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Hear Word Button */}
        <Button
          variant="outline"
          size="lg"
          onClick={hearWord}
          disabled={isListening || isProcessing}
          className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20 hover:text-blue-200
            shadow-lg shadow-blue-500/20"
        >
          <Volume2 className="h-5 w-5 mr-2" />
          Hear
        </Button>

        {/* Read Button */}
        <Button
          size="lg"
          onClick={isListening ? stopListening : startListening}
          disabled={disabled || isProcessing}
          className={`min-w-[160px] font-bold text-lg shadow-lg transition-all
            ${isListening 
              ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/30' 
              : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/30'
            }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : isListening ? (
            <>
              <MicOff className="h-5 w-5 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Mic className="h-5 w-5 mr-2" />
              Read Aloud
            </>
          )}
        </Button>
      </div>

      {/* Listening Indicator */}
      <AnimatePresence>
        {isListening && (
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
      </AnimatePresence>
    </div>
  );
};
