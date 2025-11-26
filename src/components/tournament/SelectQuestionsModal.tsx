import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface SelectQuestionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  classroomId: string | undefined;
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
  const [questionGroups, setQuestionGroups] = useState<any[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGroupsLoading, setIsGroupsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && classroomId) {
      loadQuestions();
      loadQuestionGroups();
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

  const loadQuestionGroups = async () => {
    console.log('🔄 [SelectQuestionsModal] Loading question groups for classroom:', classroomId);
    setIsGroupsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('question_groups')
        .select('*, questions(count)')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [SelectQuestionsModal] Question groups query error:', error);
        console.error('❌ [SelectQuestionsModal] Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('✅ [SelectQuestionsModal] Question groups loaded:', data?.length || 0, 'groups');
      console.log('📊 [SelectQuestionsModal] Groups data:', data);
      setQuestionGroups(data || []);
    } catch (error: any) {
      console.error("❌ [SelectQuestionsModal] Failed to load question groups:", error);
      toast({
        title: "Error",
        description: "Failed to load question groups",
        variant: "destructive",
      });
      setQuestionGroups([]);
    } finally {
      setIsGroupsLoading(false);
    }
  };

  const loadExistingSelections = async () => {
    console.log('🔄 [SelectQuestionsModal] Loading existing selections for tournament:', tournamentId);
    
    try {
      const { data, error } = await supabase
        .from('tournament_questions')
        .select('question_id')
        .eq('tournament_id', tournamentId);

      if (error) {
        console.error('❌ [SelectQuestionsModal] Existing selections query error:', error);
        console.error('❌ [SelectQuestionsModal] Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('✅ [SelectQuestionsModal] Existing selections loaded:', data?.length || 0, 'questions');
      console.log('📊 [SelectQuestionsModal] Selections data:', data);
      
      const existingIds = new Set(data?.map(tq => tq.question_id) || []);
      setSelectedQuestions(existingIds);
    } catch (error: any) {
      console.error("❌ [SelectQuestionsModal] Failed to load existing selections:", error);
      setSelectedQuestions(new Set());
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

  const handleSelectGroup = async () => {
    if (!selectedGroupId) {
      toast({
        title: "No Group Selected",
        description: "Please select a question group",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Get all questions from the selected group
      const { data: groupQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('id')
        .eq('group_id', selectedGroupId)
        .eq('approved', true);

      if (questionsError) throw questionsError;

      if (!groupQuestions || groupQuestions.length === 0) {
        toast({
          title: "No Questions",
          description: "This group has no approved questions",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Delete existing selections
      const { error: deleteError } = await supabase
        .from('tournament_questions')
        .delete()
        .eq('tournament_id', tournamentId);

      if (deleteError) throw deleteError;

      // Insert all questions from group
      const insertData = groupQuestions.map((q, index) => ({
        tournament_id: tournamentId,
        question_id: q.id,
        sequence: index + 1,
      }));

      const { error: insertError } = await supabase
        .from('tournament_questions')
        .insert(insertData);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: `${groupQuestions.length} questions from group assigned to tournament`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error selecting group:", error);
      toast({
        title: "Error",
        description: "Failed to assign question group",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
        </DialogHeader>

        {!classroomId ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading classroom data...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="groups" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="groups">Select by Group</TabsTrigger>
            <TabsTrigger value="individual">Select Individual Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="mt-4">
            {isGroupsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : questionGroups.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  No question groups available in this classroom.
                </p>
                <p className="text-sm text-muted-foreground">
                  Create question groups in the Questions Library first.
                </p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[400px] pr-4">
                  <RadioGroup value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <div className="space-y-3">
                      {questionGroups.map((group) => (
                        <div
                          key={group.id}
                          className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedGroupId(group.id)}
                        >
                          <RadioGroupItem value={group.id} id={group.id} />
                          <Label htmlFor={group.id} className="flex-1 cursor-pointer">
                            <div className="font-semibold mb-1">{group.title}</div>
                            {group.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {group.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">{group.subject}</Badge>
                              <Badge variant="outline">
                                {group.grade === 0 ? "K" : `Grade ${group.grade}`}
                              </Badge>
                              <Badge variant="outline">
                                <BookOpen className="h-3 w-3 mr-1" />
                                Questions in group
                              </Badge>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </ScrollArea>

                <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSelectGroup}
                    disabled={isSaving || !selectedGroupId}
                    className="bg-gradient-primary"
                  >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Select Group
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="individual" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              {selectedQuestions.size} question{selectedQuestions.size !== 1 ? 's' : ''} selected
            </p>

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
          </TabsContent>
        </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};