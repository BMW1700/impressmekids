import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, Check, RefreshCw } from "lucide-react";
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
}: WordFeedbackOverlayProps) => {
  const phoneticBreakdown = getPhoneticHint(expectedWord);
  const tip = getWordTip(expectedWord);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            className={`relative max-w-md w-full mx-4 p-6 rounded-2xl border-2 ${
              isCorrect 
                ? 'bg-gradient-to-br from-green-900/90 to-emerald-900/90 border-green-500/50' 
                : 'bg-gradient-to-br from-orange-900/90 to-red-900/90 border-orange-500/50'
            }`}
          >
            {/* Header icon */}
            <div className="text-center mb-4">
              {isCorrect ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.4 }}
                  className="inline-block"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/30 flex items-center justify-center mx-auto">
                    <Check className="h-10 w-10 text-green-400" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="inline-block"
                >
                  <div className="w-16 h-16 rounded-full bg-orange-500/30 flex items-center justify-center mx-auto">
                    <X className="h-10 w-10 text-orange-400" />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Title */}
            <h3 className={`text-xl font-bold text-center mb-4 ${
              isCorrect ? 'text-green-300' : 'text-orange-300'
            }`}>
              {isCorrect ? '✨ Perfect!' : '🎯 Almost!'}
            </h3>

            {/* Word display */}
            <div className="bg-black/30 rounded-xl p-4 mb-4">
              {!isCorrect && spokenWord && (
                <div className="text-center mb-3">
                  <span className="text-sm text-orange-300">You said:</span>
                  <p className="text-lg text-orange-400 font-medium">"{spokenWord}"</p>
                </div>
              )}
              
              <div className="text-center">
                <span className="text-sm text-slate-400">The word is:</span>
                <motion.p 
                  className="text-3xl font-bold text-white my-2"
                  animate={!isCorrect ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {expectedWord}
                </motion.p>
                
                {/* Phonetic breakdown */}
                <p className="text-lg text-purple-300 font-medium">
                  {phoneticBreakdown}
                </p>
              </div>
            </div>

            {/* Tip (only for incorrect) */}
            {!isCorrect && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-blue-900/40 border border-blue-500/30 rounded-lg p-3 mb-4"
              >
                <p className="text-sm text-blue-300">
                  💡 <span className="font-medium">Tip:</span> {tip}
                </p>
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              {onPlayAudio && (
                <Button
                  variant="outline"
                  onClick={onPlayAudio}
                  className="flex-1 border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Hear It
                </Button>
              )}
              
              {!isCorrect && canRetry && onTryAgain && (
                <Button
                  variant="outline"
                  onClick={onTryAgain}
                  className="flex-1 border-orange-500/50 text-orange-300 hover:bg-orange-500/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              
              <Button
                onClick={onContinue}
                className={`flex-1 ${
                  isCorrect 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isCorrect ? 'Continue' : 'Skip & Continue'}
              </Button>
            </div>

            {/* Retry hint */}
            {!isCorrect && canRetry && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs text-center text-slate-400 mt-3"
              >
                Try Again won't earn coins, but helps you learn! 💪
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
