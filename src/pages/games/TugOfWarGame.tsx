import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { TugOfWarStandalone } from "@/components/games/TugOfWarStandalone";
import { 
  DifficultyLevel, 
  DIFFICULTY_LABELS, 
  DIFFICULTY_DESCRIPTIONS,
  getShuffledWords 
} from "@/data/sightWords";

const DIFFICULTIES: DifficultyLevel[] = ['preK', 'kindergarten', 'firstGrade', 'secondGrade', 'thirdGrade'];

const TugOfWarGame = () => {
  const navigate = useNavigate();
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [gameKey, setGameKey] = useState(0);

  const startGame = useCallback((difficulty: DifficultyLevel) => {
    const shuffledWords = getShuffledWords(difficulty);
    setWords(shuffledWords);
    setSelectedDifficulty(difficulty);
    setGameKey(prev => prev + 1);
  }, []);

  const handlePlayAgain = useCallback(() => {
    if (selectedDifficulty) {
      startGame(selectedDifficulty);
    }
  }, [selectedDifficulty, startGame]);

  const handleChangeDifficulty = useCallback(() => {
    setSelectedDifficulty(null);
    setWords([]);
  }, []);

  const handleExit = useCallback(() => {
    navigate('/games');
  }, [navigate]);

  const handleComplete = useCallback((victory: boolean, stats: { wordsRead: number; correctWords: number; incorrectWords: number }) => {
    console.log('[TugOfWarGame] Game complete:', { victory, stats });
  }, []);

  // Show difficulty selection
  if (!selectedDifficulty) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 via-sky-300 to-green-400">
        <Header showAuthButtons={false} />
        
        <main className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/games')}
            className="mb-6 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Games
          </Button>

          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-block mb-4"
            >
              <div className="bg-white/30 backdrop-blur-sm p-6 rounded-full">
                <Swords className="h-16 w-16 text-white" />
              </div>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
              Reading Tug of War
            </h1>
            <p className="text-xl text-white/90 max-w-lg mx-auto">
              Battle the goblins by reading words aloud! Pull them across the line to win!
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-6" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
              Choose Your Difficulty
            </h2>
            
            <div className="grid gap-4">
              {DIFFICULTIES.map((difficulty, index) => (
                <motion.div
                  key={difficulty}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Button
                    onClick={() => startGame(difficulty)}
                    className="w-full py-8 text-left bg-white/90 hover:bg-white text-gray-800 hover:scale-[1.02] transition-transform"
                    variant="ghost"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="text-xl font-bold">{DIFFICULTY_LABELS[difficulty]}</div>
                        <div className="text-sm text-gray-600">{DIFFICULTY_DESCRIPTIONS[difficulty]}</div>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(index + 1)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-3 h-3 rounded-full ${
                              index < 2 ? 'bg-green-500' : 
                              index < 4 ? 'bg-yellow-500' : 
                              'bg-red-500'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 bg-white/20 backdrop-blur-sm rounded-lg p-4 text-white text-center">
              <h3 className="font-bold mb-2">How to Play</h3>
              <ul className="text-sm text-white/90 space-y-1">
                <li>🎤 Read the word out loud when it appears</li>
                <li>✓ Correct words pull the rope toward you</li>
                <li>✗ Wrong words let the goblins pull</li>
                <li>⏱️ Read quickly - goblins pull every 20 seconds!</li>
                <li>🏆 Pull the flag past the green line to win!</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show game
  return (
    <TugOfWarStandalone
      key={gameKey}
      words={words}
      difficulty={selectedDifficulty}
      onComplete={handleComplete}
      onPlayAgain={handlePlayAgain}
      onChangeDifficulty={handleChangeDifficulty}
      onExit={handleExit}
    />
  );
};

export default TugOfWarGame;
