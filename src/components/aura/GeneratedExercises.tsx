import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQLearningUpdate } from "@/hooks/useQLearningUpdate";
import { useMLContextSafe } from "@/components/ml/MLStatusProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, CheckCircle2, BookOpen, Mic, Brain } from "lucide-react";
import { ipaToEnglishWithSlashes } from "@/lib/phonemeDisplayUtils";

interface GeneratedExercisesProps {
  problematicPhonemes: string[];
  studentGrade?: number;
}

const GeneratedExercises = ({ problematicPhonemes, studentGrade = 5 }: GeneratedExercisesProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { updateQLearning } = useQLearningUpdate();
  const mlContext = useMLContextSafe();
  const [isGenerating, setIsGenerating] = useState(false);

  // Get ML-powered phoneme recommendation
  const mlRecommendation = useMemo(() => {
    if (!mlContext || problematicPhonemes.length === 0) return null;
    
    const { selectBestPhoneme, modelStatus } = mlContext;
    
    // Only provide recommendation if Q-learning is loaded
    if (!modelStatus.qLearningTable.loaded) return null;
    
    const result = selectBestPhoneme(
      [], // mastered (would come from student skill vector)
      problematicPhonemes, // struggling
      studentGrade,
      problematicPhonemes
    );
    
    return result;
  }, [mlContext, problematicPhonemes, studentGrade]);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['practice-exercises', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('practice_exercises')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const completeMutation = useMutation({
    mutationFn: async (exerciseId: string) => {
      const exercise = exercises?.find(e => e.id === exerciseId);
      if (!exercise || !user) return;

      // Calculate performance (in real app, this would come from actual practice metrics)
      const performance = {
        success_rate: 0.75, // Default to 75% - would be actual measured performance
        completed_phonemes: exercise.phoneme_targets || [],
      };

      // Mark as completed
      const { error } = await supabase
        .from('practice_exercises')
        .update({ 
          completed: true, 
          completed_at: new Date().toISOString(),
          success_rate: performance.success_rate,
        })
        .eq('id', exerciseId);
      
      if (error) throw error;

      // Update Q-learning model with this practice session
      await updateQLearning(exerciseId, user.id, performance);

      // Trigger effectiveness calculation in background
      supabase.functions.invoke('calculate-exercise-effectiveness', {
        body: { exerciseId, studentId: user.id },
      }).catch(err => console.error('Effectiveness calc failed:', err));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-exercises'] });
      toast({
        title: "Exercise Completed! 🎉",
        description: "Your progress has been saved and learning model updated.",
      });
    },
  });

  const generateExercises = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to generate exercises.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-practice-exercises', {
        body: {
          studentId: user.id,
          phonemeGaps: problematicPhonemes,
          grade: studentGrade,
        },
      });

      if (error) throw error;

      toast({
        title: "✨ Exercises Generated!",
        description: `Created ${data.exercises.length} personalized exercises for you.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['practice-exercises'] });
    } catch (error) {
      console.error('Generate exercises error:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate exercises. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getExerciseIcon = (type: string) => {
    switch (type) {
      case 'tongue_twister': return <Mic className="w-4 h-4" />;
      case 'read_aloud': return <BookOpen className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getExerciseLabel = (type: string) => {
    switch (type) {
      case 'tongue_twister': return 'Tongue Twister';
      case 'read_aloud': return 'Read Aloud';
      case 'creative_prompt': return 'Creative Speaking';
      default: return 'Practice';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ML Recommendation Card */}
      {mlRecommendation && mlRecommendation.isMLPowered && (
        <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">ML-Powered Recommendation</CardTitle>
              <Badge variant="default" className="text-xs">Q-Learning</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">
              <span className="font-medium">Focus on:</span>{' '}
              <Badge variant="outline" className="text-sm font-mono">/{mlRecommendation.phoneme}/</Badge>
            </p>
            <p className="text-xs text-muted-foreground">{mlRecommendation.reasoning}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Expected success:</span>
              <Badge variant={mlRecommendation.expectedReward > 0.7 ? "default" : "secondary"}>
                {Math.round(mlRecommendation.expectedReward * 100)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI-Generated Practice Exercises</h3>
          <p className="text-sm text-muted-foreground">
            Personalized exercises targeting your pronunciation gaps
          </p>
        </div>
        <Button
          onClick={generateExercises}
          disabled={isGenerating || !user}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate New
            </>
          )}
        </Button>
      </div>

      {exercises && exercises.length > 0 ? (
        <div className="grid gap-4">
          {exercises.map((exercise) => (
            <Card key={exercise.id} className={exercise.completed ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getExerciseIcon(exercise.exercise_type)}
                    <CardTitle className="text-base">
                      {getExerciseLabel(exercise.exercise_type)}
                    </CardTitle>
                    {exercise.difficulty_level && (
                      <Badge variant="outline" className="text-xs">
                        Level {exercise.difficulty_level}/5
                      </Badge>
                    )}
                    {(exercise.adaptive_metadata as any)?.version === 'v2_rl_enhanced' && (
                      <Badge variant="default" className="text-xs gap-1">
                        <Sparkles className="w-3 h-3" />
                        RL-Adaptive
                      </Badge>
                    )}
                  </div>
                  {exercise.completed ? (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Completed
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </div>
                <CardDescription className="flex flex-wrap gap-1 mt-2">
                  Target sounds:
                  {exercise.phoneme_targets.map((phoneme: string) => (
                    <Badge key={phoneme} variant="outline" className="text-xs">
                      /{phoneme}/
                    </Badge>
                  ))}
                </CardDescription>
                {(exercise.adaptive_metadata as any)?.difficulty_reasoning && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    💡 {(exercise.adaptive_metadata as any).difficulty_reasoning}
                  </p>
                )}
                {(exercise.adaptive_metadata as any)?.recommended_rest_minutes > 0 && (
                  <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-700 dark:text-amber-300">
                    ⚠️ Rest recommended: {(exercise.adaptive_metadata as any).recommended_rest_minutes} min before practice
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm leading-relaxed">{exercise.content}</p>
                </div>
                
                {exercise.effectiveness_score && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Effectiveness:</span>
                    <Badge variant={exercise.effectiveness_score > 0 ? "default" : "secondary"}>
                      {exercise.effectiveness_score > 0 ? '+' : ''}{exercise.effectiveness_score}%
                    </Badge>
                  </div>
                )}

                {!exercise.completed && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => completeMutation.mutate(exercise.id)}
                  >
                    Mark as Completed
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">No exercises yet</p>
            <p className="text-xs text-muted-foreground">
              Click "Generate New" to create personalized speaking exercises. After practice sessions, exercises will target your specific areas for improvement.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GeneratedExercises;
