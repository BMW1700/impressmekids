import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Volume2 } from "lucide-react";

interface RPGDialogueBoxProps {
  speakerName: string;
  speakerColor: string;
  dialogue: string;
  isTyping?: boolean;
  onComplete?: () => void;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
  showWordPrompt?: boolean;
  currentWord?: string;
  wordProgress?: { current: number; total: number };
}

export const RPGDialogueBox = ({
  speakerName,
  speakerColor,
  dialogue,
  isTyping = true,
  onComplete,
  autoAdvance = false,
  autoAdvanceDelay = 2000,
  showWordPrompt = false,
  currentWord,
  wordProgress,
}: RPGDialogueBoxProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const typingSpeed = 25; // ms per character

  useEffect(() => {
    if (!isTyping) {
      setDisplayedText(dialogue);
      setIsComplete(true);
      return;
    }

    setDisplayedText('');
    setIsComplete(false);
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < dialogue.length) {
        setDisplayedText(dialogue.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        if (autoAdvance && onComplete) {
          setTimeout(onComplete, autoAdvanceDelay);
        }
      }
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [dialogue, isTyping, autoAdvance, autoAdvanceDelay, onComplete]);

  const handleClick = () => {
    if (!isComplete) {
      // Skip typing animation
      setDisplayedText(dialogue);
      setIsComplete(true);
    } else if (onComplete) {
      onComplete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      {/* Classic RPG Dialogue Panel */}
      <div
        onClick={handleClick}
        className="relative bg-gradient-to-b from-slate-900/95 to-slate-950/95 
          rounded-xl border-2 border-blue-400/50 
          shadow-[0_0_30px_rgba(59,130,246,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]
          backdrop-blur-sm cursor-pointer overflow-hidden
          hover:border-blue-400/70 transition-colors"
      >
        {/* Inner border glow */}
        <div className="absolute inset-[2px] rounded-lg border border-blue-500/20 pointer-events-none" />

        {/* Speaker Name Tag */}
        <div className="absolute -top-3 left-6 z-10">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className={`px-4 py-1.5 rounded-lg bg-gradient-to-r ${speakerColor} 
              shadow-lg border border-white/20`}
          >
            <span className="font-bold text-white text-sm tracking-wide drop-shadow-md">
              {speakerName}
            </span>
          </motion.div>
        </div>

        {/* Main Content Area */}
        <div className="pt-6 pb-4 px-6">
          {/* Word Prompt Mode */}
          {showWordPrompt && currentWord ? (
            <div className="space-y-4">
              {/* Progress indicator */}
              {wordProgress && (
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Read aloud to attack!</span>
                  <span>{wordProgress.current}/{wordProgress.total} words</span>
                </div>
              )}
              
              {/* Current Word Display */}
              <div className="flex items-center justify-center py-4">
                <motion.div
                  key={currentWord}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="relative"
                >
                  <motion.span
                    className="text-4xl md:text-5xl font-black text-white tracking-wide"
                    animate={{
                      textShadow: [
                        '0 0 10px rgba(255,255,255,0.3)',
                        '0 0 20px rgba(255,255,255,0.5)',
                        '0 0 10px rgba(255,255,255,0.3)',
                      ],
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    {currentWord}
                  </motion.span>
                  
                  {/* Voice indicator */}
                  <motion.div
                    className="absolute -right-8 top-1/2 -translate-y-1/2"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <Volume2 className="h-5 w-5 text-blue-400" />
                  </motion.div>
                </motion.div>
              </div>
            </div>
          ) : (
            /* Regular Dialogue Mode */
            <div className="min-h-[80px]">
              <p className="text-lg md:text-xl leading-relaxed text-slate-100">
                {displayedText}
                {!isComplete && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="inline-block w-2.5 h-5 bg-white/80 ml-1 align-middle rounded-sm"
                  />
                )}
              </p>
            </div>
          )}
        </div>

        {/* Continue Indicator */}
        <AnimatePresence>
          {isComplete && onComplete && !showWordPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-3 right-4 flex items-center gap-2"
            >
              <span className="text-xs text-blue-300/70">Click to continue</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <ChevronRight className="h-4 w-4 text-blue-400" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decorative corners */}
        <div className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 border-blue-400/50 rounded-tl" />
        <div className="absolute top-1 right-1 w-3 h-3 border-r-2 border-t-2 border-blue-400/50 rounded-tr" />
        <div className="absolute bottom-1 left-1 w-3 h-3 border-l-2 border-b-2 border-blue-400/50 rounded-bl" />
        <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-blue-400/50 rounded-br" />
      </div>
    </motion.div>
  );
};
