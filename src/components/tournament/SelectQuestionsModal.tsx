import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SelectQuestionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  classroomId: string;
  onSuccess?: () => void;
}

export const SelectQuestionsModal = ({ 
  open, 
  onOpenChange, 
  tournamentId,
  classroomId,
  onSuccess 
}: SelectQuestionsModalProps) => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadQuestions();
      loadExistingSelections();
    }
  }, [open, tournamentId, classroomId]);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('classroom_id', classroomId)
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error: any) {
      console.error("Error loading questions:", error);
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadExistingSelections = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_questions')
        .select('question_id')
        .eq('tournament_id', tournamentId);

      if (error) throw error;
      
      const existingIds = new Set(data?.map(tq => tq.question_id) || []);
      setSelectedQuestions(existingIds);
    } catch (error: any) {
      console.error("Error loading existing selections:", error);
    }
  };

  const toggleQuestion = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const handleSave = async () => {
    if (selectedQuestions.size === 0) {
      toast({
        title: "No Questions Selected",
        description: "Please select at least one question for the tournament",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Delete existing selections
      const { error: deleteError } = await supabase
        .from('tournament_questions')
        .delete()
        .eq('tournament_id', tournamentId);

      if (deleteError) throw deleteError;

      // Insert new selections with sequence
      const insertData = Array.from(selectedQuestions).map((questionId, index) => ({
        tournament_id: tournamentId,
        question_id: questionId,
        sequence: index + 1,
      }));

      const { error: insertError } = await supabase
        .from('tournament_questions')
        .insert(insertData);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: `${selectedQuestions.size} questions assigned to tournament`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving questions:", error);
      toast({
        title: "Error",
        description: "Failed to save question selections",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Questions for Tournament</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {selectedQuestions.size} question{selectedQuestions.size !== 1 ? 's' : ''} selected
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No approved questions available for this classroom.
            </p>
            <p className="text-sm text-muted-foreground">
              Generate questions in the Questions Library first.
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => toggleQuestion(question.id)}
                  >
                    <Checkbox
                      checked={selectedQuestions.has(question.id)}
                      onCheckedChange={() => toggleQuestion(question.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{question.subject}</Badge>
                        <Badge variant="secondary">Grade {question.grade}</Badge>
                        <Badge variant={
                          question.difficulty === 'easy' ? 'secondary' :
                          question.difficulty === 'medium' ? 'default' : 'destructive'
                        }>
                          {question.difficulty}
                        </Badge>
                      </div>
                      <p className="font-medium mb-1">{question.question_text}</p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Answer:</strong> {question.answer_text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Tip: Select 10-20 questions for a good tournament experience
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || selectedQuestions.size === 0}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Save Selection
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};