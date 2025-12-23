import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, User, Calendar, CheckCircle2 } from "lucide-react";

export default function ParentReviewSubmission() {
  const { submissionId } = useParams();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [studentName, setStudentName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [submissionId]);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Verify parent has access to this student
      if (studentId) {
        const { data: parentCheck } = await supabase.rpc("get_parent_children", {
          _parent_user_id: session.user.id
        });
        
        const hasAccess = parentCheck?.some((child: any) => child.student_id === studentId);
        if (!hasAccess) {
          toast({
            title: "Access Denied",
            description: "You don't have access to view this student's submission",
            variant: "destructive",
          });
          navigate('/parent/dashboard');
          return;
        }
        
        const child = parentCheck?.find((c: any) => c.student_id === studentId);
        setStudentName(child?.full_name || "Student");
      }

      // Load submission
      const { data: submissionData, error: submissionError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (submissionError) throw submissionError;
      setSubmission(submissionData);

      // Load assignment with questions
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select(`
          *,
          assignment_questions(*)
        `)
        .eq('id', submissionData.assignment_id)
        .single();

      if (assignmentError) throw assignmentError;
      setAssignment(assignmentData);
      
      // Sort questions by sequence
      const sortedQuestions = (assignmentData.assignment_questions || []).sort(
        (a: any, b: any) => a.sequence - b.sequence
      );
      setQuestions(sortedQuestions);

      // Load answers
      const { data: answersData, error: answersError } = await supabase
        .from('assignment_answers')
        .select(`
          *,
          aura_records(*)
        `)
        .eq('submission_id', submissionData.id);

      if (answersError) throw answersError;
      setAnswers(answersData || []);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load submission",
        variant: "destructive",
      });
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalScore = () => {
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach((question) => {
      const questionPoints = question.points || 10;
      totalPoints += questionPoints;

      const answer = getAnswerForQuestion(question.id);
      if (answer?.points_earned !== null && answer?.points_earned !== undefined) {
        earnedPoints += answer.points_earned;
      }
    });

    return { totalPoints, earnedPoints };
  };

  const getAnswerForQuestion = (questionId: string) => {
    return answers.find(a => a.question_id === questionId);
  };

  const renderQuestionAnswer = (question: any, answer: any) => {
    const questionData = question.question_data;
    const answerData = answer?.answer_data || {};
    const questionPoints = question.points || 10;
    const isAutoGraded = answer?.is_correct !== null && answer?.is_correct !== undefined;

    switch (question.question_type) {
      case 'question_answer':
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium">Question: {questionData.question_text}</p>
            <p className="text-sm text-muted-foreground">{studentName}'s Answer:</p>
            <p className="text-sm bg-muted p-3 rounded">{answerData.answer_text || 'No answer provided'}</p>
            
            <div className="flex items-center gap-3 flex-wrap">
              {isAutoGraded && (
                <>
                  <Badge variant={answer.is_correct ? "default" : "destructive"}>
                    {answer.is_correct ? 'Correct' : 'Incorrect'}
                  </Badge>
                  <Badge variant="outline">
                    {answer.points_earned}/{questionPoints} points
                  </Badge>
                </>
              )}
              
              {!isAutoGraded && answer?.points_earned !== null && answer?.points_earned !== undefined && (
                <Badge variant="outline">
                  {answer.points_earned}/{questionPoints} points
                </Badge>
              )}
              
              {!answerData.answer_text && (
                <Badge variant="secondary">Not Attempted</Badge>
              )}
            </div>
          </div>
        );

      case 'reading_comprehension':
        return (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Passage:</p>
              <div className="bg-muted p-4 rounded text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                {questionData.passage}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Questions:</p>
              {questionData.questions?.map((q: any, idx: number) => (
                <div key={idx} className="mb-3 bg-muted/50 p-3 rounded">
                  <p className="text-sm font-medium">{idx + 1}. {q.question}</p>
                  {q.type === 'multiple_choice' ? (
                    <div className="mt-2 space-y-1">
                      {q.options?.map((opt: string, optIdx: number) => {
                        const studentAnswer = answerData.answers?.[idx];
                        const isSelected = studentAnswer === opt;
                        const isCorrect = opt === q.correct_answer;
                        return (
                          <div
                            key={optIdx}
                            className={`text-sm p-2 rounded ${
                              isSelected && isCorrect ? 'bg-green-100 dark:bg-green-900/30 border border-green-500' :
                              isSelected ? 'bg-red-100 dark:bg-red-900/30 border border-red-500' :
                              isCorrect ? 'bg-green-50 dark:bg-green-900/20 border border-green-300' :
                              'bg-background'
                            }`}
                          >
                            {opt}
                            {isSelected && <span className="ml-2 text-xs">({studentName}'s Answer)</span>}
                            {isCorrect && <span className="ml-2 text-xs">(Correct)</span>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">{studentName}'s Answer:</p>
                      <p className="text-sm bg-background p-2 rounded mt-1">
                        {answerData.answers?.[idx] || 'No answer'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {answerData.score !== undefined && (
                <>
                  <Badge variant="outline">
                    Score: {answerData.score}/{questionData.questions?.length || 0}
                  </Badge>
                  <Badge variant={answerData.score === questionData.questions?.length ? "default" : "secondary"}>
                    {Math.round((answerData.score / (questionData.questions?.length || 1)) * 100)}%
                  </Badge>
                </>
              )}
              {answer?.points_earned !== null && answer?.points_earned !== undefined && (
                <Badge variant="outline">
                  {answer.points_earned}/{questionPoints} points
                </Badge>
              )}
            </div>
          </div>
        );

      case 'speaking':
        const auraRecord = answer?.aura_records?.[0];
        return (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Prompt:</p>
              <p className="text-sm bg-muted p-3 rounded">{questionData.prompt}</p>
            </div>
            {answerData.audio_url && (
              <div>
                <p className="text-sm font-medium mb-2">{studentName}'s Recording:</p>
                <audio controls className="w-full" src={answerData.audio_url}>
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            {auraRecord && (
              <div className="space-y-2">
                <p className="text-sm font-medium">AURA AI Analysis:</p>
                <div className="bg-muted p-4 rounded space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>WPM: {auraRecord.wpm?.toFixed(0)}</div>
                    <div>Clarity: {auraRecord.clarity}/100</div>
                    <div>Pace: {auraRecord.pace}/100</div>
                    <div>Confidence: {auraRecord.confidence}/100</div>
                  </div>
                  {auraRecord.transcript && (
                    <div>
                      <p className="text-xs font-medium mb-1">Transcript:</p>
                      <p className="text-xs bg-background p-2 rounded">{auraRecord.transcript}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <p className="text-sm text-muted-foreground">Unknown question type</p>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assignment || !submission) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Submission Not Found</h1>
            <Button onClick={() => navigate('/parent/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { totalPoints, earnedPoints } = calculateTotalScore();
  const gradePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/parent/dashboard?tab=gradebook')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Gradebook
            </Button>

            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
                <p className="text-lg text-muted-foreground mb-2">Viewing {studentName}'s Submission</p>
                <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
                  {submission.submitted_at && (
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Submitted {new Date(submission.submitted_at).toLocaleString()}
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Attempt #{submission.attempt_number}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-lg font-bold px-4 py-2">
                  {submission.grade || gradePercentage}/100
                </Badge>
              </div>
            </div>

            <Card className="mb-4 bg-muted/30">
              <CardContent className="py-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Points Earned:</span>
                    <span className="ml-2 font-semibold">{earnedPoints} / {totalPoints}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Percentage:</span>
                    <span className="ml-2 font-semibold">{gradePercentage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Questions and Answers */}
          <div className="space-y-6 mb-6">
            {questions.map((question, index) => {
              const answer = getAnswerForQuestion(question.id);
              return (
                <Card key={question.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                      <Badge variant="outline">{question.points || 10} points</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderQuestionAnswer(question, answer)}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Teacher Feedback */}
          {submission.teacher_feedback && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Teacher Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{submission.teacher_feedback}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
