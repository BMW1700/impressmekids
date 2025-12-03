import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, TrendingUp, Brain, Target, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeMispronunciationPatterns, generatePracticeExercises } from '@/lib/mispronunciationAnalysis';
import { adaptiveDifficultyEngine } from '@/lib/difficultyScalingV2';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedCompletionAnalysisProps {
  sessionId: string;
  studentId: string;
  accuracy: number;
  wpm: number;
  wordsRead: number;
  cognitiveLoad?: number;
}

interface PracticeArea {
  phoneme: string;
  words: string[];
  tips: string;
}

export const EnhancedCompletionAnalysis = ({
  sessionId,
  studentId,
  accuracy,
  wpm,
  wordsRead,
  cognitiveLoad = 0
}: EnhancedCompletionAnalysisProps) => {
  const [practiceAreas, setPracticeAreas] = useState<PracticeArea[]>([]);
  const [difficultyRecommendation, setDifficultyRecommendation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const analyzeSession = async () => {
      setIsLoading(true);
      try {
        // Analyze mispronunciation patterns and generate practice areas
        await analyzeMispronunciationPatterns(studentId, sessionId);
        const exercises = await generatePracticeExercises(studentId);
        setPracticeAreas(exercises);

        // Get adaptive difficulty recommendation
        const diffResult = await adaptiveDifficultyEngine.calculateAdaptiveDifficulty({
          studentId,
          currentLevel: 1,
          recentGrades: [accuracy],
          completionRate: 1.0,
          consistency: accuracy / 100,
          weeklyImprovement: 0,
          recentPracticeMinutes: Math.round(wordsRead / (wpm || 100) * 60),
          masteredPhonemes: [],
          strugglingPhonemes: exercises.map(e => e.phoneme),
          readingFeatures: {
            comprehensionScore: accuracy,
            annotationQuality: 50,
            criticalThinkingScore: 50,
            highlightCount: 0,
            avgAnnotationLength: 0,
            vocabularyComplexity: 50,
            readingTime: Math.round(wordsRead / (wpm || 100) * 60)
          },
          speakingFeatures: {
            fluency: Math.min(100, wpm / 1.5),
            prosody: 50,
            confidence: accuracy,
            wpm: wpm,
            pauseCount: 0,
            phonemeAccuracy: accuracy
          }
        });
        setDifficultyRecommendation(diffResult);
      } catch (error) {
        console.error('Error analyzing session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId && studentId) {
      analyzeSession();
    }
  }, [sessionId, studentId, accuracy, wpm, cognitiveLoad]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-white/10 rounded-xl" />
        <div className="h-32 bg-white/10 rounded-xl" />
      </div>
    );
  }

  const getCognitiveLoadLabel = (load: number) => {
    if (load < 30) return { label: 'Relaxed', color: 'text-green-300', bg: 'bg-green-500/20' };
    if (load < 60) return { label: 'Focused', color: 'text-yellow-300', bg: 'bg-yellow-500/20' };
    return { label: 'Challenged', color: 'text-red-300', bg: 'bg-red-500/20' };
  };

  const loadInfo = getCognitiveLoadLabel(cognitiveLoad);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        className="space-y-4 mt-6"
      >
        {/* Cognitive Load & Difficulty */}
        <div className="grid grid-cols-2 gap-3">
          {/* Cognitive Load */}
          <div className={`rounded-xl p-4 ${loadInfo.bg} backdrop-blur-sm`}>
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5" />
              <span className="text-sm font-medium">Reading Effort</span>
            </div>
            <div className={`text-2xl font-bold ${loadInfo.color}`}>{loadInfo.label}</div>
            <Progress value={cognitiveLoad} className="h-2 mt-2 bg-white/20" />
            <p className="text-xs opacity-70 mt-1">
              {cognitiveLoad < 30 ? 'You read smoothly!' : cognitiveLoad < 60 ? 'Good concentration!' : 'Keep practicing - it gets easier!'}
            </p>
          </div>

          {/* Difficulty Recommendation */}
          {difficultyRecommendation && (
            <div className="rounded-xl p-4 bg-blue-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-medium">Next Level</span>
              </div>
              <div className="text-2xl font-bold text-blue-300">
                Level {difficultyRecommendation.newLevel}
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Badge variant="secondary" className="text-xs bg-white/20">
                  {Math.round(difficultyRecommendation.confidence * 100)}% confident
                </Badge>
              </div>
              <p className="text-xs opacity-70 mt-1">
                {difficultyRecommendation.reasoning?.[0] || 'Keep up the great work!'}
              </p>
            </div>
          )}
        </div>

        {/* Areas to Practice */}
        {practiceAreas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="rounded-xl p-4 bg-orange-500/20 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-orange-300" />
              <span className="font-semibold text-orange-300">Areas to Practice</span>
            </div>
            
            <div className="space-y-3">
              {practiceAreas.slice(0, 3).map((area, idx) => (
                <motion.div
                  key={area.phoneme}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.6 + idx * 0.1 }}
                  className="bg-white/10 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-orange-500/30 text-orange-200">
                      Sound: /{area.phoneme}/
                    </Badge>
                    <span className="text-xs opacity-70">{area.words.length} practice words</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {area.words.slice(0, 5).map(word => (
                      <span key={word} className="px-2 py-0.5 bg-white/10 rounded text-sm">
                        {word}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-start gap-2 text-xs opacity-80">
                    <Lightbulb className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{area.tips}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Strengths Section */}
        {accuracy >= 70 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
            className="rounded-xl p-4 bg-green-500/20 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="font-semibold text-green-300">Your Strengths</span>
            </div>
            <div className="space-y-2 text-sm">
              {accuracy >= 80 && (
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  <span>Excellent accuracy - you pronounced most words correctly!</span>
                </div>
              )}
              {wpm >= 80 && (
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span>Great reading speed - you're reading fluently!</span>
                </div>
              )}
              {cognitiveLoad < 40 && (
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧠</span>
                  <span>Smooth reading - low effort means mastery!</span>
                </div>
              )}
              {wordsRead >= 50 && (
                <div className="flex items-center gap-2">
                  <span className="text-lg">📚</span>
                  <span>Great stamina - you read {wordsRead} words!</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
