import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, Zap, X } from "lucide-react";
import { SoundEffects } from "@/lib/pronunciationPlayer";

const sounds = new SoundEffects();

interface ContextClueData {
  sentence: string;
  blankWord: string;
  options: string[]; // includes correct + distractors
}

interface RPGContextClueProps {
  clue: ContextClueData;
  enemyName: string;
  onComplete: (correct: boolean, damage: number) => void;
}

export const RPGContextClue = ({ clue, enemyName, onComplete }: RPGContextClueProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(12);
  const correctIndex = clue.options.indexOf(clue.blankWord);

  // Timer
  useEffect(() => {
    if (showResult) return;
    if (timeLeft <= 0) {
      handleSelect(-1);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, showResult]);

  const handleSelect = useCallback((index: number) => {
    if (showResult) return;
    setSelectedIndex(index);
    setShowResult(true);

    const isCorrect = index === correctIndex;
    if (isCorrect) {
      sounds.comboSuccess();
    } else {
      sounds.incorrectWord();
    }

    setTimeout(() => {
      onComplete(isCorrect, isCorrect ? 30 : 0);
    }, 1500);
  }, [showResult, correctIndex, onComplete]);

  // Build display sentence with blank — cross-browser safe (no lookbehind)
  const tokens = clue.sentence.split(/\b/);
  let replaced = false;
  const displaySentence = tokens.map(t => {
    if (!replaced && t.toLowerCase() === clue.blankWord.toLowerCase()) {
      replaced = true;
      return '______';
    }
    return t;
  }).join('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center"
    >
      {/* Fog overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-purple-900/60 to-slate-900/80 backdrop-blur-sm"
        animate={{ opacity: [0.7, 0.9, 0.7] }}
        transition={{ repeat: Infinity, duration: 3 }}
      />

      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-gradient-to-br from-slate-900/95 to-purple-900/95 rounded-2xl p-6 border-2 border-purple-500/50
          shadow-[0_0_40px_rgba(147,51,234,0.3)]">
          
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            >
              <Cloud className="w-6 h-6 text-purple-400" />
            </motion.div>
            <span className="text-lg font-black text-purple-300">WORD FOG!</span>
            <span className="text-sm text-slate-400">{enemyName} casts confusion!</span>
          </div>

          {/* Timer */}
          {!showResult && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className={`text-sm font-bold ${timeLeft <= 4 ? 'text-red-400' : 'text-slate-300'}`}>
                {timeLeft}s
              </span>
              <div className="w-28 h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${timeLeft <= 4 ? 'bg-red-500' : 'bg-purple-500'}`}
                  animate={{ width: `${(timeLeft / 12) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Sentence with blank */}
          <div className="bg-slate-800/60 border border-slate-600 rounded-xl p-4 mb-4">
            <p className="text-xs text-slate-400 mb-2">Fill in the missing word:</p>
            <p className="text-white text-base leading-relaxed">
              {displaySentence.split('______').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <motion.span
                      className="inline-block bg-purple-500/30 border-b-2 border-purple-400 px-3 mx-1 text-purple-300 font-bold"
                      animate={!showResult ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      {showResult && selectedIndex === correctIndex ? clue.blankWord : '???'}
                    </motion.span>
                  )}
                </span>
              ))}
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2">
            {clue.options.map((option, i) => {
              const isSelected = selectedIndex === i;
              const isCorrectOption = i === correctIndex;
              const showCorrect = showResult && isCorrectOption;
              const showWrong = showResult && isSelected && !isCorrectOption;

              return (
                <motion.button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={showResult}
                  className={`p-3 rounded-lg border-2 text-center font-bold transition-all
                    ${showCorrect
                      ? 'bg-green-500/30 border-green-400 text-green-200'
                      : showWrong
                        ? 'bg-red-500/30 border-red-400 text-red-200'
                        : isSelected
                          ? 'bg-purple-500/30 border-purple-400 text-white'
                          : 'bg-slate-800/60 border-slate-600 text-slate-200 hover:border-purple-400 hover:bg-slate-700/60'
                    }
                    ${showResult ? 'cursor-default' : 'cursor-pointer'}
                  `}
                  whileHover={!showResult ? { scale: 1.03 } : {}}
                  whileTap={!showResult ? { scale: 0.97 } : {}}
                >
                  <div className="flex items-center justify-center gap-2">
                    {showCorrect && <Zap className="w-4 h-4 text-green-400" />}
                    {showWrong && <X className="w-4 h-4 text-red-400" />}
                    <span>{option}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Result */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center"
              >
                {selectedIndex === correctIndex ? (
                  <p className="text-green-300 font-bold">✨ Fog dispelled! Bonus damage dealt!</p>
                ) : (
                  <p className="text-red-300 font-bold">💨 The fog thickens! {enemyName} attacks!</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};
