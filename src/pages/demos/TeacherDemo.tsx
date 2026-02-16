import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Users, BookOpen, Brain, Calendar as CalendarIcon,
  PlusCircle, Sparkles, BarChart3, AlertCircle, Link as LinkIcon, Eye,
  GraduationCap, ChevronRight, ChevronLeft, Clock, FileText, CheckCircle, Star,
  Settings, MessageSquare, Upload, ExternalLink, Bell, Megaphone, Award,
  ClipboardList, TrendingUp, UserCheck
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
  { id: "ai-insights", title: "AI-Powered Insights", description: "Real-time analytics powered by machine learning. Identify at-risk students, track reading progress, and get actionable recommendations." },
  { id: "stats", title: "Dashboard Stats", description: "See your classrooms, total students, and active assignments at a glance. Click any card for detailed views." },
  { id: "classrooms", title: "My Classrooms", description: "All your class sections in one place. Click a classroom to manage assignments, view student progress, and post announcements." },
  { id: "create-classroom", title: "Create Classroom", description: "Set up a new class with a unique join code. Students can join instantly by entering the code." },
  // Classroom detail steps
  { id: "classroom-detail", title: "Inside a Classroom", description: "This is the classroom management view. Use tabs for Stream, Assignments, Students, Attendance, Behavior, and Leaderboard." },
  { id: "classroom-stream-t", title: "Class Stream (Teacher)", description: "Post announcements, share materials, and communicate with your students. Students see updates here in real time." },
  { id: "classroom-assignments-t", title: "Manage Assignments", description: "Create, edit, and grade assignments. See submission status at a glance — who's turned in, who's late, who hasn't started." },
  { id: "classroom-students-t", title: "Student Roster", description: "View all enrolled students, their reading levels, grades, and at-risk status. Click any student for a detailed profile." },
  { id: "classroom-attendance-t", title: "Attendance Tracking", description: "Take daily attendance with one click per student. View attendance history and patterns over time." },
  // Back to main tabs
  { id: "links-tab", title: "Links & Resources", description: "Organize educational resources, tools, and websites for quick access. Share links with students." },
  // Calendar steps
  { id: "calendar-tab", title: "Calendar Overview", description: "View assignment deadlines, school events, parent-teacher conferences, and benchmark periods." },
  { id: "calendar-month-t", title: "Monthly Calendar", description: "See all your events at a glance. Color-coded dots show deadlines, meetings, and school events." },
  { id: "calendar-upcoming-t", title: "Upcoming Schedule", description: "A chronological list of everything coming up — deadlines, conferences, grading periods, and staff meetings." },
  // Remaining tabs
  { id: "directory-tab", title: "Directory", description: "Search for students, parents, and staff. View contact info and class rosters." },
  { id: "actions-tab", title: "Teacher Tools", description: "Access study games, story library, AURA analytics, and AI model training from one place." },
];

// ── Classroom Detail (Teacher View) ──
const TeacherClassroomDetail = ({ classroomName, onBack }: { classroomName: string; onBack: () => void }) => {
  const [classTab, setClassTab] = useState("stream");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1"><ChevronLeft className="h-4 w-4" /> Back to Classrooms</Button>
        <h2 className="text-2xl font-bold">{classroomName}</h2>
        <Badge variant="outline" className="font-mono text-xs">ABC-123</Badge>
      </div>

      <DemoHighlight stepId="classroom-detail" tooltip="Manage everything for this class — announcements, assignments, student roster, attendance, and behavior tracking.">
        <Tabs value={classTab} onValueChange={setClassTab}>
          <TabsList className="bg-muted/50 rounded-xl p-1.5 gap-1 flex-wrap">
            <TabsTrigger value="stream" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Stream</TabsTrigger>
            <TabsTrigger value="assignments" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Assignments</TabsTrigger>
            <TabsTrigger value="students" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Students</TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Attendance</TabsTrigger>
            <TabsTrigger value="behavior" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Behavior</TabsTrigger>
            <TabsTrigger value="leaderboard" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="stream" className="mt-4">
            <DemoHighlight stepId="classroom-stream-t" tooltip="Post announcements and share materials. Students see these updates on their class Stream tab.">
              <div className="space-y-4">
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

          <TabsContent value="assignments" className="mt-4">
            <DemoHighlight stepId="classroom-assignments-t" tooltip="Create and manage assignments. Track submissions — see who's turned in, who's late, and grade everything from here.">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Assignments</h3>
                  <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Create Assignment</Button>
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

          <TabsContent value="students" className="mt-4">
            <DemoHighlight stepId="classroom-students-t" tooltip="Full student roster with reading levels, grade averages, and risk flags. Click any student for their detailed profile.">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Students (28)</h3>
                  <Button size="sm" variant="outline"><UserCheck className="h-4 w-4 mr-1" /> Manage Roster</Button>
                </div>
                {[
                  { name: "Sophia Chen", reading: "5.5", avg: "96%", status: "Advanced", avatar: "SC" },
                  { name: "Emma Johnson", reading: "4.8", avg: "91%", status: "On Track", avatar: "EJ" },
                  { name: "Noah Williams", reading: "4.1", avg: "85%", status: "On Track", avatar: "NW" },
                  { name: "Liam Martinez", reading: "3.2", avg: "72%", status: "At Risk", avatar: "LM" },
                  { name: "Olivia Brown", reading: "4.5", avg: "89%", status: "On Track", avatar: "OB" },
                  { name: "Ethan Davis", reading: "3.0", avg: "68%", status: "At Risk", avatar: "ED" },
                ].map((s) => (
                  <Card key={s.name} variant="glass" className="hover-lift cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">{s.avatar}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{s.name}</p>
                          <p className="text-xs text-muted-foreground">Reading Level: {s.reading} • Avg: {s.avg}</p>
                        </div>
                      </div>
                      <Badge className={
                        s.status === "At Risk" ? "bg-red-100 text-red-700 hover:bg-red-100" :
                        s.status === "Advanced" ? "bg-green-100 text-green-700 hover:bg-green-100" :
                        "bg-blue-100 text-blue-700 hover:bg-blue-100"
                      }>{s.status}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DemoHighlight>
          </TabsContent>

          <TabsContent value="attendance" className="mt-4">
            <DemoHighlight stepId="classroom-attendance-t" tooltip="Take attendance with one click per student. Green = present, yellow = late, red = absent.">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Attendance — Today</h3>
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

          <TabsContent value="behavior" className="mt-4">
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Behavior Points</h3>
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
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-4">
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
          </TabsContent>
        </Tabs>
      </DemoHighlight>
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

  const stepsWithActions = tourSteps.map((step) => {
    const tabMap: Record<string, string> = {
      classrooms: "classrooms", "create-classroom": "classrooms",
      "classroom-detail": "classrooms",
      "classroom-stream-t": "classrooms",
      "classroom-assignments-t": "classrooms",
      "classroom-students-t": "classrooms",
      "classroom-attendance-t": "classrooms",
      "links-tab": "links",
      "calendar-tab": "calendar",
      "calendar-month-t": "calendar",
      "calendar-upcoming-t": "calendar",
      "directory-tab": "directory",
      "actions-tab": "actions",
    };
    const classroomSteps = ["classroom-detail", "classroom-stream-t", "classroom-assignments-t", "classroom-students-t", "classroom-attendance-t"];
    return {
      ...step,
      action: tabMap[step.id] ? () => {
        setCurrentTab(tabMap[step.id]);
        if (classroomSteps.includes(step.id)) {
          setOpenClassroom("5th Grade ELA – Period 1");
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

            <DemoHighlight stepId="ai-insights" tooltip="AI analyzes student reading data, grades, and engagement to surface actionable insights automatically.">
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
                  <TeacherClassroomDetail classroomName={openClassroom} onBack={() => setOpenClassroom(null)} />
                ) : (
                  <DemoHighlight stepId="classrooms" tooltip="Each card shows a classroom with its join code, student count, and assignments. Click 'View Classroom' to manage it.">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">My Classrooms</h2>
                        <DemoHighlight stepId="create-classroom" tooltip="Create a new classroom with a name, subject, and auto-generated join code. Students enter the code to join instantly.">
                          <Button className="bg-gradient-primary hover:opacity-90"><PlusCircle className="mr-2 h-4 w-4" /> Create Classroom</Button>
                        </DemoHighlight>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                          { name: "5th Grade ELA – Period 1", students: 28, code: "ABC-123", assignments: 4, pending: 12 },
                          { name: "5th Grade ELA – Period 3", students: 26, code: "DEF-456", assignments: 4, pending: 8 },
                          { name: "5th Grade ELA – Period 5", students: 28, code: "GHI-789", assignments: 4, pending: 15 },
                        ].map((c) => (
                          <Card key={c.name} className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50" onClick={() => setOpenClassroom(c.name)}>
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
                <DemoHighlight stepId="actions-tab" tooltip="Quick access to teacher power tools — browse study games, manage the story library, view AURA analytics, and configure AI models.">
                  <div className="grid md:grid-cols-2 gap-6">
                    {[
                      { icon: Sparkles, title: "Browse Games", desc: "Explore educational games to assign to students. Preview games before sharing them.", color: "from-indigo-500 to-violet-500" },
                      { icon: BookOpen, title: "Story Library", desc: "Manage reading passages. Upload custom texts or choose from the built-in library.", color: "from-emerald-500 to-teal-500" },
                      { icon: BarChart3, title: "AURA Analytics", desc: "View class-wide reading trends: WPM, accuracy, fluency scores, and pronunciation patterns.", color: "from-amber-500 to-orange-500" },
                      { icon: Brain, title: "ML Model Training", desc: "Configure AI models for personalized learning paths and automated grading.", color: "from-purple-500 to-pink-500" },
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
                              <Button size="sm" variant="outline" className="mt-3">Open <ChevronRight className="h-3 w-3 ml-1" /></Button>
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
