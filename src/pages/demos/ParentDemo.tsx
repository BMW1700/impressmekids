import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, UserPlus, Calendar as CalendarIcon, Bell, Shield, 
  ChevronRight, GraduationCap, Sparkles, Link as LinkIcon,
  BookOpen, CheckCircle, Trophy, Clock, MessageSquare, BarChart3,
  TrendingUp, Award, BookOpenCheck, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DemoTourProvider, TourStep } from "@/components/demos/DemoTourGuide";
import { DemoHighlight } from "@/components/demos/DemoHighlight";

const tourSteps: TourStep[] = [
  { id: "child-switcher", title: "Child Switcher", description: "If you have multiple children, switch between them instantly. Each child's data loads separately." },
  { id: "overview-card", title: "Student Overview", description: "See your child's overall grade, reading level, and assignments due at a glance." },
  { id: "insights", title: "Quick Insights", description: "AI-generated summaries of your child's strengths, areas for growth, and engagement patterns." },
  { id: "activity", title: "Recent Activity", description: "Real-time feed of your child's submissions, game results, reading sessions, and achievements." },
  { id: "assignments", title: "Upcoming Assignments", description: "See what's due and when. Help your child plan their study time effectively." },
  { id: "announcements", title: "Announcements", description: "Teacher and school-wide announcements so you never miss important updates." },
  { id: "gradebook-tab", title: "Gradebook", description: "Detailed view of all grades by assignment, subject, and category." },
  { id: "calendar-btn", title: "Calendar", description: "View all upcoming events, assignments, and school dates for your child in one convenient calendar." },
  { id: "safety-btn", title: "Safety", description: "Real-time safety alerts and drill notifications. Get instant confirmation when your child is marked safe during emergencies." },
  { id: "resources", title: "Links & Resources", description: "Access educational resources, school contact info, and helpful links shared by teachers." },
  { id: "notifications-btn", title: "Notifications", description: "Stay up to date with grade changes, new announcements, and important alerts from your child's teachers." },
  { id: "link-student-btn", title: "Link Student", description: "Connect your account to your child's profile to access their grades, assignments, and school activity." },
];

const ParentDemo = () => {
  const [selectedChild, setSelectedChild] = useState("Ben Weiner");
  const [currentTab, setCurrentTab] = useState("overview");

  const childData: Record<string, { grade: string; reading: string; due: string; wpm: string; accuracy: string; streak: string }> = {
    "Ben Weiner": { grade: "A-", reading: "5.2", due: "2", wpm: "112", accuracy: "94%", streak: "5" },
    "Sarah Weiner": { grade: "B+", reading: "4.8", due: "1", wpm: "98", accuracy: "91%", streak: "3" },
  };
  const data = childData[selectedChild];

  const stepsWithActions = tourSteps.map((step) => {
    const tabMap: Record<string, string> = {
      "gradebook-tab": "gradebook",
    };
    return { ...step, action: tabMap[step.id] ? () => setCurrentTab(tabMap[step.id]) : undefined };
  });

  return (
    <DemoTourProvider steps={stepsWithActions}>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-secondary/[0.06] via-secondary/[0.02] to-primary/[0.03]">
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/demos"><Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="h-4 w-4" /> Back to Demos</Button></Link>
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Interactive Parent Demo</Badge>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">Switch between children and tabs to explore</p>
        </div>

        <Header />

        <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl relative pb-32">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" />

          <div className="mb-10 flex items-start justify-between flex-wrap gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="icon-circle icon-circle-purple"><Sparkles className="h-6 w-6 text-white" /></div>
                <h1 className="hero-title gradient-text">Parent Dashboard</h1>
              </div>
              <p className="text-lg text-muted-foreground ml-[68px]">Monitor your children's academic journey</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <DemoHighlight stepId="calendar-btn" tooltip="View all upcoming events, assignments, and school dates for your child.">
                <Button variant="outline" className="gap-2 glass-card border-0 hover:bg-primary/5"><CalendarIcon className="h-4 w-4" /> Calendar</Button>
              </DemoHighlight>
              <DemoHighlight stepId="safety-btn" tooltip="Real-time safety alerts — get instant notification when your child is confirmed safe during drills or emergencies.">
                <Button variant="outline" className="gap-2 glass-card border-0 hover:bg-primary/5"><Shield className="h-4 w-4" /> Safety</Button>
              </DemoHighlight>
              <DemoHighlight stepId="resources" tooltip="Quick access to educational websites, school contact info, and resources shared by teachers.">
                <Button variant="outline" className="gap-2 glass-card border-0 hover:bg-primary/5"><LinkIcon className="h-4 w-4" /> Links & Resources</Button>
              </DemoHighlight>
              <DemoHighlight stepId="notifications-btn" tooltip="Stay up to date with grade changes, announcements, and important alerts from teachers.">
                <Button variant="outline" className="gap-2 glass-card border-0 hover:bg-primary/5"><Bell className="h-4 w-4" /> Notifications</Button>
              </DemoHighlight>
              <DemoHighlight stepId="link-student-btn" tooltip="Connect your account to your child's profile to access their grades, assignments, and activity.">
                <Button variant="gradient" className="gap-2"><UserPlus className="h-4 w-4" /> Link Student</Button>
              </DemoHighlight>
            </div>
          </div>

          <DemoHighlight stepId="child-switcher" tooltip="Toggle between your children's profiles. Each child's grades, reading data, and activity are shown independently.">
            <div className="flex gap-2 flex-wrap mb-6">
              {Object.keys(childData).map((child) => (
                <Button key={child} variant={selectedChild === child ? "gradient" : "outline"} onClick={() => setSelectedChild(child)}
                  className={selectedChild !== child ? "glass-card border-0 hover:bg-primary/5" : ""}>{child}</Button>
              ))}
            </div>
          </DemoHighlight>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-8">
            <TabsList className="glass-card border-0 p-1.5 h-auto">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-dark data-[state=active]:text-white rounded-lg px-6 py-2.5 transition-all">
                Overview
              </TabsTrigger>
              <TabsTrigger value="gradebook" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-dark data-[state=active]:text-white rounded-lg px-6 py-2.5 transition-all">
                <GraduationCap className="h-4 w-4" /> Gradebook
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <DemoHighlight stepId="overview-card" tooltip="Key metrics for your child: overall grade average, current reading level, and number of pending assignments.">
                <Card variant="glass">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"><span className="text-2xl">👦</span></div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedChild}</h2>
                        <p className="text-muted-foreground">5th Grade • Mrs. Davis's Class</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-muted/30"><p className="text-sm text-muted-foreground">Overall Grade</p><p className="text-3xl font-black">{data.grade}</p></div>
                      <div className="p-4 rounded-xl bg-muted/30"><p className="text-sm text-muted-foreground">Reading Level</p><p className="text-3xl font-black">{data.reading}</p></div>
                      <div className="p-4 rounded-xl bg-muted/30"><p className="text-sm text-muted-foreground">Assignments Due</p><p className="text-3xl font-black">{data.due}</p></div>
                    </div>
                  </CardContent>
                </Card>
              </DemoHighlight>

              <div className="grid lg:grid-cols-2 gap-6">
                <DemoHighlight stepId="insights" tooltip="Machine-learning insights identify your child's strengths, areas needing practice, and engagement patterns over time.">
                  <Card variant="glass">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-500" /> Quick Insights</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 rounded-lg bg-green-50 border border-green-200"><p className="text-sm font-medium text-green-800">💪 Strength: Reading comprehension scores are consistently above class average</p></div>
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200"><p className="text-sm font-medium text-amber-800">📈 Opportunity: Math word problems could use extra practice</p></div>
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200"><p className="text-sm font-medium text-blue-800">🔥 {data.streak}-day login streak — keep it up!</p></div>
                      <div className="p-3 rounded-lg bg-purple-50 border border-purple-200"><p className="text-sm font-medium text-purple-800">🎯 Reading fluency improved 8% this month</p></div>
                    </CardContent>
                  </Card>
                </DemoHighlight>
                <DemoHighlight stepId="activity" tooltip="Live feed of everything your child has done — assignments submitted, games played, reading sessions, and achievements earned.">
                  <Card variant="glass">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Recent Activity</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {["📝 Submitted Chapter 5 Comprehension — scored 92% — 2 hours ago", "🎮 Won Jeopardy 1v1 — Yesterday", "📖 AURA Reading: 112 WPM, 94% accuracy — Yesterday", "⭐ Earned 'Bookworm' achievement — 2 days ago", "✅ Completed Math Set 2 — scored 88% — 3 days ago"].map((a, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/30"><p className="text-muted-foreground">{a}</p></div>
                      ))}
                    </CardContent>
                  </Card>
                </DemoHighlight>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <DemoHighlight stepId="assignments" tooltip="Upcoming assignments with due dates and subjects. Help your child stay organized and on top of deadlines.">
                  <Card variant="glass">
                    <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Upcoming Assignments</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {[{ t: "Chapter 6 Reading Comprehension", d: "Due Feb 17", s: "ELA" }, { t: "Math Word Problems Set 3", d: "Due Feb 18", s: "Math" }, { t: "Science Vocabulary Review", d: "Due Feb 20", s: "Science" }].map((a) => (
                        <div key={a.t} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div><p className="font-medium text-sm">{a.t}</p><p className="text-xs text-muted-foreground">{a.d} • {a.s}</p></div>
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </DemoHighlight>
                <DemoHighlight stepId="announcements" tooltip="Messages from teachers and school administrators. Stay informed about events, deadlines, and class updates.">
                  <Card variant="glass">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-red-500" /> Announcements</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { msg: "📢 Mrs. Davis: 'Field trip permission slips due Friday'", time: "1 hour ago" },
                        { msg: "📢 Mr. Thompson: 'Math test next Tuesday — study guide posted'", time: "Yesterday" },
                        { msg: "📢 Principal Wilson: 'Spirit Week starts next Monday!'", time: "2 days ago" },
                      ].map((a, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/30"><p className="text-sm text-muted-foreground">{a.msg}</p><p className="text-xs text-muted-foreground mt-1">{a.time}</p></div>
                      ))}
                    </CardContent>
                  </Card>
                </DemoHighlight>
              </div>
            </TabsContent>

            <TabsContent value="gradebook">
              <DemoHighlight stepId="gradebook-tab" tooltip="Complete grade history organized by assignment. See scores, subjects, and grading categories.">
                <Card variant="glass">
                  <CardHeader><CardTitle>{selectedChild}'s Grades</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50"><tr><th className="text-left p-4 font-medium">Assignment</th><th className="text-left p-4 font-medium">Subject</th><th className="text-left p-4 font-medium">Grade</th><th className="text-left p-4 font-medium">Category</th></tr></thead>
                      <tbody>
                        {[
                          { a: "Chapter 5 Comprehension", s: "ELA", g: "92%", c: "Reading" },
                          { a: "Math Set 2", s: "Math", g: "88%", c: "Problem Solving" },
                          { a: "Science Quiz", s: "Science", g: "95%", c: "Assessment" },
                          { a: "Vocabulary Week 8", s: "ELA", g: "90%", c: "Writing" },
                          { a: "Geometry Basics", s: "Math", g: "85%", c: "Problem Solving" },
                          { a: "History Report", s: "Social Studies", g: "91%", c: "Writing" },
                        ].map((r) => (
                          <tr key={r.a} className="border-t border-border hover:bg-muted/30">
                            <td className="p-4 font-medium">{r.a}</td><td className="p-4">{r.s}</td><td className="p-4 font-bold">{r.g}</td><td className="p-4"><Badge variant="outline" className="text-xs">{r.c}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </DemoHighlight>
            </TabsContent>
          </Tabs>

          <div className="mt-10">
            <h2 className="section-header flex items-center gap-3">
              <div className="icon-circle icon-circle-sm icon-circle-blue"><UserPlus className="h-4 w-4 text-white" /></div>
              Access Requests
            </h2>
            <Card variant="glass" className="mt-4">
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>No pending access requests. Use "Link Student" to connect to your child's account.</p>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </DemoTourProvider>
  );
};

export default ParentDemo;
