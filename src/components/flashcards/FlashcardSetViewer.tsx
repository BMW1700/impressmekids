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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Card {currentIndex + 1} of {shuffledCards.length}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleShuffle}>
            <Shuffle className="h-4 w-4 mr-2" />
            Shuffle
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <div 
        className="relative cursor-pointer perspective-1000"
        onClick={handleFlip}
        style={{ minHeight: '300px' }}
      >
        <Card 
          className={cn(
            "transition-transform duration-500 transform-style-3d",
            isFlipped && "rotate-y-180"
          )}
        >
          <CardContent className="p-8">
            <div className={cn(
              "backface-hidden",
              !isFlipped ? "block" : "hidden"
            )}>
              <div className="text-center space-y-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Question
                </p>
                <p className="text-xl font-medium">{currentCard.front}</p>
                <p className="text-sm text-muted-foreground">
                  (Click to reveal answer)
                </p>
              </div>
            </div>

            <div className={cn(
              "backface-hidden rotate-y-180",
              isFlipped ? "block" : "hidden"
            )}>
              <div className="text-center space-y-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Answer
                </p>
                <p className="text-lg">{currentCard.back}</p>
                <p className="text-sm text-muted-foreground">
                  (Click to see question)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {hasHint && !isFlipped && (
        <div className="space-y-2">
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
            <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  💡 {currentCard.hint}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="flex justify-between gap-2">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button 
          variant="outline" 
          onClick={handleNext}
          disabled={currentIndex === shuffledCards.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / shuffledCards.length) * 100}%` }}
        />
      </div>

      <p className="text-xs text-center text-muted-foreground">
        💡 Tip: Use arrow keys (←→) to navigate, Space/Enter to flip
      </p>
    </div>
  );
}