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

  // Debug log component mount
  useEffect(() => {
    console.log('🎯 [CompleteAssignment] Component mounted', { assignmentId, hasStarted });
  }, []);

  const { timeRemaining, formatTime, stopTimer } = useAssignmentTimer({
    assignmentId: assignmentId || '',
    timerMinutes: assignment?.timer_minutes || null,
    onTimeUp: handleSubmit,
    autoStart: hasStarted,
  });

  // Check for existing submission on mount (resume functionality)
  useEffect(() => {
    console.log('🔄 [CompleteAssignment] Assignment data changed:', { 
      hasAssignment: !!assignment, 
      hasSubmissionId: !!submissionId,
      questionsCount: assignment?.assignment_questions?.length || 0
    });
    
    if (assignment && !submissionId) {
      checkForExistingSubmission();
    }
  }, [assignment]);

  // Create new submission when student clicks "Start Assignment"
  useEffect(() => {
    if (hasStarted && !submissionId && assignment) {
      console.log('📋 [CompleteAssignment] Student started assignment, creating submission');
      createSubmission();
    }
  }, [hasStarted, assignment, submissionId]);

  const checkForExistingSubmission = async () => {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session.session?.user.id || !assignmentId) {
      console.error('❌ [CompleteAssignment] Missing user ID or assignment ID');
      return;
    }

    console.log('🔍 [CompleteAssignment] Checking for existing submission');

    // Check if student has an existing submission for this assignment
    const { data: existingSubmission, error: fetchError } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', session.session.user.id)
      .eq('status', 'in_progress')
      .maybeSingle();

    if (fetchError) {
      console.error('❌ [CompleteAssignment] Error checking for existing submission:', fetchError);
      return;
    }

    if (existingSubmission) {
      console.log('✅ [CompleteAssignment] Found existing submission, resuming:', existingSubmission.id);
      setSubmissionId(existingSubmission.id);
      setHasStarted(true);
      
      toast({
        title: 'Resuming Assignment',
        description: 'Your previous progress has been loaded.',
      });
    }
  };

  const createSubmission = async () => {
    const { data: session } = await supabase.auth.getSession();
    
    console.log('📋 [CompleteAssignment] Creating submission for assignment:', assignmentId);
    console.log('👤 [CompleteAssignment] User ID:', session.session?.user.id);
    
    if (!session.session?.user.id || !assignmentId) {
      console.error('❌ [CompleteAssignment] Missing user ID or assignment ID');
      return;
    }

    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: session.session.user.id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [CompleteAssignment] Submission creation failed:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      toast({
        title: 'Failed to Start Assignment',
        description: error?.message || 'Unable to start the assignment. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    if (data) {
      console.log('✅ [CompleteAssignment] Submission created:', data.id);
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

  if (isLoading) {
    console.log('⏳ [CompleteAssignment] Loading assignment...');
    return <div>Loading...</div>;
  }
  
  if (!assignment) {
    console.log('❌ [CompleteAssignment] Assignment not found');
    return <div>Assignment not found</div>;
  }

  const questions = assignment.assignment_questions || [];
  console.log('📚 [CompleteAssignment] Questions loaded:', questions.length);
  
  const currentQuestion = questions[currentQuestionIndex];
  const allAnswered = answers.length === questions.length && answers.every((a: any) => a.status === 'completed');

  // Auto-navigate to first unanswered question when answers load
  useEffect(() => {
    if (answers.length > 0 && hasStarted) {
      const firstUnanswered = questions.findIndex(q => 
        !answers.find((a: any) => a.question_id === q.id && a.status === 'completed')
      );
      if (firstUnanswered !== -1 && firstUnanswered !== currentQuestionIndex) {
        console.log('📍 [CompleteAssignment] Jumping to first unanswered question:', firstUnanswered + 1);
        setCurrentQuestionIndex(firstUnanswered);
      }
    }
  }, [answers.length, hasStarted]);

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

  // Show loading state if questions haven't loaded yet or submission isn't created
  if (questions.length === 0 || !submissionId) {
    console.log('⏳ [CompleteAssignment] Waiting for questions or submission...', {
      questionsLength: questions.length,
      hasSubmissionId: !!submissionId
    });
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <p>Loading assignment questions...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Verify current question exists
  if (!currentQuestion) {
    console.error('❌ [CompleteAssignment] Current question is undefined', {
      currentQuestionIndex,
      questionsLength: questions.length
    });
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <p>Error: Question not found. Please refresh the page.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  console.log('✅ [CompleteAssignment] Rendering question view', {
    currentQuestionIndex,
    questionId: currentQuestion.id,
    submissionId
  });

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
            answer={answers.find((a: any) => a.question_id === currentQuestion?.id)}
            onAnswerChange={(data) => {
              console.log('🔄 [CompleteAssignment] Answer changed for question:', currentQuestion.id);
              
              if (!submissionId) {
                console.error('❌ [CompleteAssignment] No submission ID available');
                toast({
                  title: 'Error',
                  description: 'Assignment not started properly. Please refresh and try again.',
                  variant: 'destructive',
                });
                return;
              }
              
              console.log('💾 [CompleteAssignment] Saving answer:', {
                submissionId,
                questionId: currentQuestion.id,
                questionType: currentQuestion.question_type,
              });
              
              saveAnswer({
                submissionId: submissionId,
                questionId: currentQuestion.id,
                answerType: currentQuestion.question_type,
                answerData: data,
                status: 'completed',
                questionData: currentQuestion.question_data, // For auto-grading
              });
            }}
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
