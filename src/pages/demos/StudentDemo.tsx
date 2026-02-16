import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Home, Calendar, BookOpen, Users, Bell, GraduationCap, FolderOpen, User, 
  Gamepad2, Shield, Sparkles, BookOpenCheck, ArrowLeft, CheckCircle, Trophy, 
  Target, Flame, Menu, AlertCircle, Link as LinkIcon, Clock, Star, MapPin,
  MessageSquare, Phone, Mail, ExternalLink, UserCircle, Settings, Award,
  ChevronLeft, FileText, BarChart3, Play, Megaphone, Grid3X3, BookHeart,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { DemoTourProvider, TourStep } from "@/components/demos/DemoTourGuide";
import { DemoHighlight } from "@/components/demos/DemoHighlight";
import { liquidGlassTabClass } from "@/components/ui/liquid-glass-button";

const sections = [
  { id: "home", label: "Home", icon: Home, color: "from-violet-500 to-purple-600" },
  { id: "today", label: "Today", icon: Calendar, color: "from-blue-500 to-cyan-500" },
  { id: "courses", label: "Courses", icon: BookOpen, color: "from-emerald-500 to-teal-500" },
  { id: "clubs", label: "Clubs", icon: Users, color: "from-pink-500 to-rose-500" },
  { id: "calendar", label: "Calendar", icon: Calendar, color: "from-amber-500 to-orange-500" },
  { id: "announcements", label: "Announcements", icon: Bell, color: "from-red-500 to-pink-500" },
  { id: "study-games", label: "Study Games", icon: Gamepad2, color: "from-indigo-500 to-violet-500" },
  { id: "aura-reading", label: "AURA Reading", icon: BookOpenCheck, color: "from-amber-500 to-yellow-500" },
  { id: "gradebook", label: "Gradebook", icon: GraduationCap, color: "from-cyan-500 to-blue-500" },
  { id: "directory", label: "Directory", icon: FolderOpen, color: "from-slate-500 to-gray-600" },
  { id: "safety", label: "Safety", icon: Shield, color: "from-green-500 to-emerald-500" },
  { id: "links-resources", label: "Links & Resources", icon: LinkIcon, color: "from-blue-500 to-indigo-500" },
  { id: "account", label: "Account", icon: User, color: "from-purple-500 to-indigo-500" },
];

const tourSteps: TourStep[] = [
  { id: "sidebar", title: "Navigation Sidebar", description: "Use the sidebar to navigate between all sections of your student dashboard. Each icon represents a different area." },
  { id: "home-stats", title: "Your Stats at a Glance", description: "See your assignments, completed work, games won, and daily streak right from the home page." },
  { id: "smart-action", title: "Smart Next Action", description: "AI recommends the most important thing to work on next based on due dates and your progress." },
  { id: "daily-missions", title: "Daily Missions", description: "Complete daily goals to earn XP and keep your streak going. New missions appear every day!" },
  // Today section
  { id: "today-due", title: "Due Today", description: "See all assignments and tasks due today in one place. Start any assignment directly from here." },
  { id: "today-pastdue", title: "Past Due Alerts", description: "Any overdue assignments appear here with red alerts so you can catch up quickly." },
  // Courses
  { id: "courses", title: "My Courses", description: "View all your enrolled classes. Click any course card to see assignments, grades, and class materials." },
  // Classroom detail steps
  { id: "classroom-header", title: "Classroom View", description: "Inside a classroom you see the class name and a 'Back to Courses' button. Below is a grid of tabs for all classroom features." },
  { id: "classroom-tabs", title: "Classroom Tabs", description: "9 tabs organized in a 3×3 grid: Syllabus, Assignments, Announcements, Discussions, Study Materials, Study Games, Calendar, Grades, and Trends." },
  { id: "classroom-announcements", title: "Class Announcements", description: "The Announcements tab shows messages from your teacher — assignment notifications, reminders, and class updates." },
  { id: "classroom-assignments", title: "Classroom Assignments", description: "View all published assignments for this class. Click any assignment to start working on it." },
  { id: "classroom-grades", title: "Your Grades", description: "The Grades tab shows your current grade and all graded assignments for this specific class." },
  { id: "classroom-leaderboard", title: "Class Leaderboard", description: "See how you rank against classmates based on assignment scores, games won, and AURA reading performance." },
  // Clubs
  { id: "clubs", title: "Clubs & Activities", description: "Browse and join school clubs. See upcoming events and connect with classmates who share your interests." },
  // Calendar steps
  { id: "calendar-section", title: "Your Calendar", description: "See all assignments, class schedules, and school events in one unified calendar view." },
  { id: "calendar-month", title: "Monthly View", description: "The month view shows all events at a glance. Days with events are highlighted. Click any day to see details." },
  { id: "calendar-upcoming", title: "Upcoming Events", description: "A quick list of your next events — assignments due, club meetings, and school events — sorted by date." },
  // Remaining sections
  { id: "study-games", title: "Study Games", description: "Play educational games like Jeopardy 1v1, Number Maker, and more to learn while having fun!" },
  { id: "aura", title: "AURA Reading Practice", description: "Practice reading aloud with AI-powered feedback on speed, accuracy, and pronunciation." },
  { id: "gradebook", title: "Gradebook", description: "Track all your grades across every class and assignment in one place." },
  { id: "safety-section", title: "Safety Center", description: "Report concerns anonymously, access emergency contacts, and find trusted adults at school." },
  { id: "account-section", title: "Your Account", description: "Manage your profile, avatar, language settings, and more." },
];

const DemoSidebar = ({ activeSection, onSectionChange, isSheet = false, onClose }: {
  activeSection: string;
  onSectionChange: (s: string) => void;
  isSheet?: boolean;
  onClose?: () => void;
}) => (
  <aside className={cn(
    "border-r border-border/50 bg-gradient-to-b from-background via-background to-muted/20 h-full relative overflow-hidden",
    isSheet ? "w-full" : "w-72"
  )}>
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
    </div>
    <div className="relative p-6 overflow-y-auto max-h-full">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Dashboard</h2>
            <p className="text-xs text-muted-foreground">Student Portal</p>
          </div>
        </div>
      </div>
      <nav className="space-y-1.5">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id || (activeSection === "classroom-detail" && section.id === "courses");
          return (
            <motion.button
              key={section.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
              onClick={() => { onSectionChange(section.id); onClose?.(); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative group",
                isActive
                  ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              style={{ boxShadow: isActive ? `0 8px 24px -8px hsl(var(--primary) / 0.4)` : undefined }}
            >
              <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300", isActive ? "bg-white/20" : "bg-muted/50 group-hover:bg-muted")}>
                <Icon className={cn("h-4 w-4 transition-all duration-300", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
              </div>
              <span className={cn("relative z-10 flex-1 text-left transition-all duration-300", isActive ? "text-white font-semibold" : "")}>{section.label}</span>
              {isActive && <motion.div layoutId="demoActiveIndicator" className="w-2 h-2 rounded-full bg-white/80" transition={{ type: "spring", bounce: 0.3, duration: 0.5 }} />}
            </motion.button>
          );
        })}
      </nav>
    </div>
  </aside>
);

// ── Section Components ──

const DemoHomeSection = () => (
  <div className="space-y-8 animate-fade-in">
    <div className="relative rounded-3xl bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8 border border-border/50 overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl" />
      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg"><span className="text-2xl">👩‍🎓</span></div>
          <div><p className="text-sm text-muted-foreground font-medium">5th Grade • Room 204</p></div>
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-black mb-2 text-gradient-purple">Good afternoon, Demo Student!</h1>
          <p className="text-lg text-muted-foreground">Here's what's happening today</p>
        </div>
        <DemoHighlight stepId="home-stats" tooltip="Quick snapshot of your daily progress — assignments due, completed work, games played, and your login streak.">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: BookOpen, label: "Assignments", value: "5", circleClass: "icon-circle-sm icon-circle-blue" },
              { icon: CheckCircle, label: "Completed", value: "3", circleClass: "icon-circle-sm icon-circle-green" },
              { icon: Trophy, label: "Games Won", value: "8", circleClass: "icon-circle-sm icon-circle-purple" },
              { icon: Flame, label: "Day Streak", value: "5 🔥", circleClass: "icon-circle-sm icon-circle-orange" },
            ].map((stat) => (
              <Card key={stat.label} variant="glass" className="hover-lift">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={stat.circleClass}><stat.icon className="h-4 w-4 text-white" /></div>
                    <div><div className="text-2xl font-black">{stat.value}</div><div className="text-xs text-muted-foreground font-medium">{stat.label}</div></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DemoHighlight>
      </div>
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      <DemoHighlight stepId="smart-action" tooltip="AI analyzes your due dates and progress to suggest the most impactful next task.">
        <Card variant="glass"><CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Smart Next Action</CardTitle></CardHeader>
          <CardContent><div className="p-4 rounded-xl bg-primary/5 border border-primary/10"><p className="font-medium">Complete "Chapter 5 Reading Comprehension"</p><p className="text-sm text-muted-foreground mt-1">Due tomorrow • ELA • Mrs. Davis's class</p><Button className="mt-3" size="sm">Start Assignment</Button></div></CardContent>
        </Card>
      </DemoHighlight>
      <DemoHighlight stepId="daily-missions" tooltip="Three fresh missions every day. Complete them all to earn bonus XP and maintain your streak.">
        <Card variant="glass"><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-500" /> Daily Missions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[{ label: "Read for 15 minutes", xp: "+50 XP", done: true }, { label: "Complete 1 assignment", xp: "+100 XP", done: false }, { label: "Play a study game", xp: "+30 XP", done: false }].map((m) => (
              <div key={m.label} className={cn("flex items-center justify-between p-3 rounded-lg border", m.done ? "bg-green-50 border-green-200" : "bg-card border-border")}>
                <div className="flex items-center gap-2">{m.done ? <CheckCircle className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />}<span className={cn("text-sm", m.done && "line-through text-muted-foreground")}>{m.label}</span></div>
                <Badge variant="outline" className="text-xs">{m.xp}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </DemoHighlight>
    </div>

    <Card variant="glass"><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-red-500" /> Recent Activity</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        {["📝 Submitted Science Vocabulary Quiz — scored 95% — 2 hours ago", "🎮 Won Jeopardy 1v1 against classmate — Yesterday", "📖 AURA Reading session — 112 WPM, 94% accuracy — Yesterday", "⭐ Earned 'Bookworm' achievement — 2 days ago"].map((a, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"><p className="text-muted-foreground">{a}</p></div>
        ))}
      </CardContent>
    </Card>
  </div>
);

// ── Today Section (matches TodaySection.tsx) ──
const DemoTodaySection = () => (
  <div className="space-y-6 animate-fade-in">
    <h1 className="text-3xl font-bold text-foreground">Today</h1>

    {/* Due Today */}
    <DemoHighlight stepId="today-due" tooltip="All assignments and tasks due today. Click 'Start' to begin working on any of them.">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Due Today</CardTitle>
            <Badge variant="secondary">3</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { title: "Chapter 6 Reading Comprehension", category: "Homework", classroom: "5th Grade ELA", dueTime: "3:00 PM" },
              { title: "Math Word Problems Set 3", category: "Homework", classroom: "5th Grade Math", dueTime: "4:00 PM" },
              { title: "Science Vocabulary Review", category: "Quiz", classroom: "5th Grade Science", dueTime: "11:59 PM" },
            ].map((a) => (
              <div key={a.title} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-foreground">{a.title}</h3>
                    <Badge variant="outline" className={
                      a.category === "Quiz" ? "bg-yellow-500/10 text-yellow-700 border-yellow-200" : "bg-blue-500/10 text-blue-700 border-blue-200"
                    }>{a.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.classroom} • Due at {a.dueTime}</p>
                </div>
                <Button>Start</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DemoHighlight>

    {/* Past Due */}
    <DemoHighlight stepId="today-pastdue" tooltip="Overdue assignments that still need to be completed. Submit them as soon as possible!">
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Past Due</CardTitle>
            <Badge variant="destructive">1</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg hover:bg-destructive/5 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-foreground">Geometry Basics Worksheet</h3>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">Homework</Badge>
                </div>
                <p className="text-sm text-muted-foreground">5th Grade Math • Was due Feb 14</p>
              </div>
              <Button variant="destructive">Complete Now</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </DemoHighlight>
  </div>
);

const DemoCoursesSection = ({ onOpenClassroom }: { onOpenClassroom: (name: string) => void }) => (
  <div className="space-y-6 animate-fade-in">
    <DemoHighlight stepId="courses" tooltip="Each card represents a class you're enrolled in. Click to view assignments, materials, and grades for that class.">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
        <Button><span className="mr-2">+</span> Join Course</Button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {[
          { name: "5th Grade ELA", teacher: "Mrs. Davis", students: 28, code: "ELA-2025" },
          { name: "5th Grade Math", teacher: "Mr. Thompson", students: 26, code: "MATH-2025" },
          { name: "5th Grade Science", teacher: "Ms. Chen", students: 24, code: "SCI-2025" },
        ].map((c) => (
          <Card key={c.name} variant="glass" className="hover-lift cursor-pointer" onClick={() => onOpenClassroom(c.name)}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"><BookOpen className="h-6 w-6 text-white" /></div>
                <Badge variant="outline" className="text-xs">{c.code}</Badge>
              </div>
              <h3 className="text-xl font-bold mb-1">{c.name}</h3>
              <p className="text-sm text-muted-foreground">{c.teacher} • {c.students} students</p>
              <Button size="sm" variant="outline" className="mt-3 w-full">View Classroom →</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </DemoHighlight>
  </div>
);

// ── Demo Classroom Detail (Student View) — Matches actual ClassroomDetail ──
const DemoClassroomDetail = ({ classroomName, onBack }: { classroomName: string; onBack: () => void }) => {
  const [classTab, setClassTab] = useState("announcements");

  // Student tabs matching STUDENT_TABS from ClassroomTabsList
  const studentTabs = [
    { id: "syllabus", icon: FileText, label: "Syllabus" },
    { id: "assignments", icon: FileText, label: "Assignments" },
    { id: "announcements", icon: Megaphone, label: "Announcements" },
    { id: "discussions", icon: MessageSquare, label: "Discussions" },
    { id: "study", icon: BookOpen, label: "Study Materials" },
    { id: "tournaments", icon: Play, label: "Study Games" },
    { id: "calendar", icon: Calendar, label: "Calendar" },
    { id: "grades", icon: GraduationCap, label: "Grades" },
    { id: "trends", icon: BarChart3, label: "Trends" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header matching real ClassroomDetail */}
      <DemoHighlight stepId="classroom-header" tooltip="The classroom header shows the class name. Click 'Back to Courses' to return to your course list.">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1"><ChevronLeft className="h-4 w-4" /> Back to Courses</Button>
        </div>
        <Card className="shadow-elegant border-2 border-primary/10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <CardHeader className="bg-gradient-to-br from-muted/30 to-muted/10 relative z-10">
            <CardTitle className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {classroomName}
            </CardTitle>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2"><Users className="h-5 w-5" /><span className="font-medium">28 students</span></div>
            </div>
          </CardHeader>
        </Card>
      </DemoHighlight>

      {/* Tabs - 3x3 liquid glass grid matching ClassroomTabsList student view */}
      <DemoHighlight stepId="classroom-tabs" tooltip="9 tabs in a 3×3 grid — each one controls a different section of the classroom. Click any tab to explore.">
        <Tabs value={classTab} onValueChange={setClassTab}>
          <TabsList className="grid grid-cols-3 w-full h-auto p-2 bg-muted/50 rounded-xl gap-2">
            {studentTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className={cn("relative", liquidGlassTabClass)}>
                <tab.icon className="mr-2 h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Announcements Tab (Stream) */}
          <TabsContent value="announcements" className="mt-6">
            <DemoHighlight stepId="classroom-announcements" tooltip="Teacher announcements and updates for this class. Assignment notifications appear here too.">
              <div className="mb-4"><h2 className="text-2xl font-bold">Announcements</h2></div>
              <div className="space-y-4">
                {[
                  { title: "Chapter 6 Reading Assigned", content: "Please read Chapter 6 and answer the comprehension questions by Friday.", type: "assignment" as const, time: "2026-02-16T09:15:00" },
                  { title: "Vocabulary Quiz Results Posted", content: "Great job everyone! Class average was 88%. Check your individual scores in the gradebook.", type: "announcement" as const, time: "2026-02-15T14:30:00" },
                  { title: "Field Trip Permission Slips", content: "Don't forget to return your signed permission slips for the museum trip by this Friday.", type: "announcement" as const, time: "2026-02-14T10:00:00" },
                ].map((a) => (
                  <Card key={a.title} className="shadow-card hover:shadow-yellow transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1">
                          {a.type === "assignment" ? <FileText className="h-5 w-5 text-primary" /> : <Bell className="h-5 w-5 text-primary" />}
                          <CardTitle className="text-lg">{a.title}</CardTitle>
                        </div>
                        <Badge variant={a.type === "assignment" ? "default" : "secondary"}>
                          {a.type === "assignment" ? "Assignment" : "Announcement"}
                        </Badge>
                      </div>
                      <CardDescription>
                        {new Date(a.time).toLocaleDateString()} at {new Date(a.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{a.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DemoHighlight>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="mt-6">
            <DemoHighlight stepId="classroom-assignments" tooltip="All published assignments for this class. Click any to view details and start working.">
              <div className="mb-4"><h2 className="text-2xl font-bold">Assignments</h2></div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "Chapter 6 Reading Comprehension", due: "Feb 21", status: "published", category: "Homework", questions: 10, timer: null },
                  { title: "Vocabulary Week 12", due: "Feb 19", status: "published", category: "Quiz", questions: 20, timer: 15 },
                  { title: "Chapter 5 Comprehension", due: "Feb 14", status: "published", category: "Homework", questions: 8, timer: null },
                  { title: "Creative Writing: My Hero", due: "Feb 12", status: "published", category: "Test", questions: 3, timer: 45 },
                ].map((a) => (
                  <Card key={a.title} className="shadow-card hover:shadow-purple transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="default"><span className="mr-1">👁</span> Published</Badge>
                        {a.category && <Badge variant="outline" className={
                          a.category === "Test" ? "bg-red-500/10 text-red-700 border-red-200" :
                          a.category === "Quiz" ? "bg-yellow-500/10 text-yellow-700 border-yellow-200" :
                          "bg-blue-500/10 text-blue-700 border-blue-200"
                        }>{a.category}</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Badge variant="outline">{a.questions} Questions</Badge>
                          {a.timer && <Badge variant="outline">{a.timer} min</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">Due: {a.due}</p>
                        <Button variant="outline" className="w-full mt-2">Start Assignment</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DemoHighlight>
          </TabsContent>

          {/* Syllabus Tab */}
          <TabsContent value="syllabus" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">📋 Class Syllabus</h3>
                <div className="space-y-4 text-sm">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="font-semibold mb-1">Grade Weights</p>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      <span>Assignments: 40%</span><span>Quizzes: 25%</span>
                      <span>Participation: 15%</span><span>Final Project: 20%</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="font-semibold mb-1">Office Hours</p>
                    <p className="text-muted-foreground">Tuesday & Thursday 3:00–4:00 PM, Room 204</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discussions Tab */}
          <TabsContent value="discussions" className="mt-6">
            <div className="mb-4"><h2 className="text-2xl font-bold">Discussions</h2></div>
            <div className="space-y-4">
              {[
                { title: "What was your favorite part of Chapter 5?", replies: 12, lastReply: "2 hours ago" },
                { title: "Study group for the science quiz?", replies: 8, lastReply: "Yesterday" },
                { title: "Book recommendations for free reading", replies: 15, lastReply: "2 days ago" },
              ].map((d) => (
                <Card key={d.title} className="hover-lift cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">{d.title}</p>
                        <p className="text-xs text-muted-foreground">{d.replies} replies • Last reply {d.lastReply}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{d.replies}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Study Materials Tab */}
          <TabsContent value="study" className="mt-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">Study Materials</h2>
              <p className="text-muted-foreground">Review flashcard sets from your teacher</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "ELA Vocabulary Week 12", subject: "ELA", cards: 24 },
                { title: "Chapter 5 Key Terms", subject: "ELA", cards: 18 },
              ].map((set) => (
                <Card key={set.title} className="shadow-card hover:shadow-purple transition-shadow">
                  <CardHeader><CardTitle className="text-lg">{set.title}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Badge variant="secondary">{set.subject}</Badge>
                      <p className="text-sm text-muted-foreground"><strong>{set.cards}</strong> flashcards</p>
                      <Button className="w-full"><Play className="mr-2 h-4 w-4" /> Study Now</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Study Games Tab */}
          <TabsContent value="tournaments" className="mt-6">
            <div className="mb-4"><h2 className="text-2xl font-bold">Study Games</h2></div>
            <Card className="p-12 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No Tournaments Yet</h3>
              <p className="text-muted-foreground">Your teacher hasn't created any tournaments yet</p>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Class Calendar</h2>
                  <p className="text-muted-foreground">View upcoming assignments and events for this class</p>
                </div>
                <Button><Calendar className="h-4 w-4 mr-2" /> View Full Calendar</Button>
              </div>
              <Card className="p-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Upcoming Deadlines</h3>
                  <div className="space-y-3">
                    {[
                      { title: "Vocabulary Week 12", category: "Quiz", due: "Feb 19" },
                      { title: "Chapter 6 Reading Comprehension", category: "Homework", due: "Feb 21" },
                      { title: "Creative Writing Final Draft", category: "Test", due: "Feb 28" },
                    ].map((a) => (
                      <div key={a.title} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{a.title}</p>
                            <p className="text-xs text-muted-foreground">{a.category}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{a.due}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Grades Tab */}
          <TabsContent value="grades" className="mt-6">
            <DemoHighlight stepId="classroom-grades" tooltip="Your grades for this specific class. See scores on all graded assignments.">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Your Grades</h2>
                  <p className="text-muted-foreground">View your current grades and performance in this class</p>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50"><tr><th className="text-left p-4 font-medium">Assignment</th><th className="text-left p-4 font-medium">Category</th><th className="text-left p-4 font-medium">Grade</th><th className="text-left p-4 font-medium">Status</th></tr></thead>
                      <tbody>
                        {[
                          { a: "Chapter 5 Comprehension", c: "Homework", g: "92%", s: "Graded" },
                          { a: "Vocabulary Week 11", c: "Quiz", g: "95%", s: "Graded" },
                          { a: "Creative Writing: My Hero", c: "Test", g: "88%", s: "Graded" },
                          { a: "Chapter 6 Reading", c: "Homework", g: "—", s: "Not Started" },
                        ].map((r) => (
                          <tr key={r.a} className="border-t border-border hover:bg-muted/30">
                            <td className="p-4 font-medium">{r.a}</td><td className="p-4">{r.c}</td><td className="p-4 font-bold">{r.g}</td>
                            <td className="p-4"><Badge variant={r.s === "Graded" ? "default" : "outline"} className={r.s === "Graded" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>{r.s}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
            </DemoHighlight>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="mt-6">
            <DemoHighlight stepId="classroom-leaderboard" tooltip="See how you rank and track your performance trends over time in this class.">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Your Progress</h2>
                <p className="text-muted-foreground">Track your performance trends in this classroom</p>
              </div>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Current Average", value: "91%", icon: "📊" },
                  { label: "Assignments Completed", value: "12/15", icon: "✅" },
                  { label: "Class Rank", value: "#2", icon: "🏆" },
                ].map((s) => (
                  <Card key={s.label}><CardContent className="p-5 text-center"><span className="text-2xl mb-2 block">{s.icon}</span><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-3xl font-black">{s.value}</p></CardContent></Card>
                ))}
              </div>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Rank</th>
                        <th className="text-left p-4 font-medium">Student</th>
                        <th className="text-left p-4 font-medium">Avg Grade</th>
                        <th className="text-left p-4 font-medium">Games Won</th>
                        <th className="text-left p-4 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { rank: "🥇", name: "Sophia Chen", avg: "96%", games: 12, total: 520 },
                        { rank: "🥈", name: "Demo Student (You)", avg: "92%", games: 8, total: 485, you: true },
                        { rank: "🥉", name: "Emma Johnson", avg: "91%", games: 10, total: 470 },
                        { rank: "4", name: "Liam Martinez", avg: "87%", games: 6, total: 420 },
                        { rank: "5", name: "Noah Williams", avg: "85%", games: 9, total: 410 },
                      ].map((s) => (
                        <tr key={s.name} className={cn("border-t border-border", s.you && "bg-primary/5 font-semibold")}>
                          <td className="p-4 text-lg">{s.rank}</td>
                          <td className="p-4">{s.name}</td>
                          <td className="p-4">{s.avg}</td>
                          <td className="p-4">{s.games}</td>
                          <td className="p-4 font-bold">{s.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </DemoHighlight>
          </TabsContent>
        </Tabs>
      </DemoHighlight>
    </div>
  );
};

const DemoClubsSection = () => (
  <div className="space-y-6 animate-fade-in">
    <DemoHighlight stepId="clubs" tooltip="Join clubs based on your interests. Participate in events, chat with members, and build community outside the classroom.">
      <h2 className="text-3xl font-black text-gradient-purple">Clubs</h2>
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        {[
          { name: "Reading Adventurers", desc: "Explore new books and share reviews with friends", members: 18, nextMeeting: "Tomorrow 1:00 PM", emoji: "📚", joined: true },
          { name: "Science Explorers", desc: "Hands-on experiments and science fair prep", members: 22, nextMeeting: "Wednesday 2:30 PM", emoji: "🔬", joined: true },
          { name: "Chess Club", desc: "Learn strategies and compete in tournaments", members: 12, nextMeeting: "Thursday 3:00 PM", emoji: "♟️", joined: false },
          { name: "Art Studio", desc: "Drawing, painting, and digital art workshops", members: 15, nextMeeting: "Friday 1:30 PM", emoji: "🎨", joined: false },
        ].map((club) => (
          <Card key={club.name} variant="glass" className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <span className="text-3xl">{club.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{club.name}</h3>
                    {club.joined && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Joined</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{club.desc}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {club.members} members</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {club.nextMeeting}</span>
                  </div>
                  {!club.joined && <Button size="sm" variant="outline" className="mt-3">Join Club</Button>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DemoHighlight>
  </div>
);

// ── Expanded Calendar Section ──
const DemoCalendarSection = () => {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const monthName = today.toLocaleString("default", { month: "long", year: "numeric" });

  const eventDays: Record<number, { title: string; color: string }[]> = {
    17: [{ title: "Chapter 6 Due", color: "bg-red-500" }],
    18: [{ title: "Reading Club", color: "bg-pink-500" }],
    19: [{ title: "Science Fair", color: "bg-amber-500" }],
    20: [{ title: "Vocab Quiz", color: "bg-red-500" }, { title: "Chess Club", color: "bg-pink-500" }],
    21: [{ title: "No School", color: "bg-green-500" }],
    24: [{ title: "Math Test", color: "bg-blue-500" }],
    26: [{ title: "AURA Benchmark", color: "bg-purple-500" }],
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <DemoHighlight stepId="calendar-section" tooltip="Your unified calendar shows class times, assignment due dates, club meetings, and school events all in one view.">
        <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
      </DemoHighlight>

      <DemoHighlight stepId="calendar-month" tooltip="Monthly grid view — days with events show colored dots. Click any day to see full details.">
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
                    "aspect-square flex flex-col items-center justify-center rounded-lg text-sm cursor-pointer hover:bg-muted/50 transition-colors relative",
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
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Assignments</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-pink-500" /> Clubs</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Events</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Classes</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> Holidays</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> Assessments</span>
            </div>
          </CardContent>
        </Card>
      </DemoHighlight>

      <DemoHighlight stepId="calendar-upcoming" tooltip="Quick chronological list of upcoming events so you never miss a deadline or meeting.">
        <h3 className="font-bold text-lg">Upcoming Events</h3>
        <div className="space-y-3 mt-3">
          {[
            { date: "Mon, Feb 17", items: [{ t: "Chapter 6 Reading Due", type: "Assignment", color: "bg-red-100 text-red-700" }, { t: "ELA 8:00 AM", type: "Class", color: "bg-blue-100 text-blue-700" }] },
            { date: "Tue, Feb 18", items: [{ t: "Math Word Problems Due", type: "Assignment", color: "bg-red-100 text-red-700" }, { t: "Reading Club 1:00 PM", type: "Club", color: "bg-pink-100 text-pink-700" }] },
            { date: "Wed, Feb 19", items: [{ t: "Science Fair Setup", type: "Event", color: "bg-amber-100 text-amber-700" }] },
            { date: "Thu, Feb 20", items: [{ t: "Vocabulary Quiz", type: "Assignment", color: "bg-red-100 text-red-700" }, { t: "Chess Club 3:00 PM", type: "Club", color: "bg-pink-100 text-pink-700" }] },
            { date: "Fri, Feb 21", items: [{ t: "No School – Teacher Workday", type: "Holiday", color: "bg-green-100 text-green-700" }] },
          ].map((day) => (
            <Card key={day.date} variant="glass">
              <CardContent className="p-4">
                <p className="font-bold text-sm mb-2">{day.date}</p>
                <div className="space-y-2">
                  {day.items.map((item) => (
                    <div key={item.t} className="flex items-center justify-between">
                      <span className="text-sm">{item.t}</span>
                      <Badge className={cn("text-xs", item.color)}>{item.type}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DemoHighlight>
    </div>
  );
};

const DemoAnnouncementsSection = () => (
  <div className="space-y-6 animate-fade-in">
    <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
    <div className="space-y-4">
      {[
        { teacher: "Mrs. Davis", time: "1 hour ago", title: "Field Trip Permission Slips", body: "Please return your signed permission slips for the museum trip by Friday. Extra copies are available at the front office.", urgent: true },
        { teacher: "Mr. Thompson", time: "Yesterday", title: "Math Test Next Tuesday", body: "Study guide has been posted in our class page. Review chapters 4-6 and complete the practice problems.", urgent: false },
        { teacher: "Principal Wilson", time: "2 days ago", title: "Spirit Week Next Week!", body: "Monday: Pajama Day, Tuesday: Twin Day, Wednesday: Crazy Hat Day, Thursday: School Colors, Friday: Costume Day!", urgent: false },
        { teacher: "Mrs. Davis", time: "3 days ago", title: "New Books in Class Library", body: "We've added 15 new titles to our classroom library. Come check them out during free reading time!", urgent: false },
      ].map((a) => (
        <Card key={a.title} variant="glass" className="hover-lift">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{a.title}</h3>
                {a.urgent && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Important</Badge>}
              </div>
              <span className="text-xs text-muted-foreground">{a.time}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{a.body}</p>
            <p className="text-xs text-muted-foreground">— {a.teacher}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const DemoGamesSection = () => (
  <div className="space-y-6 animate-fade-in">
    <DemoHighlight stepId="study-games" tooltip="Educational games that help reinforce classroom learning. Challenge classmates or play solo to earn XP.">
      <h2 className="text-3xl font-black text-gradient-purple">Study Games</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {[
          { name: "Jeopardy 1v1", desc: "Challenge a classmate to a quiz battle", emoji: "🎯", players: "2 players" },
          { name: "Number Maker", desc: "Build equations to reach target numbers", emoji: "🔢", players: "Solo" },
          { name: "Name That Animal", desc: "Identify animals from clues", emoji: "🦁", players: "Solo" },
          { name: "US States Quiz", desc: "Test your geography knowledge", emoji: "🗺️", players: "Solo" },
          { name: "Tug of War", desc: "Answer questions to pull the rope", emoji: "🪢", players: "2 players" },
          { name: "Word Scramble", desc: "Unscramble vocabulary words for points", emoji: "🔤", players: "Solo" },
        ].map((g) => (
          <Card key={g.name} variant="glass" className="hover-lift cursor-pointer">
            <CardContent className="p-6 text-center">
              <span className="text-4xl mb-4 block">{g.emoji}</span>
              <h3 className="font-bold text-lg mb-1">{g.name}</h3>
              <p className="text-sm text-muted-foreground mb-1">{g.desc}</p>
              <Badge variant="outline" className="text-xs mb-3">{g.players}</Badge>
              <Button size="sm" className="w-full mt-2">Play Now</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </DemoHighlight>
  </div>
);

const DemoAuraSection = () => (
  <div className="space-y-6 animate-fade-in">
    <DemoHighlight stepId="aura" tooltip="AURA uses AI speech recognition to measure your reading fluency, speed, accuracy, and pronunciation in real time.">
      <h2 className="text-3xl font-black text-gradient-purple">AURA Reading Practice</h2>
      <div className="grid sm:grid-cols-3 gap-4 mt-4">
        {[{ label: "Words Per Minute", value: "112", icon: "⚡" }, { label: "Accuracy", value: "94%", icon: "🎯" }, { label: "Sessions This Week", value: "3", icon: "📊" }].map((s) => (
          <Card key={s.label} variant="glass"><CardContent className="p-5 text-center"><span className="text-2xl mb-2 block">{s.icon}</span><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-3xl font-black">{s.value}</p></CardContent></Card>
        ))}
      </div>
      <Card variant="glass" className="mt-4">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><BookOpenCheck className="h-5 w-5 text-primary" /> Today's Passage</h3>
          <div className="bg-muted/30 rounded-xl p-5 text-sm leading-relaxed mb-4 italic">
            "The sun rose slowly over the mountains, casting golden light across the valley below. Birds began their morning songs as a gentle breeze rustled through the tall grass. Maya opened her notebook and began to write about the beautiful scene before her…"
          </div>
          <div className="flex gap-3">
            <Button>🎙️ Start Recording</Button>
            <Button variant="outline">📖 Choose Different Passage</Button>
          </div>
        </CardContent>
      </Card>
    </DemoHighlight>
  </div>
);

const DemoGradebookSection = () => (
  <div className="space-y-6 animate-fade-in">
    <DemoHighlight stepId="gradebook" tooltip="View all your grades organized by class and assignment. Filter by subject or date range.">
      <h2 className="text-3xl font-black text-gradient-purple">Gradebook</h2>
      <Card variant="glass" className="mt-4">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr><th className="text-left p-4 font-medium">Assignment</th><th className="text-left p-4 font-medium">Subject</th><th className="text-left p-4 font-medium">Grade</th><th className="text-left p-4 font-medium">Status</th></tr></thead>
            <tbody>
              {[
                { a: "Chapter 5 Comprehension", s: "ELA", g: "92%", st: "Graded" },
                { a: "Math Word Problems Set 2", s: "Math", g: "88%", st: "Graded" },
                { a: "Science Vocabulary Quiz", s: "Science", g: "95%", st: "Graded" },
                { a: "Geometry Basics", s: "Math", g: "85%", st: "Graded" },
                { a: "Chapter 6 Reading", s: "ELA", g: "—", st: "Pending" },
                { a: "Math Set 3", s: "Math", g: "—", st: "Not Started" },
              ].map((r) => (
                <tr key={r.a} className="border-t border-border hover:bg-muted/30">
                  <td className="p-4 font-medium">{r.a}</td><td className="p-4">{r.s}</td><td className="p-4 font-bold">{r.g}</td>
                  <td className="p-4"><Badge variant={r.st === "Graded" ? "default" : "outline"} className={r.st === "Graded" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>{r.st}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </DemoHighlight>
  </div>
);

const DemoDirectorySection = () => (
  <div className="space-y-6 animate-fade-in">
    <h2 className="text-3xl font-black text-gradient-purple">Directory</h2>
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">My Teachers</h3>
      {[
        { name: "Mrs. Davis", role: "ELA Teacher", email: "davis@school.edu", room: "Room 204" },
        { name: "Mr. Thompson", role: "Math Teacher", email: "thompson@school.edu", room: "Room 118" },
        { name: "Ms. Chen", role: "Science Teacher", email: "chen@school.edu", room: "Room 305" },
      ].map((t) => (
        <Card key={t.name} variant="glass" className="hover-lift">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"><span className="text-lg font-bold text-white">{t.name[0]}</span></div>
              <div><p className="font-semibold">{t.name}</p><p className="text-sm text-muted-foreground">{t.role} • {t.room}</p></div>
            </div>
            <Button size="sm" variant="outline"><Mail className="h-3 w-3 mr-1" /> Message</Button>
          </CardContent>
        </Card>
      ))}
      <h3 className="font-semibold text-lg mt-6">School Staff</h3>
      {[
        { name: "Principal Wilson", role: "Principal", room: "Main Office" },
        { name: "Ms. Harper", role: "School Counselor", room: "Room 102" },
      ].map((s) => (
        <Card key={s.name} variant="glass" className="hover-lift">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"><span className="text-lg font-bold text-white">{s.name[0]}</span></div>
            <div><p className="font-semibold">{s.name}</p><p className="text-sm text-muted-foreground">{s.role} • {s.room}</p></div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const DemoSafetySection = () => (
  <div className="space-y-6 animate-fade-in">
    <DemoHighlight stepId="safety-section" tooltip="A safe space to report concerns, view emergency procedures, and find trusted adults at school.">
      <h2 className="text-3xl font-black text-gradient-purple">Safety Center</h2>
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        <Card variant="glass" className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-500" /> Report a Concern</h3>
            <p className="text-sm text-muted-foreground mb-4">If you see something that worries you, report it anonymously. A trusted adult will follow up.</p>
            <Button className="bg-red-600 hover:bg-red-700 text-white">Submit Anonymous Report</Button>
          </CardContent>
        </Card>
        <Card variant="glass" className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Phone className="h-5 w-5 text-green-500" /> Emergency Contacts</h3>
            <div className="space-y-2 text-sm">
              <p>🏫 Main Office: (555) 123-4567</p>
              <p>🏥 School Nurse: (555) 123-4568</p>
              <p>👨‍💼 Principal Wilson: (555) 123-4569</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass" className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Shield className="h-5 w-5 text-blue-500" /> Trusted Adults</h3>
            <p className="text-sm text-muted-foreground mb-3">These adults are available to talk if you need help:</p>
            <div className="space-y-2 text-sm">
              <p>• Ms. Harper — School Counselor (Room 102)</p>
              <p>• Mr. Blake — Vice Principal (Main Office)</p>
              <p>• Mrs. Rivera — Social Worker (Room 105)</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass" className="border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Bell className="h-5 w-5 text-amber-500" /> Safety Alerts</h3>
            <p className="text-sm text-muted-foreground">No active safety alerts. Your school is operating normally. 🟢</p>
          </CardContent>
        </Card>
      </div>
    </DemoHighlight>
  </div>
);

const DemoLinksSection = () => (
  <div className="space-y-6 animate-fade-in">
    <h2 className="text-3xl font-black text-gradient-purple">Links & Resources</h2>
    <div className="grid md:grid-cols-2 gap-4">
      {[
        { name: "Khan Academy", desc: "Free math and science lessons", emoji: "🎓" },
        { name: "Epic! Reading", desc: "Digital library with thousands of books", emoji: "📚" },
        { name: "Typing.com", desc: "Practice your typing skills", emoji: "⌨️" },
        { name: "Google Classroom", desc: "Access shared class materials", emoji: "📋" },
        { name: "School Library Catalog", desc: "Search and reserve library books", emoji: "🏛️" },
        { name: "BrainPOP", desc: "Animated educational videos", emoji: "🧠" },
      ].map((link) => (
        <Card key={link.name} variant="glass" className="hover-lift cursor-pointer">
          <CardContent className="p-4 flex items-center gap-4">
            <span className="text-2xl">{link.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold">{link.name}</p>
              <p className="text-xs text-muted-foreground">{link.desc}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const DemoAccountSection = () => (
  <div className="space-y-6 animate-fade-in">
    <DemoHighlight stepId="account-section" tooltip="Manage your profile details, change your avatar, adjust settings, and customize your dashboard experience.">
      <h2 className="text-3xl font-black text-gradient-purple">My Account</h2>
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"><span className="text-3xl">👩‍🎓</span></div>
              <div>
                <h3 className="font-bold text-lg">Demo Student</h3>
                <p className="text-sm text-muted-foreground">5th Grade • Lincoln Elementary</p>
                <p className="text-sm text-muted-foreground">demo.student@school.edu</p>
              </div>
            </div>
            <Button variant="outline" className="w-full"><UserCircle className="h-4 w-4 mr-2" /> Edit Profile</Button>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Settings className="h-5 w-5" /> Settings</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30"><span>Language</span><Badge variant="outline">English</Badge></div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30"><span>Dark Mode</span><Badge variant="outline">Off</Badge></div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30"><span>Notifications</span><Badge variant="outline">On</Badge></div>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass" className="md:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><Award className="h-5 w-5 text-amber-500" /> Achievements</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Bookworm", desc: "Read 10 passages", emoji: "📚", earned: true },
                { name: "Streak Master", desc: "5-day login streak", emoji: "🔥", earned: true },
                { name: "Quiz Whiz", desc: "Score 100% on a quiz", emoji: "🧠", earned: true },
                { name: "Game Champion", desc: "Win 20 study games", emoji: "🏆", earned: false },
              ].map((a) => (
                <div key={a.name} className={cn("p-4 rounded-xl text-center border", a.earned ? "bg-amber-50 border-amber-200" : "bg-muted/30 border-border opacity-50")}>
                  <span className="text-2xl mb-2 block">{a.emoji}</span>
                  <p className="font-semibold text-sm">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DemoHighlight>
  </div>
);

// ── Main ──

const StudentDemo = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [openClassroom, setOpenClassroom] = useState<string | null>(null);

  const renderSection = () => {
    if (activeSection === "classroom-detail" && openClassroom) {
      return <DemoClassroomDetail classroomName={openClassroom} onBack={() => setActiveSection("courses")} />;
    }
    switch (activeSection) {
      case "home": return <DemoHomeSection />;
      case "today": return <DemoTodaySection />;
      case "courses": return <DemoCoursesSection onOpenClassroom={(name) => { setOpenClassroom(name); setActiveSection("classroom-detail"); }} />;
      case "clubs": return <DemoClubsSection />;
      case "calendar": return <DemoCalendarSection />;
      case "announcements": return <DemoAnnouncementsSection />;
      case "study-games": return <DemoGamesSection />;
      case "aura-reading": return <DemoAuraSection />;
      case "gradebook": return <DemoGradebookSection />;
      case "directory": return <DemoDirectorySection />;
      case "safety": return <DemoSafetySection />;
      case "links-resources": return <DemoLinksSection />;
      case "account": return <DemoAccountSection />;
      default: return <DemoHomeSection />;
    }
  };

  const stepsWithActions = tourSteps.map((step) => {
    const sectionMap: Record<string, string> = {
      "today-due": "today",
      "today-pastdue": "today",
      courses: "courses",
      "classroom-header": "classroom-detail",
      "classroom-tabs": "classroom-detail",
      "classroom-announcements": "classroom-detail",
      "classroom-assignments": "classroom-detail",
      "classroom-grades": "classroom-detail",
      "classroom-leaderboard": "classroom-detail",
      clubs: "clubs",
      "calendar-section": "calendar",
      "calendar-month": "calendar",
      "calendar-upcoming": "calendar",
      "study-games": "study-games",
      aura: "aura-reading",
      gradebook: "gradebook",
      "safety-section": "safety",
      "account-section": "account",
    };

    // Map step IDs to classroom tab switches
    const classTabMap: Record<string, string> = {
      "classroom-announcements": "announcements",
      "classroom-assignments": "assignments",
      "classroom-grades": "grades",
      "classroom-leaderboard": "trends",
    };

    return {
      ...step,
      action: sectionMap[step.id] ? () => {
        const target = sectionMap[step.id];
        setActiveSection(target);
        if (target === "classroom-detail" && !openClassroom) {
          setOpenClassroom("5th Grade ELA");
        }
      } : step.action,
    };
  });

  return (
    <DemoTourProvider steps={stepsWithActions} onStepChange={(step) => {
      // Tab switching is handled by DemoClassroomDetail internally via user clicks
    }}>
      <div className="min-h-screen flex flex-col bg-background">
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/demos"><Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="h-4 w-4" /> Back to Demos</Button></Link>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Interactive Student Demo</Badge>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">Click sidebar items or use the guided tour</p>
        </div>

        <Header />

        <div className="flex flex-1">
          <div className="hidden lg:block">
            <DemoHighlight stepId="sidebar" tooltip="Navigate between all sections of your dashboard — Home, Courses, Clubs, Calendar, Games, Reading, Grades, and more.">
              <DemoSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
            </DemoHighlight>
          </div>

          <div className="block lg:hidden fixed top-[7.5rem] left-4 z-50">
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild>
                <button className="p-2.5 rounded-xl bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-muted/80 transition-colors">
                  <Menu className="h-5 w-5 text-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <DemoSidebar activeSection={activeSection} onSectionChange={setActiveSection} isSheet onClose={() => setMobileSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>

          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 pb-32">
              <AnimatePresence mode="wait">
                <motion.div key={activeSection + (openClassroom || "")} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {renderSection()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </DemoTourProvider>
  );
};

export default StudentDemo;
