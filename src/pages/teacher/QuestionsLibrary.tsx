import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, Plus, FolderPlus } from "lucide-react";
import { CreateQuestionGroupModal } from "@/components/tournament/CreateQuestionGroupModal";
import { EditQuestionGroupModal } from "@/components/tournament/EditQuestionGroupModal";
import { GenerateFlashcardsModal } from "@/components/flashcards/GenerateFlashcardsModal";
import { QuestionGroupCard } from "@/components/tournament/QuestionGroupCard";
import { ConfirmModal } from "@/components/ConfirmModal";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface QuestionGroup {
  id: string;
  title: string;
  description?: string;
  subject: string;
  grade: number;
  created_at: string;
  question_count: number;
}

const QuestionsLibrary = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [classroom, setClassroom] = useState<any>(null);
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<QuestionGroup | null>(null);

  useEffect(() => {
    loadData();
  }, [classroomId]);

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
          description: "You don't have permission to manage this classroom's questions",
          variant: "destructive",
        });
        navigate('/teacher/dashboard');
        return;
      }

      setClassroom(classroomData);

      // Load question groups with question counts
      const { data: groupsData, error: groupsError } = await supabase
        .from('question_groups')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Get question counts for each group
      const groupsWithCounts = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { count } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .eq('approved', true);

          return {
            ...group,
            question_count: count || 0,
          };
        })
      );

      setQuestionGroups(groupsWithCounts);
    } catch (error: any) {
      console.error("Error loading question groups:", error);
      toast({
        title: "Error",
        description: "Failed to load question groups",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewQuestions = (groupId: string) => {
    navigate(`/teacher/questions/${classroomId}/${groupId}`);
  };

  const handleEdit = (group: QuestionGroup) => {
    setSelectedGroup(group);
    setShowEditModal(true);
  };

  const handleDelete = (group: QuestionGroup) => {
    setSelectedGroup(group);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedGroup) return;

    try {
      const { error } = await supabase
        .from('question_groups')
        .delete()
        .eq('id', selectedGroup.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question group deleted successfully",
      });

      setShowDeleteModal(false);
      setSelectedGroup(null);
      loadData();
    } catch (error: any) {
      console.error("Error deleting question group:", error);
      toast({
        title: "Error",
        description: "Failed to delete question group",
        variant: "destructive",
      });
    }
  };

  const handleGenerateFlashcards = (group: QuestionGroup) => {
    setSelectedGroup(group);
    setShowFlashcardsModal(true);
  };

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
                <BreadcrumbPage>Questions Library</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Question Groups</h1>
              <p className="text-muted-foreground">{classroom?.name}</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              Create Question Group
            </Button>
          </div>

          {questionGroups.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No Question Groups Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first question group to organize your questions by topic
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Create Question Group
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {questionGroups.map((group) => (
                <QuestionGroupCard
                  key={group.id}
                  id={group.id}
                  title={group.title}
                  description={group.description}
                  subject={group.subject}
                  grade={group.grade}
                  questionCount={group.question_count}
                  createdAt={group.created_at}
                  onViewQuestions={() => handleViewQuestions(group.id)}
                  onEdit={() => handleEdit(group)}
                  onDelete={() => handleDelete(group)}
                  onGenerateFlashcards={() => handleGenerateFlashcards(group)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <CreateQuestionGroupModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        classroomId={classroomId!}
        onSuccess={loadData}
      />

      {selectedGroup && (
        <>
          <EditQuestionGroupModal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            groupId={selectedGroup.id}
            initialData={{
              title: selectedGroup.title,
              description: selectedGroup.description,
              subject: selectedGroup.subject,
              grade: selectedGroup.grade,
            }}
            onSuccess={loadData}
          />

          <ConfirmModal
            open={showDeleteModal}
            onOpenChange={setShowDeleteModal}
            title="Delete Question Group"
            description={`Are you sure you want to delete "${selectedGroup.title}"? This will also remove all questions in this group.`}
            onConfirm={confirmDelete}
          />

          <GenerateFlashcardsModal
            open={showFlashcardsModal}
            onOpenChange={setShowFlashcardsModal}
            questionGroupId={selectedGroup.id}
            groupTitle={selectedGroup.title}
            questionCount={selectedGroup.question_count}
            onSuccess={loadData}
          />
        </>
      )}
    </div>
  );
};

export default QuestionsLibrary;