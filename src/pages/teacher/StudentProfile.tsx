import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, TrendingUp, Activity, MessageSquare, Sparkles, ArrowLeft } from "lucide-react";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useTeacherNotes } from "@/hooks/useTeacherNotes";
import { generateNextBestAction, getActionEmoji } from "@/lib/nextBestAction";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from "date-fns";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function StudentProfile() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [noteContent, setNoteContent] = useState("");
  
  const { 
    profile, 
    studentProfile, 
    skillVector,
    auraRecords, 
    submissions,
    classrooms,
    longitudinalMetrics,
    activityTimeline,
    isLoading 
  } = useStudentProfile(studentId);

  const primaryClassroom = classrooms[0]?.classrooms;
  const { notes, createNote, isCreating } = useTeacherNotes(
    studentId, 
    classrooms[0]?.classroom_id
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header showAuthButtons={false} />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Student Not Found</h1>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Generate Next Best Action
  const nextAction = generateNextBestAction({
    auraRecords,
    skillVector,
    studentProfile,
    recentAssignments: submissions,
  });

  // Prepare chart data
  const clarityChartData = longitudinalMetrics?.clarityOverTime.map((item) => ({
    date: format(item.date, 'MMM d'),
    clarity: item.value,
  })) || [];

  const handleAddNote = () => {
    if (!noteContent.trim()) return;
    createNote({ content: noteContent, noteType: 'text' });
    setNoteContent("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuthButtons={false} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/teacher/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {primaryClassroom && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/classroom/${primaryClassroom.id}`}>
                        {primaryClassroom.name}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage>{profile.full_name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">{profile.full_name}</h1>
                <p className="text-muted-foreground">{profile.email}</p>
                {studentProfile?.grade && (
                  <Badge variant="secondary" className="mt-2">
                    Grade {studentProfile.grade}
                  </Badge>
                )}
              </div>

              {longitudinalMetrics && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Sessions</p>
                    <p className="text-2xl font-bold">{longitudinalMetrics.sessionsCount}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Avg Clarity</p>
                    <p className="text-2xl font-bold">{longitudinalMetrics.avgClarity.toFixed(1)}/5</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Avg Confidence</p>
                    <p className="text-2xl font-bold">{longitudinalMetrics.avgConfidence.toFixed(1)}/5</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Next Best Action Card */}
          {nextAction && (
            <Card className="mb-8 border-2 border-primary bg-gradient-to-r from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {getActionEmoji(nextAction.actionType)} Next Best Action
                </CardTitle>
                <CardDescription>
                  AI-recommended intervention based on latest performance data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">{nextAction.title}</h3>
                  <p className="text-muted-foreground mb-4">{nextAction.description}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium mb-1">💡 Why This Action?</p>
                    <p className="text-sm text-muted-foreground">{nextAction.reasoning}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium mb-1">🎯 Expected Outcome</p>
                    <p className="text-sm text-muted-foreground">{nextAction.expectedOutcome}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant={nextAction.priority === 'high' ? 'destructive' : 'secondary'}>
                    {nextAction.priority.toUpperCase()} PRIORITY
                  </Badge>
                  <Badge variant="outline">
                    {nextAction.difficulty.toUpperCase()} DIFFICULTY
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ⏱️ {nextAction.estimatedDuration}
                  </span>
                </div>

                <Button 
                  className="w-full bg-gradient-primary hover:opacity-90"
                  onClick={() => {
                    // TODO: Navigate to exercise generation or assignment creation
                    navigate(`/teacher/assignment/create/${primaryClassroom?.id}`);
                  }}
                >
                  Generate Custom Assignment
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="overview" className="mb-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="progress">Progress Charts</TabsTrigger>
              <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
              <TabsTrigger value="notes">Teacher Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Quick Stats */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Recent Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {longitudinalMetrics ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Clarity</span>
                          <span className="font-bold">{longitudinalMetrics.avgClarity.toFixed(1)}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Pace</span>
                          <span className="font-bold">{longitudinalMetrics.avgPace.toFixed(1)}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Confidence</span>
                          <span className="font-bold">{longitudinalMetrics.avgConfidence.toFixed(1)}/5</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No data yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Activity Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Speaking Sessions</span>
                        <span className="font-bold">{auraRecords.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Assignments</span>
                        <span className="font-bold">{submissions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Classrooms</span>
                        <span className="font-bold">{classrooms.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Communication
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Teacher Notes</span>
                        <span className="font-bold">{notes.length}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          const tabsList = document.querySelector('[role="tablist"]');
                          const notesTab = tabsList?.querySelector('[value="notes"]') as HTMLButtonElement;
                          notesTab?.click();
                        }}
                      >
                        Add Note
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
              {longitudinalMetrics && clarityChartData.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Clarity Score Over Time</CardTitle>
                    <CardDescription>Track speaking clarity improvement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={clarityChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="clarity" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">
                    Not enough data to display charts yet. Student needs to complete more speaking sessions.
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                  <CardDescription>All student activity in chronological order</CardDescription>
                </CardHeader>
                <CardContent>
                  {activityTimeline.length > 0 ? (
                    <div className="space-y-4">
                      {activityTimeline.map((activity, index) => (
                        <div key={index} className="flex gap-4 border-l-2 border-muted pl-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {activity.type === 'aura' ? (
                                <Badge variant="secondary">Speaking</Badge>
                              ) : (
                                <Badge>Assignment</Badge>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {format(activity.date, 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                            {activity.type === 'aura' ? (
                              <p className="text-sm">
                                Recorded speaking practice • Clarity: {activity.data.clarity}/5
                              </p>
                            ) : (
                              <p className="text-sm">
                                {activity.data.assignments?.title} • Status: {activity.data.status}
                                {activity.data.grade && ` • Score: ${activity.data.grade}%`}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No activity yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Add a Note</CardTitle>
                  <CardDescription>
                    Private notes visible only to you and the student
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Write a note for this student..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={4}
                  />
                  <Button 
                    onClick={handleAddNote}
                    disabled={!noteContent.trim() || isCreating}
                  >
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Note
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Note History</CardTitle>
                </CardHeader>
                <CardContent>
                  {notes.length > 0 ? (
                    <div className="space-y-4">
                      {notes.map((note) => (
                        <div key={note.id} className="border-l-2 border-primary pl-4">
                          <p className="text-sm text-muted-foreground mb-1">
                            {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                          <p>{note.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No notes yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
