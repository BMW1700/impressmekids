import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, CheckCircle2, BookOpen, Mic } from "lucide-react";

interface GeneratedExercisesProps {
  problematicPhonemes: string[];
  studentGrade?: number;
}

const GeneratedExercises = ({ problematicPhonemes, studentGrade = 5 }: GeneratedExercisesProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

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
      // Mark as completed
      const { error } = await supabase
        .from('practice_exercises')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', exerciseId);
      
      if (error) throw error;

      // Trigger effectiveness calculation in background
      if (user) {
        supabase.functions.invoke('calculate-exercise-effectiveness', {
          body: { exerciseId, studentId: user.id },
        }).catch(err => console.error('Effectiveness calc failed:', err));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-exercises'] });
      toast({
        title: "Exercise Completed! 🎉",
        description: "Practice again to measure your improvement!",
      });
    },
  });

  const generateExercises = async () => {
    if (!user || problematicPhonemes.length === 0) {
      toast({
        title: "Cannot Generate",
        description: "Complete a practice session first to identify areas for improvement.",
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI-Generated Practice Exercises</h3>
          <p className="text-sm text-muted-foreground">
            Personalized exercises targeting your pronunciation gaps
          </p>
        </div>
        <Button
          onClick={generateExercises}
          disabled={isGenerating || problematicPhonemes.length === 0}
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
              Complete a practice session to generate personalized exercises
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GeneratedExercises;
