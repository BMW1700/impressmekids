import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ArrowRight,
  Trophy,
  Coins,
  Shield
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
  variant?: 'default' | 'boss_gate';
  enemyName?: string;
  onComplete: (score: number, totalQuestions: number, bonusXp: number, bonusGold: number) => void;
  onSkip: () => void;
}

// Improved question generator that extracts actual content questions
const generateQuestions = (storyTitle: string, storyText: string, count: number = 3): ComprehensionQuestion[] => {
  const sentences = storyText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const questions: ComprehensionQuestion[] = [];
  
  // Extract potential character names (capitalized words, not at sentence start)
  const charMatches = storyText.match(/(?<=[.!?\s])\s*[A-Z][a-z]{2,}/g) || [];
  const potentialCharacters = [...new Set(charMatches.map(c => c.trim()))].filter(
    c => !['The', 'But', 'And', 'Then', 'When', 'Once', 'They', 'She', 'His', 'Her', 'There', 'This', 'That', 'After', 'Before', 'Where'].includes(c)
  );

  // Extract key content words (nouns/adjectives 5+ chars) for distractors
  const contentWords = [...new Set(
    storyText.match(/\b[a-z]{5,}\b/gi)?.map(w => w.toLowerCase()) || []
  )].slice(0, 20);

  // Helper: get plausible distractors from the story text itself
  const getStoryDistractors = (correctText: string, count: number): string[] => {
    const available = sentences
      .map(s => s.trim().slice(0, 60))
      .filter(s => s !== correctText && s.length > 10);
    const shuffled = available.sort(() => Math.random() - 0.5).slice(0, count);
    // Pad if not enough
    const fallbacks = ['Something completely different happened', 'The story changed direction unexpectedly'];
    while (shuffled.length < count) {
      shuffled.push(fallbacks[shuffled.length] || 'None of the above');
    }
    return shuffled;
  };

  // Q1: Character identification
  if (potentialCharacters.length > 0) {
    const mainChar = potentialCharacters[0];
    // Use other potential characters first, then plausible names
    const charPool = [...potentialCharacters.slice(1), 'Marcus', 'Elena', 'Jasper']
      .filter(d => d !== mainChar).slice(0, 3);
    
    questions.push({
      question: `Who is a character in this story?`,
      options: [mainChar, ...charPool].sort(() => Math.random() - 0.5),
      correctIndex: 0,
      type: 'character'
    });
    const lastQ = questions[questions.length - 1];
    lastQ.correctIndex = lastQ.options.indexOf(mainChar);
  }

  // Q2: What happened first (sequence)
  if (sentences.length >= 3) {
    const firstEvent = sentences[0].trim().slice(0, 60);
    const laterEvent = sentences[Math.min(sentences.length - 1, 3)].trim().slice(0, 60);
    const midEvent = sentences[Math.floor(sentences.length / 2)].trim().slice(0, 60);
    
    questions.push({
      question: `What happened first in the story?`,
      options: [
        `"${firstEvent}..."`,
        `"${laterEvent}..."`,
        `"${midEvent}..."`,
        'The story started with an ending'
      ],
      correctIndex: 0,
      type: 'sequence'
    });
  }

  // Q3: Main idea / what's the story about — use plausible wrong themes
  const storyLower = storyText.toLowerCase();
  const themes = [
    { key: 'adventure', label: 'an adventure or journey' },
    { key: 'friend', label: 'friendship' },
    { key: 'learn', label: 'learning something new' },
    { key: 'help', label: 'helping others' },
    { key: 'brave', label: 'being brave' },
    { key: 'family', label: 'family' },
    { key: 'animal', label: 'animals' },
    { key: 'magic', label: 'magic or fantasy' },
    { key: 'forest', label: 'nature and the outdoors' },
    { key: 'school', label: 'school' },
  ];
  
  const detectedTheme = themes.find(t => storyLower.includes(t.key)) || { key: 'story', label: 'an interesting story' };
  // Pick wrong themes that are plausible but not detected
  const wrongThemes = themes
    .filter(t => t.key !== detectedTheme.key && !storyLower.includes(t.key))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(t => t.label.charAt(0).toUpperCase() + t.label.slice(1));
  
  questions.push({
    question: `What is "${storyTitle}" mostly about?`,
    options: [
      detectedTheme.label.charAt(0).toUpperCase() + detectedTheme.label.slice(1),
      ...wrongThemes
    ].slice(0, 4),
    correctIndex: 0,
    type: 'main_idea'
  });

  // Q4: Cause/effect or problem identification — plausible distractors from story
  if (sentences.length >= 3) {
    const middleSentence = sentences[Math.floor(sentences.length / 2)].trim();
    const actionWords = middleSentence.match(/\b(found|discovered|decided|tried|wanted|needed|realized|noticed)\b/i);
    if (actionWords) {
      const snippet = middleSentence.slice(0, 50);
      const distractors = getStoryDistractors(snippet, 3);
      questions.push({
        question: `What happened in the middle of the story?`,
        options: [
          `"${snippet}..."`,
          ...distractors.map(d => `"${d}..."`)
        ].slice(0, 4),
        correctIndex: 0,
        type: 'cause_effect'
      });
    }
  }

  // Q5: Detail question — uses actual content with plausible wrong details
  if (sentences.length >= 2) {
    const detailSentence = sentences.find(s => s.length > 20 && s.length < 100) || sentences[0];
    const detail = detailSentence.trim().slice(0, 55);
    const wrongDetails = getStoryDistractors(detail, 3);
    
    questions.push({
      question: `Which of these is true about the story?`,
      options: [
        `"${detail}..." is part of the story`,
        ...wrongDetails.map(d => `"${d}..." is the main point`)
      ].slice(0, 4),
      correctIndex: 0,
      type: 'main_idea'
    });
  }

  // Return requested count
  return questions.slice(0, count);
};

export const ComprehensionQuiz = ({
  isOpen,
  storyTitle,
  storyText,
  variant = 'default',
  enemyName = 'the boss',
  onComplete,
  onSkip
}: ComprehensionQuizProps) => {
  const isBossGate = variant === 'boss_gate';
  const questionCount = isBossGate ? 1 : 3;
  
  const [questions, setQuestions] = useState<ComprehensionQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showFinalResults, setShowFinalResults] = useState(false);

  useEffect(() => {
    if (isOpen && storyText) {
      const generated = generateQuestions(storyTitle, storyText, questionCount);
      setQuestions(generated);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setCorrectCount(0);
      setShowFinalResults(false);
    }
  }, [isOpen, storyTitle, storyText, questionCount]);

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

    // Boss gate: immediately complete after showing result
    if (isBossGate) {
      setTimeout(() => {
        const bonusXp = isCorrect ? 25 : 0;
        const bonusGold = isCorrect ? 10 : 0;
        onComplete(isCorrect ? 1 : 0, 1, bonusXp, bonusGold);
      }, 1500);
    }
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

  // Boss Gate variant: inline, RPG-themed
  if (isBossGate) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        
        <motion.div
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="relative z-10 w-full max-w-lg mx-4"
        >
          <div className="bg-gradient-to-br from-red-900/95 to-slate-900/95 rounded-2xl p-6 border-2 border-red-500/50
            shadow-[0_0_50px_rgba(239,68,68,0.3)]">
            
            {/* Boss barrier header */}
            <div className="text-center mb-4">
              <motion.div
                className="inline-flex items-center gap-2 mb-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Shield className="w-6 h-6 text-red-400" />
                <span className="text-lg font-black text-red-300">LAST STAND BARRIER!</span>
                <Shield className="w-6 h-6 text-red-400" />
              </motion.div>
              <p className="text-sm text-slate-300">
                {enemyName} raises a barrier! Answer correctly to land the final blow!
              </p>
            </div>

            {/* Question */}
            <div className="bg-slate-800/60 border border-slate-600 rounded-xl p-4 mb-4">
              <p className="text-white text-base font-medium">{currentQ.question}</p>
            </div>

            {/* Options */}
            <div className="space-y-2 mb-4">
              {currentQ.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = showResult && index === currentQ.correctIndex;
                const isWrong = showResult && isSelected && index !== currentQ.correctIndex;
                
                return (
                  <motion.button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    disabled={showResult}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3 text-sm
                      ${isCorrect 
                        ? 'bg-green-500/20 border-green-500 text-green-300' 
                        : isWrong 
                          ? 'bg-red-500/20 border-red-500 text-red-300'
                          : isSelected
                            ? 'bg-amber-500/30 border-amber-400 text-white'
                            : 'bg-slate-800/50 border-slate-600 text-slate-300 hover:border-amber-400'
                      }
                      ${showResult ? 'cursor-default' : 'cursor-pointer'}
                    `}
                    whileHover={!showResult ? { scale: 1.02 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                      ${isCorrect ? 'border-green-500 bg-green-500' 
                        : isWrong ? 'border-red-500 bg-red-500'
                        : isSelected ? 'border-amber-400 bg-amber-400'
                        : 'border-slate-500'
                      }
                    `}>
                      {isCorrect && <CheckCircle2 className="w-3 h-3 text-white" />}
                      {isWrong && <XCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span>{option}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Confirm button */}
            {!showResult && (
              <Button
                onClick={handleConfirm}
                disabled={selectedAnswer === null}
                className="w-full bg-gradient-to-r from-red-500 to-amber-600 hover:from-red-600 hover:to-amber-700 font-bold"
              >
                Break the Barrier!
              </Button>
            )}

            {/* Result */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  {selectedAnswer === currentQ.correctIndex ? (
                    <p className="text-green-300 font-bold text-lg">⚡ BARRIER SHATTERED! Final blow landed!</p>
                  ) : (
                    <p className="text-red-300 font-bold">💥 Barrier holds! {enemyName} heals!</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Default variant (unchanged from original, but with improved questions)
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
            <>
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
              
              <div className="h-2 bg-slate-700 rounded-full mb-6 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              <p className="text-white text-lg font-medium mb-4">{currentQ.question}</p>
              
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
