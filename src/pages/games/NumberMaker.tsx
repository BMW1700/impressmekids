import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Shuffle, Undo2, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CelebrationEffect } from "@/components/aura/CelebrationEffect";
import { motion, AnimatePresence } from "framer-motion";

type Difficulty = 'easy' | 'standard';
type GameStatus = 'playing' | 'won' | 'lost';
type Operation = '+' | '-' | '×' | '÷';

interface MoveHistory {
  cards: number[];
  firstCard: number;
  secondCard: number;
  operation: Operation;
  result: number;
}

// Generate a solvable puzzle by working backwards
const generatePuzzle = (difficulty: Difficulty): { target: number; cards: number[] } => {
  const numCards = difficulty === 'easy' ? 3 : 4;
  const maxNum = difficulty === 'easy' ? 10 : 12;
  
  // Generate random starting numbers
  let cards: number[] = [];
  for (let i = 0; i < numCards; i++) {
    cards.push(Math.floor(Math.random() * maxNum) + 1);
  }
  
  // Simulate operations to find a valid target
  const operations: Operation[] = ['+', '-', '×', '÷'];
  let workingCards = [...cards];
  
  for (let step = 0; step < numCards - 1; step++) {
    if (workingCards.length < 2) break;
    
    // Pick two random cards
    const idx1 = Math.floor(Math.random() * workingCards.length);
    let idx2 = Math.floor(Math.random() * workingCards.length);
    while (idx2 === idx1) {
      idx2 = Math.floor(Math.random() * workingCards.length);
    }
    
    const a = workingCards[idx1];
    const b = workingCards[idx2];
    
    // Try operations in random order until one works
    const shuffledOps = [...operations].sort(() => Math.random() - 0.5);
    let result: number | null = null;
    
    for (const op of shuffledOps) {
      const r = executeOp(a, op, b);
      if (r !== null && Math.abs(r) <= 1000) {
        result = r;
        break;
      }
    }
    
    if (result === null) {
      // Fallback to addition
      result = a + b;
    }
    
    // Remove used cards and add result
    workingCards = workingCards.filter((_, i) => i !== idx1 && i !== idx2);
    workingCards.push(result);
  }
  
  return {
    target: workingCards[0],
    cards: cards
  };
};

const executeOp = (a: number, op: Operation, b: number): number | null => {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      if (b === 0) return null;
      if (a % b !== 0) return null;
      return a / b;
    default:
      return null;
  }
};

// Number Card Component
const NumberCard = ({ 
  value, 
  isSelected, 
  isDisabled, 
  onClick,
  isNew
}: { 
  value: number; 
  isSelected: boolean; 
  isDisabled: boolean; 
  onClick: () => void;
  isNew?: boolean;
}) => (
  <motion.button
    initial={isNew ? { scale: 0, opacity: 0 } : false}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0, opacity: 0 }}
    whileHover={!isDisabled ? { scale: 1.05 } : {}}
    whileTap={!isDisabled ? { scale: 0.95 } : {}}
    onClick={onClick}
    disabled={isDisabled}
    className={`
      relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl font-bold text-3xl sm:text-4xl
      transition-all duration-200 border-2
      ${isSelected 
        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30 scale-110' 
        : 'bg-card text-card-foreground border-border hover:border-primary/50'
      }
      ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    {value}
  </motion.button>
);

// Operation Button Component
const OperationButton = ({ 
  operation, 
  isSelected, 
  isDisabled, 
  onClick 
}: { 
  operation: Operation; 
  isSelected: boolean; 
  isDisabled: boolean; 
  onClick: () => void;
}) => {
  const colors: Record<Operation, string> = {
    '+': 'bg-green-500 hover:bg-green-600',
    '-': 'bg-red-500 hover:bg-red-600',
    '×': 'bg-blue-500 hover:bg-blue-600',
    '÷': 'bg-orange-500 hover:bg-orange-600',
  };

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.1 } : {}}
      whileTap={!isDisabled ? { scale: 0.9 } : {}}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        w-14 h-14 sm:w-16 sm:h-16 rounded-full font-bold text-2xl sm:text-3xl text-white
        transition-all duration-200 shadow-md
        ${isSelected 
          ? 'ring-4 ring-white ring-offset-2 ring-offset-background scale-110' 
          : ''
        }
        ${isDisabled 
          ? 'opacity-40 cursor-not-allowed bg-muted' 
          : colors[operation]
        }
      `}
    >
      {operation}
    </motion.button>
  );
};

// Result Modal Component
const ResultModal = ({ 
  status, 
  targetNumber, 
  finalNumber, 
  onTryAgain, 
  onNewPuzzle 
}: { 
  status: 'won' | 'lost'; 
  targetNumber: number; 
  finalNumber: number; 
  onTryAgain: () => void; 
  onNewPuzzle: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="bg-card rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-border"
    >
      {status === 'won' ? (
        <>
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Amazing!</h2>
          <p className="text-muted-foreground mb-6">You reached {targetNumber}!</p>
        </>
      ) : (
        <>
          <div className="text-6xl mb-4">💪</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Almost!</h2>
          <p className="text-muted-foreground mb-2">You got {finalNumber}</p>
          <p className="text-muted-foreground mb-6">The target was {targetNumber}</p>
        </>
      )}
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onTryAgain} className="px-6">
          Try Again
        </Button>
        <Button onClick={onNewPuzzle} className="px-6">
          New Puzzle
        </Button>
      </div>
    </motion.div>
  </motion.div>
);

// How To Play Component
const HowToPlay = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-card rounded-3xl p-6 max-w-md w-full shadow-2xl border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-foreground">How to Play</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="space-y-3 text-muted-foreground">
            <p className="flex gap-2">
              <span className="text-primary font-bold">1.</span>
              Pick a number card
            </p>
            <p className="flex gap-2">
              <span className="text-primary font-bold">2.</span>
              Pick an operation (+, -, ×, ÷)
            </p>
            <p className="flex gap-2">
              <span className="text-primary font-bold">3.</span>
              Pick another number card
            </p>
            <p className="flex gap-2">
              <span className="text-primary font-bold">4.</span>
              The two cards combine into one!
            </p>
            <p className="flex gap-2">
              <span className="text-primary font-bold">5.</span>
              Keep going until you reach the target!
            </p>
          </div>
          <div className="mt-4 p-3 bg-muted/50 rounded-xl">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> Division only works when the result is a whole number!
            </p>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const NumberMaker = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [targetNumber, setTargetNumber] = useState(0);
  const [numberCards, setNumberCards] = useState<number[]>([]);
  const [selectedFirst, setSelectedFirst] = useState<number | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [moveHistory, setMoveHistory] = useState<MoveHistory[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newCardIndex, setNewCardIndex] = useState<number | null>(null);

  const operations: Operation[] = ['+', '-', '×', '÷'];

  // Initialize game
  useEffect(() => {
    newPuzzle();
  }, [difficulty]);

  const newPuzzle = () => {
    const puzzle = generatePuzzle(difficulty);
    setTargetNumber(puzzle.target);
    setNumberCards(puzzle.cards);
    setSelectedFirst(null);
    setSelectedOperation(null);
    setGameStatus('playing');
    setMoveHistory([]);
    setErrorMessage(null);
    setNewCardIndex(null);
  };

  const resetPuzzle = () => {
    if (moveHistory.length === 0) return;
    
    // Restore original cards from first move
    const originalCards = moveHistory[0].cards;
    setNumberCards(originalCards);
    setSelectedFirst(null);
    setSelectedOperation(null);
    setGameStatus('playing');
    setMoveHistory([]);
    setErrorMessage(null);
    setNewCardIndex(null);
  };

  const undoLastMove = () => {
    if (moveHistory.length === 0) return;
    
    const lastMove = moveHistory[moveHistory.length - 1];
    
    // Remove result and restore the two cards
    const newCards = numberCards.filter(c => c !== lastMove.result);
    newCards.push(lastMove.firstCard, lastMove.secondCard);
    
    setNumberCards(newCards);
    setMoveHistory(moveHistory.slice(0, -1));
    setSelectedFirst(null);
    setSelectedOperation(null);
    setGameStatus('playing');
    setErrorMessage(null);
    setNewCardIndex(null);
  };

  const handleNumberClick = (index: number) => {
    if (gameStatus !== 'playing') return;
    setErrorMessage(null);

    const clickedValue = numberCards[index];

    if (selectedFirst === null) {
      // First number selection
      setSelectedFirst(index);
    } else if (selectedFirst === index) {
      // Deselect if clicking same card
      setSelectedFirst(null);
      setSelectedOperation(null);
    } else if (selectedOperation === null) {
      // Need to select operation first
      setErrorMessage("Pick an operation first!");
    } else {
      // Execute the operation
      const firstValue = numberCards[selectedFirst];
      const result = executeOp(firstValue, selectedOperation, clickedValue);

      if (result === null) {
        setErrorMessage("That division doesn't work! Try another.");
        return;
      }

      // Save to history
      setMoveHistory([...moveHistory, {
        cards: [...numberCards],
        firstCard: firstValue,
        secondCard: clickedValue,
        operation: selectedOperation,
        result
      }]);

      // Create new cards array
      const newCards = numberCards.filter((_, i) => i !== selectedFirst && i !== index);
      newCards.push(result);
      
      setNumberCards(newCards);
      setNewCardIndex(newCards.length - 1);
      setSelectedFirst(null);
      setSelectedOperation(null);

      // Check win/loss condition
      if (newCards.length === 1) {
        if (newCards[0] === targetNumber) {
          setGameStatus('won');
          setCelebrationTrigger(prev => prev + 1);
        } else {
          setGameStatus('lost');
        }
      }
    }
  };

  const handleOperationClick = (op: Operation) => {
    if (gameStatus !== 'playing' || selectedFirst === null) return;
    setErrorMessage(null);
    
    if (selectedOperation === op) {
      setSelectedOperation(null);
    } else {
      setSelectedOperation(op);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <CelebrationEffect trigger={celebrationTrigger} message="You did it!" />
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/games')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          
          <h1 className="text-xl font-bold text-foreground">Number Maker</h1>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHelp(true)}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Difficulty Toggle */}
        <div className="flex justify-center gap-2 mb-6">
          <Button
            variant={difficulty === 'easy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDifficulty('easy')}
            className="px-6"
          >
            Easy
          </Button>
          <Button
            variant={difficulty === 'standard' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDifficulty('standard')}
            className="px-6"
          >
            Standard
          </Button>
        </div>

        {/* Target Display */}
        <Card className="mb-8 p-6 text-center bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20">
          <p className="text-sm text-muted-foreground mb-1">Target</p>
          <motion.p 
            key={targetNumber}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl sm:text-6xl font-bold text-primary"
          >
            {targetNumber}
          </motion.p>
        </Card>

        {/* Error Message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-destructive/10 text-destructive rounded-xl text-center text-sm"
            >
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Number Cards */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <AnimatePresence mode="popLayout">
            {numberCards.map((num, index) => (
              <NumberCard
                key={`${index}-${num}`}
                value={num}
                isSelected={selectedFirst === index}
                isDisabled={gameStatus !== 'playing'}
                onClick={() => handleNumberClick(index)}
                isNew={newCardIndex === index}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Operations */}
        <div className="flex justify-center gap-3 sm:gap-4 mb-8">
          {operations.map((op) => (
            <OperationButton
              key={op}
              operation={op}
              isSelected={selectedOperation === op}
              isDisabled={gameStatus !== 'playing' || selectedFirst === null}
              onClick={() => handleOperationClick(op)}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={undoLastMove}
            disabled={moveHistory.length === 0 || gameStatus !== 'playing'}
            className="gap-2"
          >
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetPuzzle}
            disabled={moveHistory.length === 0}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={newPuzzle}
            className="gap-2"
          >
            <Shuffle className="h-4 w-4" />
            New Puzzle
          </Button>
        </div>

        {/* Move Counter */}
        {moveHistory.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Moves: {moveHistory.length}
          </p>
        )}
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {(gameStatus === 'won' || gameStatus === 'lost') && (
          <ResultModal
            status={gameStatus}
            targetNumber={targetNumber}
            finalNumber={numberCards[0] || 0}
            onTryAgain={resetPuzzle}
            onNewPuzzle={newPuzzle}
          />
        )}
      </AnimatePresence>

      {/* How To Play Modal */}
      <HowToPlay isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
};

export default NumberMaker;
