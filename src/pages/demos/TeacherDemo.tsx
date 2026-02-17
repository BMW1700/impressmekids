import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Users, BookOpen, Brain, Calendar as CalendarIcon,
  PlusCircle, Sparkles, BarChart3, AlertCircle, Link as LinkIcon, Eye,
  GraduationCap, ChevronRight, ChevronLeft, Clock, FileText, CheckCircle, Star,
  Settings, MessageSquare, Upload, ExternalLink, Bell, Megaphone, Award,
  ClipboardList, TrendingUp, UserCheck, Shield, Play, Grid3X3, BookHeart,
  Trophy, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";
import { liquidGlassTabClass } from "@/components/ui/liquid-glass-button";
import { DemoTourProvider, TourStep } from "@/components/demos/DemoTourGuide";
import { DemoHighlight } from "@/components/demos/DemoHighlight";

const tourSteps: TourStep[] = [
  { id: "ai-insights-banner", title: "AI-Powered Insights", description: "Real-time analytics powered by machine learning. Identify at-risk students, track reading progress, and get actionable recommendations." },
  { id: "stats", title: "Dashboard Stats", description: "See your classrooms, total students, and active assignments at a glance. Click any card for detailed views." },
  { id: "classrooms", title: "My Classrooms", description: "All your class sections in one place. Click a classroom to manage assignments, view student progress, and post announcements." },
  { id: "create-classroom", title: "Create Classroom", description: "Set up a new class with a unique join code. Students can join instantly by entering the code." },
  // Classroom detail
  { id: "classroom-header-t", title: "Classroom Header", description: "The classroom name, join code, student count, and quick action buttons — Edit, Toolkit, and AI Class Insights." },
  { id: "quick-actions-t", title: "Quick Actions", description: "One-click access to Manage Questions, Create Assignment, and Send Announcement." },
  // Individual classroom tabs
  { id: "tab-syllabus-t", title: "Syllabus", description: "Upload your class syllabus and configure grade weights. Students can view the posted syllabus here." },
  { id: "tab-attendance-t", title: "Attendance", description: "Take daily attendance with one click per student. Track present, late, and absent — view history and patterns over time." },
  { id: "tab-students-t", title: "Students", description: "Full student roster with reading levels, grade averages, and risk flags. Click any student for their detailed profile." },
  { id: "tab-safety-t", title: "Safety & Drills", description: "Manage emergency drills and student safety. Track drill completion and safety readiness." },
  { id: "tab-office-hours-t", title: "Office Hours", description: "Set your available office hours for parent meetings. Parents book open slots directly — booked meetings appear in Upcoming Bookings." },
  { id: "tab-announcements-t", title: "Announcements", description: "Post announcements and share materials. Students see these updates on their Announcements tab." },
  { id: "tab-assignments-t", title: "Assignments", description: "Create, edit, and grade assignments. See submission status — who's turned in, who's late, who hasn't started." },
  { id: "tab-discussions-t", title: "Discussions", description: "Create discussion topics and moderate student conversations. Foster class engagement and critical thinking." },
  { id: "tab-study-t", title: "Study Materials", description: "Manage flashcard sets for your students. Generate flashcards from question groups or create custom sets." },
  { id: "tab-tournaments-t", title: "Study Games", description: "Create and manage educational games like Jeopardy duels and trivia tournaments for your students." },
  { id: "tab-leaderboard-t", title: "Leaderboard", description: "Track student performance with reading stars and class rankings. Motivate students with friendly competition." },
  { id: "tab-rubrics-t", title: "Rubrics", description: "Create and manage grading rubrics. Attach rubrics to assignments for consistent and transparent grading." },
  { id: "tab-ai-insights-t", title: "AI Insights", description: "AI-powered analytics for your classroom — reading trends, at-risk detection, and personalized recommendations." },
  { id: "tab-behavior-t", title: "Behavior", description: "Track and reward student behavior with positive/negative points. View trends and patterns over time." },
  { id: "tab-journal-t", title: "Journal", description: "Keep a private teaching journal — reflect on lessons, note student progress, and plan improvements." },
  { id: "tab-grades-t", title: "Grades", description: "View the class gradebook with all assignments, scores, and averages for each student." },
  { id: "tab-calendar-t", title: "Calendar", description: "View upcoming assignment deadlines and class events in a calendar format." },
  // Back to main tabs
  { id: "links-tab", title: "Links & Resources", description: "Organize educational resources, tools, and websites for quick access. Share links with students." },
  { id: "calendar-tab", title: "Calendar Overview", description: "View assignment deadlines, school events, parent-teacher conferences, and benchmark periods." },
  { id: "calendar-month-t", title: "Monthly Calendar", description: "See all your events at a glance. Color-coded dots show deadlines, meetings, and school events." },
  { id: "calendar-upcoming-t", title: "Upcoming Schedule", description: "A chronological list of everything coming up — deadlines, conferences, grading periods, and staff meetings." },
  { id: "directory-tab", title: "Directory", description: "Search for students, parents, and staff. View contact info and class rosters." },
  { id: "actions-tab", title: "Teacher Tools", description: "Access Browse Games, AURA Analytics, Story Library, and Resources from one place." },
];

// Teacher classroom tab config matching ClassroomTabsList
const TEACHER_TAB_CONFIG: { id: string; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { id: "syllabus", icon: FileText, label: "Syllabus" },
  { id: "attendance", icon: UserCheck, label: "Attendance" },
  { id: "students", icon: Users, label: "Students" },
  { id: "safety", icon: Shield, label: "Safety" },
  { id: "meeting-requests", icon: CalendarIcon, label: "Office Hours" },
  { id: "announcements", icon: Megaphone, label: "Announcements" },
  { id: "assignments", icon: FileText, label: "Assignments" },
  { id: "discussions", icon: MessageSquare, label: "Discussions" },
  { id: "study", icon: BookOpen, label: "Study Materials" },
  { id: "tournaments", icon: Play, label: "Study Games" },
  { id: "leaderboard", icon: Trophy, label: "Leaderboard" },
  { id: "rubrics", icon: Grid3X3, label: "Rubrics" },
  { id: "ai-insights", icon: BarChart3, label: "AI Insights" },
  { id: "behavior", icon: Trophy, label: "Behavior" },
  { id: "journal", icon: BookHeart, label: "Journal" },
  { id: "grades", icon: GraduationCap, label: "Grades" },
  { id: "calendar", icon: CalendarIcon, label: "Calendar" },
];

// Map tab IDs to tour step IDs
const tabToStepId: Record<string, string> = {
  syllabus: "tab-syllabus-t",
  attendance: "tab-attendance-t",
  students: "tab-students-t",
  safety: "tab-safety-t",
  "meeting-requests": "tab-office-hours-t",
  announcements: "tab-announcements-t",
  assignments: "tab-assignments-t",
  discussions: "tab-discussions-t",
  study: "tab-study-t",
  tournaments: "tab-tournaments-t",
  leaderboard: "tab-leaderboard-t",
  rubrics: "tab-rubrics-t",
  "ai-insights": "tab-ai-insights-t",
  behavior: "tab-behavior-t",
  journal: "tab-journal-t",
  grades: "tab-grades-t",
  calendar: "tab-calendar-t",
};

// ── Classroom Detail (Teacher View) ──
const TeacherClassroomDetail = ({
  classroomName,
  onBack,
  activeClassTab,
  onClassTabChange,
}: {
  classroomName: string;
  onBack: () => void;
  activeClassTab?: string;
  onClassTabChange?: (tab: string) => void;
}) => {
  const [localTab, setLocalTab] = useState("students");
  const classTab = activeClassTab ?? localTab;
  const handleTabChange = (v: string) => {
    setLocalTab(v);
    onClassTabChange?.(v);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header matching real ClassroomDetail */}
      <DemoHighlight stepId="classroom-header-t" tooltip="The classroom header shows the class name, join code, student count, and quick action buttons.">
        <Card className="shadow-elegant border-2 border-primary/10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <CardHeader className="bg-gradient-to-br from-muted/30 to-muted/10 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 mb-2">
                  <ChevronLeft className="h-4 w-4" /> Back to Classrooms
                </Button>
                <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
                  {classroomName}
                </CardTitle>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">28 students</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm text-muted-foreground font-medium">Join Code</span>
                <Badge variant="outline" className="font-mono text-xl px-6 py-3 border-2 border-primary/30 bg-background/80 backdrop-blur-sm">
                  ABC-123
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" size="lg">Edit Classroom</Button>
              <Button variant="outline" size="lg">🧰 Toolkit</Button>
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/60 hover:opacity-90 shadow-card text-base text-white">
                <BarChart3 className="mr-2 h-5 w-5" /> 🧠 AI Class Insights
              </Button>
            </div>
          </CardContent>
        </Card>
      </DemoHighlight>

      {/* Quick Actions */}
      <DemoHighlight stepId="quick-actions-t" tooltip="One-click access to your most common actions — manage questions, create assignments, and send announcements.">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border-2 border-primary/10 shadow-card">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Quick Actions</h2>
              <p className="text-sm text-muted-foreground">Manage your classroom content and activities</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button variant="outline" size="lg"><BookOpen className="mr-2 h-5 w-5" /> Manage Questions</Button>
              <Button variant="outline" size="lg"><FileText className="mr-2 h-5 w-5" /> Create Assignment</Button>
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/60 hover:opacity-90 shadow-card text-white">
                <Megaphone className="mr-2 h-5 w-5" /> Send Announcement
              </Button>
            </div>
          </div>
        </div>
      </DemoHighlight>

      {/* Tabs - 5-column grid matching real ClassroomTabsList */}
      <Tabs value={classTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-5 w-full h-auto p-2 bg-muted/50 rounded-xl gap-2">
          {TEACHER_TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className={cn("relative", liquidGlassTabClass)}>
                <Icon className="mr-2 h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Syllabus */}
        <TabsContent value="syllabus" className="mt-6">
          <DemoHighlight stepId="tab-syllabus-t" tooltip="Upload your class syllabus PDF and configure grade category weights.">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Syllabus</h2>
              <Card variant="glass">
                <CardContent className="p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">Upload Syllabus</h3>
                  <p className="text-muted-foreground mb-4">Upload a PDF or document for your students to view</p>
                  <Button><Upload className="mr-2 h-4 w-4" /> Upload File</Button>
                </CardContent>
              </Card>
              <Card variant="glass">
                <CardContent className="p-6">
                  <h3 className="font-bold mb-3">Grade Weights</h3>
                  <div className="space-y-2">
                    {[
                      { cat: "Tests", weight: "30%" },
                      { cat: "Quizzes", weight: "20%" },
                      { cat: "Homework", weight: "25%" },
                      { cat: "Participation", weight: "15%" },
                      { cat: "Projects", weight: "10%" },
                    ].map((g) => (
                      <div key={g.cat} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="font-medium">{g.cat}</span>
                        <Badge variant="outline">{g.weight}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </DemoHighlight>
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance" className="mt-6">
          <DemoHighlight stepId="tab-attendance-t" tooltip="Take attendance with one click per student. Green = present, yellow = late, red = absent.">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Attendance</h2>
                  <p className="text-muted-foreground mt-1">Track and manage student attendance</p>
                </div>
                <Button size="sm">Save Attendance</Button>
              </div>
              {[
                { name: "Sophia Chen", status: "present" },
                { name: "Emma Johnson", status: "present" },
                { name: "Noah Williams", status: "late" },
                { name: "Liam Martinez", status: "absent" },
                { name: "Olivia Brown", status: "present" },
                { name: "Ethan Davis", status: "present" },
              ].map((s) => (
                <Card key={s.name} variant="glass">
                  <CardContent className="p-4 flex items-center justify-between">
                    <p className="font-medium">{s.name}</p>
                    <div className="flex gap-2">
                      {["present", "late", "absent"].map((st) => (
                        <Button key={st} size="sm" variant={s.status === st ? "default" : "outline"}
                          className={cn(
                            s.status === st && st === "present" && "bg-green-600 hover:bg-green-700 text-white",
                            s.status === st && st === "late" && "bg-amber-500 hover:bg-amber-600 text-white",
                            s.status === st && st === "absent" && "bg-red-600 hover:bg-red-700 text-white",
                          )}
                        >
                          {st.charAt(0).toUpperCase() + st.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DemoHighlight>
        </TabsContent>

        {/* Students */}
        <TabsContent value="students" className="mt-6">
          <DemoHighlight stepId="tab-students-t" tooltip="Full student roster with reading levels, grade averages, and risk flags. Click any student for their detailed profile.">
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Student Roster</h2>
                <p className="text-muted-foreground mt-1">Manage and view your classroom students</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: "Sophia Chen", reading: "5.5", avg: "96%", status: "Advanced", avatar: "SC" },
                  { name: "Emma Johnson", reading: "4.8", avg: "91%", status: "On Track", avatar: "EJ" },
                  { name: "Noah Williams", reading: "4.1", avg: "85%", status: "On Track", avatar: "NW" },
                  { name: "Liam Martinez", reading: "3.2", avg: "72%", status: "At Risk", avatar: "LM" },
                  { name: "Olivia Brown", reading: "4.5", avg: "89%", status: "On Track", avatar: "OB" },
                  { name: "Ethan Davis", reading: "3.0", avg: "68%", status: "At Risk", avatar: "ED" },
                ].map((s) => (
                  <Card key={s.name} className="shadow-card hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] border-2 border-primary/10 hover:border-primary/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{s.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">Reading Level: {s.reading} • Avg: {s.avg}</p>
                        </div>
                        <Badge className={
                          s.status === "At Risk" ? "bg-red-100 text-red-700 hover:bg-red-100" :
                          s.status === "Advanced" ? "bg-green-100 text-green-700 hover:bg-green-100" :
                          "bg-blue-100 text-blue-700 hover:bg-blue-100"
                        }>{s.status}</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </DemoHighlight>
        </TabsContent>

        {/* Safety */}
        <TabsContent value="safety" className="mt-6">
          <DemoHighlight stepId="tab-safety-t" tooltip="Manage emergency drills and student safety procedures.">
            <div className="mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Safety & Drills</h2>
              <p className="text-muted-foreground mt-1">Manage emergency drills and student safety</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { type: "Fire Drill", last: "Jan 15", next: "Mar 1", status: "Completed" },
                { type: "Tornado Drill", last: "Dec 10", next: "Feb 28", status: "Upcoming" },
                { type: "Lockdown Drill", last: "Nov 20", next: "Mar 15", status: "Upcoming" },
              ].map((d) => (
                <Card key={d.type} variant="glass">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-primary" />
                        <h3 className="font-bold">{d.type}</h3>
                      </div>
                      <Badge variant={d.status === "Completed" ? "default" : "outline"}>{d.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Last: {d.last} • Next: {d.next}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DemoHighlight>
        </TabsContent>

        {/* Office Hours / Meeting Requests */}
        <TabsContent value="meeting-requests" className="mt-6">
          <DemoHighlight stepId="tab-office-hours-t" tooltip="Manage parent and student meeting requests. Set your availability and approve meeting slots.">
            <div className="mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Office Hours</h2>
              <p className="text-muted-foreground mt-1">Manage meeting requests from parents and students</p>
            </div>
            <div className="space-y-4">
              {[
                { parent: "Mrs. Martinez", student: "Liam Martinez", reason: "Discuss reading progress", date: "Feb 18, 3:00 PM", status: "Pending" },
                { parent: "Mr. Chen", student: "Sophia Chen", reason: "Advanced placement discussion", date: "Feb 19, 2:30 PM", status: "Approved" },
                { parent: "Mrs. Davis", student: "Ethan Davis", reason: "Behavior concerns", date: "Feb 20, 4:00 PM", status: "Pending" },
              ].map((m) => (
                <Card key={m.parent} variant="glass">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="font-bold">{m.parent}</p>
                      <p className="text-sm text-muted-foreground">Re: {m.student} — {m.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">{m.date}</p>
                    </div>
                    <div className="flex gap-2">
                      {m.status === "Pending" ? (
                        <>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">Approve</Button>
                          <Button size="sm" variant="outline">Decline</Button>
                        </>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Approved</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DemoHighlight>
        </TabsContent>

        {/* Announcements */}
        <TabsContent value="announcements" className="mt-6">
          <DemoHighlight stepId="tab-announcements-t" tooltip="Post announcements and share materials. Students see these updates on their Announcements tab.">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Announcements</h2>
              <Card variant="glass" className="border-dashed border-2">
                <CardContent className="p-5 flex items-center gap-4">
                  <Megaphone className="h-6 w-6 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Post an announcement to your class...</p>
                    <p className="text-xs text-muted-foreground">Share updates, materials, or reminders</p>
                  </div>
                  <Button size="sm">Post</Button>
                </CardContent>
              </Card>
              {[
                { title: "Chapter 6 Reading Assigned", body: "Read Chapter 6 and complete comprehension questions by Friday. Use the annotation guide I shared last week.", time: "Today, 9:15 AM" },
                { title: "Vocabulary Quiz Results", body: "Great work! Class average: 88%. Top scorers: Sophia (100%), Emma (96%), Noah (94%). Review incorrect answers in your gradebook.", time: "Yesterday, 2:30 PM" },
                { title: "Field Trip Reminder", body: "Museum trip is next Friday! 22 of 28 permission slips returned. Please remind students who haven't turned theirs in.", time: "2 days ago" },
              ].map((post) => (
                <Card key={post.title} variant="glass">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold">{post.title}</p>
                      <span className="text-xs text-muted-foreground">{post.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{post.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DemoHighlight>
        </TabsContent>

        {/* Assignments */}
        <TabsContent value="assignments" className="mt-6">
          <DemoHighlight stepId="tab-assignments-t" tooltip="Create and manage assignments. Track submissions — see who's turned in, who's late, and grade everything from here.">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Assignments</h2>
                <Button className="bg-gradient-to-r from-primary to-primary/60 hover:opacity-90 text-white"><FileText className="mr-2 h-4 w-4" /> Create Assignment</Button>
              </div>
              {[
                { title: "Chapter 6 Reading Comprehension", due: "Feb 21", submitted: 0, total: 28, status: "Active", type: "Reading" },
                { title: "Vocabulary Week 12", due: "Feb 19", submitted: 15, total: 28, status: "Active", type: "Quiz" },
                { title: "Chapter 5 Comprehension", due: "Feb 14", submitted: 28, total: 28, status: "Graded", type: "Reading", avgGrade: "87%" },
                { title: "Creative Writing: My Hero", due: "Feb 12", submitted: 28, total: 28, status: "Graded", type: "Essay", avgGrade: "82%" },
              ].map((a) => (
                <Card key={a.title} variant="glass" className="hover-lift cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center",
                        a.status === "Graded" ? "bg-green-100" : "bg-blue-100"
                      )}>
                        {a.status === "Graded" ? <CheckCircle className="h-5 w-5 text-green-600" /> : <FileText className="h-5 w-5 text-blue-600" />}
                      </div>
                      <div>
                        <p className="font-semibold">{a.title}</p>
                        <p className="text-xs text-muted-foreground">Due {a.due} • {a.type}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium">{a.submitted}/{a.total} submitted</p>
                      {a.avgGrade && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Avg: {a.avgGrade}</Badge>}
                      {a.status === "Active" && a.submitted < a.total && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">{a.total - a.submitted} pending</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DemoHighlight>
        </TabsContent>

        {/* Discussions */}
        <TabsContent value="discussions" className="mt-6">
          <DemoHighlight stepId="tab-discussions-t" tooltip="Create discussion topics and moderate student conversations.">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Discussions</h2>
                <Button><Plus className="mr-2 h-4 w-4" /> New Discussion</Button>
              </div>
              {[
                { title: "What makes a good hero?", replies: 18, lastActivity: "2 hours ago" },
                { title: "Chapter 5 — Favorite character and why?", replies: 24, lastActivity: "Yesterday" },
                { title: "Weekend reading recommendations", replies: 12, lastActivity: "3 days ago" },
              ].map((d) => (
                <Card key={d.title} variant="glass" className="hover-lift cursor-pointer">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="font-bold">{d.title}</p>
                      <p className="text-sm text-muted-foreground">{d.replies} replies • Last activity {d.lastActivity}</p>
                    </div>
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </DemoHighlight>
        </TabsContent>

        {/* Study Materials */}
        <TabsContent value="study" className="mt-6">
          <DemoHighlight stepId="tab-study-t" tooltip="Manage flashcard sets for your students. Generate flashcards from question groups.">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Study Materials</h2>
                  <p className="text-muted-foreground">Manage flashcard sets for your students</p>
                </div>
                <Button className="bg-gradient-to-r from-primary to-primary/60 text-white"><Plus className="mr-2 h-4 w-4" /> Create Flashcards</Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "Ch. 5 Vocabulary", cards: 20, subject: "ELA", posted: true },
                  { title: "Literary Devices", cards: 15, subject: "ELA", posted: true },
                  { title: "Ch. 6 Key Terms", cards: 12, subject: "ELA", posted: false },
                ].map((s) => (
                  <Card key={s.title} className="shadow-card hover:shadow-elegant transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{s.title}</CardTitle>
                        <Badge variant={s.posted ? "default" : "secondary"}>{s.posted ? "Posted" : "Draft"}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant="secondary">{s.subject}</Badge>
                        <p className="text-sm text-muted-foreground"><strong>{s.cards}</strong> flashcards</p>
                        <Button className="w-full" variant="outline"><Play className="mr-2 h-4 w-4" /> Preview</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </DemoHighlight>
        </TabsContent>

        {/* Study Games / Tournaments */}
        <TabsContent value="tournaments" className="mt-6">
          <DemoHighlight stepId="tab-tournaments-t" tooltip="Create and manage educational games and tournaments for your students.">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Study Games</h2>
                <Button className="bg-gradient-to-r from-primary to-primary/60 hover:opacity-90 text-white"><Trophy className="mr-2 h-4 w-4" /> Assign Game</Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: "Vocab Battle Week 12", game: "Jeopardy Duel", status: "In Progress", created: "Feb 14" },
                  { name: "Chapter 5 Review", game: "Trivia Rush", status: "Completed", created: "Feb 10" },
                ].map((t) => (
                  <Card key={t.name} className="shadow-card hover:shadow-elegant transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{t.name}</CardTitle>
                        <Badge variant={t.status === "Completed" ? "secondary" : "default"}>{t.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{t.game}</p>
                      <p className="text-xs text-muted-foreground mt-1">Created {t.created}</p>
                      <Button variant="outline" className="w-full mt-4"><Play className="mr-2 h-4 w-4" /> Control Tournament</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </DemoHighlight>
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard" className="mt-6">
          <DemoHighlight stepId="tab-leaderboard-t" tooltip="Track student performance with reading stars and class rankings.">
            <div className="mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Class Leaderboard</h2>
              <p className="text-muted-foreground mt-1">Track student performance and achievements</p>
            </div>
            <Card variant="glass">
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Rank</th>
                      <th className="text-left p-4 font-medium">Student</th>
                      <th className="text-left p-4 font-medium">Avg Grade</th>
                      <th className="text-left p-4 font-medium">Games Won</th>
                      <th className="text-left p-4 font-medium">AURA</th>
                      <th className="text-left p-4 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { rank: "🥇", name: "Sophia Chen", avg: "96%", games: 12, aura: 95, total: 520 },
                      { rank: "🥈", name: "Emma Johnson", avg: "91%", games: 10, aura: 82, total: 470 },
                      { rank: "🥉", name: "Noah Williams", avg: "85%", games: 9, aura: 75, total: 410 },
                      { rank: "4", name: "Olivia Brown", avg: "89%", games: 7, aura: 80, total: 400 },
                    ].map((s) => (
                      <tr key={s.name} className="border-t border-border hover:bg-muted/30">
                        <td className="p-4 text-lg">{s.rank}</td>
                        <td className="p-4 font-medium">{s.name}</td>
                        <td className="p-4">{s.avg}</td>
                        <td className="p-4">{s.games}</td>
                        <td className="p-4">{s.aura}</td>
                        <td className="p-4 font-bold">{s.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </DemoHighlight>
        </TabsContent>

        {/* Rubrics */}
        <TabsContent value="rubrics" className="mt-6">
          <DemoHighlight stepId="tab-rubrics-t" tooltip="Create and manage grading rubrics. Attach to assignments for consistent grading.">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Rubrics</h2>
                <Button><Plus className="mr-2 h-4 w-4" /> Create Rubric</Button>
              </div>
              {[
                { title: "Essay Writing Rubric", criteria: 5, assignments: 2 },
                { title: "Reading Comprehension Rubric", criteria: 4, assignments: 3 },
              ].map((r) => (
                <Card key={r.title} variant="glass" className="hover-lift cursor-pointer">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="font-bold">{r.title}</p>
                      <p className="text-sm text-muted-foreground">{r.criteria} criteria • Used in {r.assignments} assignments</p>
                    </div>
                    <Grid3X3 className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </DemoHighlight>
        </TabsContent>

        {/* AI Insights */}
        <TabsContent value="ai-insights" className="mt-6">
          <DemoHighlight stepId="tab-ai-insights-t" tooltip="AI-powered classroom analytics — reading trends, at-risk flags, and personalized recommendations.">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">AI Insights</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card variant="glass">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <h3 className="font-bold">At-Risk Students (3)</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Liam Martinez, Ethan Davis, and Maya Wilson are showing declining reading fluency scores.</p>
                    <Button variant="outline" className="mt-3" size="sm">View Details</Button>
                  </CardContent>
                </Card>
                <Card variant="glass">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <h3 className="font-bold">Class Improvement</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Overall class reading level improved by +12% this month. Vocabulary scores up 8% on average.</p>
                  </CardContent>
                </Card>
                <Card variant="glass">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Brain className="h-5 w-5 text-primary" />
                      <h3 className="font-bold">Recommendations</h3>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Assign targeted phonics exercises for at-risk group</li>
                      <li>• Consider advanced reading for top 5 students</li>
                      <li>• Schedule parent conferences for declining students</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card variant="glass">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <BarChart3 className="h-5 w-5 text-amber-500" />
                      <h3 className="font-bold">Reading Analytics</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Class average: 142 WPM (above grade level). Accuracy: 94%. Comprehension: 87%.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DemoHighlight>
        </TabsContent>

        {/* Behavior */}
        <TabsContent value="behavior" className="mt-6">
          <DemoHighlight stepId="tab-behavior-t" tooltip="Track and reward student behavior with positive and negative points.">
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Behavior Tracking</h2>
                <p className="text-muted-foreground mt-1">Track and reward student behavior</p>
              </div>
              {[
                { name: "Sophia Chen", points: 42, trend: "+5 this week" },
                { name: "Emma Johnson", points: 38, trend: "+3 this week" },
                { name: "Noah Williams", points: 30, trend: "+1 this week" },
                { name: "Liam Martinez", points: 18, trend: "-2 this week" },
              ].map((s) => (
                <Card key={s.name} variant="glass">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.trend}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold">{s.points}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600">+</Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600">−</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DemoHighlight>
        </TabsContent>

        {/* Journal */}
        <TabsContent value="journal" className="mt-6">
          <DemoHighlight stepId="tab-journal-t" tooltip="Keep a private teaching journal — reflect on lessons and plan improvements.">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Teaching Journal</h2>
                <Button><Plus className="mr-2 h-4 w-4" /> New Entry</Button>
              </div>
              {[
                { date: "Feb 16", title: "Great discussion today", excerpt: "Students were really engaged with the hero analysis. Sophia made an excellent point about..." },
                { date: "Feb 14", title: "Vocab quiz reflection", excerpt: "Class average was higher than expected. Need to challenge top students more. Consider..." },
                { date: "Feb 12", title: "Liam struggling with reading", excerpt: "Met with Liam after class. He seems frustrated with chapter 5. Will try paired reading..." },
              ].map((j) => (
                <Card key={j.date} variant="glass" className="hover-lift cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold">{j.title}</p>
                      <span className="text-xs text-muted-foreground">{j.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{j.excerpt}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DemoHighlight>
        </TabsContent>

        {/* Grades */}
        <TabsContent value="grades" className="mt-6">
          <DemoHighlight stepId="tab-grades-t" tooltip="View the class gradebook with all assignments, scores, and averages.">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Gradebook</h2>
              <Card variant="glass">
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Student</th>
                        <th className="text-left p-4 font-medium">Ch5 Comp.</th>
                        <th className="text-left p-4 font-medium">Vocab W11</th>
                        <th className="text-left p-4 font-medium">Essay</th>
                        <th className="text-left p-4 font-medium">Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Sophia Chen", g1: 98, g2: 100, g3: 95, avg: "96%" },
                        { name: "Emma Johnson", g1: 92, g2: 88, g3: 90, avg: "91%" },
                        { name: "Noah Williams", g1: 85, g2: 82, g3: 88, avg: "85%" },
                        { name: "Liam Martinez", g1: 70, g2: 68, g3: 75, avg: "72%" },
                        { name: "Olivia Brown", g1: 90, g2: 86, g3: 91, avg: "89%" },
                      ].map((s) => (
                        <tr key={s.name} className="border-t border-border hover:bg-muted/30">
                          <td className="p-4 font-medium">{s.name}</td>
                          <td className="p-4">{s.g1}</td>
                          <td className="p-4">{s.g2}</td>
                          <td className="p-4">{s.g3}</td>
                          <td className="p-4 font-bold">{s.avg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </DemoHighlight>
        </TabsContent>

        {/* Calendar */}
        <TabsContent value="calendar" className="mt-6">
          <DemoHighlight stepId="tab-calendar-t" tooltip="View upcoming assignment deadlines and class events.">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Class Calendar</h2>
                  <p className="text-muted-foreground">View upcoming assignments and events for this class</p>
                </div>
              </div>
              <Card className="p-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    Upcoming Deadlines
                  </h3>
                  <div className="space-y-3">
                    {[
                      { title: "Chapter 6 Reading Comprehension", due: "Feb 21", cat: "Reading" },
                      { title: "Vocabulary Week 12", due: "Feb 19", cat: "Quiz" },
                      { title: "Creative Writing: My Superpower", due: "Feb 26", cat: "Essay" },
                    ].map((a) => (
                      <div key={a.title} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{a.title}</p>
                            <p className="text-xs text-muted-foreground">{a.cat}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{a.due}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </DemoHighlight>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ── Expanded Teacher Calendar ──
const TeacherCalendarTab = () => {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const monthName = today.toLocaleString("default", { month: "long", year: "numeric" });

  const eventDays: Record<number, { title: string; color: string }[]> = {
    17: [{ title: "Ch6 Due", color: "bg-red-500" }],
    18: [{ title: "Conferences", color: "bg-blue-500" }],
    19: [{ title: "Grading Ends", color: "bg-purple-500" }],
    20: [{ title: "Science Fair", color: "bg-amber-500" }],
    22: [{ title: "Benchmark", color: "bg-green-500" }],
    24: [{ title: "Staff Meeting", color: "bg-blue-500" }],
    26: [{ title: "PD Day", color: "bg-purple-500" }],
  };

  return (
    <div className="space-y-6">
      <DemoHighlight stepId="calendar-tab" tooltip="All deadlines, events, and conferences in one view. Color-coded by type for quick scanning.">
        <h2 className="text-2xl font-bold">Calendar</h2>
      </DemoHighlight>

      <DemoHighlight stepId="calendar-month-t" tooltip="Monthly grid view — days with events show colored dots. Hover over any day for event details.">
        <Card variant="glass">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4 text-center">{monthName}</h3>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = day === today.getDate();
                const events = eventDays[day];
                return (
                  <div key={day} className={cn(
                    "aspect-square flex flex-col items-center justify-center rounded-lg text-sm cursor-pointer hover:bg-muted/50 transition-colors",
                    isToday && "bg-primary text-primary-foreground font-bold ring-2 ring-primary/30",
                    events && !isToday && "font-semibold"
                  )}>
                    <span>{day}</span>
                    {events && (
                      <div className="flex gap-0.5 mt-0.5">
                        {events.slice(0, 3).map((e, idx) => (
                          <div key={idx} className={cn("w-1.5 h-1.5 rounded-full", e.color)} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Deadlines</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Meetings</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Events</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> Admin</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> Assessments</span>
            </div>
          </CardContent>
        </Card>
      </DemoHighlight>

      <DemoHighlight stepId="calendar-upcoming-t" tooltip="Chronological list of upcoming deadlines, conferences, grading periods, and staff meetings.">
        <h3 className="font-bold text-lg">Upcoming</h3>
        <div className="space-y-3 mt-3">
          {[
            { date: "Feb 17", event: "Chapter 6 Assignment Due", type: "Deadline", color: "border-l-red-500" },
            { date: "Feb 18", event: "Parent-Teacher Conferences", type: "Event", color: "border-l-blue-500" },
            { date: "Feb 19", event: "Grading Period Ends", type: "Admin", color: "border-l-purple-500" },
            { date: "Feb 20", event: "Science Fair Judging", type: "Event", color: "border-l-amber-500" },
            { date: "Feb 22", event: "Reading Benchmark Period Opens", type: "Assessment", color: "border-l-green-500" },
            { date: "Feb 24", event: "Staff Meeting 3:30 PM", type: "Meeting", color: "border-l-blue-500" },
            { date: "Feb 26", event: "Professional Development Day", type: "Admin", color: "border-l-purple-500" },
          ].map((e) => (
            <Card key={e.event} variant="glass" className={`hover-lift cursor-pointer border-l-4 ${e.color}`}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="text-center min-w-[50px]"><p className="text-xs text-muted-foreground">{e.date.split(" ")[0]}</p><p className="text-xl font-black">{e.date.split(" ")[1]}</p></div>
                <div className="flex-1"><p className="font-medium">{e.event}</p></div>
                <Badge variant="outline" className="text-xs">{e.type}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </DemoHighlight>
    </div>
  );
};

const TeacherDemo = () => {
  const [currentTab, setCurrentTab] = useState("classrooms");
  const [openClassroom, setOpenClassroom] = useState<string | null>(null);
  const [activeClassTab, setActiveClassTab] = useState<string>("students");

  // Map step IDs to their required tab / classroom state
  const classroomTabStepIds = Object.values(tabToStepId);
  const stepToClassTab: Record<string, string> = {};
  for (const [tabId, stepId] of Object.entries(tabToStepId)) {
    stepToClassTab[stepId] = tabId;
  }

  const stepsWithActions = tourSteps.map((step) => {
    const tabMap: Record<string, string> = {
      classrooms: "classrooms", "create-classroom": "classrooms",
      "classroom-header-t": "classrooms",
      "quick-actions-t": "classrooms",
      "links-tab": "links",
      "calendar-tab": "calendar",
      "calendar-month-t": "calendar",
      "calendar-upcoming-t": "calendar",
      "directory-tab": "directory",
      "actions-tab": "actions",
    };
    // All classroom tab steps go to "classrooms" main tab
    if (classroomTabStepIds.includes(step.id)) {
      tabMap[step.id] = "classrooms";
    }

    const classroomDetailSteps = ["classroom-header-t", "quick-actions-t", ...classroomTabStepIds];

    return {
      ...step,
      action: tabMap[step.id] ? () => {
        setCurrentTab(tabMap[step.id]);
        if (classroomDetailSteps.includes(step.id)) {
          setOpenClassroom("5th Grade ELA – Period 1");
          // Set the active classroom tab if this is a tab-specific step
          if (stepToClassTab[step.id]) {
            setActiveClassTab(stepToClassTab[step.id]);
          }
        } else if (step.id === "classrooms" || step.id === "create-classroom") {
          setOpenClassroom(null);
        }
      } : undefined,
    };
  });

  return (
    <DemoTourProvider steps={stepsWithActions}>
      <div className="min-h-screen flex flex-col bg-background">
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/demos"><Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="h-4 w-4" /> Back to Demos</Button></Link>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Interactive Teacher Demo</Badge>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">Click tabs and cards to explore • Use the guided tour</p>
        </div>

        <Header showAuthButtons={false} />

        <main className="flex-1 py-8 animate-fade-in">
          <div className="container mx-auto px-4 pb-32">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-[#9B6DD6] to-[#D4A04A] bg-clip-text text-transparent">
                Welcome, Demo Teacher! <span className="text-[#9B6DD6]">👋</span>
              </h1>
              <p className="text-muted-foreground text-lg">Here's your classroom at a glance</p>
            </div>

            <DemoHighlight stepId="ai-insights-banner" tooltip="AI analyzes student reading data, grades, and engagement to surface actionable insights automatically.">
              <Card className="mb-8 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
                      <Brain className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">AI-Powered Insights</h3>
                        <Badge className="bg-amber-400 text-amber-900 hover:bg-amber-400 border-0"><Sparkles className="h-3 w-3 mr-1" /> New</Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">3 students are flagged as at-risk in reading fluency. 2 assignments need grading. Overall class improvement: +12% this month.</p>
                      <div className="flex flex-wrap gap-3">
                        <Button className="bg-primary hover:bg-primary/90 text-white"><BarChart3 className="h-4 w-4 mr-2" /> View Analytics</Button>
                        <Button variant="outline" className="bg-card hover:bg-muted"><AlertCircle className="h-4 w-4 mr-2" /> At-Risk Students (3)</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DemoHighlight>

            <DemoHighlight stepId="stats" tooltip="Quick overview of your teaching load — classrooms, enrolled students, and active assignments across all classes.">
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                  { label: "Total Classrooms", value: "3", icon: Users, note: "↗ Active", color: "text-primary" },
                  { label: "Total Students", value: "82", icon: BookOpen, note: "↗ Enrolled", color: "bg-gradient-to-b from-[#9B6DD6] to-[#D4A04A] bg-clip-text text-transparent" },
                  { label: "Active Assignments", value: "12", icon: Brain, note: "ML-Powered", color: "text-primary" },
                ].map((s) => (
                  <Card key={s.label} className="bg-card border shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center"><s.icon className="h-5 w-5 text-amber-500" /></div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-black ${s.color}`}>{s.value}</span>
                        <span className="text-sm text-emerald-500 font-medium">{s.note}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DemoHighlight>

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="flex flex-wrap justify-center w-full h-auto p-2 bg-muted/50 rounded-xl gap-2">
                <TabsTrigger value="classrooms" className={liquidGlassTabClass} onClick={() => setOpenClassroom(null)}><Users className="h-4 w-4 mr-2" /> Classrooms</TabsTrigger>
                <TabsTrigger value="links" className={liquidGlassTabClass}><LinkIcon className="h-4 w-4 mr-2" /> Links</TabsTrigger>
                <TabsTrigger value="calendar" className={liquidGlassTabClass}><CalendarIcon className="h-4 w-4 mr-2" /> Calendar</TabsTrigger>
                <TabsTrigger value="directory" className={liquidGlassTabClass}><Users className="h-4 w-4 mr-2" /> Directory</TabsTrigger>
                <TabsTrigger value="actions" className={liquidGlassTabClass}><BookOpen className="h-4 w-4 mr-2" /> Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="classrooms" className="mt-6 space-y-8">
                {openClassroom ? (
                  <TeacherClassroomDetail
                    classroomName={openClassroom}
                    onBack={() => setOpenClassroom(null)}
                    activeClassTab={activeClassTab}
                    onClassTabChange={setActiveClassTab}
                  />
                ) : (
                  <DemoHighlight stepId="classrooms" tooltip="Each card shows a classroom with its join code, student count, and assignments. Click 'View Classroom' to manage it.">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">My Classrooms</h2>
                        <DemoHighlight stepId="create-classroom" tooltip="Create a new classroom with a name, subject, and auto-generated join code. Students enter the code to join instantly.">
                          <Button className="bg-gradient-to-r from-primary to-primary/60 hover:opacity-90 text-white"><PlusCircle className="mr-2 h-4 w-4" /> Create Classroom</Button>
                        </DemoHighlight>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                          { name: "5th Grade ELA – Period 1", students: 28, code: "ABC-123", assignments: 4, pending: 12 },
                          { name: "5th Grade ELA – Period 3", students: 26, code: "DEF-456", assignments: 4, pending: 8 },
                          { name: "5th Grade ELA – Period 5", students: 28, code: "GHI-789", assignments: 4, pending: 15 },
                        ].map((c) => (
                          <Card key={c.name} className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50" onClick={() => { setOpenClassroom(c.name); setActiveClassTab("students"); }}>
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                  <GraduationCap className="h-6 w-6 text-white" />
                                </div>
                                <Badge variant="outline" className="text-xs font-mono">{c.code}</Badge>
                              </div>
                              <h3 className="text-lg font-bold mb-2">{c.name}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.students} students</span>
                                <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {c.assignments} assignments</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm mb-4">
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">{c.pending} ungraded</Badge>
                              </div>
                              <Button size="sm" variant="outline" className="w-full"><Eye className="h-4 w-4 mr-1" /> View Classroom</Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </DemoHighlight>
                )}
              </TabsContent>

              <TabsContent value="links" className="mt-6">
                <DemoHighlight stepId="links-tab" tooltip="Organize and share educational resources. Add links to websites, tools, and documents for your students.">
                  <h2 className="text-2xl font-bold mb-4">Links & Resources</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { name: "ReadTheory", desc: "Adaptive reading comprehension", emoji: "📖" },
                      { name: "IXL Learning", desc: "Personalized math practice", emoji: "🔢" },
                      { name: "Newsela", desc: "Current events at reading level", emoji: "📰" },
                      { name: "Google Classroom", desc: "Shared class materials", emoji: "📋" },
                      { name: "Scholastic Book Orders", desc: "Monthly book orders", emoji: "📚" },
                      { name: "Parent Communication Portal", desc: "Send messages to parents", emoji: "✉️" },
                    ].map((link) => (
                      <Card key={link.name} variant="glass" className="hover-lift cursor-pointer">
                        <CardContent className="p-4 flex items-center gap-4">
                          <span className="text-2xl">{link.emoji}</span>
                          <div className="flex-1"><p className="font-semibold">{link.name}</p><p className="text-xs text-muted-foreground">{link.desc}</p></div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Button variant="outline" className="mt-4"><PlusCircle className="h-4 w-4 mr-2" /> Add Resource</Button>
                </DemoHighlight>
              </TabsContent>

              <TabsContent value="calendar" className="mt-6 space-y-4">
                <TeacherCalendarTab />
              </TabsContent>

              <TabsContent value="directory" className="mt-6">
                <DemoHighlight stepId="directory-tab" tooltip="Find any student, parent, or staff member. View contact info, class enrollment, and communication history.">
                  <h2 className="text-2xl font-bold mb-4">Directory</h2>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-muted-foreground">My Students</h3>
                    {[
                      { name: "Emma Johnson", grade: "5th", class: "Period 1", reading: "4.8", status: "On Track" },
                      { name: "Liam Martinez", grade: "5th", class: "Period 1", reading: "3.2", status: "At Risk" },
                      { name: "Sophia Chen", grade: "5th", class: "Period 3", reading: "5.5", status: "Advanced" },
                      { name: "Noah Williams", grade: "5th", class: "Period 5", reading: "4.1", status: "On Track" },
                    ].map((s) => (
                      <Card key={s.name} variant="glass" className="hover-lift">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"><span className="text-sm font-bold text-white">{s.name[0]}{s.name.split(" ")[1]?.[0]}</span></div>
                            <div>
                              <p className="font-semibold">{s.name}</p>
                              <p className="text-xs text-muted-foreground">{s.grade} Grade • {s.class} • Reading Level: {s.reading}</p>
                            </div>
                          </div>
                          <Badge className={s.status === "At Risk" ? "bg-red-100 text-red-700 hover:bg-red-100" : s.status === "Advanced" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-blue-100 text-blue-700 hover:bg-blue-100"} >{s.status}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DemoHighlight>
              </TabsContent>

              <TabsContent value="actions" className="mt-6 space-y-4">
                <DemoHighlight stepId="actions-tab" tooltip="Quick access to teacher power tools — browse study games, manage the story library, view AURA analytics, and organize your resources.">
                  <div className="grid md:grid-cols-2 gap-6">
                    {[
                      { icon: Sparkles, title: "Browse Games", desc: "Explore educational games for your classroom", color: "from-purple-500 to-violet-500", btn: "View Games" },
                      { icon: BarChart3, title: "AURA Analytics", desc: "Track student pronunciation with AI", color: "from-amber-500 to-orange-500", btn: "View Analytics" },
                      { icon: BookOpen, title: "Story Library", desc: "Create & manage reading stories", color: "from-orange-500 to-red-500", btn: "Manage Stories" },
                      { icon: Sparkles, title: "Resources", desc: "Save and organize your personal teaching resources", color: "from-indigo-500 to-purple-500", btn: "View Resources" },
                    ].map((action) => (
                      <Card key={action.title} className="hover:shadow-lg transition-all cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0`}>
                              <action.icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{action.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{action.desc}</p>
                              <Button size="sm" variant="outline" className="mt-3">{action.btn} <ChevronRight className="h-3 w-3 ml-1" /></Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DemoHighlight>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>
    </DemoTourProvider>
  );
};

export default TeacherDemo;
