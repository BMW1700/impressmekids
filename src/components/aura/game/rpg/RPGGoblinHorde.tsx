import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Coins, Sparkles } from "lucide-react";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { MiniGoblin } from "./MiniGoblin";
import { MiniOperative } from "./MiniOperative";
import { getStoredTheme } from "@/lib/gameTheme";

interface GoblinWord {
  id: number;
  word: string;
  x: number;
  defeated: boolean;
  speed: number;
}

interface FloatingReward {
  id: number;
  type: 'gold' | 'xp';
  amount: number;
  x: number;
  y: number;
}

interface RPGGoblinHordeProps {
  words: string[];
  enemyName?: string;
  onComplete: (result: { success: boolean; wordsSpoken: number; totalWords: number }) => void;
  onWordResult?: (word: string, correct: boolean) => void;
  theme?: string;
}

const isAgent = () => getStoredTheme() === 'agent';

const battleSounds = new SoundEffects();

export const RPGGoblinHorde = ({
  words,
  enemyName = "Goblin",
  onComplete,
  onWordResult,
}: RPGGoblinHordeProps) => {
  const [goblins, setGoblins] = useState<GoblinWord[]>([]);
  const [currentGoblinIndex, setCurrentGoblinIndex] = useState(0);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [defeatedCount, setDefeatedCount] = useState(0);
  const [escapedCount, setEscapedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [floatingRewards, setFloatingRewards] = useState<FloatingReward[]>([]);
  const [totalGold, setTotalGold] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const wordsKey = useMemo(() => words.join('|'), [words]);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const rewardIdRef = useRef(0);
  const processingRef = useRef(false);
  const gameWordsRef = useRef<string[]>([]);
  const goblinsRef = useRef<GoblinWord[]>([]);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initializedWordsKeyRef = useRef<string | null>(null);

  // Keep goblinsRef in sync
  useEffect(() => {
    goblinsRef.current = goblins;
  }, [goblins]);

  // Initialize words and spawn goblins
  useEffect(() => {
    if (initializedWordsKeyRef.current === wordsKey) return;

    initializedWordsKeyRef.current = wordsKey;

    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }

    isListeningRef.current = false;
    processingRef.current = false;
    setIsMicActive(false);
    setFeedback(null);
    setDefeatedCount(0);
    setEscapedCount(0);
    setGameOver(false);
    setFloatingRewards([]);
    setTotalGold(0);
    setTotalXp(0);
    setGoblins([]);
    goblinsRef.current = [];

    const cleanWords = words
      .filter(w => w.length >= 2 && w.length <= 8)
      .slice(0, 8)
      .map(w => w.replace(/[^a-zA-Z]/g, ''));
    
    if (cleanWords.length < 3) {
      gameWordsRef.current = ['run', 'jump', 'play', 'read', 'fun'];
    } else {
      gameWordsRef.current = cleanWords;
    }

    // Spawn first goblin immediately
    spawnGoblin(0);

    // Spawn goblins one at a time with delays
    let index = 1;
    spawnIntervalRef.current = setInterval(() => {
      if (index < gameWordsRef.current.length) {
        spawnGoblin(index);
        index++;
      } else {
        if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
      }
    }, 1800); // Faster spawn interval

    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    };
  }, [words, wordsKey]);

  const spawnGoblin = (index: number) => {
    const word = gameWordsRef.current[index];
    if (!word) return;

    const newGoblin: GoblinWord = {
      id: index,
      word: word.toLowerCase(),
      x: 100,
      defeated: false,
      speed: 0.18 + Math.random() * 0.07, // Faster goblins
    };

    setGoblins(prev => {
      const next = [...prev, newGoblin];
      goblinsRef.current = next;
      return next;
    });
  };

  // Move goblins and check for escapes
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setGoblins(prev => {
        const updated = prev.map(g => {
          if (g.defeated) return g;
          const newX = g.x - g.speed;
          
          // Goblin escaped!
          if (newX <= 5) {
            setEscapedCount(c => c + 1);
            return { ...g, x: newX, defeated: true };
          }
          
          return { ...g, x: newX };
        });
        goblinsRef.current = updated;
        return updated;
      });
    }, 50);

    return () => clearInterval(moveInterval);
  }, []);

  // Check for game over
  useEffect(() => {
    const totalGoblins = gameWordsRef.current.length;
    if (totalGoblins > 0 && defeatedCount + escapedCount >= totalGoblins && !gameOver) {
      setGameOver(true);
      stopMic();
      
      const success = defeatedCount >= Math.ceil(totalGoblins * 0.5);
      setTimeout(() => {
        onComplete({
          success,
          wordsSpoken: defeatedCount,
          totalWords: totalGoblins,
        });
      }, 1500);
    }
  }, [defeatedCount, escapedCount, gameOver, onComplete]);

  const showFloatingReward = useCallback((type: 'gold' | 'xp', amount: number, x: number) => {
    const id = ++rewardIdRef.current;
    setFloatingRewards(prev => [...prev, { id, type, amount, x, y: 50 }]);
    
    if (type === 'gold') setTotalGold(g => g + amount);
    else setTotalXp(x => x + amount);

    setTimeout(() => {
      setFloatingRewards(prev => prev.filter(r => r.id !== id));
    }, 1000);
  }, []);

  const handleGoblinDefeat = useCallback((goblinId: number, word: string) => {
    const targetGoblin = goblinsRef.current.find(g => g.id === goblinId);
    if (!targetGoblin || targetGoblin.defeated) return;

    const nextGoblins = goblinsRef.current.map(g => 
      g.id === goblinId ? { ...g, defeated: true } : g
    );

    goblinsRef.current = nextGoblins;
    setGoblins(nextGoblins);
    
    setDefeatedCount(c => c + 1);
    setFeedback({ text: "Got 'em!", type: 'success' });
    battleSounds.correctWord();
    
    const goldReward = 5 + Math.floor(Math.random() * 5);
    const xpReward = 8 + Math.floor(Math.random() * 7);
    showFloatingReward('gold', goldReward, 50);
    showFloatingReward('xp', xpReward, 60);
    
    onWordResult?.(word, true);
    
    setTimeout(() => setFeedback(null), 600);
  }, [onWordResult, showFloatingReward]);

  const startListeningForGoblin = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognitionRef.current = recognition;

      recognition.onresult = (event: any) => {
        if (processingRef.current) return;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const spokenWords = new Set<string>();

          for (let j = 0; j < result.length; j++) {
            const transcript = result[j]?.transcript?.toLowerCase().trim() || '';
            transcript.split(/\s+/).forEach((spoken: string) => {
              const cleanSpoken = spoken.replace(/[^a-z]/g, '');
              if (cleanSpoken.length >= 2) {
                spokenWords.add(cleanSpoken);
              }
            });
          }

          for (const spoken of spokenWords) {
            const activeGoblins = goblinsRef.current.filter(g => !g.defeated);
            const matchedGoblin = activeGoblins.find(goblin => isWordMatchLenient(spoken, goblin.word));

            if (matchedGoblin) {
              handleGoblinDefeat(matchedGoblin.id, matchedGoblin.word);
            }
          }
        }
      };

      recognition.onerror = () => {
        if (isListeningRef.current && !gameOver) {
          setTimeout(() => startListeningForGoblin(), 200);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current && !gameOver) {
          setTimeout(() => startListeningForGoblin(), 100);
        }
      };

      recognition.start();
    } catch {}
  }, [gameOver, handleGoblinDefeat]);

  const startMic = useCallback(() => {
    setIsMicActive(true);
    isListeningRef.current = true;
    startListeningForGoblin();
  }, [startListeningForGoblin]);

  const stopMic = useCallback(() => {
    setIsMicActive(false);
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
  }, []);

  // Auto-start mic
  useEffect(() => {
    const timer = setTimeout(() => startMic(), 500);
    return () => {
      clearTimeout(timer);
      stopMic();
    };
  }, [wordsKey, startMic, stopMic]);

  const agent = isAgent();

  // Render goblin/operative sprite
  const renderGoblin = (goblin: GoblinWord) => {
    if (goblin.defeated) {
      return (
        <motion.div
          key={`defeated-${goblin.id}`}
          className="absolute"
          style={{ left: `${goblin.x}%`, bottom: '15%' }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 1.5, y: -50 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-4xl">{agent ? '⚡' : '💥'}</div>
        </motion.div>
      );
    }

    const variants: Array<'soldier' | 'heavy' | 'sniper'> = ['soldier', 'heavy', 'sniper'];

    return (
      <motion.div
        key={goblin.id}
        className="absolute flex flex-col items-center"
        style={{ left: `${goblin.x}%`, bottom: '15%' }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <motion.div
          className={`${agent ? 'bg-slate-800/90 border-cyan-500' : 'bg-red-900/90 border-red-500'} px-3 py-1 rounded-lg mb-2 border-2 shadow-lg`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <span className="text-white font-bold text-lg uppercase tracking-wider">
            {goblin.word}
          </span>
        </motion.div>
        
        <div className="relative">
          {agent ? (
            <MiniOperative size={48} flipX variant={variants[goblin.id % 3]} />
          ) : (
            <MiniGoblin size={48} flipX />
          )}
          <motion.div
            className="absolute -bottom-1 left-0 text-lg opacity-60"
            animate={{ opacity: [0.3, 0.6, 0.3], x: [0, 8, 0] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          >
            💨
          </motion.div>
        </div>
      </motion.div>
    );
  };

  if (gameOver) {
    const totalGoblins = gameWordsRef.current.length;
    const success = defeatedCount >= Math.ceil(totalGoblins * 0.5);
    
    return (
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-green-900/95 to-emerald-950/95 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-center p-8 rounded-2xl bg-slate-900/80 border-2 border-green-500/50"
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
        >
          <motion.div 
            className="text-6xl mb-4"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: 3 }}
          >
            {agent ? (success ? '🎯' : '⚠️') : (success ? '⚔️' : '😅')}
          </motion.div>
          <h2 className={`text-3xl font-black mb-4 ${success ? 'text-green-400' : 'text-yellow-400'}`}>
            {agent
              ? (success ? 'SQUAD NEUTRALIZED!' : 'They Escaped!')
              : (success ? 'HORDE DEFEATED!' : 'They Got Away!')}
          </h2>
          <div className="flex gap-8 justify-center mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{defeatedCount}</p>
              <p className="text-sm text-slate-400">Defeated</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{escapedCount}</p>
              <p className="text-sm text-slate-400">Escaped</p>
            </div>
          </div>
          <div className="flex gap-6 justify-center">
            <div className="flex items-center gap-2 bg-yellow-900/50 px-4 py-2 rounded-lg">
              <Coins className="h-5 w-5 text-yellow-400" />
              <span className="text-yellow-300 font-bold">+{totalGold}</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-900/50 px-4 py-2 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <span className="text-purple-300 font-bold">+{totalXp} XP</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="fixed inset-0 z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Background */}
      <div className={`absolute inset-0 ${agent
        ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-gray-950'
        : 'bg-gradient-to-b from-green-900 via-emerald-800 to-green-950'}`} />
      
      {/* Ground */}
      <div className={`absolute bottom-0 left-0 right-0 h-[20%] ${agent
        ? 'bg-gradient-to-t from-gray-800 to-slate-700'
        : 'bg-gradient-to-t from-amber-900 to-green-800'}`} />
      
      {/* Player zone indicator */}
      <div className={`absolute left-0 bottom-[15%] w-[8%] h-[30%] flex items-center justify-center border-r-2 ${agent
        ? 'bg-gradient-to-r from-cyan-500/20 to-transparent border-cyan-400/50'
        : 'bg-gradient-to-r from-blue-500/30 to-transparent border-blue-400/50'}`}>
        <div className="text-4xl">{agent ? '🎯' : '🛡️'}</div>
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
        <div className={`bg-slate-900/80 px-4 py-2 rounded-xl border ${agent ? 'border-cyan-500/50' : 'border-green-500/50'}`}>
          <h2 className={`text-xl font-black ${agent ? 'text-cyan-400' : 'text-green-400'}`}>
            {agent ? '🎯 HOSTILE SQUAD!' : '⚔️ GOBLIN HORDE!'}
          </h2>
          <p className={`text-sm ${agent ? 'text-cyan-300' : 'text-green-300'}`}>
            {agent ? 'Speak the words to eliminate them!' : 'Speak the words to defeat them!'}
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-yellow-900/80 px-4 py-2 rounded-xl border border-yellow-500/50">
            <Coins className="h-5 w-5 text-yellow-400" />
            <span className="text-yellow-300 font-bold">{totalGold}</span>
          </div>
          <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-purple-500/50">
            <span className="text-green-400 font-bold">{defeatedCount}</span>
            <span className="text-slate-400"> / </span>
            <span className="text-slate-300">{gameWordsRef.current.length}</span>
          </div>
        </div>
      </div>

      {/* Floating rewards */}
      <AnimatePresence>
        {floatingRewards.map(reward => (
          <motion.div
            key={reward.id}
            className={`absolute z-30 font-bold text-xl ${
              reward.type === 'gold' ? 'text-yellow-400' : 'text-purple-400'
            }`}
            style={{ left: `${reward.x}%`, top: `${reward.y}%` }}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -50 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            +{reward.amount} {reward.type === 'gold' ? '🪙' : '✨'}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Goblins */}
      <div className="absolute inset-0">
        {goblins.map(goblin => renderGoblin(goblin))}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30
              text-4xl font-black ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic control */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <motion.div
          className={`p-6 rounded-full ${
            isMicActive 
              ? 'bg-green-600 shadow-[0_0_30px_rgba(34,197,94,0.5)]' 
              : 'bg-slate-700'
          }`}
          animate={isMicActive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
          onClick={() => isMicActive ? stopMic() : startMic()}
        >
          {isMicActive ? (
            <Mic className="h-10 w-10 text-white" />
          ) : (
            <MicOff className="h-10 w-10 text-slate-400" />
          )}
        </motion.div>
        {isMicActive && (
          <motion.p 
            className="text-center text-green-300 mt-2 font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🎤 Listening...
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};
