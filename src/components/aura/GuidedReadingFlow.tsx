import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuraCharacter } from "./AuraCharacter";
import { PredictivePractice } from "./PredictivePractice";
import { WordByWordReader } from "./WordByWordReader";
import { PassageCompleteCelebration } from "./PassageCompleteCelebration";
import { CuratedStory } from "@/data/curatedStories";

interface GuidedReadingFlowProps {
  story: CuratedStory;
  studentId: string;
  onBack: () => void;
  onComplete: (stats: any) => void;
}

type Step = 'intro' | 'practice' | 'reading' | 'celebration';

export const GuidedReadingFlow = ({
  story,
  studentId,
  onBack,
  onComplete
}: GuidedReadingFlowProps) => {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [readingStats, setReadingStats] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const steps: Step[] = ['intro', 'practice', 'reading'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleIntroComplete = () => {
    setCurrentStep('practice');
  };

  const handlePracticeComplete = () => {
    setCurrentStep('reading');
  };

  const handleReadingComplete = (stats: any) => {
    setReadingStats(stats);
    setShowCelebration(true);
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    onComplete(readingStats);
    onBack();
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Library
        </Button>
      </div>

      {/* Progress Indicator */}
      {currentStep !== 'intro' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {currentStep === 'practice' && 'Step 1: Practice'}
              {currentStep === 'reading' && 'Step 2: Reading'}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {/* Intro Step */}
        {currentStep === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-8">
              <div className="text-center space-y-6">
                {/* Story Cover */}
                <div className={`h-48 bg-gradient-to-br ${story.cover_gradient} rounded-xl flex items-center justify-center text-6xl`}>
                  {story.category === 'animals' && '🐾'}
                  {story.category === 'space' && '🚀'}
                  {story.category === 'sports' && '⚽'}
                  {story.category === 'fairy_tales' && '✨'}
                  {story.category === 'science' && '🔬'}
                  {story.category === 'adventure' && '🗺️'}
                  {story.category === 'history' && '📜'}
                </div>

                {/* AURA Introduction */}
                <AuraCharacter
                  state="excited"
                  message={`Today we're reading "${story.title}"!`}
                />

                {/* Story Info */}
                <div className="space-y-2">
                  <h2 className="font-heading text-3xl font-bold">{story.title}</h2>
                  <p className="text-lg text-muted-foreground">{story.description}</p>
                </div>

                {/* Story Details */}
                <div className="flex justify-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {story.word_count} words
                  </div>
                  <div>
                    ⏱️ {story.reading_time_minutes} min read
                  </div>
                  <div>
                    📚 Grade {story.grade_level === 0 ? 'K' : story.grade_level}
                  </div>
                </div>

                {/* Start Button */}
                <Button
                  onClick={handleIntroComplete}
                  size="lg"
                  className="mt-6"
                >
                  Let's Get Started!
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Practice Step */}
        {currentStep === 'practice' && (
          <motion.div
            key="practice"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <PredictivePractice
              passageText={story.passage_text}
              studentId={studentId}
              onComplete={handlePracticeComplete}
            />
          </motion.div>
        )}

        {/* Reading Step */}
        {currentStep === 'reading' && (
          <motion.div
            key="reading"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <WordByWordReader
              passageText={story.passage_text}
              assignmentId={null}
              onComplete={handleReadingComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration Modal */}
      {readingStats && (
        <PassageCompleteCelebration
          open={showCelebration}
          onClose={handleCelebrationClose}
          stats={readingStats}
          onReadAnother={onBack}
        />
      )}
    </div>
  );
};
