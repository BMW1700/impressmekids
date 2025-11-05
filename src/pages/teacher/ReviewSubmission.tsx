import { useEffect, useState, useRef } from "react";
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
import { Loader2, ArrowLeft, Save, User, Calendar, CheckCircle2 } from "lucide-react";
import { useTextHighlights } from "@/hooks/useTextHighlights";
import { useAssignmentSubmissions } from "@/hooks/useAssignmentSubmissions";
import { AnnotationSidebar } from "@/components/assignments/AnnotationSidebar";
import { Separator } from "@/components/ui/separator";
import { AuraReadingGrader } from "@/components/aura/AuraReadingGrader";

export default function ReviewSubmission() {
  const { submissionId } = useParams();
  const [searchParams] = useSearchParams();
  const classroomId = searchParams.get('classroom');
  const navigate = useNavigate();
  const { toast } = useToast();
  const passageRef = useRef<HTMLDivElement>(null);

  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [hoveredHighlightId, setHoveredHighlightId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { highlights } = useTextHighlights(submissionId);
  const { gradeSubmission } = useAssignmentSubmissions(assignment?.id);

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

      // Load submission with student info
      const { data: submissionData, error: submissionError } = await supabase
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

      if (submissionError) throw submissionError;
      setSubmission(submissionData);

      // Initialize grade and feedback if already graded
      if (submissionData.grade !== null) {
        setGrade(submissionData.grade.toString());
      }
      if (submissionData.teacher_feedback) {
        setFeedback(submissionData.teacher_feedback);
      }

      // Load assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', submissionData.assignment_id)
        .single();

      if (assignmentError) throw assignmentError;
      setAssignment(assignmentData);

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

  const handleSaveGrade = () => {
    if (!submissionId || !assignment?.classroom_id) return;

    const gradeValue = parseFloat(grade);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
      toast({
        title: "Invalid Grade",
        description: "Please enter a grade between 0 and 100",
        variant: "destructive",
      });
      return;
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
        submissionId,
        grade: gradeValue,
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

  const renderHighlightedText = () => {
    if (!assignment?.passage_text) return null;

    const text = assignment.passage_text;
    const sortedHighlights = [...highlights].sort((a, b) => a.start_offset - b.start_offset);

    const elements: JSX.Element[] = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, idx) => {
      // Add text before highlight
      if (highlight.start_offset > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>
            {text.substring(lastIndex, highlight.start_offset)}
          </span>
        );
      }

      // Add highlighted text
      elements.push(
        <mark
          key={`highlight-${highlight.id}`}
          style={{ backgroundColor: highlight.color }}
          className={`cursor-pointer transition-all rounded px-0.5 ${
            hoveredHighlightId === highlight.id ? 'ring-2 ring-primary ring-offset-1' : ''
          }`}
          onMouseEnter={() => setHoveredHighlightId(highlight.id)}
          onMouseLeave={() => setHoveredHighlightId(null)}
        >
          {text.substring(highlight.start_offset, highlight.end_offset)}
        </mark>
      );

      lastIndex = highlight.end_offset;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return elements;
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuthButtons={false} />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
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
              <div>
                <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
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

            <Card className="mb-4 bg-muted/30">
              <CardContent className="py-4">
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Highlights:</span>
                    <span className="ml-2 font-semibold">{highlights.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Student Email:</span>
                    <span className="ml-2 font-semibold">{submission.profiles?.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="ml-2 font-semibold">{submission.status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Reading Passage with Highlights */}
            <div className="lg:col-span-2 space-y-6">
              {/* AURA AI Reading Grader */}
              <AuraReadingGrader
                assignmentId={assignment.id}
                highlights={highlights}
                passageText={assignment.passage_text}
                studentId={submission.student_id}
                onGradeGenerated={(aiGrade, aiFeedback) => {
                  setGrade(aiGrade.toString());
                  setFeedback(aiFeedback);
                }}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Student's Annotated Passage</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {studentName}'s highlights and annotations are shown below
                  </p>
                </CardHeader>
                <CardContent>
                  <div
                    ref={passageRef}
                    className="prose prose-sm max-w-none font-serif text-base leading-relaxed whitespace-pre-wrap"
                  >
                    {renderHighlightedText()}
                  </div>
                </CardContent>
              </Card>

              {/* Grading Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Grading & Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                      <Label htmlFor="grade">Grade (0-100)</Label>
                      <Input
                        id="grade"
                        type="number"
                        min="0"
                        max="100"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        placeholder="85"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label htmlFor="feedback">Feedback for Student</Label>
                      <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Great job highlighting key concepts! Your annotations show good understanding..."
                        rows={4}
                        disabled={isSaving}
                      />
                    </div>
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
                      disabled={isSaving || !grade || !feedback.trim()}
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

            {/* Annotations Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <AnnotationSidebar
                  highlights={highlights}
                  onUpdateAnnotation={() => {}}
                  onDeleteHighlight={() => {}}
                  onHighlightClick={(highlight) => setHoveredHighlightId(highlight.id)}
                  hoveredHighlightId={hoveredHighlightId}
                  isReadOnly={true}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
