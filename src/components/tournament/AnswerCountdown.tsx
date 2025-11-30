import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface AnswerCountdownProps {
  deadline: string;
}

export const AnswerCountdown = ({ deadline }: AnswerCountdownProps) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    const calculateSecondsLeft = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const diff = Math.max(0, Math.floor((deadlineTime - now) / 1000));
      setSecondsLeft(diff);
    };

    // Initial calculation
    calculateSecondsLeft();

    // Update every 100ms for smooth countdown
    const interval = setInterval(calculateSecondsLeft, 100);

    return () => clearInterval(interval);
  }, [deadline]);

  const getColor = () => {
    if (secondsLeft > 7) return 'bg-green-500/20 text-green-600 border-green-500/50';
    if (secondsLeft > 3) return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/50';
    return 'bg-red-500/20 text-red-600 border-red-500/50 animate-pulse';
  };

  return (
    <Badge variant="outline" className={`text-xl px-6 py-3 mt-2 ${getColor()}`}>
      <Clock className="mr-2 h-5 w-5" />
      {secondsLeft}s remaining
    </Badge>
  );
};
