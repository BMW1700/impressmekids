import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, Check, RefreshCw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";



interface WordFeedbackOverlayProps {
  isVisible: boolean;
  expectedWord: string;
  spokenWord?: string;
  isCorrect: boolean;
  canRetry?: boolean;
  onContinue: () => void;
  onTryAgain?: () => void;
  onPlayAudio?: () => void;
  onTeachPhonics?: () => void;
}


// Simple phonetic breakdown helper
const getPhoneticHint = (word: string): string => {
  // Simple syllable estimation (not perfect but helpful)
  const vowels = 'aeiouy';
  let syllables: string[] = [];
  let currentSyllable = '';
  let prevWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i].toLowerCase();
    const isVowel = vowels.includes(char);
    currentSyllable += word[i];
    
    if (isVowel && !prevWasVowel && currentSyllable.length > 1) {
      // Check if next char exists and is consonant
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
  
  // If only one syllable, just return the word
  if (syllables.length <= 1) {
    return word.toUpperCase();
  }
  
  return syllables.map((s, i) => 
    i === 0 ? s.toUpperCase() : s.toLowerCase()
  ).join(' • ');
};

// Get a helpful tip for the word
const getWordTip = (word: string): string => {
  const lowerWord = word.toLowerCase();
  
  // Silent letters
  if (lowerWord.includes('kn')) return "The 'k' in 'kn' is silent!";
  if (lowerWord.includes('wr')) return "The 'w' in 'wr' is silent!";
  if (lowerWord.includes('gh') && !lowerWord.endsWith('gh')) return "The 'gh' is often silent!";
  if (lowerWord.includes('mb') && lowerWord.endsWith('mb')) return "The 'b' at the end is silent!";
  
  // Special sounds
  if (lowerWord.includes('th')) return "Make the 'th' sound with your tongue between your teeth!";
  if (lowerWord.includes('ough')) return "The 'ough' has a special sound - listen carefully!";
  if (lowerWord.includes('tion')) return "The 'tion' sounds like 'shun'!";
  if (lowerWord.includes('ight')) return "The 'ight' sounds like 'ite'!";
  
  // Double letters
  if (/(.)\1/.test(lowerWord)) return "Notice the double letters in this word!";
  
  // Long words
  if (word.length >= 8) return "Break this long word into smaller parts!";
  
  return "Sound it out slowly, one part at a time!";
};

export const WordFeedbackOverlay = ({
  isVisible,
  expectedWord,
  spokenWord,
  isCorrect,
  canRetry = true,
  onContinue,
  onTryAgain,
  onPlayAudio,
  onTeachPhonics,
}: WordFeedbackOverlayProps) => {

  const phoneticBreakdown = getPhoneticHint(expectedWord);
  const tip = getWordTip(expectedWord);

  return (
    <>{createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 10 }}
            className={`relative max-w-sm w-full mx-4 p-4 rounded-xl border-2 ${
              isCorrect 
                ? 'bg-gradient-to-br from-green-900/95 to-emerald-900/95 border-green-500/50' 
                : 'bg-gradient-to-br from-orange-900/95 to-red-900/95 border-orange-500/50'
            }`}
          >
            {/* Compact Header icon */}
            <div className="text-center mb-2">
              {isCorrect ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.3 }}
                  className="inline-block"
                >
                  <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center mx-auto">
                    <Check className="h-6 w-6 text-green-400" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  animate={{ rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 0.4 }}
                  className="inline-block"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-500/30 flex items-center justify-center mx-auto">
                    <X className="h-6 w-6 text-orange-400" />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Compact Title */}
            <h3 className={`text-lg font-bold text-center mb-2 ${
              isCorrect ? 'text-green-300' : 'text-orange-300'
            }`}>
              {isCorrect ? '✨ Perfect!' : '🎯 Almost!'}
            </h3>

            {/* Compact Word display */}
            <div className="bg-black/30 rounded-lg p-3 mb-3">
              {!isCorrect && spokenWord && (
                <div className="text-center mb-2">
                  <span className="text-xs text-orange-300">You said:</span>
                  <p className="text-base text-orange-400 font-medium">"{spokenWord}"</p>
                </div>
              )}
              
              <div className="text-center">
                <span className="text-xs text-slate-400">The word is:</span>
                <motion.p 
                  className="text-2xl font-bold text-white my-1"
                  animate={!isCorrect ? { scale: [1, 1.03, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {expectedWord}
                </motion.p>
                
                {/* Phonetic breakdown */}
                <p className="text-base text-purple-300 font-medium">
                  {phoneticBreakdown}
                </p>
              </div>
            </div>

            {/* Compact Tip (only for incorrect) */}
            {!isCorrect && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-blue-900/40 border border-blue-500/30 rounded-lg p-2 mb-3"
              >
                <p className="text-xs text-blue-300">
                  💡 <span className="font-medium">Tip:</span> {tip}
                </p>
              </motion.div>
            )}

            {/* Compact Action buttons */}
            <div className="flex gap-2">
              {onPlayAudio && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPlayAudio}
                  className="flex-1 border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                >
                  <Volume2 className="h-4 w-4 mr-1" />
                  Hear
                </Button>
              )}
              
              {!isCorrect && canRetry && onTryAgain && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onTryAgain}
                  className="flex-1 border-orange-500/50 text-orange-300 hover:bg-orange-500/20"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              )}
              
              <Button
                size="sm"
                onClick={onContinue}
                className={`flex-1 ${
                  isCorrect 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isCorrect ? 'Continue' : 'Skip'}
              </Button>
            </div>

            {/* Compact Retry hint */}
            {!isCorrect && canRetry && (
              <p className="text-[10px] text-center text-slate-400 mt-2">
                Retry won't earn coins, but helps you learn! 💪
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
    )}</>
  );
};
