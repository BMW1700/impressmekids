import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Volume2, CheckCircle } from 'lucide-react';
import { generatePracticeExercises } from '@/lib/mispronunciationAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { playCorrectPronunciation, unlockSpeechSynthesis } from '@/lib/pronunciationPlayer';

interface PhonemePracticeExercisesProps {
  studentId: string;
}

interface Exercise {
  phoneme: string;
  words: string[];
  tips: string;
}

export const PhonemePracticeExercises = ({ studentId }: PhonemePracticeExercisesProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [practicing, setPracticing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadExercises();
  }, [studentId]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const data = await generatePracticeExercises(studentId);
      setExercises(data);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const playPhonemeSound = (phoneme: string) => {
    // CRITICAL: Unlock speech on user gesture (Listen button click)
    unlockSpeechSynthesis();
    
    setPracticing(phoneme);
    
    const words = exercises.find(e => e.phoneme === phoneme)?.words || [];
    let index = 0;

    const speakNext = () => {
      if (index >= words.length) {
        setPracticing(null);
        return;
      }

      // Use the fixed playCorrectPronunciation instead of raw speechSynthesis
      console.log('🔊 Practice Tab: Playing word:', words[index]);
      playCorrectPronunciation(words[index]);
      
      index++;
      // Move to next word after a delay
      setTimeout(speakNext, 1200);
    };

    speakNext();
  };

  const markAsMastered = async (phoneme: string) => {
    const errorType = `${phoneme}→*`; // Mark all patterns with this target phoneme
    
    const { error } = await supabase
      .from('student_error_patterns')
      .update({ mastered: true })
      .eq('student_id', studentId)
      .like('error_type', `${phoneme}%`);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update mastery status',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Great job! 🎉',
        description: `You've mastered the ${phoneme} sound!`,
      });
      loadExercises(); // Refresh list
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (exercises.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phoneme Practice</CardTitle>
          <CardDescription>
            Complete more reading sessions to get personalized practice exercises!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Practice Exercises</h3>
        <Badge variant="secondary">{exercises.length} sounds to practice</Badge>
      </div>

      <div className="grid gap-4">
        {exercises.map((exercise) => (
          <Card key={exercise.phoneme}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-primary">
                    /{exercise.phoneme}/
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {exercise.tips}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playPhonemeSound(exercise.phoneme)}
                    disabled={practicing === exercise.phoneme}
                  >
                    {practicing === exercise.phoneme ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                    <span className="ml-2">Listen</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsMastered(exercise.phoneme)}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span className="ml-2">Mastered</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium mb-2">Practice these words:</p>
              <div className="flex flex-wrap gap-2">
                {exercise.words.map((word) => (
                  <Badge key={word} variant="secondary" className="text-base px-3 py-1">
                    {word}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
