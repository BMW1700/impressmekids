import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles } from 'lucide-react';

interface GenerateQuestionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomId: string;
  questionGroupId?: string;
  onSuccess?: () => void;
}

export const GenerateQuestionsModal = ({
  open,
  onOpenChange,
  classroomId,
  questionGroupId,
  onSuccess,
}: GenerateQuestionsModalProps) => {
  const [subject, setSubject] = useState('Math');
  const [grade, setGrade] = useState('5');
  const [difficulty, setDifficulty] = useState('3');
  const [lessonContext, setLessonContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!lessonContext.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide lesson context',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-question-ai', {
        body: {
          classroom_id: classroomId,
          group_id: questionGroupId,
          subject,
          grade: parseInt(grade),
          difficulty: parseInt(difficulty),
          lesson_context: lessonContext.trim(),
        },
      });

      if (error) throw error;

      toast({
        title: 'Questions Generated!',
        description: `${data.count} AI questions created. Review and approve them before using.`,
      });

      setLessonContext('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate questions',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate AI Questions
          </DialogTitle>
          <DialogDescription>
            Generate curriculum-appropriate questions using AI. Questions will be saved as drafts for your review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Math, Science, History"
                disabled={isGenerating}
              />
            </div>

            <div>
              <Label htmlFor="grade">Grade Level</Label>
              <Select value={grade} onValueChange={setGrade} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3rd Grade</SelectItem>
                  <SelectItem value="4">4th Grade</SelectItem>
                  <SelectItem value="5">5th Grade</SelectItem>
                  <SelectItem value="6">6th Grade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="difficulty">Difficulty (1-5)</Label>
            <Select value={difficulty} onValueChange={setDifficulty} disabled={isGenerating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Very Easy</SelectItem>
                <SelectItem value="2">2 - Easy</SelectItem>
                <SelectItem value="3">3 - Medium</SelectItem>
                <SelectItem value="4">4 - Hard</SelectItem>
                <SelectItem value="5">5 - Very Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="lesson-context">Lesson Context</Label>
            <Textarea
              id="lesson-context"
              placeholder="Describe the topic or lesson (e.g., 'multiplication of fractions', 'American Revolution', 'photosynthesis')"
              value={lessonContext}
              onChange={(e) => setLessonContext(e.target.value)}
              disabled={isGenerating}
              rows={4}
            />
          </div>

          <Button
            onClick={handleGenerate}
            className="w-full"
            disabled={isGenerating}
          >
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isGenerating ? 'Generating Questions...' : 'Generate 3 Questions'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
