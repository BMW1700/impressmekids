import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw, Lightbulb, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Flashcard {
  front: string;
  back: string;
  hint?: string;
}

interface FlashcardSetViewerProps {
  flashcards: Flashcard[];
}

export function FlashcardSetViewer({ flashcards }: FlashcardSetViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>(flashcards);

  const currentCard = shuffledCards[currentIndex];
  const hasHint = currentCard?.hint && currentCard.hint.trim().length > 0;
  
  // Rotate through brain-stimulating colors
  const borderColors = ['border-yellow-400', 'border-orange-400', 'border-red-400', 'border-blue-400', 'border-green-400'];
  const currentBorderColor = borderColors[currentIndex % borderColors.length];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex, isFlipped]);

  const handleNext = () => {
    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setShuffledCards(flashcards);
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No flashcards available
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between px-2">
        <span className="text-sm font-medium text-muted-foreground">
          Card {currentIndex + 1} of {shuffledCards.length}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleShuffle}>
            <Shuffle className="h-4 w-4 mr-1" />
            Shuffle
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      <div className="relative">
        <Card 
          className={cn(
            "relative cursor-pointer transition-all duration-300 border-4 shadow-lg hover:shadow-xl",
            currentBorderColor,
            isFlipped && "scale-[0.98]"
          )}
          onClick={handleFlip}
        >
          <CardContent className="p-6 min-h-[240px] flex flex-col">
            <div className={cn(
              "flex-1 flex items-center justify-center",
              !isFlipped ? "block" : "hidden"
            )}>
              <div className="text-center space-y-3">
                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Question
                </p>
                <p className="text-lg font-semibold leading-tight">{currentCard.front}</p>
                <p className="text-xs text-muted-foreground italic">
                  Click to reveal answer
                </p>
              </div>
            </div>

            <div className={cn(
              "flex-1 flex items-center justify-center",
              isFlipped ? "block" : "hidden"
            )}>
              <div className="text-center space-y-3">
                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Answer
                </p>
                <p className="text-lg font-medium leading-tight">{currentCard.back}</p>
                <p className="text-xs text-muted-foreground italic">
                  Click to see question
                </p>
              </div>
            </div>

            {/* Navigation buttons integrated into card */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                disabled={currentIndex === 0}
                className="hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex-1 mx-4">
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      currentBorderColor.replace('border-', 'bg-')
                    )}
                    style={{ width: `${((currentIndex + 1) / shuffledCards.length) * 100}%` }}
                  />
                </div>
              </div>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                disabled={currentIndex === shuffledCards.length - 1}
                className="hover:bg-muted"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {hasHint && !isFlipped && (
          <div className="mt-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowHint(!showHint)}
              className="w-full"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </Button>
            
            {showHint && (
              <Card className="mt-2 bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-400">
                <CardContent className="p-3">
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">
                    💡 {currentCard.hint}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        💡 Tip: Use arrow keys (←→) to navigate, Space/Enter to flip
      </p>
    </div>
  );
}