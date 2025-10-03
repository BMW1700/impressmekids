import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, Plus, Filter, CheckCircle, XCircle, Edit } from "lucide-react";
import { GenerateQuestionsModal } from "@/components/tournament/GenerateQuestionsModal";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const QuestionsLibrary = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [classroom, setClassroom] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, [classroomId]);

  useEffect(() => {
    applyFilters();
  }, [questions, filterSubject, filterGrade, filterDifficulty]);

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

      // Load questions for this classroom
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false });

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
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

  const applyFilters = () => {
    let filtered = [...questions];

    if (filterSubject !== "all") {
      filtered = filtered.filter(q => q.subject === filterSubject);
    }

    if (filterGrade !== "all") {
      filtered = filtered.filter(q => q.grade === parseInt(filterGrade));
    }

    if (filterDifficulty !== "all") {
      filtered = filtered.filter(q => q.difficulty === filterDifficulty);
    }

    setFilteredQuestions(filtered);
  };

  const toggleApproval = async (questionId: string, currentApproval: boolean) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ approved: !currentApproval })
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Question ${!currentApproval ? 'approved' : 'unapproved'}`,
      });

      loadData();
    } catch (error: any) {
      console.error("Error updating question:", error);
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      });
    }
  };

  const uniqueSubjects = Array.from(new Set(questions.map(q => q.subject)));
  const uniqueGrades = Array.from(new Set(questions.map(q => q.grade))).sort((a, b) => a - b);

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
              <h1 className="text-3xl font-bold mb-2">Questions Library</h1>
              <p className="text-muted-foreground">{classroom?.name}</p>
            </div>
            <Button
              className="bg-gradient-primary hover:opacity-90"
              onClick={() => setShowGenerateModal(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Generate Questions with AI
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Select value={filterSubject} onValueChange={setFilterSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {uniqueSubjects.map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Grade</label>
                  <Select value={filterGrade} onValueChange={setFilterGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Grades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {uniqueGrades.map(grade => (
                        <SelectItem key={grade} value={grade.toString()}>Grade {grade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Difficulties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Difficulties</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {filteredQuestions.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No Questions Yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate questions with AI to get started
              </p>
              <Button
                className="bg-gradient-primary hover:opacity-90"
                onClick={() => setShowGenerateModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Generate Questions with AI
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredQuestions.map((question) => (
                <Card key={question.id} className="shadow-card">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
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
                          {question.approved ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <XCircle className="h-3 w-3 mr-1" />
                              Draft
                            </Badge>
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
                      <div className="flex gap-2">
                        <Button
                          variant={question.approved ? "outline" : "default"}
                          size="sm"
                          onClick={() => toggleApproval(question.id, question.approved)}
                        >
                          {question.approved ? 'Unapprove' : 'Approve'}
                        </Button>
                      </div>
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
        onSuccess={loadData}
      />
    </div>
  );
};

export default QuestionsLibrary;