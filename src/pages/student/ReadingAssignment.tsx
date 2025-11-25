import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Send, Save, Calendar, MessageSquare, BookOpen, Mic } from "lucide-react";
import { useTextHighlights } from "@/hooks/useTextHighlights";
import { useSubmission } from "@/hooks/useSubmission";
import { AnnotationSidebar } from "@/components/assignments/AnnotationSidebar";
import { MobileAnnotationDrawer } from "@/components/assignments/MobileAnnotationDrawer";
import { RealtimeAnnotationCoach } from "@/components/aura/RealtimeAnnotationCoach";
import { WordByWordReader } from "@/components/aura/WordByWordReader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const HIGHLIGHT_COLORS = [
  '#fef08a', // yellow
  '#bfdbfe', // blue
  '#bbf7d0', // green
  '#fed7aa', // orange
  '#e9d5ff', // purple
];

export default function ReadingAssignment() {
  const { assignmentId } = useParams();
  const [searchParams] = useSearchParams();
  const classroomId = searchParams.get('classroom');
  const navigate = useNavigate();
  const { toast } = useToast();
  const passageRef = useRef<HTMLDivElement>(null);
  
  const [assignment, setAssignment] = useState<any>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [colorIndex, setColorIndex] = useState(0);
  const [showAnnotationDialog, setShowAnnotationDialog] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<{
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [annotationText, setAnnotationText] = useState("");
  const [hoveredHighlightId, setHoveredHighlightId] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [selectedHighlightIndex, setSelectedHighlightIndex] = useState<number>(-1);
  const [readingMode, setReadingMode] = useState<'annotation' | 'word-by-word'>('annotation');

  const { submission, createOrUpdateSubmission } = useSubmission(assignmentId, studentId || undefined);
  const { highlights, createHighlight, updateHighlight, deleteHighlight } = useTextHighlights(
    submission?.id
  );

  const isSubmitted = submission?.status === 'submitted';

  useEffect(() => {
    loadData();
  }, [assignmentId]);

  // Keyboard navigation
  useEffect(() => {
    if (isSubmitted || highlights.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const newIndex =
          e.key === 'ArrowDown'
            ? Math.min(selectedHighlightIndex + 1, highlights.length - 1)
            : Math.max(selectedHighlightIndex - 1, 0);

        setSelectedHighlightIndex(newIndex);
        if (newIndex >= 0) {
          setHoveredHighlightId(highlights[newIndex].id);
          scrollToHighlight(highlights[newIndex].id);
        }
      } else if (e.key === 'Delete' && selectedHighlightIndex >= 0) {
        e.preventDefault();
        deleteHighlight(highlights[selectedHighlightIndex].id);
        setSelectedHighlightIndex(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitted, highlights, selectedHighlightIndex]);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      setStudentId(session.user.id);

      // Load assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (assignmentError) throw assignmentError;
      setAssignment(assignmentData);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load assignment",
        variant: "destructive",
      });
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize submission as "in_progress" when component mounts
  useEffect(() => {
    if (studentId && assignmentId && !submission) {
      createOrUpdateSubmission({
        assignmentId: assignmentId!,
        studentId,
        status: 'in_progress',
      });
    }
  }, [studentId, assignmentId, submission]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!studentId || !assignmentId || !submission || isSubmitted) return;

    const interval = setInterval(() => {
      console.log('Auto-saving progress...');
      // Submission is already saved via highlights
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [studentId, assignmentId, submission, isSubmitted]);

  const getCharacterOffset = (node: Node, offset: number): number => {
    if (!passageRef.current) return 0;
    
    const range = document.createRange();
    range.setStart(passageRef.current, 0);
    range.setEnd(node, offset);
    
    return range.toString().length;
  };

  const handleTextSelection = () => {
    if (isSubmitted) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !passageRef.current) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    
    if (!selectedText || selectedText.length < 3) {
      toast({
        title: "Selection too short",
        description: "Please select at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    // Check if selection is within the passage
    if (!passageRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    // Check for overlapping highlights
    const startOffset = getCharacterOffset(range.startContainer, range.startOffset);
    const endOffset = getCharacterOffset(range.endContainer, range.endOffset);

    const hasOverlap = highlights.some(
      (h) =>
        (startOffset >= h.start_offset && startOffset < h.end_offset) ||
        (endOffset > h.start_offset && endOffset <= h.end_offset) ||
        (startOffset <= h.start_offset && endOffset >= h.end_offset)
    );

    if (hasOverlap) {
      toast({
        title: "Overlapping highlight",
        description: "Please select text that doesn't overlap with existing highlights",
        variant: "destructive",
      });
      selection.removeAllRanges();
      return;
    }

    setPendingSelection({
      text: selectedText,
      startOffset,
      endOffset,
    });
    setShowAnnotationDialog(true);
    
    // Clear selection
    selection.removeAllRanges();
  };

  const saveHighlight = () => {
    if (!pendingSelection || !submission || !studentId || !annotationText.trim()) return;

    const color = HIGHLIGHT_COLORS[colorIndex % HIGHLIGHT_COLORS.length];
    
    createHighlight({
      submissionId: submission.id,
      studentId,
      startOffset: pendingSelection.startOffset,
      endOffset: pendingSelection.endOffset,
      highlightedText: pendingSelection.text,
      annotation: annotationText.trim(),
      color,
    });

    setColorIndex((prev) => (prev + 1) % HIGHLIGHT_COLORS.length);
    setPendingSelection(null);
    setAnnotationText("");
    setShowAnnotationDialog(false);

    toast({
      title: "Highlight added!",
      description: "Your annotation has been saved",
    });
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
          onClick={() => scrollToHighlight(highlight.id)}
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

  const scrollToHighlight = (highlightId: string) => {
    // Scroll to annotation in sidebar
    const element = document.getElementById(`annotation-${highlightId}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSubmit = () => {
    if (!studentId || !assignmentId) return;

    if (highlights.length === 0) {
      toast({
        title: "No highlights",
        description: "Please add at least one highlight before submitting",
        variant: "destructive",
      });
      return;
    }

    createOrUpdateSubmission({
      assignmentId,
      studentId,
      status: 'submitted',
    });

    // Navigate back to classroom after brief delay
    setTimeout(() => {
      navigate(`/classrooms/${classroomId}`);
    }, 1500);
  };

  const handleSaveDraft = () => {
    toast({
      title: "Progress saved",
      description: "Your work has been automatically saved",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header showAuthButtons={false} />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Assignment Not Found</h1>
            <Button onClick={() => navigate(`/classrooms/${classroomId}`)}>
              Back to Classroom
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
              onClick={() => navigate(`/classrooms/${classroomId}`)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Classroom
            </Button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
                {assignment.description && (
                  <p className="text-muted-foreground mb-2">{assignment.description}</p>
                )}
                {assignment.due_date && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Due: {new Date(assignment.due_date).toLocaleString()}
                  </p>
                )}
              </div>
              <Badge variant={isSubmitted ? "default" : "secondary"} className="text-sm">
                {isSubmitted ? "Submitted" : "In Progress"}
              </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Reading Passage with Mode Tabs */}
            <div className="lg:col-span-2">
              {!isSubmitted && (
                <Tabs value={readingMode} onValueChange={(v) => setReadingMode(v as any)} className="mb-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="annotation" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Read & Annotate
                    </TabsTrigger>
                    <TabsTrigger value="word-by-word" className="flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      Word-by-Word Practice
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}

              {readingMode === 'word-by-word' && !isSubmitted ? (
                <WordByWordReader
                  passageText={assignment.passage_text}
                  assignmentId={assignmentId}
                  onComplete={(sessionData) => {
                    toast({
                      title: "Reading Session Complete!",
                      description: `${sessionData.wpm} WPM • ${sessionData.accuracy}% Accuracy`,
                    });
                    setReadingMode('annotation');
                  }}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Reading Passage</CardTitle>
                    {!isSubmitted && (
                      <p className="text-sm text-muted-foreground">
                        Select any text to highlight and add your notes
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div
                      ref={passageRef}
                      className="prose prose-sm max-w-none font-serif text-base leading-relaxed whitespace-pre-wrap select-text"
                      onMouseUp={handleTextSelection}
                      style={{ userSelect: isSubmitted ? 'none' : 'text' }}
                    >
                      {renderHighlightedText()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {!isSubmitted && (
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    className="flex-1"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-primary hover:opacity-90"
                    disabled={highlights.length === 0}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Submit Assignment
                  </Button>
                </div>
              )}

              {/* Mobile Annotations Button */}
              <Button
                className="lg:hidden fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg z-50"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label="View annotations"
              >
                <MessageSquare className="h-6 w-6" />
                {highlights.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                    {highlights.length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Annotations Sidebar - Desktop Only */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-4 space-y-4">
                {/* Real-time AI Coach */}
                {assignment?.enable_realtime_coaching && !isSubmitted && (
                  <RealtimeAnnotationCoach
                    highlights={highlights}
                    passageText={assignment.passage_text}
                    enabled={true}
                  />
                )}
                
                <AnnotationSidebar
                  highlights={highlights}
                  onUpdateAnnotation={(id, annotation) => updateHighlight({ id, annotation })}
                  onDeleteHighlight={deleteHighlight}
                  onHighlightClick={(highlight) => {
                    setHoveredHighlightId(highlight.id);
                    scrollToHighlight(highlight.id);
                  }}
                  hoveredHighlightId={hoveredHighlightId}
                  isReadOnly={isSubmitted}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Mobile Annotations Drawer */}
      <MobileAnnotationDrawer
        highlights={highlights}
        onUpdateAnnotation={(id, annotation) => updateHighlight({ id, annotation })}
        onDeleteHighlight={deleteHighlight}
        onHighlightClick={(highlight) => setHoveredHighlightId(highlight.id)}
        hoveredHighlightId={hoveredHighlightId}
        isReadOnly={isSubmitted}
        open={mobileDrawerOpen}
        onOpenChange={setMobileDrawerOpen}
      />

      {/* Annotation Dialog */}
      <Dialog open={showAnnotationDialog} onOpenChange={setShowAnnotationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Annotation</DialogTitle>
            <DialogDescription>
              Selected: "{pendingSelection?.text.substring(0, 50)}
              {(pendingSelection?.text.length || 0) > 50 ? '...' : ''}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="annotation">Your Note</Label>
              <Input
                id="annotation"
                value={annotationText}
                onChange={(e) => setAnnotationText(e.target.value)}
                placeholder="Why is this important? What does it mean?"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && annotationText.trim()) {
                    saveHighlight();
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Highlight color:</span>
              <div
                className="w-8 h-8 rounded border-2 border-border"
                style={{ backgroundColor: HIGHLIGHT_COLORS[colorIndex % HIGHLIGHT_COLORS.length] }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowAnnotationDialog(false);
                setPendingSelection(null);
                setAnnotationText("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveHighlight}
              disabled={!annotationText.trim()}
            >
              Add Highlight
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
