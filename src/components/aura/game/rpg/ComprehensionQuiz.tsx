import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ArrowRight,
  Trophy,
  Coins
} from "lucide-react";

interface ComprehensionQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  type: 'character' | 'problem' | 'sequence' | 'cause_effect' | 'main_idea';
}

interface ComprehensionQuizProps {
  isOpen: boolean;
  storyTitle: string;
  storyText: string;
  onComplete: (score: number, totalQuestions: number, bonusXp: number, bonusGold: number) => void;
  onSkip: () => void;
}

// Simple question generator based on story content
const generateQuestions = (storyTitle: string, storyText: string): ComprehensionQuestion[] => {
  const words = storyText.split(/\s+/).filter(w => w.length > 0);
  const sentences = storyText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // Extract potential character names (capitalized words)
  const potentialCharacters = storyText.match(/\b[A-Z][a-z]+\b/g) || [];
  const uniqueCharacters = [...new Set(potentialCharacters)].slice(0, 4);
  
  const questions: ComprehensionQuestion[] = [];
  
  // Question 1: Story length/content question
  const wordCount = words.length;
  questions.push({
    question: `About how long is this story?`,
    options: [
      wordCount < 100 ? 'Very short (under 100 words)' : 'A few sentences',
      wordCount >= 100 && wordCount < 200 ? 'Short story (100-200 words)' : 'A paragraph or two',
      wordCount >= 200 ? 'A longer story (200+ words)' : 'Very long',
      'Just one sentence'
    ],
    correctIndex: wordCount < 100 ? 0 : wordCount < 200 ? 1 : 2,
    type: 'main_idea'
  });
  
  // Question 2: What was the story about?
  const mainTopics = ['adventure', 'friendship', 'learning', 'animals', 'nature', 'family'];
  const storyLower = storyText.toLowerCase();
  const detectedTopic = mainTopics.find(t => storyLower.includes(t)) || 'adventure';
  
  questions.push({
    question: `What is "${storyTitle}" mostly about?`,
    options: [
      `It tells a ${detectedTopic === 'adventure' ? 'story' : detectedTopic + ' story'}`,
      'It is a recipe for cooking',
      'It lists numbers from 1 to 100',
      'It teaches math problems'
    ],
    correctIndex: 0,
    type: 'main_idea'
  });
  
  // Question 3: Beginning of story
  const firstSentence = sentences[0]?.trim().slice(0, 50) || 'Once upon a time';
  questions.push({
    question: `How does this story begin?`,
    options: [
      `With "${firstSentence}..."`,
      'With a math equation',
      'With a list of ingredients',
      'With "The End"'
    ],
    correctIndex: 0,
    type: 'sequence'
  });
  
  // Shuffle and return 2-3 questions
  return questions.slice(0, 3);
};

export const ComprehensionQuiz = ({
  isOpen,
  storyTitle,
  storyText,
  onComplete,
  onSkip
}: ComprehensionQuizProps) => {
  const [questions, setQuestions] = useState<ComprehensionQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showFinalResults, setShowFinalResults] = useState(false);

  useEffect(() => {
    if (isOpen && storyText) {
      const generated = generateQuestions(storyTitle, storyText);
      setQuestions(generated);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setCorrectCount(0);
      setShowFinalResults(false);
    }
  }, [isOpen, storyTitle, storyText]);

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleConfirm = () => {
    if (selectedAnswer === null) return;
    
    const isCorrect = selectedAnswer === questions[currentQuestion].correctIndex;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setShowFinalResults(true);
    }
  };

  const handleFinish = () => {
    const bonusXp = correctCount * 15;
    const bonusGold = correctCount * 5;
    onComplete(correctCount, questions.length, bonusXp, bonusGold);
  };

  if (!isOpen || questions.length === 0) return null;

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + (showResult ? 1 : 0)) / questions.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-2xl p-6 max-w-lg w-full border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.3)]"
        >
          {showFinalResults ? (
            // Final Results
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mb-4"
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-2xl font-black text-white mb-2">Story Check Complete!</h2>
              <p className="text-indigo-300 mb-6">
                You got {correctCount} out of {questions.length} correct!
              </p>
              
              {/* Rewards */}
              <div className="flex justify-center gap-4 mb-6">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-purple-500/20 border border-purple-500/30 rounded-lg px-4 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="text-xl font-bold text-white">+{correctCount * 15}</span>
                    <span className="text-purple-300 text-sm">XP</span>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-amber-500/20 border border-amber-500/30 rounded-lg px-4 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-400" />
                    <span className="text-xl font-bold text-white">+{correctCount * 5}</span>
                    <span className="text-amber-300 text-sm">Gold</span>
                  </div>
                </motion.div>
              </div>
              
              <Button
                onClick={handleFinish}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8"
              >
                Continue Adventure
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          ) : (
            // Question UI
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-500/20">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Story Check!</h2>
                    <p className="text-xs text-indigo-300">{storyTitle}</p>
                  </div>
                </div>
                <Badge className="bg-indigo-500/20 text-indigo-300">
                  {currentQuestion + 1} / {questions.length}
                </Badge>
              </div>
              
              {/* Progress bar */}
              <div className="h-2 bg-slate-700 rounded-full mb-6 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              {/* Question */}
              <p className="text-white text-lg font-medium mb-4">{currentQ.question}</p>
              
              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentQ.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = showResult && index === currentQ.correctIndex;
                  const isWrong = showResult && isSelected && index !== currentQ.correctIndex;
                  
                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleSelectAnswer(index)}
                      disabled={showResult}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3
                        ${isCorrect 
                          ? 'bg-green-500/20 border-green-500 text-green-300' 
                          : isWrong 
                            ? 'bg-red-500/20 border-red-500 text-red-300'
                            : isSelected
                              ? 'bg-indigo-500/30 border-indigo-400 text-white'
                              : 'bg-slate-800/50 border-slate-600 text-slate-300 hover:border-indigo-400'
                        }
                        ${showResult ? 'cursor-default' : 'cursor-pointer'}
                      `}
                      whileHover={!showResult ? { scale: 1.02 } : {}}
                      whileTap={!showResult ? { scale: 0.98 } : {}}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                        ${isCorrect 
                          ? 'border-green-500 bg-green-500' 
                          : isWrong 
                            ? 'border-red-500 bg-red-500'
                            : isSelected
                              ? 'border-indigo-400 bg-indigo-400'
                              : 'border-slate-500'
                        }
                      `}>
                        {isCorrect && <CheckCircle2 className="w-4 h-4 text-white" />}
                        {isWrong && <XCircle className="w-4 h-4 text-white" />}
                        {isSelected && !showResult && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm">{option}</span>
                    </motion.button>
                  );
                })}
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={onSkip}
                  className="text-slate-400 hover:text-white"
                >
                  Skip Quiz
                </Button>
                
                {!showResult ? (
                  <Button
                    onClick={handleConfirm}
                    disabled={selectedAnswer === null}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    Check Answer
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
