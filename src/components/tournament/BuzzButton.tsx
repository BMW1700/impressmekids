import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface BuzzButtonProps {
  onBuzz: () => void;
  disabled?: boolean;
  canBuzz?: boolean;
}

export const BuzzButton = ({ onBuzz, disabled, canBuzz }: BuzzButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !disabled && canBuzz) {
        e.preventDefault();
        setIsPressed(true);
        onBuzz();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onBuzz, disabled, canBuzz]);

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        size="lg"
        onClick={onBuzz}
        disabled={disabled || !canBuzz}
        className={`h-32 w-32 rounded-full text-2xl font-bold transition-all ${
          isPressed ? 'scale-95' : 'scale-100'
        } ${!disabled && canBuzz ? 'animate-pulse' : ''}`}
        aria-label="Buzz in to answer"
      >
        <Zap className="h-16 w-16" />
      </Button>
      <p className="text-sm text-muted-foreground">Press SPACE or tap to buzz in</p>
    </div>
  );
};
