import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Users, BookOpen, Brain, Calendar as CalendarIcon,
  PlusCircle, Sparkles, BarChart3, AlertCircle, Link as LinkIcon, Eye,
  GraduationCap, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { liquidGlassTabClass } from "@/components/ui/liquid-glass-button";

const TeacherDemo = () => {
  const [showAssignmentHint, setShowAssignmentHint] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Demo banner */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/demos"><Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="h-4 w-4" /> Back to Demos</Button></Link>
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Interactive Teacher Demo</Badge>
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block">Click tabs and cards to explore the teacher experience</p>
      </div>

      <Header showAuthButtons={false} />

      <main className="flex-1 py-8 animate-fade-in">
        <div className="container mx-auto px-4">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-[#9B6DD6] to-[#D4A04A] bg-clip-text text-transparent">
              Welcome, Demo Teacher! <span className="text-[#9B6DD6]">👋</span>
            </h1>
            <p className="text-muted-foreground text-lg">Here's your classroom at a glance</p>
          </div>

          {/* AI Insights Card */}
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
                  <p className="text-muted-foreground mb-4">Get real-time reading analytics, identify at-risk students, and track classroom progress with ML-powered tools.</p>
                  <div className="flex flex-wrap gap-3">
                    <Button className="bg-primary hover:bg-primary/90 text-white"><BarChart3 className="h-4 w-4 mr-2" /> View Analytics</Button>
                    <Button variant="outline" className="bg-card hover:bg-muted"><AlertCircle className="h-4 w-4 mr-2" /> At-Risk Students</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Classrooms</CardTitle>
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center"><Users className="h-5 w-5 text-amber-500" /></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-primary">3</span>
                  <span className="text-sm text-emerald-500 font-medium">↗ Active</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center"><BookOpen className="h-5 w-5 text-amber-500" /></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black bg-gradient-to-b from-[#9B6DD6] to-[#D4A04A] bg-clip-text text-transparent">82</span>
                  <span className="text-sm text-emerald-500 font-medium">↗ Enrolled</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Assignments</CardTitle>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Brain className="h-5 w-5 text-primary" /></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-primary">12</span>
                  <Badge className="bg-amber-400 text-amber-900 hover:bg-amber-400 border-0 text-xs">ML-Powered</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="classrooms" className="w-full">
            <TabsList className="flex flex-wrap justify-center w-full h-auto p-2 bg-muted/50 rounded-xl gap-2">
              <TabsTrigger value="classrooms" className={liquidGlassTabClass}><Users className="h-4 w-4 mr-2" /> Classrooms</TabsTrigger>
              <TabsTrigger value="links" className={liquidGlassTabClass}><LinkIcon className="h-4 w-4 mr-2" /> Links</TabsTrigger>
              <TabsTrigger value="calendar" className={liquidGlassTabClass}><CalendarIcon className="h-4 w-4 mr-2" /> Calendar</TabsTrigger>
              <TabsTrigger value="directory" className={liquidGlassTabClass}><Users className="h-4 w-4 mr-2" /> Directory</TabsTrigger>
              <TabsTrigger value="actions" className={liquidGlassTabClass}><BookOpen className="h-4 w-4 mr-2" /> Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="classrooms" className="mt-6 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">My Classrooms</h2>
                  <Button className="bg-gradient-primary hover:opacity-90"><PlusCircle className="mr-2 h-4 w-4" /> Create Classroom</Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: "5th Grade ELA – Period 1", students: 28, code: "ABC-123", assignments: 4 },
                    { name: "5th Grade ELA – Period 3", students: 26, code: "DEF-456", assignments: 4 },
                    { name: "5th Grade ELA – Period 5", students: 28, code: "GHI-789", assignments: 4 },
                  ].map((c) => (
                    <Card key={c.name} className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-white" />
                          </div>
                          <Badge variant="outline" className="text-xs">{c.code}</Badge>
                        </div>
                        <h3 className="text-lg font-bold mb-2">{c.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{c.students} students</span>
                          <span>{c.assignments} assignments</span>
                        </div>
                        <Button size="sm" variant="outline" className="mt-4 w-full"><Eye className="h-4 w-4 mr-1" /> View Classroom</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="links" className="mt-6">
              <Card variant="glass"><CardContent className="p-8 text-center"><p className="text-muted-foreground">Save and organize links to educational resources, tools, and websites for quick access.</p></CardContent></Card>
            </TabsContent>

            <TabsContent value="calendar" className="mt-6 space-y-4">
              <h2 className="text-2xl font-bold">Calendar</h2>
              {[
                { date: "Feb 17", event: "Chapter 6 Assignment Due", type: "deadline" },
                { date: "Feb 18", event: "Parent-Teacher Conferences", type: "event" },
                { date: "Feb 20", event: "Science Fair Judging", type: "event" },
                { date: "Feb 22", event: "Reading Benchmark Period Opens", type: "assessment" },
              ].map((e) => (
                <Card key={e.event} variant="glass" className="hover-lift cursor-pointer">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="text-center min-w-[50px]"><p className="text-xs text-muted-foreground">{e.date.split(" ")[0]}</p><p className="text-xl font-black">{e.date.split(" ")[1]}</p></div>
                    <div className="flex-1"><p className="font-medium">{e.event}</p></div>
                    <Badge variant="outline" className="text-xs">{e.type}</Badge>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="directory" className="mt-6">
              <Card variant="glass"><CardContent className="p-8 text-center"><p className="text-muted-foreground">View and search the school directory — find students, parents, and staff contact information.</p></CardContent></Card>
            </TabsContent>

            <TabsContent value="actions" className="mt-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { icon: Sparkles, title: "Browse Games", desc: "Explore educational games to share with your students", color: "from-indigo-500 to-violet-500" },
                  { icon: BookOpen, title: "Story Library", desc: "Manage reading passages and stories for assignments", color: "from-emerald-500 to-teal-500" },
                  { icon: BarChart3, title: "AURA Analytics", desc: "View detailed reading analytics and student progress", color: "from-amber-500 to-orange-500" },
                  { icon: Brain, title: "ML Model Training", desc: "Train and configure AI models for your classroom", color: "from-purple-500 to-pink-500" },
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
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TeacherDemo;
