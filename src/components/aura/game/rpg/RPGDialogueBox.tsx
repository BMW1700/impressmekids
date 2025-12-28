import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface RPGDialogueBoxProps {
  speakerName: string;
  speakerColor: string;
  dialogue: string;
  isTyping?: boolean;
  onComplete?: () => void;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
}

export const RPGDialogueBox = ({
  speakerName,
  speakerColor,
  dialogue,
  isTyping = true,
  onComplete,
  autoAdvance = false,
  autoAdvanceDelay = 2000,
}: RPGDialogueBoxProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const typingSpeed = 30; // ms per character

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
      exit={{ opacity: 0, y: 20 }}
      className="w-full"
    >
      <div
        onClick={handleClick}
        className="relative bg-card/95 backdrop-blur-sm border-2 border-border rounded-lg p-4 cursor-pointer
          hover:border-primary/50 transition-colors"
      >
        {/* Speaker Name Tag */}
        <div className={`absolute -top-3 left-4 px-3 py-1 rounded-md bg-gradient-to-r ${speakerColor} text-white text-sm font-bold shadow-md`}>
          {speakerName}
        </div>

        {/* Dialogue Text */}
        <div className="pt-2 min-h-[60px]">
          <p className="text-lg leading-relaxed">
            {displayedText}
            {!isComplete && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="inline-block w-2 h-5 bg-foreground ml-1 align-middle"
              />
            )}
          </p>
        </div>

        {/* Continue Indicator */}
        <AnimatePresence>
          {isComplete && onComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-2 right-3 flex items-center gap-1 text-xs text-muted-foreground"
            >
              Click to continue
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <ChevronRight className="h-4 w-4" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
