import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Users, GraduationCap, Shield, Calendar, Settings, School,
  Link as LinkIcon, FileUp, Zap, Database, UserPlus, UserCheck, ChevronRight,
  Search, Eye, MoreHorizontal, Upload, Clock, AlertTriangle, Download,
  RefreshCw, Bell, Globe, Lock, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { liquidGlassTabClass } from "@/components/ui/liquid-glass-button";
import { DemoTourProvider, TourStep } from "@/components/demos/DemoTourGuide";
import { DemoHighlight } from "@/components/demos/DemoHighlight";

const tourSteps: TourStep[] = [
  { id: "stats", title: "District Overview", description: "At-a-glance metrics for your entire district — total teachers, students, and admin accounts." },
  { id: "teachers-tab", title: "Teacher Management", description: "View all teachers, their class loads, student counts, and verification status. Click any teacher to see details." },
  { id: "students-tab", title: "Student Management", description: "Browse all enrolled students. Filter by grade, school, or class. View profiles and academic data." },
  { id: "admins-tab", title: "Admin Accounts", description: "Manage district and school admin accounts. View roles and access levels." },
  { id: "account-requests", title: "Account Verification", description: "Approve or deny new teacher and staff account requests. Verify identities before granting access." },
  { id: "parent-linking", title: "Parent Access Requests", description: "Review and approve parent requests to link to student records. Verify relationships before granting access." },
  { id: "import-tab", title: "Bulk Import", description: "Upload CSV files to bulk-create student and teacher accounts. Map columns, preview data, and import." },
  { id: "clever-tab", title: "Clever Integration", description: "Sync your roster automatically with Clever for hands-free account management." },
  { id: "calendar-tab", title: "School Calendar", description: "Manage school-wide events, holidays, and important dates visible to all users." },
  { id: "safety-tab", title: "Safety Protocols", description: "Configure emergency drills, security alerts, anonymous reporting, and safety procedures." },
  { id: "backups-tab", title: "Data Backups", description: "Automated database backups, backup history, and data restoration capabilities." },
];

const mockTeachers = [
  { name: "Mrs. Davis", email: "davis@school.edu", classes: 3, students: 82, school: "Lincoln Elementary", verified: true },
  { name: "Mr. Thompson", email: "thompson@school.edu", classes: 2, students: 54, school: "Lincoln Elementary", verified: true },
  { name: "Mrs. Lee", email: "lee@school.edu", classes: 2, students: 48, school: "Lincoln Elementary", verified: true },
  { name: "Ms. Rodriguez", email: "rodriguez@school.edu", classes: 1, students: 24, school: "Washington Elementary", verified: true },
];

const mockStudents = [
  { name: "Emma Johnson", email: "emma.j@school.edu", grade: "5th", classes: 2, school: "Lincoln Elementary" },
  { name: "Liam Martinez", email: "liam.m@school.edu", grade: "5th", classes: 2, school: "Lincoln Elementary" },
  { name: "Sophia Chen", email: "sophia.c@school.edu", grade: "4th", classes: 1, school: "Lincoln Elementary" },
  { name: "Noah Williams", email: "noah.w@school.edu", grade: "5th", classes: 2, school: "Lincoln Elementary" },
  { name: "Olivia Brown", email: "olivia.b@school.edu", grade: "4th", classes: 2, school: "Washington Elementary" },
];

const AdminDemo = () => {
  const [currentTab, setCurrentTab] = useState("teachers");
  const [searchQuery, setSearchQuery] = useState("");

  const stepsWithActions = tourSteps.map((step) => {
    const tabMap: Record<string, string> = {
      "teachers-tab": "teachers", "students-tab": "students", "admins-tab": "admins",
      "account-requests": "teacher-requests", "parent-linking": "parent-requests",
      "import-tab": "import", "clever-tab": "clever", "calendar-tab": "calendar",
      "safety-tab": "safety", "backups-tab": "backups",
    };
    return { ...step, action: tabMap[step.id] ? () => setCurrentTab(tabMap[step.id]) : undefined };
  });

  return (
    <DemoTourProvider steps={stepsWithActions}>
      <Helmet>
        <title>Admin Demo — NabuLearn</title>
        <meta name="description" content="Interactive district admin demo: roster management, Clever sync, bulk import, safety protocols, and account verification." />
        <link rel="canonical" href="https://nabulearn.com/demos/admin" />
        <meta property="og:title" content="Admin Demo — NabuLearn" />
        <meta property="og:description" content="Interactive district admin demo for NabuLearn." />
        <meta property="og:url" content="https://nabulearn.com/demos/admin" />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/demos"><Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="h-4 w-4" /> Back to Demos</Button></Link>
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Interactive Admin Demo</Badge>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">Explore tabs and use the guided tour</p>
        </div>

        <Header showAuthButtons={false} />

        <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl animate-fade-in pb-32">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-4xl font-black text-gradient-purple">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1 text-lg">Platform-wide user management and oversight</p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Button variant="outline" className="flex items-center gap-2"><School className="h-4 w-4" /> Schools</Button>
                <Button variant="outline" className="flex items-center gap-2"><Settings className="h-4 w-4" /> Settings</Button>
              </div>
            </div>

            <DemoHighlight stepId="stats" tooltip="High-level counts for teachers, students, and admins across your entire district. Click any card for details.">
              <div className="grid gap-4 md:grid-cols-3">
                <Card variant="glass" className="hover-lift">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Teachers</CardTitle>
                    <div className="icon-circle-blue w-10 h-10"><Users className="h-5 w-5 text-white" /></div>
                  </CardHeader>
                  <CardContent><div className="text-4xl font-black">8</div><p className="text-xs text-muted-foreground">Across 2 schools</p></CardContent>
                </Card>
                <Card variant="glass" className="hover-lift">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
                    <div className="icon-circle-green w-10 h-10"><GraduationCap className="h-5 w-5 text-white" /></div>
                  </CardHeader>
                  <CardContent><div className="text-4xl font-black">184</div><p className="text-xs text-muted-foreground">Grades 3-5</p></CardContent>
                </Card>
                <Card variant="glass" className="hover-lift">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
                    <div className="icon-circle-purple w-10 h-10"><Shield className="h-5 w-5 text-white" /></div>
                  </CardHeader>
                  <CardContent><div className="text-4xl font-black">3</div><p className="text-xs text-muted-foreground">1 district, 2 school</p></CardContent>
                </Card>
              </div>
            </DemoHighlight>

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
              <div className="space-y-2">
                <TabsList className="grid w-full grid-cols-5 h-auto p-2 bg-muted/50 rounded-xl gap-2">
                  <TabsTrigger value="teachers" className={liquidGlassTabClass}>Teachers</TabsTrigger>
                  <TabsTrigger value="students" className={liquidGlassTabClass}>Students</TabsTrigger>
                  <TabsTrigger value="admins" className={liquidGlassTabClass}>Admins</TabsTrigger>
                  <TabsTrigger value="teacher-requests" className={liquidGlassTabClass}>Account Requests</TabsTrigger>
                  <TabsTrigger value="parent-requests" className={liquidGlassTabClass}>Parental Linking</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-5 h-auto p-2 bg-muted/50 rounded-xl gap-2">
                  <TabsTrigger value="import" className={liquidGlassTabClass}>Import</TabsTrigger>
                  <TabsTrigger value="clever" className={liquidGlassTabClass}>Clever</TabsTrigger>
                  <TabsTrigger value="calendar" className={liquidGlassTabClass}>Calendar</TabsTrigger>
                  <TabsTrigger value="safety" className={liquidGlassTabClass}>Safety</TabsTrigger>
                  <TabsTrigger value="backups" className={liquidGlassTabClass}>Backups</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="teachers" className="space-y-4">
                <DemoHighlight stepId="teachers-tab" tooltip="All verified teachers in your district with class counts, student totals, and school assignments.">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Teachers ({mockTeachers.length})</h2>
                    <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search teachers..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                  </div>
                  <div className="space-y-3 mt-4">
                    {mockTeachers.map((t) => (
                      <Card key={t.name} variant="glass" className="hover-lift cursor-pointer">
                        <CardContent className="p-5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"><span className="text-lg font-bold text-white">{t.name[0]}{t.name.split(" ")[1]?.[0]}</span></div>
                            <div>
                              <p className="font-semibold">{t.name}</p>
                              <p className="text-sm text-muted-foreground">{t.email} • {t.school}</p>
                              <div className="flex gap-2 mt-1"><Badge variant="outline" className="text-xs">{t.classes} classes</Badge><Badge variant="outline" className="text-xs">{t.students} students</Badge></div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Verified</Badge>
                            <Button size="sm" variant="outline"><Eye className="h-3 w-3 mr-1" /> View</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DemoHighlight>
              </TabsContent>

              <TabsContent value="students" className="space-y-4">
                <DemoHighlight stepId="students-tab" tooltip="All enrolled students with grade level, class enrollment, and school assignment. Search or filter to find specific students.">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Students ({mockStudents.length})</h2>
                    <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search students..." className="pl-9" /></div>
                  </div>
                  <div className="space-y-3 mt-4">
                    {mockStudents.map((s) => (
                      <Card key={s.name} variant="glass" className="hover-lift cursor-pointer">
                        <CardContent className="p-5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"><span className="text-lg font-bold text-white">{s.name[0]}{s.name.split(" ")[1]?.[0]}</span></div>
                            <div>
                              <p className="font-semibold">{s.name}</p>
                              <p className="text-sm text-muted-foreground">{s.email} • {s.school}</p>
                              <div className="flex gap-2 mt-1"><Badge variant="outline" className="text-xs">{s.grade} Grade</Badge><Badge variant="outline" className="text-xs">{s.classes} classes</Badge></div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline"><Eye className="h-3 w-3 mr-1" /> View</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DemoHighlight>
              </TabsContent>

              <TabsContent value="admins" className="space-y-4">
                <DemoHighlight stepId="admins-tab" tooltip="District and school admin accounts. District admins have full access; school admins manage their assigned schools.">
                  <h2 className="text-xl font-bold">Admins (3)</h2>
                  <div className="space-y-3 mt-4">
                    {[
                      { name: "Dr. Wilson", role: "District Admin", scope: "Full district access", school: "All Schools" },
                      { name: "Ms. Harper", role: "School Admin", scope: "Lincoln Elementary only", school: "Lincoln Elementary" },
                      { name: "Mr. Blake", role: "School Admin", scope: "Washington Elementary only", school: "Washington Elementary" },
                    ].map((a) => (
                      <Card key={a.name} variant="glass" className="hover-lift">
                        <CardContent className="p-5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Shield className="h-5 w-5 text-white" /></div>
                            <div>
                              <p className="font-semibold">{a.name}</p>
                              <p className="text-sm text-muted-foreground">{a.role} • {a.school}</p>
                              <p className="text-xs text-muted-foreground">{a.scope}</p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DemoHighlight>
              </TabsContent>

              <TabsContent value="teacher-requests" className="space-y-4">
                <DemoHighlight stepId="account-requests" tooltip="New users requesting teacher or staff accounts. Verify their identity and school affiliation before approving.">
                  <h2 className="text-xl font-bold">Account Verification Requests</h2>
                  <div className="space-y-3 mt-4">
                    {[
                      { name: "Ms. Rodriguez", email: "rodriguez@school.edu", role: "Teacher", school: "Washington Elementary", date: "Feb 15, 2026" },
                      { name: "Mr. Kim", email: "kim@school.edu", role: "Teacher", school: "Lincoln Elementary", date: "Feb 14, 2026" },
                    ].map((req) => (
                      <Card key={req.name} variant="glass">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center"><UserCheck className="h-5 w-5 text-amber-700" /></div>
                              <div>
                                <p className="font-semibold">{req.name}</p>
                                <p className="text-sm text-muted-foreground">{req.email} • Requesting {req.role} access</p>
                                <p className="text-xs text-muted-foreground">{req.school} • Submitted {req.date}</p>
                              </div>
                            </div>
                            <div className="flex gap-2"><Button size="sm" className="bg-green-600 hover:bg-green-700">Approve</Button><Button size="sm" variant="outline">Deny</Button></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DemoHighlight>
              </TabsContent>

              <TabsContent value="parent-requests" className="space-y-4">
                <DemoHighlight stepId="parent-linking" tooltip="Parents requesting access to view their child's records. Verify the relationship before granting data access.">
                  <h2 className="text-xl font-bold">Parent Access Requests</h2>
                  <div className="space-y-3 mt-4">
                    {[
                      { parent: "John Parent", child: "Emma Johnson", email: "john.parent@email.com", date: "Feb 15, 2026" },
                      { parent: "Maria Garcia", child: "Liam Martinez", email: "maria.g@email.com", date: "Feb 13, 2026" },
                    ].map((req) => (
                      <Card key={req.parent} variant="glass">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><UserPlus className="h-5 w-5 text-blue-700" /></div>
                              <div>
                                <p className="font-semibold">{req.parent}</p>
                                <p className="text-sm text-muted-foreground">Requesting access to {req.child}'s records</p>
                                <p className="text-xs text-muted-foreground">{req.email} • Submitted {req.date}</p>
                              </div>
                            </div>
                            <div className="flex gap-2"><Button size="sm" className="bg-green-600 hover:bg-green-700">Approve</Button><Button size="sm" variant="outline">Deny</Button></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DemoHighlight>
              </TabsContent>

              <TabsContent value="import" className="space-y-4">
                <DemoHighlight stepId="import-tab" tooltip="Upload a CSV file to create student or teacher accounts in bulk. Map your column headers, preview, then import.">
                  <h2 className="text-xl font-bold">Bulk Import</h2>
                  <div className="grid md:grid-cols-2 gap-6 mt-4">
                    <Card variant="glass" className="hover-lift cursor-pointer">
                      <CardContent className="p-8 text-center">
                        <Upload className="h-12 w-12 mx-auto text-primary mb-4" />
                        <h3 className="font-bold text-lg mb-2">Import Students</h3>
                        <p className="text-sm text-muted-foreground mb-4">Upload a CSV with student names, emails, grades, and school assignments.</p>
                        <Button><Upload className="h-4 w-4 mr-2" /> Upload CSV</Button>
                      </CardContent>
                    </Card>
                    <Card variant="glass" className="hover-lift cursor-pointer">
                      <CardContent className="p-8 text-center">
                        <Upload className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
                        <h3 className="font-bold text-lg mb-2">Import Teachers</h3>
                        <p className="text-sm text-muted-foreground mb-4">Upload a CSV with teacher names, emails, and school assignments.</p>
                        <Button variant="outline"><Upload className="h-4 w-4 mr-2" /> Upload CSV</Button>
                      </CardContent>
                    </Card>
                  </div>
                  <Card variant="glass" className="mt-4">
                    <CardContent className="p-5">
                      <h3 className="font-semibold mb-3">Recent Imports</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <span>students_batch_feb.csv — 45 records</span>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <span>teachers_new.csv — 3 records</span>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DemoHighlight>
              </TabsContent>

              <TabsContent value="clever" className="space-y-4">
                <DemoHighlight stepId="clever-tab" tooltip="Connect to Clever to automatically sync student and teacher rosters. New students appear automatically.">
                  <h2 className="text-xl font-bold">Clever Integration</h2>
                  <Card variant="glass" className="mt-4">
                    <CardContent className="p-8 text-center">
                      <Globe className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                      <h3 className="font-bold text-lg mb-2">Connect with Clever</h3>
                      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">Sync your roster with Clever for automated student and teacher account management. New enrollments, class changes, and withdrawals update automatically.</p>
                      <div className="flex justify-center gap-3">
                        <Button className="bg-blue-600 hover:bg-blue-700"><Zap className="h-4 w-4 mr-2" /> Connect Clever</Button>
                        <Button variant="outline">Learn More</Button>
                      </div>
                      <div className="mt-6 p-4 rounded-lg bg-muted/30 max-w-md mx-auto">
                        <p className="text-sm text-muted-foreground">Status: <span className="font-medium text-amber-600">Not Connected</span></p>
                      </div>
                    </CardContent>
                  </Card>
                </DemoHighlight>
              </TabsContent>

              <TabsContent value="calendar" className="space-y-4">
                <DemoHighlight stepId="calendar-tab" tooltip="School-wide calendar visible to all users. Manage holidays, events, testing windows, and district dates.">
                  <h2 className="text-xl font-bold">School Calendar</h2>
                  <div className="space-y-3 mt-4">
                    {[
                      { date: "Feb 17", event: "Presidents' Day — No School", type: "Holiday", color: "border-l-green-500" },
                      { date: "Feb 18", event: "Parent-Teacher Conferences", type: "Event", color: "border-l-blue-500" },
                      { date: "Feb 22", event: "Reading Benchmark Window Opens", type: "Assessment", color: "border-l-amber-500" },
                      { date: "Mar 1", event: "State Testing Begins", type: "Assessment", color: "border-l-red-500" },
                      { date: "Mar 15", event: "Spring Break Starts", type: "Holiday", color: "border-l-green-500" },
                      { date: "Mar 24", event: "School Resumes", type: "Admin", color: "border-l-purple-500" },
                    ].map((e) => (
                      <Card key={e.event} variant="glass" className={`hover-lift border-l-4 ${e.color}`}>
                        <CardContent className="p-5 flex items-center gap-4">
                          <div className="text-center min-w-[50px]"><p className="text-xs text-muted-foreground">{e.date.split(" ")[0]}</p><p className="text-xl font-black">{e.date.split(" ")[1]}</p></div>
                          <div className="flex-1"><p className="font-medium">{e.event}</p></div>
                          <Badge variant="outline" className="text-xs">{e.type}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Button variant="outline" className="mt-4">+ Add Event</Button>
                </DemoHighlight>
              </TabsContent>

              <TabsContent value="safety" className="space-y-4">
                <DemoHighlight stepId="safety-tab" tooltip="Configure emergency procedures, manage anonymous reporting, and view safety alert sources.">
                  <h2 className="text-xl font-bold">Safety & Security</h2>
                  <div className="grid md:grid-cols-2 gap-6 mt-4">
                    <Card variant="glass" className="border-l-4 border-l-red-500">
                      <CardContent className="p-6">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" /> Emergency Protocols</h3>
                        <p className="text-sm text-muted-foreground mb-3">Configure and manage emergency drill schedules and procedures.</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between p-2 rounded bg-muted/30"><span>Fire Drill</span><span className="text-muted-foreground">Last: Feb 5</span></div>
                          <div className="flex justify-between p-2 rounded bg-muted/30"><span>Lockdown Drill</span><span className="text-muted-foreground">Last: Jan 22</span></div>
                          <div className="flex justify-between p-2 rounded bg-muted/30"><span>Tornado Drill</span><span className="text-muted-foreground">Last: Jan 10</span></div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card variant="glass" className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Bell className="h-5 w-5 text-blue-500" /> Anonymous Reports</h3>
                        <p className="text-sm text-muted-foreground mb-3">Review anonymous safety reports submitted by students and staff.</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center p-2 rounded bg-muted/30"><span>Pending reports</span><Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">2</Badge></div>
                          <div className="flex justify-between p-2 rounded bg-muted/30"><span>Resolved this month</span><span className="font-semibold">5</span></div>
                        </div>
                        <Button size="sm" variant="outline" className="mt-3">Review Reports</Button>
                      </CardContent>
                    </Card>
                    <Card variant="glass" className="border-l-4 border-l-green-500">
                      <CardContent className="p-6">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Lock className="h-5 w-5 text-green-500" /> Access Controls</h3>
                        <p className="text-sm text-muted-foreground mb-3">Manage building access, visitor policies, and security cameras.</p>
                        <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle className="h-4 w-4" /> All systems operational</div>
                      </CardContent>
                    </Card>
                    <Card variant="glass" className="border-l-4 border-l-purple-500">
                      <CardContent className="p-6">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Globe className="h-5 w-5 text-purple-500" /> Alert Sources</h3>
                        <p className="text-sm text-muted-foreground mb-3">External alert integrations for weather, Amber alerts, and local emergencies.</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between p-2 rounded bg-muted/30"><span>Weather Service</span><Badge className="bg-green-100 text-green-700 hover:bg-green-100">Connected</Badge></div>
                          <div className="flex justify-between p-2 rounded bg-muted/30"><span>Local PD</span><Badge className="bg-green-100 text-green-700 hover:bg-green-100">Connected</Badge></div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </DemoHighlight>
              </TabsContent>

              <TabsContent value="backups" className="space-y-4">
                <DemoHighlight stepId="backups-tab" tooltip="Automated daily backups with point-in-time recovery. Download backups or restore data when needed.">
                  <h2 className="text-xl font-bold">Data Backups</h2>
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <Card variant="glass"><CardContent className="p-5 text-center"><Database className="h-8 w-8 mx-auto text-primary mb-2" /><p className="text-sm text-muted-foreground">Last Backup</p><p className="text-lg font-bold">Today 3:00 AM</p></CardContent></Card>
                    <Card variant="glass"><CardContent className="p-5 text-center"><RefreshCw className="h-8 w-8 mx-auto text-emerald-500 mb-2" /><p className="text-sm text-muted-foreground">Backup Frequency</p><p className="text-lg font-bold">Every 24h</p></CardContent></Card>
                    <Card variant="glass"><CardContent className="p-5 text-center"><Download className="h-8 w-8 mx-auto text-blue-500 mb-2" /><p className="text-sm text-muted-foreground">Total Backups</p><p className="text-lg font-bold">47</p></CardContent></Card>
                  </div>
                  <Card variant="glass" className="mt-4">
                    <CardHeader><CardTitle>Backup History</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        {[
                          { name: "auto_backup_2026-02-16", size: "2.4 GB", status: "Complete", tables: 42 },
                          { name: "auto_backup_2026-02-15", size: "2.3 GB", status: "Complete", tables: 42 },
                          { name: "auto_backup_2026-02-14", size: "2.3 GB", status: "Complete", tables: 42 },
                          { name: "manual_backup_2026-02-10", size: "2.2 GB", status: "Complete", tables: 42 },
                        ].map((b) => (
                          <div key={b.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <div><p className="font-medium">{b.name}</p><p className="text-xs text-muted-foreground">{b.size} • {b.tables} tables</p></div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{b.status}</Badge>
                              <Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1" /> Download</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <div className="flex gap-3 mt-4">
                    <Button><Database className="h-4 w-4 mr-2" /> Create Manual Backup</Button>
                    <Button variant="outline"><RefreshCw className="h-4 w-4 mr-2" /> Restore from Backup</Button>
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

export default AdminDemo;
