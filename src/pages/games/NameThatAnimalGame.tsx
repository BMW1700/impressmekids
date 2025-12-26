import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Volume2, RotateCcw, ArrowLeft, PartyPopper } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStats } from "@/hooks/useGameStats";

interface Animal {
  name: string;
  emoji: string;
  firstLetter: string;
}

const ANIMALS: Animal[] = [
  { name: "Lion", emoji: "🦁", firstLetter: "L" },
  { name: "Elephant", emoji: "🐘", firstLetter: "E" },
  { name: "Zebra", emoji: "🦓", firstLetter: "Z" },
  { name: "Giraffe", emoji: "🦒", firstLetter: "G" },
  { name: "Monkey", emoji: "🐵", firstLetter: "M" },
  { name: "Bear", emoji: "🐻", firstLetter: "B" },
  { name: "Tiger", emoji: "🐯", firstLetter: "T" },
  { name: "Panda", emoji: "🐼", firstLetter: "P" },
  { name: "Frog", emoji: "🐸", firstLetter: "F" },
  { name: "Dolphin", emoji: "🐬", firstLetter: "D" },
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const NameThatAnimalGame = () => {
  const { updateGameStats } = useGameStats();
  const [gameAnimals, setGameAnimals] = useState<Animal[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [nameChoices, setNameChoices] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const statsUpdatedRef = useRef(false);

  // Initialize game
  const initializeGame = useCallback(() => {
    const shuffled = shuffleArray(ANIMALS);
    setGameAnimals(shuffled);
    setCurrentRound(0);
    setIsGameComplete(false);
    setFeedback(null);
    statsUpdatedRef.current = false;
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Generate name choices for current round
  useEffect(() => {
    if (gameAnimals.length === 0) return;
    
    const currentAnimal = gameAnimals[currentRound];
    if (!currentAnimal) return;

    const correctName = currentAnimal.name;
    
    // Get 2 random incorrect animal names
    const incorrectNames = ANIMALS
      .filter(a => a.name !== correctName)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map(a => a.name);
    
    // Combine and shuffle
    const choices = shuffleArray([correctName, ...incorrectNames]);
    setNameChoices(choices);
    
    // Auto-play audio on round start
    setTimeout(() => speakAnimalName(currentAnimal.name), 500);
  }, [currentRound, gameAnimals]);

  // Text-to-speech for animal name
  const speakAnimalName = (name: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(name);
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Play feedback sounds
  const playFeedbackSound = (isCorrect: boolean) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (isCorrect) {
      // Happy ascending tones
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } else {
      // Gentle low tone
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  };

  // Handle name selection
  const handleNameSelect = (name: string) => {
    if (feedback) return; // Prevent double-clicks during feedback
    
    const currentAnimal = gameAnimals[currentRound];
    const isCorrect = name === currentAnimal.name;
    
    setFeedback(isCorrect ? "correct" : "incorrect");
    playFeedbackSound(isCorrect);
    
    if (isCorrect) {
      setTimeout(() => {
        setFeedback(null);
        if (currentRound + 1 >= gameAnimals.length) {
          setIsGameComplete(true);
          if (!statsUpdatedRef.current) {
            statsUpdatedRef.current = true;
            updateGameStats(true);
          }
        } else {
          setCurrentRound(prev => prev + 1);
        }
      }, 1200);
    } else {
      setTimeout(() => setFeedback(null), 800);
    }
  };

  const currentAnimal = gameAnimals[currentRound];

  if (!currentAnimal && !isGameComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 dark:from-background dark:via-background dark:to-background">
      <Header />
      
      <main className="flex-1 py-6 px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Back button and progress */}
          <div className="flex items-center justify-between mb-6">
            <Link to="/games">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Games
              </Button>
            </Link>
            {!isGameComplete && (
              <div className="text-sm font-medium text-muted-foreground">
                {currentRound + 1} / {gameAnimals.length}
              </div>
            )}
          </div>

          {isGameComplete ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-12"
            >
              <Card className="p-8 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <PartyPopper className="h-20 w-20 mx-auto text-green-600 mb-6" />
                </motion.div>
                <h2 className="text-3xl md:text-4xl font-bold text-green-700 dark:text-green-400 mb-4">
                  Great Job! 🎉
                </h2>
                <p className="text-lg text-green-600 dark:text-green-500 mb-8">
                  You named all the animals!
                </p>
                <Button
                  onClick={initializeGame}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white text-xl px-8 py-6 rounded-2xl"
                >
                  <RotateCcw className="h-6 w-6 mr-2" />
                  Play Again
                </Button>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {/* Title */}
              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Name that Animal! 🐾
                </h1>
                <p className="text-muted-foreground">
                  What is this animal called?
                </p>
              </div>

              {/* Animal Display */}
              <Card className="p-8 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentRound}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="text-center"
                  >
                    {/* Animal emoji */}
                    <motion.div
                      className="text-[120px] md:text-[160px] leading-none mb-4"
                      animate={feedback === "correct" ? { 
                        scale: [1, 1.2, 1],
                        rotate: [0, -5, 5, -5, 0]
                      } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {currentAnimal.emoji}
                    </motion.div>

                    {/* Replay audio button */}
                    <Button
                      onClick={() => speakAnimalName(currentAnimal.name)}
                      variant="outline"
                      size="lg"
                      className="gap-3 text-lg px-6 py-4 rounded-xl border-2 hover:bg-primary/10"
                      disabled={isPlaying}
                    >
                      <Volume2 className={`h-6 w-6 ${isPlaying ? 'animate-pulse text-primary' : ''}`} />
                      Hear the Name
                    </Button>
                  </motion.div>
                </AnimatePresence>
              </Card>

              {/* Name Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {nameChoices.map((name, index) => {
                  const isCorrect = name === currentAnimal.name;
                  const showCorrect = feedback === "correct" && isCorrect;
                  const showIncorrect = feedback === "incorrect" && !isCorrect;

                  return (
                    <motion.div
                      key={`${currentRound}-${name}`}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Button
                        onClick={() => handleNameSelect(name)}
                        disabled={!!feedback}
                        className={`
                          w-full h-20 md:h-24 text-2xl md:text-3xl font-bold rounded-2xl
                          transition-all duration-200 transform
                          ${showCorrect 
                            ? 'bg-green-500 hover:bg-green-500 text-white scale-105 ring-4 ring-green-300' 
                            : showIncorrect
                            ? 'bg-orange-400 hover:bg-orange-400 text-white opacity-50'
                            : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105'
                          }
                          active:scale-95
                          shadow-lg hover:shadow-xl
                        `}
                      >
                        {name}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Feedback message */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`text-center text-2xl font-bold ${
                      feedback === "correct" 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-orange-500 dark:text-orange-400"
                    }`}
                  >
                    {feedback === "correct" ? (
                      <span>🌟 Wonderful! 🌟</span>
                    ) : (
                      <span>Try again! 💪</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NameThatAnimalGame;
