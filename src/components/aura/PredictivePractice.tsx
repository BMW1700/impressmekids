import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Volume2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuraCharacter } from "./AuraCharacter";
import { predictDifficultWords } from "@/lib/ml/crossModalTransferNetwork";

interface PredictivePracticeProps {
  passageText: string;
  studentId: string;
  onComplete: () => void;
}

interface PracticeWord {
  word: string;
  difficulty: number;
  practiced: boolean;
}

export const PredictivePractice = ({
  passageText,
  studentId,
  onComplete
}: PredictivePracticeProps) => {
  const [practiceWords, setPracticeWords] = useState<PracticeWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize practice words using ML prediction
  useEffect(() => {
    const initializePractice = async () => {
      try {
        // Use the cross-modal transfer network to predict difficult words
        const predictions = await predictDifficultWords(passageText, studentId);
        
        // Take top 5 most difficult words
        const topWords = predictions
          .sort((a, b) => b.difficulty - a.difficulty)
          .slice(0, 5)
          .map(p => ({
            word: p.word,
            difficulty: p.difficulty,
            practiced: false
          }));

        setPracticeWords(topWords);
        setLoading(false);
      } catch (error) {
        console.error('Error predicting difficult words:', error);
        // Fallback: extract 5 random longer words
        const words = passageText.split(/\s+/)
          .filter(w => w.length > 5)
          .slice(0, 5)
          .map(word => ({
            word: word.replace(/[^a-zA-Z]/g, ''),
            difficulty: 0.5,
            practiced: false
          }));
        setPracticeWords(words);
        setLoading(false);
      }
    };

    initializePractice();
  }, [passageText, studentId]);

  const currentWord = practiceWords[currentIndex];
  const progress = ((currentIndex + 1) / practiceWords.length) * 100;

  // Text-to-speech to pronounce the word
  const pronounceWord = () => {
    if ('speechSynthesis' in window && currentWord) {
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Listen to student pronunciation
  const handlePractice = () => {
    setIsListening(true);
    pronounceWord();

    // Simulate listening for 2 seconds
    setTimeout(() => {
      setIsListening(false);
      markWordPracticed();
    }, 2000);
  };

  const markWordPracticed = () => {
    const updatedWords = [...practiceWords];
    updatedWords[currentIndex].practiced = true;
    setPracticeWords(updatedWords);

    // Move to next word or complete
    if (currentIndex < practiceWords.length - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 500);
    } else {
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-3/4 mx-auto" />
          <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
        </div>
      </Card>
    );
  }

  if (practiceWords.length === 0) {
    // No difficult words found - skip practice
    onComplete();
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <AuraCharacter
          state="encouraging"
          message="Let's practice some tricky words before we read!"
        />
        <h2 className="font-heading text-2xl font-bold">Pre-Reading Practice</h2>
        <p className="text-muted-foreground">
          These words might be challenging. Let's practice them first!
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Word {currentIndex + 1} of {practiceWords.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Practice Card */}
      <AnimatePresence mode="wait">
        {currentWord && (
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8">
              <div className="text-center space-y-6">
                {/* The Word */}
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-5xl font-bold text-primary"
                >
                  {currentWord.word}
                </motion.div>

                {/* Difficulty Indicator */}
                <div className="flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 w-8 rounded ${
                        i < Math.ceil(currentWord.difficulty * 5)
                          ? 'bg-yellow-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Practice Button */}
                <div className="space-y-3">
                  {!currentWord.practiced ? (
                    <>
                      <Button
                        onClick={pronounceWord}
                        variant="outline"
                        className="mr-2"
                      >
                        <Volume2 className="mr-2 h-4 w-4" />
                        Hear It
                      </Button>
                      <Button
                        onClick={handlePractice}
                        disabled={isListening}
                        className="w-full"
                      >
                        {isListening ? 'Listening...' : 'Practice Now'}
                      </Button>
                    </>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center gap-2 text-green-600"
                    >
                      <Check className="h-6 w-6" />
                      <span className="font-semibold">Great job!</span>
                    </motion.div>
                  )}
                </div>

                {/* Instructions */}
                {!currentWord.practiced && !isListening && (
                  <p className="text-sm text-muted-foreground">
                    Click "Hear It" to listen, then "Practice Now" to try saying it yourself!
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Words Practiced */}
      <div className="flex justify-center gap-2">
        {practiceWords.map((word, i) => (
          <div
            key={i}
            className={`h-2 w-12 rounded ${
              word.practiced
                ? 'bg-green-500'
                : i === currentIndex
                ? 'bg-primary'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
