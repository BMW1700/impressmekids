import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Volume2, Check, Mic, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuraCharacter } from "./AuraCharacter";
import { predictDifficultWords } from "@/lib/ml/crossModalTransferNetwork";
import { unlockVoiceMascot, speakWord } from "@/lib/voiceMascot";

interface PredictivePracticeProps {
  passageText: string;
  studentId: string;
  onComplete: () => void;
}

interface PracticeWord {
  word: string;
  difficulty: number;
  practiced: boolean;
  result?: 'correct' | 'incorrect';
}

// Normalize word for comparison
const normalizeWord = (word: string): string => {
  return word.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Fuzzy match using Levenshtein distance
const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const isWordMatch = (spoken: string, expected: string): boolean => {
  const normalizedSpoken = normalizeWord(spoken);
  const normalizedExpected = normalizeWord(expected);
  if (normalizedSpoken === normalizedExpected) return true;
  const distance = levenshteinDistance(normalizedSpoken, normalizedExpected);
  const maxLen = Math.max(normalizedSpoken.length, normalizedExpected.length);
  return distance <= Math.max(2, Math.floor(maxLen * 0.3));
};

export const PredictivePractice = ({
  passageText,
  studentId,
  onComplete
}: PredictivePracticeProps) => {
  const [practiceWords, setPracticeWords] = useState<PracticeWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(true);
  const [spokenWord, setSpokenWord] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  
  const recognitionRef = useRef<any>(null);

  // Initialize practice words using ML prediction
  useEffect(() => {
    const initializePractice = async () => {
      try {
        const predictions = await predictDifficultWords(passageText, studentId);
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
  const progress = practiceWords.length > 0 ? ((currentIndex + 1) / practiceWords.length) * 100 : 0;

  // Text-to-speech to pronounce the word
  const pronounceWord = useCallback(() => {
    if (currentWord) {
      // CRITICAL: Unlock speech on user gesture
      unlockVoiceMascot();
      speakWord(currentWord.word);
    }
  }, [currentWord]);

  // Stop any ongoing recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // PHASE 2 FIX: Listen to student pronunciation using Web Speech API
  const handlePractice = useCallback(() => {
    // CRITICAL: Unlock speech on user gesture (Say It button click)
    unlockVoiceMascot();
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      // Fallback for browsers without speech recognition
      pronounceWord();
      setTimeout(() => markWordPracticed('correct'), 1500);
      return;
    }

    setIsListening(true);
    setSpokenWord(null);
    setFeedback(null);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: any) => {
      const results = event.results[0];
      let bestMatch = false;
      let spokenText = '';

      // Check all alternatives for a match
      for (let i = 0; i < results.length; i++) {
        const transcript = results[i].transcript.trim();
        spokenText = transcript;
        if (isWordMatch(transcript, currentWord.word)) {
          bestMatch = true;
          break;
        }
      }

      setSpokenWord(spokenText);
      setIsListening(false);

      if (bestMatch) {
        setFeedback('correct');
        setTimeout(() => markWordPracticed('correct'), 1000);
      } else {
        setFeedback('incorrect');
        // Play correct pronunciation after showing incorrect feedback
        setTimeout(() => {
          speakWord(currentWord.word);
        }, 500);
        setTimeout(() => markWordPracticed('incorrect'), 2000);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      // On error, let them try again or skip
      if (event.error === 'no-speech') {
        setFeedback(null);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [currentWord, pronounceWord]);

  const markWordPracticed = (result: 'correct' | 'incorrect') => {
    const updatedWords = [...practiceWords];
    updatedWords[currentIndex].practiced = true;
    updatedWords[currentIndex].result = result;
    setPracticeWords(updatedWords);

    // Reset feedback state
    setFeedback(null);
    setSpokenWord(null);

    // Move to next word or complete
    if (currentIndex < practiceWords.length - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 300);
    } else {
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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
    onComplete();
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <AuraCharacter
          state={isListening ? "thinking" : feedback === 'correct' ? "celebrating" : "encouraging"}
          message={
            isListening 
              ? "I'm listening... say the word!" 
              : feedback === 'correct'
              ? "Perfect! You got it!"
              : feedback === 'incorrect'
              ? "Good try! Listen to the correct way..."
              : "Let's practice some tricky words before we read!"
          }
        />
        <h2 className="font-heading text-2xl font-bold">Pre-Reading Practice</h2>
        <p className="text-muted-foreground">
          Click "Hear It" to listen, then "Say It" to practice!
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
                  className={`text-5xl font-bold ${
                    feedback === 'correct' 
                      ? 'text-green-500' 
                      : feedback === 'incorrect' 
                      ? 'text-red-500' 
                      : 'text-primary'
                  }`}
                >
                  {currentWord.word}
                </motion.div>

                {/* What student said */}
                {spokenWord && (
                  <div className="text-lg text-muted-foreground">
                    You said: "<span className={feedback === 'correct' ? 'text-green-500' : 'text-red-500'}>{spokenWord}</span>"
                  </div>
                )}

                {/* Feedback Icons */}
                {feedback && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-center gap-2"
                  >
                    {feedback === 'correct' ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="h-8 w-8" />
                        <span className="text-xl font-semibold">Perfect!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600">
                        <Volume2 className="h-8 w-8 animate-pulse" />
                        <span className="text-xl font-semibold">Listen carefully...</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Difficulty Indicator */}
                {!feedback && (
                  <div className="flex justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-8 rounded ${
                          i < Math.ceil(currentWord.difficulty * 5)
                            ? 'bg-yellow-500'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Practice Buttons */}
                {!currentWord.practiced && !feedback && (
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button
                      onClick={pronounceWord}
                      variant="outline"
                      size="lg"
                      disabled={isListening}
                    >
                      <Volume2 className="mr-2 h-5 w-5" />
                      Hear It
                    </Button>
                    <Button
                      onClick={handlePractice}
                      size="lg"
                      disabled={isListening}
                      className="gap-2"
                    >
                      {isListening ? (
                        <>
                          <Mic className="h-5 w-5 animate-pulse text-red-500" />
                          Listening...
                        </>
                      ) : (
                        <>
                          <Mic className="h-5 w-5" />
                          Say It
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Skip option when listening fails */}
                {!isListening && !feedback && !currentWord.practiced && (
                  <button
                    onClick={() => markWordPracticed('correct')}
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Skip this word
                  </button>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Words Progress Dots */}
      <div className="flex justify-center gap-2">
        {practiceWords.map((word, i) => (
          <div
            key={i}
            className={`h-3 w-12 rounded-full transition-all ${
              word.practiced
                ? word.result === 'correct'
                  ? 'bg-green-500'
                  : 'bg-amber-500'
                : i === currentIndex
                ? 'bg-primary animate-pulse'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
