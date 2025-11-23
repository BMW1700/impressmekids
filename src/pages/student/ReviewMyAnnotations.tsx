import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, User, Calendar, CheckCircle2 } from "lucide-react";
import { useTextHighlights } from "@/hooks/useTextHighlights";
import { AnnotationSidebar } from "@/components/assignments/AnnotationSidebar";

export default function ReviewMyAnnotations() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const passageRef = useRef<HTMLDivElement>(null);

  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredHighlightId, setHoveredHighlightId] = useState<string | null>(null);

  const { highlights } = useTextHighlights(submissionId);

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

      // Load submission
      const { data: submissionData, error: submissionError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (submissionError) throw submissionError;
      setSubmission(submissionData);

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
            <Button onClick={() => navigate('/student/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuthButtons={false} />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/student/dashboard?section=gradebook')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Gradebook
            </Button>

            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  {submission.submitted_at && (
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Submitted {new Date(submission.submitted_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-sm">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Graded
                </Badge>
                {submission.grade !== null && (
                  <Badge variant="outline" className="text-lg font-bold">
                    {submission.grade}/100
                  </Badge>
                )}
              </div>
            </div>

            <Card className="mb-4 bg-muted/30">
              <CardContent className="py-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Highlights:</span>
                    <span className="ml-2 font-semibold">{highlights.length}</span>
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
              <Card>
                <CardHeader>
                  <CardTitle>Your Annotated Passage</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Your highlights and annotations are shown below
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
