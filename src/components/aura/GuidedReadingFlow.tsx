import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuraCharacter } from "./AuraCharacter";
import { PredictivePractice } from "./PredictivePractice";
import { WordByWordReader } from "./WordByWordReader";
import { SingleWordReader } from "./SingleWordReader";
import { ReadingModeSelector, ReadingMode } from "./ReadingModeSelector";
import { PassageCompleteCelebration } from "./PassageCompleteCelebration";
import { ReadingResultsCard } from "./ReadingResultsCard";
import { CuratedStory } from "@/data/curatedStories";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getMiscueInterventions } from "@/lib/miscueAnalysis";
import { updateStudentReadingStats } from "@/lib/updateStudentReadingStats";

interface GuidedReadingFlowProps {
  story: CuratedStory;
  studentId: string;
  onBack: () => void;
  onComplete: (stats: any) => void;
  // Screening mode props
  screeningPeriodId?: string | null;
  screeningClassroomId?: string | null;
  screeningPassageId?: string | null;
  screeningPassageTitle?: string | null;
  screeningGradeLevel?: number;
}

type Step = 'intro' | 'mode-select' | 'practice' | 'reading' | 'celebration';

export const GuidedReadingFlow = ({
  story,
  studentId,
  onBack,
  onComplete,
  screeningPeriodId,
  screeningClassroomId,
  screeningPassageId,
  screeningPassageTitle,
  screeningGradeLevel,
}: GuidedReadingFlowProps) => {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [readingMode, setReadingMode] = useState<ReadingMode>('full-passage');
  const [readingStats, setReadingStats] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const { toast } = useToast();

  const steps: Step[] = ['intro', 'mode-select', 'practice', 'reading'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleIntroComplete = () => {
    setCurrentStep('mode-select');
  };

  const handleModeSelect = (mode: ReadingMode) => {
    setReadingMode(mode);
    setCurrentStep('practice');
  };

  const handlePracticeComplete = () => {
    setCurrentStep('reading');
  };

  const handleReadingComplete = async (stats: any) => {
    setReadingStats(stats);
    
    // Save progress to database if accuracy >= 50%
    const passed = stats.accuracy >= 50;
    
    if (passed) {
      try {
        // First, check if story exists in reading_library, if not create it
        const { data: existingStory } = await supabase
          .from('reading_library')
          .select('id')
          .eq('title', story.title)
          .single();
        
        let storyId = existingStory?.id;
        
        if (!storyId) {
          // Insert story into reading_library
          const { data: newStory, error: insertError } = await supabase
            .from('reading_library')
            .insert({
              title: story.title,
              description: story.description,
              passage_text: story.passage_text,
              grade_level: story.grade_level,
              category: story.category,
              target_phonemes: story.target_phonemes,
              word_count: story.word_count,
              reading_time_minutes: story.reading_time_minutes,
              difficulty_level: story.difficulty_level,
              cover_gradient: story.cover_gradient,
            })
            .select('id')
            .single();
          
          if (insertError) {
            console.error('Error inserting story:', insertError);
          } else {
            storyId = newStory?.id;
          }
        }
        
        if (storyId) {
          // Check for existing progress
          const { data: existingProgress } = await supabase
            .from('student_reading_progress')
            .select('*')
            .eq('student_id', studentId)
            .eq('story_id', storyId)
            .single();
          
          if (existingProgress) {
            // Update existing progress
            await supabase
              .from('student_reading_progress')
              .update({
                completed: true,
                times_read: (existingProgress.times_read || 0) + 1,
                best_wpm: Math.max(existingProgress.best_wpm || 0, stats.wpm),
                best_accuracy: Math.max(existingProgress.best_accuracy || 0, stats.accuracy),
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingProgress.id);
          } else {
            // Create new progress
            await supabase
              .from('student_reading_progress')
              .insert({
                student_id: studentId,
                story_id: storyId,
                completed: true,
                times_read: 1,
                best_wpm: stats.wpm,
                best_accuracy: stats.accuracy,
                completed_at: new Date().toISOString(),
              });
          }
          
          toast({
            title: "Progress Saved! 📚",
            description: "This story has been added to your bookshelf!",
          });
        }
      } catch (error) {
        console.error('Error saving reading progress:', error);
      }
    }
    
    setShowCelebration(true);
  };

  const handleCelebrationClose = () => {
    // Just close the celebration - don't auto-navigate away
    // Let the student view the detailed results first
    setShowCelebration(false);
    // Don't call onComplete here - that triggers parent's exit logic
    // Student will use "Back to Library" button to leave after viewing results
  };

  const handleTryAgain = () => {
    setShowCelebration(false);
    setReadingStats(null);
    setCurrentStep('reading');
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
      {currentStep !== 'intro' && currentStep !== 'mode-select' && (
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

        {/* Mode Selection Step */}
        {currentStep === 'mode-select' && (
          <ReadingModeSelector
            onSelectMode={handleModeSelect}
            storyTitle={story.title}
          />
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

        {/* Reading Step - Full Passage Mode */}
        {currentStep === 'reading' && readingMode === 'full-passage' && (
          <motion.div
            key="reading-full"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <WordByWordReader
              passageText={story.passage_text}
              assignmentId={null}
              onComplete={handleReadingComplete}
              screeningPeriodId={screeningPeriodId}
              screeningClassroomId={screeningClassroomId}
              screeningPassageId={screeningPassageId}
              screeningPassageTitle={screeningPassageTitle || story.title}
              screeningGradeLevel={screeningGradeLevel}
            />
          </motion.div>
        )}

        {/* Reading Step - Word by Word Mode */}
        {currentStep === 'reading' && readingMode === 'word-by-word' && (
          <motion.div
            key="reading-single"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <SingleWordReader
              passageText={story.passage_text}
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
          stats={{
            wpm: readingStats.wpm || 0,
            accuracy: readingStats.accuracy || 0,
            wordsRead: readingStats.wordsRead || 0,
            xpEarned: readingStats.xpEarned || readingStats.wordsRead || 0,
          }}
          onReadAnother={onBack}
          onTryAgain={handleTryAgain}
        />
      )}

      {/* Detailed Reading Results (shown after celebration) */}
      {readingStats && !showCelebration && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <ReadingResultsCard
            wpm={readingStats.wpm || 0}
            wcpm={readingStats.wcpm || 0}
            accuracy={readingStats.accuracy || 0}
            miscueAnalysis={readingStats.miscueAnalysis}
            prosodyMetrics={readingStats.prosodyMetrics}
            fluencyLevel={readingStats.fluencyLevel}
            xpEarned={readingStats.xpEarned}
          />
          
          {/* Intervention Recommendations */}
          {readingStats.miscueAnalysis && (
            <Card className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                📚 What to Practice Next
              </h4>
              <ul className="space-y-2">
                {getMiscueInterventions(readingStats.miscueAnalysis).map((intervention, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">→</span>
                    {intervention}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          
          <div className="flex gap-3">
            <Button onClick={handleTryAgain} variant="outline" className="flex-1">
              Try Again
            </Button>
            <Button onClick={onBack} className="flex-1">
              Read Another Story
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};