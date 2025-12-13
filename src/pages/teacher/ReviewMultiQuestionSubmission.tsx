import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Save, User, Calendar, CheckCircle2, Volume2 } from "lucide-react";
import { useAssignmentSubmissions } from "@/hooks/useAssignmentSubmissions";
import { Separator } from "@/components/ui/separator";
import { useAssignmentRubric } from "@/hooks/useRubrics";
import { RubricGrader } from "@/components/rubrics/RubricGrader";

export default function ReviewMultiQuestionSubmission() {
  const { submissionId } = useParams();
  const [searchParams] = useSearchParams();
  const classroomId = searchParams.get('classroom');
  const navigate = useNavigate();
  const { toast } = useToast();

  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [selectedAttemptNumber, setSelectedAttemptNumber] = useState<number | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [manualGrades, setManualGrades] = useState<Record<string, number>>({});
  const [rubricScore, setRubricScore] = useState<{ total: number; max: number } | null>(null);

  const { gradeSubmission } = useAssignmentSubmissions(assignment?.id);
  const { assignmentRubric } = useAssignmentRubric(assignment?.id);

  useEffect(() => {
    loadData();
  }, [submissionId, selectedAttemptNumber]);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Load initial submission to get student and assignment info
      const { data: initialSubmission, error: initialError } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          profiles!student_id (
            id,
            full_name,
            email
          )
        `)
        .eq('id', submissionId)
        .single();

      if (initialError) throw initialError;

      // Load ALL submissions for this student+assignment
      const { data: allSubmissionsData, error: allSubmissionsError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', initialSubmission.assignment_id)
        .eq('student_id', initialSubmission.student_id)
        .order('attempt_number', { ascending: false });

      if (allSubmissionsError) throw allSubmissionsError;
      setAllSubmissions(allSubmissionsData || []);

      // If no attempt selected, default to most recent
      if (!selectedAttemptNumber && allSubmissionsData && allSubmissionsData.length > 0) {
        setSelectedAttemptNumber(allSubmissionsData[0].attempt_number);
      }

      // Find the submission for the selected attempt
      const targetSubmission = selectedAttemptNumber
        ? allSubmissionsData?.find(s => s.attempt_number === selectedAttemptNumber)
        : allSubmissionsData?.[0];

      if (!targetSubmission) throw new Error('Submission not found');

      // Create merged submission object with student info
      const mergedSubmission = {
        ...targetSubmission,
        profiles: initialSubmission.profiles
      };
      setSubmission(mergedSubmission);

      // Initialize grade and feedback if already graded
      if (mergedSubmission.grade !== null) {
        setGrade(mergedSubmission.grade.toString());
      } else {
        setGrade("");
      }
      if (mergedSubmission.teacher_feedback) {
        setFeedback(mergedSubmission.teacher_feedback);
      } else {
        setFeedback("");
      }

      // Load assignment with questions
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select(`
          *,
          assignment_questions(*)
        `)
        .eq('id', targetSubmission.assignment_id)
        .single();

      if (assignmentError) throw assignmentError;
      setAssignment(assignmentData);
      
      // Sort questions by sequence
      const sortedQuestions = (assignmentData.assignment_questions || []).sort(
        (a: any, b: any) => a.sequence - b.sequence
      );
      setQuestions(sortedQuestions);

      // Load answers for the selected submission
      const { data: answersData, error: answersError } = await supabase
        .from('assignment_answers')
        .select(`
          *,
          aura_records(*)
        `)
        .eq('submission_id', targetSubmission.id);

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
      } else if (manualGrades[question.id] !== undefined) {
        earnedPoints += manualGrades[question.id];
      }
    });

    return { totalPoints, earnedPoints };
  };

  const handleSaveManualGrade = async (questionId: string, answerId: string, points: number) => {
    try {
      const { error } = await supabase
        .from('assignment_answers')
        .update({ points_earned: points })
        .eq('id', answerId);

      if (error) throw error;

      setManualGrades(prev => ({ ...prev, [questionId]: points }));
      toast({
        title: "Grade Saved",
        description: "Question grade has been updated",
      });
      
      // Reload data to refresh
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save grade",
        variant: "destructive",
      });
    }
  };

  const handleRubricScoreChange = (total: number, max: number) => {
    setRubricScore({ total, max });
  };

  const handleSaveGrade = () => {
    if (!submissionId || !assignment?.classroom_id) return;

    // Calculate final grade - use rubric if available, otherwise use question scores
    let gradePercentage: number;
    if (rubricScore && rubricScore.max > 0) {
      gradePercentage = Math.round((rubricScore.total / rubricScore.max) * 100);
    } else {
      const { totalPoints, earnedPoints } = calculateTotalScore();
      gradePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    }

    if (!feedback.trim()) {
      toast({
        title: "Missing Feedback",
        description: "Please provide feedback for the student",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    gradeSubmission(
      {
        submissionId: submission.id,
        grade: gradePercentage,
        feedback: feedback.trim(),
      },
      {
        onSuccess: () => {
          // Navigate to classroom assignments tab
          navigate(`/classrooms/${assignment.classroom_id}?tab=assignments`);
        },
        onSettled: () => {
          setIsSaving(false);
        },
      }
    );
  };

  const getAnswerForQuestion = (questionId: string) => {
    return answers.find(a => a.question_id === questionId);
  };

  const renderQuestionAnswer = (question: any, answer: any) => {
    const questionData = question.question_data;
    const answerData = answer?.answer_data || {};
    const questionPoints = question.points || 10;
    const isAutoGraded = answer?.is_correct !== null && answer?.is_correct !== undefined;
    const needsManualGrading = !isAutoGraded && answerData.answer_text;

    switch (question.question_type) {
      case 'question_answer':
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium">Question: {questionData.question_text}</p>
            <p className="text-sm text-muted-foreground">Student Answer:</p>
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
              
              {needsManualGrading && (
                <div className="flex items-center gap-2">
                  <Label htmlFor={`grade-${answer.id}`} className="text-sm">Grade:</Label>
                  <Input
                    id={`grade-${answer.id}`}
                    type="number"
                    min="0"
                    max={questionPoints}
                    value={manualGrades[question.id] ?? answer?.points_earned ?? ''}
                    onChange={(e) => setManualGrades(prev => ({ 
                      ...prev, 
                      [question.id]: parseFloat(e.target.value) || 0 
                    }))}
                    className="w-20"
                    placeholder="0"
                  />
                  <span className="text-sm text-muted-foreground">/ {questionPoints}</span>
                  <Button
                    size="sm"
                    onClick={() => handleSaveManualGrade(question.id, answer.id, manualGrades[question.id] || 0)}
                    disabled={manualGrades[question.id] === undefined}
                  >
                    Save
                  </Button>
                </div>
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
                            {isSelected && <span className="ml-2 text-xs">(Student)</span>}
                            {isCorrect && <span className="ml-2 text-xs">(Correct)</span>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Student Answer:</p>
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
                <p className="text-sm font-medium mb-2">Student Recording:</p>
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
                  {auraRecord.feedback && Array.isArray(auraRecord.feedback) && auraRecord.feedback.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1">Feedback:</p>
                      <ul className="text-xs space-y-1">
                        {auraRecord.feedback.map((fb: any, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{fb.text || fb}</span>
                          </li>
                        ))}
                      </ul>
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
        <Header showAuthButtons={false} />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Submission Not Found</h1>
            <Button onClick={() => navigate(`/classrooms/${classroomId}`)}>
              Back to Classroom
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const studentName = submission.profiles?.full_name || 'Student';
  const isGraded = submission.graded_at !== null;
  const { totalPoints, earnedPoints } = calculateTotalScore();

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuthButtons={false} />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(`/classrooms/${classroomId}`)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Classroom
            </Button>

            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
                <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {studentName}
                  </span>
                  {submission.submitted_at && (
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Submitted {new Date(submission.submitted_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              
              {/* TOP RIGHT SECTION - Dropdown + Badge */}
              <div className="flex flex-col items-end gap-2">
                {/* Attempt Dropdown - Only show if multiple attempts exist */}
                {allSubmissions.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="attempt-select" className="text-sm text-muted-foreground">
                      Viewing:
                    </Label>
                    <select
                      id="attempt-select"
                      value={selectedAttemptNumber || ''}
                      onChange={(e) => setSelectedAttemptNumber(parseInt(e.target.value))}
                      className="bg-background border border-input rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {allSubmissions.map(s => (
                        <option key={s.id} value={s.attempt_number}>
                          Attempt {s.attempt_number} of {assignment.max_attempts}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Grading Status Badge */}
                <div className="flex items-center gap-2">
                  <Badge variant={isGraded ? "default" : "secondary"} className="text-sm">
                    {isGraded ? (
                      <>
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Graded
                      </>
                    ) : (
                      'Not Graded'
                    )}
                  </Badge>
                  {isGraded && submission.grade !== null && (
                    <Badge variant="outline" className="text-lg font-bold">
                      {submission.grade}/100
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Student Answers */}
          <div className="space-y-6 mb-6">
            {questions.map((question, idx) => {
              const answer = getAnswerForQuestion(question.id);
              return (
                <Card key={question.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>Question {idx + 1}</span>
                      <div className="flex gap-2">
                        <Badge variant="outline">{question.question_type.replace('_', ' ')}</Badge>
                        <Badge variant="secondary">{question.points || 10} pts</Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {answer ? (
                      renderQuestionAnswer(question, answer)
                    ) : (
                      <p className="text-sm text-muted-foreground">No answer submitted</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Rubric Grading Section */}
          {assignmentRubric && submission && (
            <div className="mb-6">
              <RubricGrader
                rubricId={assignmentRubric.rubric_id}
                submissionId={submission.id}
                onScoreChange={handleRubricScoreChange}
              />
            </div>
          )}

          {/* Grading Section */}
          <Card>
            <CardHeader>
              <CardTitle>Grading & Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Total Score</span>
                  <span className="text-2xl font-bold">
                    {rubricScore ? rubricScore.total : earnedPoints} / {rubricScore ? rubricScore.max : totalPoints} points
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Percentage</span>
                  <span className="text-lg font-semibold">
                    {rubricScore 
                      ? (rubricScore.max > 0 ? Math.round((rubricScore.total / rubricScore.max) * 100) : 0)
                      : (totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0)}%
                  </span>
                </div>
                {rubricScore && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Grade calculated from rubric scores
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="feedback">Feedback for Student</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Great work! Your answers show good understanding..."
                  rows={4}
                  disabled={isSaving}
                />
              </div>

              <Separator />

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/classrooms/${classroomId}`)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveGrade}
                  disabled={isSaving || !feedback.trim()}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {isGraded ? 'Update Grade' : 'Save Grade & Feedback'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
