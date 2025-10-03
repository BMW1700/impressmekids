import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, Plus, Sparkles, Trash2 } from "lucide-react";
import { GenerateQuestionsModal } from "@/components/tournament/GenerateQuestionsModal";
import { GenerateFlashcardsModal } from "@/components/flashcards/GenerateFlashcardsModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { CreateQuestionModal } from "@/components/tournament/CreateQuestionModal";
import { AddQuestionsToGroupModal } from "@/components/tournament/AddQuestionsToGroupModal";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const QuestionGroupDetail = () => {
  const { classroomId, groupId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [classroom, setClassroom] = useState<any>(null);
  const [group, setGroup] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddQuestionsModal, setShowAddQuestionsModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [classroomId, groupId]);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Load classroom
      const { data: classroomData, error: classroomError } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', classroomId)
        .eq('teacher_id', session.user.id)
        .single();

      if (classroomError || !classroomData) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this classroom",
          variant: "destructive",
        });
        navigate('/teacher/dashboard');
        return;
      }

      setClassroom(classroomData);

      // Load question group
      const { data: groupData, error: groupError } = await supabase
        .from('question_groups')
        .select('*')
        .eq('id', groupId)
        .eq('classroom_id', classroomId)
        .single();

      if (groupError || !groupData) {
        toast({
          title: "Error",
          description: "Question group not found",
          variant: "destructive",
        });
        navigate(`/teacher/questions/${classroomId}`);
        return;
      }

      setGroup(groupData);

      // Load questions in this group
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveQuestion = (question: any) => {
    setSelectedQuestion(question);
    setShowRemoveModal(true);
  };

  const confirmRemoveQuestion = async () => {
    if (!selectedQuestion) return;

    try {
      const { error } = await supabase
        .from('questions')
        .update({ group_id: null })
        .eq('id', selectedQuestion.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question removed from group",
      });

      setShowRemoveModal(false);
      setSelectedQuestion(null);
      loadData();
    } catch (error: any) {
      console.error("Error removing question:", error);
      toast({
        title: "Error",
        description: "Failed to remove question",
        variant: "destructive",
      });
    }
  };

  const gradeLabel = group?.grade === 0 ? "K" : `Grade ${group?.grade}`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuthButtons={false} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/teacher/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/classrooms/${classroomId}`}>{classroom?.name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/teacher/questions/${classroomId}`}>Questions Library</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{group?.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{group?.title}</CardTitle>
                  {group?.description && (
                    <p className="text-muted-foreground">{group.description}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Badge variant="secondary">{group?.subject}</Badge>
                    <Badge variant="outline">{gradeLabel}</Badge>
                    <Badge variant="outline">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {questions.length} {questions.length === 1 ? 'question' : 'questions'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFlashcardsModal(true)}
                    disabled={questions.length === 0}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Flashcards
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddQuestionsModal(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Questions
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Manually
                  </Button>
                  <Button
                    onClick={() => setShowGenerateModal(true)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {questions.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No Questions in This Group</h3>
              <p className="text-muted-foreground mb-4">
                Add questions with AI to get started
              </p>
              <Button
                onClick={() => setShowGenerateModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Questions with AI
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {questions.map((question) => (
                <Card key={question.id} className="shadow-card">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={
                            question.difficulty === 'easy' ? 'secondary' :
                            question.difficulty === 'medium' ? 'default' : 'destructive'
                          }>
                            {question.difficulty}
                          </Badge>
                          <Badge variant="outline">{question.question_type}</Badge>
                          {question.source === 'ai' && (
                            <Badge className="bg-purple-500">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI Generated
                            </Badge>
                          )}
                          {question.source === 'manual' && (
                            <Badge className="bg-blue-500">Manual</Badge>
                          )}
                        </div>
                        <p className="font-medium mb-2">{question.question_text}</p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Answer:</strong> {question.answer_text}
                        </p>
                        {question.explanation && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Explanation:</strong> {question.explanation}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveQuestion(question)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <GenerateQuestionsModal
        open={showGenerateModal}
        onOpenChange={setShowGenerateModal}
        classroomId={classroomId!}
        questionGroupId={groupId}
        onSuccess={loadData}
      />

      {group && (
        <GenerateFlashcardsModal
          open={showFlashcardsModal}
          onOpenChange={setShowFlashcardsModal}
          questionGroupId={groupId!}
          groupTitle={group.title}
          questionCount={questions.length}
          onSuccess={loadData}
        />
      )}

      <CreateQuestionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        classroomId={classroomId!}
        groupId={groupId}
        onSuccess={loadData}
      />

      <AddQuestionsToGroupModal
        open={showAddQuestionsModal}
        onOpenChange={setShowAddQuestionsModal}
        classroomId={classroomId!}
        groupId={groupId!}
        onSuccess={loadData}
      />

      <ConfirmModal
        open={showRemoveModal}
        onOpenChange={setShowRemoveModal}
        title="Remove Question from Group"
        description="Are you sure you want to remove this question from the group? The question will not be deleted, just ungrouped."
        onConfirm={confirmRemoveQuestion}
      />
    </div>
  );
};

export default QuestionGroupDetail;