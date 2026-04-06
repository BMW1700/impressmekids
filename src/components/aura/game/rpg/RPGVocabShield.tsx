import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, X, Lock } from "lucide-react";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";
import { SoundEffects } from "@/lib/pronunciationPlayer";

const sounds = new SoundEffects();

interface VocabShieldWord {
  word: string;
  definition: string;
  distractors: string[];
}

interface RPGVocabShieldProps {
  vocabWord: VocabShieldWord;
  enemyName: string;
  onComplete: (correct: boolean, damage: number) => void;
}

export const RPGVocabShield = ({ vocabWord, enemyName, onComplete }: RPGVocabShieldProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [shieldBroken, setShieldBroken] = useState(false);

  // Shuffle options once on mount
  const [options] = useState(() => {
    const all = [vocabWord.definition, ...vocabWord.distractors];
    // Fisher-Yates shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
  });

  const correctIndex = options.indexOf(vocabWord.definition);

  // Countdown timer
  useEffect(() => {
    if (showResult) return;
    if (timeLeft <= 0) {
      // Time's up - wrong answer
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
      setShieldBroken(true);
      sounds.comboSuccess();
      sounds.lightningCrack();
    } else {
      sounds.incorrectWord();
    }

    // Delay before completing
    setTimeout(() => {
      const damage = isCorrect ? 45 : 0; // 3x normal damage for correct
      onComplete(isCorrect, damage);
    }, 1800);
  }, [showResult, correctIndex, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center"
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Shield container */}
        <div className="relative">
          {/* Shield visual */}
          <AnimatePresence>
            {!shieldBroken && (
              <motion.div
                className="absolute inset-0 rounded-2xl"
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(239,68,68,0.4)',
                    '0 0 60px rgba(239,68,68,0.6)',
                    '0 0 30px rgba(239,68,68,0.4)',
                  ],
                }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                exit={{ opacity: 0, scale: 1.5 }}
              />
            )}
          </AnimatePresence>

          {shieldBroken && (
            <motion.div
              className="absolute inset-0 rounded-2xl"
              initial={{ opacity: 1 }}
              animate={{
                boxShadow: '0 0 80px rgba(34,197,94,0.8)',
                opacity: [1, 0.5, 1],
              }}
              transition={{ duration: 0.5 }}
            />
          )}

          <div className={`bg-gradient-to-br rounded-2xl p-6 border-2 transition-colors duration-300 ${
            shieldBroken
              ? 'from-green-900/95 to-emerald-900/95 border-green-400'
              : 'from-red-900/95 to-slate-900/95 border-red-500'
          }`}>
            {/* Header */}
            <div className="text-center mb-4">
              <motion.div
                className="inline-flex items-center gap-2 mb-2"
                animate={!shieldBroken ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                {(() => { const agent = isAgentMode(); return (
                <>
                {agent ? <Lock className={`w-6 h-6 ${shieldBroken ? 'text-green-400' : 'text-red-400'}`} /> : <Shield className={`w-6 h-6 ${shieldBroken ? 'text-green-400' : 'text-red-400'}`} />}
                <span className={`text-lg font-black ${shieldBroken ? 'text-green-300' : 'text-red-300'}`}>
                  {shieldBroken 
                    ? (agent ? 'ENCRYPTION BROKEN!' : 'SHIELD SHATTERED!')
                    : (agent ? `${enemyName}'s ENCRYPTION LOCK!` : `${enemyName}'s WORD SHIELD!`)}
                </span>
                </>
                ); })()}
              </motion.div>

              {/* Timer */}
              {!showResult && (
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className={`text-sm font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-slate-300'}`}>
                    {timeLeft}s
                  </div>
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${timeLeft <= 5 ? 'bg-red-500' : 'bg-amber-500'}`}
                      initial={{ width: '100%' }}
                      animate={{ width: `${(timeLeft / 15) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* The word */}
              <motion.div
                className="bg-slate-800/80 border border-slate-600 rounded-xl px-6 py-3 mb-1"
                animate={!showResult ? { scale: [1, 1.02, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <p className="text-xs text-slate-400 mb-1">What does this word mean?</p>
                <p className="text-2xl font-black text-white tracking-wide">{vocabWord.word}</p>
              </motion.div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {options.map((option, i) => {
                const isSelected = selectedIndex === i;
                const isCorrectOption = i === correctIndex;
                const showCorrect = showResult && isCorrectOption;
                const showWrong = showResult && isSelected && !isCorrectOption;

                return (
                  <motion.button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={showResult}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all text-sm font-medium
                      ${showCorrect
                        ? 'bg-green-500/30 border-green-400 text-green-200'
                        : showWrong
                          ? 'bg-red-500/30 border-red-400 text-red-200'
                          : isSelected
                            ? 'bg-amber-500/30 border-amber-400 text-white'
                            : 'bg-slate-800/60 border-slate-600 text-slate-200 hover:border-amber-500 hover:bg-slate-700/60'
                      }
                      ${showResult ? 'cursor-default' : 'cursor-pointer'}
                    `}
                    whileHover={!showResult ? { scale: 1.02 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                  >
                    <div className="flex items-center gap-2">
                      {showCorrect && <Zap className="w-4 h-4 text-green-400 shrink-0" />}
                      {showWrong && <X className="w-4 h-4 text-red-400 shrink-0" />}
                      <span>{option}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Result message */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-center"
                >
                  {selectedIndex === correctIndex ? (
                    <p className="text-green-300 font-bold">⚡ MASSIVE DAMAGE! Shield destroyed!</p>
                  ) : (
                    <p className="text-red-300 font-bold">💥 Shield holds! {enemyName} counter-attacks!</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
