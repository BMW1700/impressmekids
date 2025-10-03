import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle } from "lucide-react";
import { CreateQuestionModal } from "./CreateQuestionModal";

interface AddQuestionsToGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomId: string;
  groupId: string;
  onSuccess?: () => void;
}

export const AddQuestionsToGroupModal = ({
  open,
  onOpenChange,
  classroomId,
  groupId,
  onSuccess,
}: AddQuestionsToGroupModalProps) => {
  const { toast } = useToast();
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (open) {
      loadAvailableQuestions();
    }
  }, [open, classroomId, groupId]);

  const loadAvailableQuestions = async () => {
    setIsLoading(true);
    try {
      // Get questions in classroom that are NOT in this group
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("classroom_id", classroomId)
        .eq("approved", true)
        .or(`group_id.is.null,group_id.neq.${groupId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAvailableQuestions(data || []);
    } catch (error: any) {
      console.error("Error loading questions:", error);
      toast({
        title: "Error",
        description: "Failed to load available questions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
        description: "Please select at least one question to add",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Update all selected questions to add them to the group
      const { error } = await supabase
        .from("questions")
        .update({ group_id: groupId })
        .in("id", Array.from(selectedQuestions));

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedQuestions.size} question${selectedQuestions.size !== 1 ? "s" : ""} added to group`,
      });

      setSelectedQuestions(new Set());
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error adding questions:", error);
      toast({
        title: "Error",
        description: "Failed to add questions to group",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSuccess = () => {
    loadAvailableQuestions();
    setShowCreateModal(false);
    onSuccess?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Questions to Group</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="existing" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Add Existing Questions</TabsTrigger>
              <TabsTrigger value="create">Create New Question</TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : availableQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No available questions to add. All questions in this classroom are already in this group or other groups.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Create a new question or generate questions with AI.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedQuestions.size} question{selectedQuestions.size !== 1 ? "s" : ""} selected
                  </p>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {availableQuestions.map((question) => (
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
                              <Badge variant="secondary">
                                {question.grade === 0 ? "K" : `Grade ${question.grade}`}
                              </Badge>
                              <Badge
                                variant={
                                  question.difficulty === "easy"
                                    ? "secondary"
                                    : question.difficulty === "medium"
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {question.difficulty}
                              </Badge>
                              <Badge variant="outline">{question.question_type}</Badge>
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

                  <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || selectedQuestions.size === 0}
                      className="bg-gradient-primary"
                    >
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Add Selected ({selectedQuestions.size})
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="create" className="mt-4">
              <div className="py-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Create a new question and add it directly to this group
                </p>
                <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-primary">
                  Open Question Creator
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <CreateQuestionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        classroomId={classroomId}
        groupId={groupId}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};
