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
import { FocusDetectionProvider } from '@/components/assignments/FocusDetectionProvider';
import { IsolationModeWrapper } from '@/components/assignments/IsolationModeWrapper';

export default function CompleteAssignment() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { assignment, isLoading } = useMultiQuestionAssignments(undefined, assignmentId);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<any>(null);
  const { answers, saveAnswer } = useAssignmentAnswers(submissionId || undefined);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [focusViolations, setFocusViolations] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);

  // Check authentication and role on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/auth'); return; }
    
    const { data: profileResult } = await supabase.rpc('get_user_profile', { 
      _user_id: session.user.id 
    });
    
    if (!profileResult || profileResult.length === 0) { 
      navigate('/auth'); 
      return; 
    }
    
    const profileData = profileResult[0];
    
    // Only students can complete assignments
    if (profileData.role !== 'student') {
      toast({
        title: "Access Denied",
        description: "Only students can access assignments.",
        variant: "destructive",
      });
      
      // Redirect to appropriate dashboard
      if (profileData.role === 'district_manager') navigate('/district-manager/dashboard');
      else if (profileData.role === 'teacher') navigate('/teacher/dashboard');
      else if (profileData.role === 'admin') navigate('/admin/dashboard');
      else if (profileData.role === 'parent') navigate('/parent/dashboard');
    }
  };

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
      questionsCount: assignment?.assignment_questions?.length || 0,
      maxAttempts: assignment?.max_attempts || 1
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

  // Shuffle questions when assignment loads (if enabled)
  useEffect(() => {
    if (assignment && assignment.shuffle_questions && shuffledQuestions.length === 0) {
      const questions = [...(assignment.assignment_questions || [])];
      // Simple Fisher-Yates shuffle
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
      setShuffledQuestions(questions);
    } else if (assignment && !assignment.shuffle_questions) {
      setShuffledQuestions(assignment.assignment_questions || []);
    }
  }, [assignment]);

  // Auto-navigate to first unanswered question when answers load
  useEffect(() => {
    // Safety checks - only run if we have all required data
    if (!hasStarted || !assignment || !submissionId || answers.length === 0) {
      return;
    }
    
    const questions = shuffledQuestions.length > 0 ? shuffledQuestions : assignment.assignment_questions || [];
    if (questions.length === 0) {
      return;
    }
    
    const firstUnanswered = questions.findIndex(q => 
      !answers.find((a: any) => a.question_id === q.id && a.status === 'completed')
    );
    
    if (firstUnanswered !== -1 && firstUnanswered !== currentQuestionIndex) {
      console.log('📍 [CompleteAssignment] Jumping to first unanswered question:', firstUnanswered + 1);
      setCurrentQuestionIndex(firstUnanswered);
    }
  }, [answers.length, hasStarted, assignment, submissionId, currentQuestionIndex, shuffledQuestions]);

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
      setCurrentSubmission(existingSubmission);
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

    // Get next attempt number
    const { data: existingSubmissions } = await supabase
      .from('assignment_submissions')
      .select('attempt_number')
      .eq('assignment_id', assignmentId)
      .eq('student_id', session.session.user.id)
      .order('attempt_number', { ascending: false })
      .limit(1);

    const nextAttemptNumber = existingSubmissions && existingSubmissions.length > 0 
      ? (existingSubmissions[0].attempt_number || 0) + 1 
      : 1;

    console.log('🔢 [CompleteAssignment] Next attempt number:', nextAttemptNumber);

    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: session.session.user.id,
        status: 'in_progress',
        attempt_number: nextAttemptNumber,
        started_at: new Date().toISOString(),
        focus_violations: 0,
        anti_cheating_metadata: {
          shuffle_questions: assignment?.shuffle_questions || false,
          shuffle_answers: assignment?.shuffle_answers || false,
          isolation_mode: assignment?.isolation_mode || false,
          focus_detection: assignment?.focus_detection || false,
        },
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
      console.log('✅ [CompleteAssignment] Submission created:', data.id, 'Attempt:', data.attempt_number);
      setSubmissionId(data.id);
      setCurrentSubmission(data);
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
        focus_violations: focusViolations,
      })
      .eq('id', submissionId);

    toast({
      title: 'Assignment Submitted',
      description: timeRemaining === 0 ? "Time's up. Your work has been submitted." : 'Your assignment has been submitted successfully.',
    });

    navigate(`/classrooms/${assignment.classroom_id}?tab=assignments`);
  }

  const handleFocusViolation = () => {
    setFocusViolations(prev => prev + 1);
  };

  // 1. FIRST: Check if assignment is loading
  if (isLoading) {
    console.log('⏳ [CompleteAssignment] Loading assignment...');
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <p>Loading assignment...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  // 2. SECOND: Check if assignment exists
  if (!assignment) {
    console.log('❌ [CompleteAssignment] Assignment not found');
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <p>Assignment not found</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const questions = shuffledQuestions.length > 0 ? shuffledQuestions : assignment.assignment_questions || [];
  console.log('📚 [CompleteAssignment] Questions loaded:', questions.length);
  
  // 3. THIRD: Check if questions are loaded
  if (questions.length === 0) {
    console.log('⏳ [CompleteAssignment] Waiting for questions to load...');
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

  // 4. FOURTH: Show start screen if student hasn't started yet
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
              {assignment.max_attempts && assignment.max_attempts > 1 && (
                <p><strong>Attempts Allowed:</strong> {assignment.max_attempts}</p>
              )}
            </div>
            <Button size="lg" onClick={() => setHasStarted(true)}>Start Assignment</Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // 5. FIFTH: Check if submission is created (needed after student clicks start)
  if (!submissionId) {
    console.log('⏳ [CompleteAssignment] Waiting for submission to be created...');
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <p>Starting assignment...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 6. NOW SAFE: Calculate variables for assignment UI
  const currentQuestion = questions[currentQuestionIndex];
  const allAnswered = answers.length === questions.length && answers.every((a: any) => a.status === 'completed');

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

  console.log('✅ [CompleteAssignment] About to render assignment UI', {
    hasStarted,
    submissionId,
    questionsCount: questions.length,
    currentQuestionIndex,
    answersCount: answers.length,
    currentQuestionId: currentQuestion.id
  });

  const assignmentContent = (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{assignment.title}</h1>
          {currentSubmission?.attempt_number && assignment?.max_attempts && (
            <p className="text-sm text-muted-foreground mt-1">
              Attempt {currentSubmission.attempt_number} of {assignment.max_attempts}
            </p>
          )}
        </div>
        {formatTime && (
          <div className="text-lg font-semibold">
            Time Remaining: {formatTime}
          </div>
        )}
      </div>

      <StudentQuestionView
        question={currentQuestion}
        answer={answers.find((a: any) => a.question_id === currentQuestion?.id)}
        shuffleAnswers={assignment.shuffle_answers}
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
            questionData: currentQuestion.question_data,
            questionPoints: currentQuestion.points || 10,
          });
        }}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
      />

      {!assignment.isolation_mode && (
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
      )}
    </div>
  );

  return (
    <FocusDetectionProvider 
      enabled={assignment.focus_detection || false}
      onViolation={handleFocusViolation}
    >
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          {assignment.isolation_mode ? (
            <IsolationModeWrapper
              currentQuestion={currentQuestionIndex}
              totalQuestions={questions.length}
              canProceed={!!answers.find((a: any) => a.question_id === currentQuestion?.id && a.status === 'completed')}
              onNext={() => setCurrentQuestionIndex(i => i + 1)}
              onSubmit={handleSubmit}
            >
              {assignmentContent}
            </IsolationModeWrapper>
          ) : (
            assignmentContent
          )}
        </main>
        <Footer />
      </div>
    </FocusDetectionProvider>
  );
}
