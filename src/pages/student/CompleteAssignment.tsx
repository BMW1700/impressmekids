import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StudentQuestionView } from '@/components/assignments/StudentQuestionView';
import { useMultiQuestionAssignments } from '@/hooks/useMultiQuestionAssignments';
import { useAssignmentTimer } from '@/hooks/useAssignmentTimer';
import { useAssignmentAnswers } from '@/hooks/useAssignmentAnswers';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function CompleteAssignment() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { assignment, isLoading } = useMultiQuestionAssignments(undefined, assignmentId);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const { answers, saveAnswer } = useAssignmentAnswers(submissionId || undefined);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const { timeRemaining, formatTime, stopTimer } = useAssignmentTimer({
    assignmentId: assignmentId || '',
    timerMinutes: assignment?.timer_minutes || null,
    onTimeUp: handleSubmit,
    autoStart: hasStarted,
  });

  useEffect(() => {
    if (assignment && hasStarted && !submissionId) {
      createSubmission();
    }
  }, [assignment, hasStarted]);

  const createSubmission = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user.id || !assignmentId) return;

    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: session.session.user.id,
        status: 'not_started',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!error && data) {
      setSubmissionId(data.id);
    }
  };

  async function handleSubmit() {
    if (!submissionId) return;

    stopTimer();
    
    await supabase
      .from('assignment_submissions')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    toast({
      title: 'Assignment Submitted',
      description: timeRemaining === 0 ? "Time's up. Your work has been submitted." : 'Your assignment has been submitted successfully.',
    });

    navigate('/student/dashboard');
  }

  if (isLoading) return <div>Loading...</div>;
  if (!assignment) return <div>Assignment not found</div>;

  const questions = assignment.assignment_questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const allAnswered = answers.length === questions.length && answers.every((a: any) => a.status === 'completed');

  if (!hasStarted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto p-8 text-center space-y-6">
            <h1 className="text-3xl font-bold">{assignment.title}</h1>
            <p className="text-muted-foreground">{assignment.description}</p>
            <div className="space-y-2">
              <p><strong>Questions:</strong> {questions.length}</p>
              {assignment.timer_minutes && (
                <p><strong>Time Limit:</strong> {assignment.timer_minutes} minutes</p>
              )}
            </div>
            <Button size="lg" onClick={() => setHasStarted(true)}>Start Assignment</Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{assignment.title}</h1>
            {formatTime && (
              <div className="text-lg font-semibold">
                Time Remaining: {formatTime}
              </div>
            )}
          </div>

          <StudentQuestionView
            question={currentQuestion}
            answer={answers.find((a: any) => a.question_id === currentQuestion.id)}
            onAnswerChange={(data) => saveAnswer({
              submissionId: submissionId!,
              questionId: currentQuestion.id,
              answerType: currentQuestion.question_type,
              answerData: data,
              status: 'completed',
              questionData: currentQuestion.question_data, // For auto-grading
            })}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
          />

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(i => i - 1)}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentQuestionIndex < questions.length - 1 ? (
              <Button onClick={() => setCurrentQuestionIndex(i => i + 1)}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!allAnswered}>
                Submit Assignment
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
