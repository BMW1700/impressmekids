import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Users, GraduationCap, Shield, Calendar, Settings, School,
  Link as LinkIcon, FileUp, Zap, Database, UserPlus, UserCheck, ChevronRight,
  Search, Eye, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { liquidGlassTabClass } from "@/components/ui/liquid-glass-button";

const mockTeachers = [
  { name: "Mrs. Davis", email: "davis@school.edu", classes: 3, students: 82, school: "Lincoln Elementary", verified: true },
  { name: "Mr. Thompson", email: "thompson@school.edu", classes: 2, students: 54, school: "Lincoln Elementary", verified: true },
  { name: "Mrs. Lee", email: "lee@school.edu", classes: 2, students: 48, school: "Lincoln Elementary", verified: true },
];
const mockStudents = [
  { name: "Emma Johnson", email: "emma.j@school.edu", grade: "5th", classes: 2, school: "Lincoln Elementary" },
  { name: "Liam Martinez", email: "liam.m@school.edu", grade: "5th", classes: 2, school: "Lincoln Elementary" },
  { name: "Sophia Chen", email: "sophia.c@school.edu", grade: "4th", classes: 1, school: "Lincoln Elementary" },
  { name: "Noah Williams", email: "noah.w@school.edu", grade: "5th", classes: 2, school: "Lincoln Elementary" },
];

const AdminDemo = () => {
  const [currentTab, setCurrentTab] = useState("teachers");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Demo banner */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/demos"><Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="h-4 w-4" /> Back to Demos</Button></Link>
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Interactive Admin Demo</Badge>
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block">Explore tabs and interact with user management</p>
      </div>

      <Header showAuthButtons={false} />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
        <div className="space-y-6">
          {/* Header */}
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

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card variant="glass" className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Teachers</CardTitle>
                <div className="icon-circle-blue w-10 h-10"><Users className="h-5 w-5 text-white" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black">8</div>
                <p className="text-xs text-muted-foreground">Teachers in your district</p>
              </CardContent>
            </Card>
            <Card variant="glass" className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
                <div className="icon-circle-green w-10 h-10"><GraduationCap className="h-5 w-5 text-white" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black">184</div>
                <p className="text-xs text-muted-foreground">Students in your district</p>
              </CardContent>
            </Card>
            <Card variant="glass" className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
                <div className="icon-circle-purple w-10 h-10"><Shield className="h-5 w-5 text-white" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black">3</div>
                <p className="text-xs text-muted-foreground">Admins in your district</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
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
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Teachers ({mockTeachers.length})</h2>
                <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search teachers..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
              </div>
              <div className="space-y-3">
                {mockTeachers.map((t) => (
                  <Card key={t.name} variant="glass" className="hover-lift cursor-pointer">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"><span className="text-lg font-bold text-white">{t.name[0]}{t.name.split(" ")[1]?.[0]}</span></div>
                        <div>
                          <p className="font-semibold">{t.name}</p>
                          <p className="text-sm text-muted-foreground">{t.email}</p>
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
            </TabsContent>

            <TabsContent value="students" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Students ({mockStudents.length})</h2>
                <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search students..." className="pl-9" /></div>
              </div>
              <div className="space-y-3">
                {mockStudents.map((s) => (
                  <Card key={s.name} variant="glass" className="hover-lift cursor-pointer">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"><span className="text-lg font-bold text-white">{s.name[0]}{s.name.split(" ")[1]?.[0]}</span></div>
                        <div>
                          <p className="font-semibold">{s.name}</p>
                          <p className="text-sm text-muted-foreground">{s.email}</p>
                          <div className="flex gap-2 mt-1"><Badge variant="outline" className="text-xs">{s.grade} Grade</Badge><Badge variant="outline" className="text-xs">{s.classes} classes</Badge></div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline"><Eye className="h-3 w-3 mr-1" /> View</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="admins" className="space-y-4">
              <h2 className="text-xl font-bold">Admins (3)</h2>
              {["Dr. Wilson (District Admin)", "Ms. Harper (School Admin)", "Mr. Blake (School Admin)"].map((a) => (
                <Card key={a} variant="glass" className="hover-lift">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Shield className="h-5 w-5 text-white" /></div>
                      <p className="font-semibold">{a}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="teacher-requests" className="space-y-4">
              <h2 className="text-xl font-bold">Account Verification Requests</h2>
              <Card variant="glass">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center"><UserCheck className="h-5 w-5 text-amber-700" /></div>
                    <div>
                      <p className="font-semibold">Ms. Rodriguez</p>
                      <p className="text-sm text-muted-foreground">rodriguez@school.edu • Requesting Teacher access</p>
                    </div>
                  </div>
                  <div className="flex gap-2"><Button size="sm" className="bg-green-600 hover:bg-green-700">Approve</Button><Button size="sm" variant="outline">Deny</Button></div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="parent-requests" className="space-y-4">
              <h2 className="text-xl font-bold">Parent Access Requests</h2>
              <Card variant="glass">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><UserPlus className="h-5 w-5 text-blue-700" /></div>
                    <div>
                      <p className="font-semibold">John Parent</p>
                      <p className="text-sm text-muted-foreground">Requesting access to Emma Johnson's records</p>
                    </div>
                  </div>
                  <div className="flex gap-2"><Button size="sm" className="bg-green-600 hover:bg-green-700">Approve</Button><Button size="sm" variant="outline">Deny</Button></div>
                </CardContent>
              </Card>
            </TabsContent>

            {["import", "clever", "calendar", "safety", "backups"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <Card variant="glass">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground capitalize">{
                      tab === "import" ? "Bulk import students via CSV upload. Map columns, preview data, and import in one step." :
                      tab === "clever" ? "Sync your roster with Clever for automated student and teacher account management." :
                      tab === "calendar" ? "Manage school-wide events, holidays, and important dates visible to all users." :
                      tab === "safety" ? "Configure safety protocols, emergency drills, and security alert systems." :
                      "Manage automated database backups, view backup history, and restore data when needed."
                    }</p>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDemo;
