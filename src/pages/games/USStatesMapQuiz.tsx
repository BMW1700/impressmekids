import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Play, RotateCcw, Trophy, Clock, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { USMap } from "@/components/games/USMap";
import { useGameStats } from "@/hooks/useGameStats";

interface GameState {
  status: "start" | "playing" | "finished";
  currentQuestion: number;
  score: number;
  correctAnswers: number;
  states: string[];
  currentState: string;
  feedback: { type: "correct" | "incorrect"; clickedState?: string } | null;
  startTime: number;
  elapsedTime: number;
}

const ALL_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

const QUESTIONS_PER_GAME = 30;

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const USStatesMapQuiz = () => {
  const { updateGameStats } = useGameStats();
  const statsUpdatedRef = useRef(false);
  const [game, setGame] = useState<GameState>({
    status: "start",
    currentQuestion: 0,
    score: 0,
    correctAnswers: 0,
    states: [],
    currentState: "",
    feedback: null,
    startTime: 0,
    elapsedTime: 0,
  });

  // Timer effect
  useEffect(() => {
    if (game.status !== "playing") return;
    
    const interval = setInterval(() => {
      setGame(prev => ({
        ...prev,
        elapsedTime: Math.floor((Date.now() - prev.startTime) / 1000)
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [game.status]);

  const startGame = useCallback(() => {
    const shuffledStates = shuffleArray(ALL_STATES).slice(0, QUESTIONS_PER_GAME);
    statsUpdatedRef.current = false;
    setGame({
      status: "playing",
      currentQuestion: 0,
      score: 0,
      correctAnswers: 0,
      states: shuffledStates,
      currentState: shuffledStates[0],
      feedback: null,
      startTime: Date.now(),
      elapsedTime: 0,
    });
  }, []);

  const handleStateClick = useCallback((clickedState: string) => {
    if (game.feedback || game.status !== "playing") return;

    const isCorrect = clickedState === game.currentState;
    
    setGame(prev => ({
      ...prev,
      score: isCorrect ? prev.score + 10 : Math.max(0, prev.score - 2),
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      feedback: { type: isCorrect ? "correct" : "incorrect", clickedState: isCorrect ? undefined : clickedState },
    }));

    // Move to next question after delay
    setTimeout(() => {
      setGame(prev => {
        const nextQuestion = prev.currentQuestion + 1;
        if (nextQuestion >= QUESTIONS_PER_GAME) {
          // Game finished - update stats
          if (!statsUpdatedRef.current) {
            statsUpdatedRef.current = true;
            const won = prev.correctAnswers >= QUESTIONS_PER_GAME * 0.7; // 70% to win
            updateGameStats(won);
          }
          return { ...prev, status: "finished", feedback: null };
        }
        return {
          ...prev,
          currentQuestion: nextQuestion,
          currentState: prev.states[nextQuestion],
          feedback: null,
        };
      });
    }, isCorrect ? 800 : 1500);
  }, [game.feedback, game.status, game.currentState]);

  const accuracy = game.correctAnswers > 0 || game.currentQuestion > 0
    ? Math.round((game.correctAnswers / (game.status === "finished" ? QUESTIONS_PER_GAME : game.currentQuestion || 1)) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-sky-50 to-cyan-50 dark:from-background dark:via-background dark:to-background">
      <Header />
      
      <main className="flex-1 py-4 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Link to="/games">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Games
              </Button>
            </Link>
            {game.status === "playing" && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-white/80 dark:bg-card/80 px-3 py-1.5 rounded-full">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="font-mono font-bold">{formatTime(game.elapsedTime)}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 dark:bg-card/80 px-3 py-1.5 rounded-full">
                  <Target className="h-4 w-4 text-green-500" />
                  <span className="font-bold">{game.score}</span>
                </div>
                <div className="bg-white/80 dark:bg-card/80 px-3 py-1.5 rounded-full font-medium">
                  {game.currentQuestion + 1} / {QUESTIONS_PER_GAME}
                </div>
              </div>
            )}
          </div>

          {/* Start Screen */}
          {game.status === "start" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Card className="max-w-xl mx-auto p-8 bg-white/90 dark:bg-card/90 backdrop-blur-sm">
                <div className="text-6xl mb-6">🗺️</div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                  U.S. States Map Quiz
                </h1>
                <p className="text-muted-foreground mb-6 text-lg">
                  Can you find all 50 states on the map? Test your geography skills by clicking on the correct state!
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 text-left">
                  <h3 className="font-semibold mb-2">How to Play:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• You'll be asked to find {QUESTIONS_PER_GAME} states</li>
                    <li>• Click on the correct state on the map</li>
                    <li>• Green = Correct! Red = Try to remember for next time</li>
                    <li>• See how fast and accurate you can be!</li>
                  </ul>
                </div>
                <Button
                  onClick={startGame}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xl px-8 py-6 rounded-2xl gap-3"
                >
                  <Play className="h-6 w-6" />
                  Start Game
                </Button>
              </Card>
            </motion.div>
          )}

          {/* Game Screen */}
          {game.status === "playing" && (
            <div className="space-y-4">
              {/* Question prompt */}
              <Card className="p-4 bg-white/90 dark:bg-card/90 backdrop-blur-sm text-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={game.currentState}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <p className="text-lg text-muted-foreground mb-1">Click on:</p>
                    <h2 className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">
                      {game.currentState}
                    </h2>
                  </motion.div>
                </AnimatePresence>
              </Card>

              {/* Feedback message */}
              <AnimatePresence>
                {game.feedback && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`text-center py-3 px-6 rounded-xl font-bold text-lg ${
                      game.feedback.type === "correct"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {game.feedback.type === "correct" ? (
                      "✓ Correct! Great job!"
                    ) : (
                      <>Oops! That was {game.feedback.clickedState}. The correct answer is highlighted in green.</>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Map */}
              <Card className="p-2 md:p-4 bg-white/90 dark:bg-card/90 backdrop-blur-sm overflow-hidden">
                <USMap
                  onStateClick={handleStateClick}
                  highlightCorrect={game.feedback ? game.currentState : undefined}
                  highlightIncorrect={game.feedback?.type === "incorrect" ? game.feedback.clickedState : undefined}
                  disabled={!!game.feedback}
                />
              </Card>
            </div>
          )}

          {/* Results Screen */}
          {game.status === "finished" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <Card className="max-w-xl mx-auto p-8 bg-white/90 dark:bg-card/90 backdrop-blur-sm">
                <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
                <h2 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
                  Quiz Complete!
                </h2>
                <p className="text-muted-foreground mb-6">
                  {accuracy >= 90 ? "Outstanding! You're a geography expert! 🌟" :
                   accuracy >= 70 ? "Great job! Keep practicing! 👏" :
                   accuracy >= 50 ? "Good effort! Try again to improve! 💪" :
                   "Keep learning! You'll get better with practice! 📚"}
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                    <div className="text-3xl font-bold text-blue-600">{game.score}</div>
                    <div className="text-sm text-muted-foreground">Score</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                    <div className="text-3xl font-bold text-green-600">{game.correctAnswers}/{QUESTIONS_PER_GAME}</div>
                    <div className="text-sm text-muted-foreground">Correct</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                    <div className="text-3xl font-bold text-purple-600">{formatTime(game.elapsedTime)}</div>
                    <div className="text-sm text-muted-foreground">Time</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={startGame}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    <RotateCcw className="h-5 w-5" />
                    Play Again
                  </Button>
                  <Link to="/games">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Back to Games
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default USStatesMapQuiz;
