import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Users, BookOpen, Brain, Calendar as CalendarIcon,
  PlusCircle, Sparkles, BarChart3, AlertCircle, Link as LinkIcon, Eye,
  GraduationCap, ChevronRight, Clock, FileText, CheckCircle, Star,
  Settings, MessageSquare, Upload, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { liquidGlassTabClass } from "@/components/ui/liquid-glass-button";
import { DemoTourProvider, TourStep } from "@/components/demos/DemoTourGuide";
import { DemoHighlight } from "@/components/demos/DemoHighlight";

const tourSteps: TourStep[] = [
  { id: "ai-insights", title: "AI-Powered Insights", description: "Real-time analytics powered by machine learning. Identify at-risk students, track reading progress, and get actionable recommendations." },
  { id: "stats", title: "Dashboard Stats", description: "See your classrooms, total students, and active assignments at a glance. Click any card for detailed views." },
  { id: "classrooms", title: "My Classrooms", description: "All your class sections in one place. Click a classroom to manage assignments, view student progress, and post announcements." },
  { id: "create-classroom", title: "Create Classroom", description: "Set up a new class with a unique join code. Students can join instantly by entering the code." },
  { id: "links-tab", title: "Links & Resources", description: "Organize educational resources, tools, and websites for quick access. Share links with students." },
  { id: "calendar-tab", title: "Calendar", description: "View assignment deadlines, school events, parent-teacher conferences, and benchmark periods." },
  { id: "directory-tab", title: "Directory", description: "Search for students, parents, and staff. View contact info and class rosters." },
  { id: "actions-tab", title: "Teacher Tools", description: "Access study games, story library, AURA analytics, and AI model training from one place." },
];

const TeacherDemo = () => {
  const [currentTab, setCurrentTab] = useState("classrooms");

  const stepsWithActions = tourSteps.map((step) => {
    const tabMap: Record<string, string> = {
      classrooms: "classrooms", "create-classroom": "classrooms",
      "links-tab": "links", "calendar-tab": "calendar",
      "directory-tab": "directory", "actions-tab": "actions",
    };
    return { ...step, action: tabMap[step.id] ? () => setCurrentTab(tabMap[step.id]) : undefined };
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
                <TabsTrigger value="classrooms" className={liquidGlassTabClass}><Users className="h-4 w-4 mr-2" /> Classrooms</TabsTrigger>
                <TabsTrigger value="links" className={liquidGlassTabClass}><LinkIcon className="h-4 w-4 mr-2" /> Links</TabsTrigger>
                <TabsTrigger value="calendar" className={liquidGlassTabClass}><CalendarIcon className="h-4 w-4 mr-2" /> Calendar</TabsTrigger>
                <TabsTrigger value="directory" className={liquidGlassTabClass}><Users className="h-4 w-4 mr-2" /> Directory</TabsTrigger>
                <TabsTrigger value="actions" className={liquidGlassTabClass}><BookOpen className="h-4 w-4 mr-2" /> Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="classrooms" className="mt-6 space-y-8">
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
                        <Card key={c.name} className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50">
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
                <DemoHighlight stepId="calendar-tab" tooltip="All deadlines, events, and conferences in one view. Color-coded by type for quick scanning.">
                  <h2 className="text-2xl font-bold">Calendar</h2>
                  <div className="space-y-3 mt-4">
                    {[
                      { date: "Feb 17", event: "Chapter 6 Assignment Due", type: "Deadline", color: "border-l-red-500" },
                      { date: "Feb 18", event: "Parent-Teacher Conferences", type: "Event", color: "border-l-blue-500" },
                      { date: "Feb 19", event: "Grading Period Ends", type: "Admin", color: "border-l-purple-500" },
                      { date: "Feb 20", event: "Science Fair Judging", type: "Event", color: "border-l-blue-500" },
                      { date: "Feb 22", event: "Reading Benchmark Period Opens", type: "Assessment", color: "border-l-amber-500" },
                      { date: "Feb 24", event: "Staff Meeting 3:30 PM", type: "Meeting", color: "border-l-green-500" },
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
