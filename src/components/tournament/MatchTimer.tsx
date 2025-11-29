import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface MatchTimerProps {
  roundEndsAt?: string;
  className?: string;
}

export const MatchTimer = ({ roundEndsAt, className = '' }: MatchTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!roundEndsAt) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const end = new Date(roundEndsAt).getTime();
      const diff = Math.max(0, end - now);
      setTimeLeft(Math.floor(diff / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);


    return () => clearInterval(interval);
  }, [roundEndsAt]);

  if (!roundEndsAt) {
    return null;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLow = timeLeft <= 10;

  return (
    <div
      className={`flex items-center gap-2 text-4xl font-bold ${
        isLow ? 'text-destructive animate-pulse' : 'text-foreground'
      } ${className}`}
    >
      <Clock className="h-8 w-8" />
      <span>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
};
