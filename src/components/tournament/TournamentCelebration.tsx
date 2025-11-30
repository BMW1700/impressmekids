import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface TournamentCelebrationProps {
  winner: { name: string; score: number } | null;
  runnerUp: { name: string; score: number } | null;
  tournamentName: string;
}

export const TournamentCelebration = ({ winner, runnerUp, tournamentName }: TournamentCelebrationProps) => {
  const [showWinner, setShowWinner] = useState(false);
  const [showRunnerUp, setShowRunnerUp] = useState(false);

  useEffect(() => {
    // Staggered entrance
    setTimeout(() => setShowWinner(true), 300);
    setTimeout(() => setShowRunnerUp(true), 900);
  }, []);

  // Generate confetti particles
  const confetti = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    emoji: ['🌸', '✨', '🎉', '⭐'][i % 4],
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
  }));

  return (
    <div className="relative w-full overflow-hidden rounded-xl border-2 border-gradient-primary bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/30 dark:via-amber-950/30 dark:to-orange-950/30 shadow-2xl">
      {/* Confetti particles */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="absolute text-2xl animate-confetti-fall pointer-events-none"
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        >
          {particle.emoji}
        </div>
      ))}

      <CardContent className="relative z-10 py-12 px-6">
        {/* Winner Section */}
        <div
          className={`text-center mb-8 transition-all duration-700 ${
            showWinner ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="text-8xl mb-4 animate-trophy-shine inline-block">
            🏆
          </div>
          <h2 className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-3 animate-glow-pulse">
            TOURNAMENT CHAMPION!
          </h2>
          <div className="text-5xl font-bold mb-2 animate-pop-in-bounce">
            ⭐ {winner?.name || 'Unknown'} ⭐
          </div>
          <div className="text-2xl font-semibold text-muted-foreground">
            {winner?.score || 0} points
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent my-8" />

        {/* Runner-Up Section */}
        {runnerUp && (
          <div
            className={`text-center transition-all duration-700 ${
              showRunnerUp ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div className="text-6xl mb-3 animate-float-up inline-block">
              🥈
            </div>
            <h3 className="text-3xl font-bold text-gray-600 dark:text-gray-300 mb-2">
              2nd Place
            </h3>
            <div className="text-4xl font-bold mb-2">
              {runnerUp.name}
            </div>
            <div className="text-xl font-semibold text-muted-foreground">
              {runnerUp.score} points
            </div>
          </div>
        )}

        {/* Tournament Name */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            {tournamentName}
          </p>
        </div>
      </CardContent>
    </div>
  );
};
