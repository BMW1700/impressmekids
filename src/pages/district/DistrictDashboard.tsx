import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, GraduationCap, BookOpen, TrendingUp, Download, Shield, FileText, BarChart3, Building2 } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

interface DistrictStats {
  totalClassrooms: number;
  totalTeachers: number;
  totalStudents: number;
  avgAuraScore: number;
  activeUsersToday: number;
  totalAssignments: number;
  avgAttendance: number;
}

interface SchoolData {
  school_name: string;
  total_students: number;
  total_teachers: number;
  total_classrooms: number;
  avg_aura: number;
  active_today: number;
}

interface DrillData {
  drill_type: string;
  total_drills: number;
  avg_attendance_rate: number;
  last_drill_date: string;
}

const DistrictDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DistrictStats>({
    totalClassrooms: 0,
    totalTeachers: 0,
    totalStudents: 0,
    avgAuraScore: 0,
    activeUsersToday: 0,
    totalAssignments: 0,
    avgAttendance: 0
  });
  const [schoolData, setSchoolData] = useState<SchoolData[]>([]);
  const [drillData, setDrillData] = useState<DrillData[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: districtAdmin } = await supabase
      .from("district_admins")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!districtAdmin) {
      toast.error("You do not have district admin access");
      navigate("/");
      return;
    }

    loadStats();
    loadSchoolComparison();
    loadDrillAnalytics();
  };

  const loadStats = async () => {
    const { count: classroomCount } = await supabase
      .from("classrooms")
      .select("*", { count: "exact", head: true });

    const { data: teachers } = await supabase
      .from("classrooms")
      .select("teacher_id");
    const uniqueTeachers = new Set(teachers?.map(t => t.teacher_id)).size;

    const { count: studentCount } = await supabase
      .from("classroom_students")
      .select("*", { count: "exact", head: true });

    const { data: auraRecords } = await supabase
      .from("aura_records")
      .select("grade");
    
    const avgAura = auraRecords && auraRecords.length > 0
      ? Math.round(auraRecords.reduce((sum, r) => sum + (r.grade || 0), 0) / auraRecords.length)
      : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: activeCount } = await supabase
      .from("aura_records")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    const { count: assignmentCount } = await supabase
      .from("assignments")
      .select("*", { count: "exact", head: true });

    const { data: attendanceRecords } = await supabase
      .from("attendance_records")
      .select("status")
      .gte("date", today.toISOString().split('T')[0]);
    
    const avgAttendance = attendanceRecords && attendanceRecords.length > 0
      ? Math.round((attendanceRecords.filter(r => r.status === 'present').length / attendanceRecords.length) * 100)
      : 0;

    setStats({
      totalClassrooms: classroomCount || 0,
      totalTeachers: uniqueTeachers,
      totalStudents: studentCount || 0,
      avgAuraScore: avgAura,
      activeUsersToday: activeCount || 0,
      totalAssignments: assignmentCount || 0,
      avgAttendance: avgAttendance
    });

    setLoading(false);
  };

  const loadSchoolComparison = async () => {
    // Mock cross-school data for demo (in production, this would query by school/district)
    const mockSchools: SchoolData[] = [
      { school_name: "Lincoln Elementary", total_students: 450, total_teachers: 25, total_classrooms: 18, avg_aura: 87, active_today: 320 },
      { school_name: "Washington Middle", total_students: 620, total_teachers: 35, total_classrooms: 24, avg_aura: 82, active_today: 485 },
      { school_name: "Jefferson High", total_students: 890, total_teachers: 48, total_classrooms: 32, avg_aura: 79, active_today: 567 },
      { school_name: "Roosevelt Elementary", total_students: 380, total_teachers: 22, total_classrooms: 15, avg_aura: 91, active_today: 298 },
    ];
    setSchoolData(mockSchools);
  };

  const loadDrillAnalytics = async () => {
    const { data: drills } = await supabase
      .from("drill_sessions")
      .select("drill_type, created_at, drill_attendance(status)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!drills) return;

    const drillMap = new Map<string, { total: number; present: number; last: string }>();
    
    drills.forEach((drill: any) => {
      if (!drillMap.has(drill.drill_type)) {
        drillMap.set(drill.drill_type, { total: 0, present: 0, last: drill.created_at });
      }
      const entry = drillMap.get(drill.drill_type)!;
      entry.total++;
      entry.present += drill.drill_attendance?.filter((d: any) => d.status === 'present').length || 0;
    });

    const analytics: DrillData[] = Array.from(drillMap.entries()).map(([type, data]) => ({
      drill_type: type,
      total_drills: data.total,
      avg_attendance_rate: Math.round((data.present / data.total) * 100),
      last_drill_date: new Date(data.last).toLocaleDateString()
    }));

    setDrillData(analytics);
  };

  const exportRoster = async () => {
    const { data } = await supabase
      .from("classroom_students")
      .select(`
        student_id,
        classroom_id,
        classrooms(name, teacher_id),
        profiles!student_id(full_name, email)
      `);

    if (!data) {
      toast.error("Error fetching roster data");
      return;
    }

    const csv = [
      ["Student Name", "Student Email", "Classroom", "Student ID"].join(","),
      ...data.map((row: any) => [
        row.profiles?.full_name || "Unknown",
        row.profiles?.email || "Unknown",
        row.classrooms?.name || "Unknown",
        row.student_id
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `district-roster-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Roster exported successfully");
  };

  const exportDistrictReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      summary: stats,
      schools: schoolData,
      drill_performance: drillData
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `district-report-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    toast.success("District report exported");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">District Dashboard</h1>
            <p className="text-muted-foreground">Cross-school analytics and district-wide insights</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportRoster} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Roster
            </Button>
            <Button onClick={exportDistrictReport}>
              <FileText className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="schools">
              <Building2 className="mr-2 h-4 w-4" />
              Schools
            </TabsTrigger>
            <TabsTrigger value="safety">
              <Shield className="mr-2 h-4 w-4" />
              Safety & Drills
            </TabsTrigger>
            <TabsTrigger value="engagement">
              <TrendingUp className="mr-2 h-4 w-4" />
              Engagement
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground mt-1">Across {stats.totalClassrooms} classrooms</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTeachers}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stats.totalClassrooms} active classrooms</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Avg AURA Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avgAuraScore}%</div>
                  <p className="text-xs text-muted-foreground mt-1">District-wide average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Today</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeUsersToday}</div>
                  <p className="text-xs text-muted-foreground mt-1">Students active today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalAssignments}</div>
                  <p className="text-xs text-muted-foreground mt-1">Created this year</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avgAttendance}%</div>
                  <p className="text-xs text-muted-foreground mt-1">This week</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cross-School Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={schoolData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="school_name" angle={-15} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total_students" fill="hsl(var(--primary))" name="Students" />
                    <Bar dataKey="avg_aura" fill="hsl(var(--chart-2))" name="Avg AURA Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {schoolData.map((school) => (
                <Card key={school.school_name}>
                  <CardHeader>
                    <CardTitle className="text-lg">{school.school_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Students:</span>
                        <span className="font-semibold">{school.total_students}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Teachers:</span>
                        <span className="font-semibold">{school.total_teachers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Classrooms:</span>
                        <span className="font-semibold">{school.total_classrooms}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg AURA:</span>
                        <span className="font-semibold">{school.avg_aura}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Today:</span>
                        <span className="font-semibold">{school.active_today}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="safety" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>District-Wide Drill Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {drillData.length > 0 ? (
                    drillData.map((drill) => (
                      <div key={drill.drill_type} className="border-l-4 border-primary pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold capitalize">{drill.drill_type} Drills</h3>
                            <p className="text-sm text-muted-foreground">Last drill: {drill.last_drill_date}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{drill.avg_attendance_rate}%</div>
                            <p className="text-xs text-muted-foreground">Avg attendance</p>
                          </div>
                        </div>
                        <p className="text-sm">Total drills conducted: {drill.total_drills}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No drill data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Button variant="outline" onClick={() => navigate("/admin/safety")} className="h-auto py-4">
                <Shield className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Safety Dashboard</div>
                  <div className="text-xs text-muted-foreground">View real-time safety alerts</div>
                </div>
              </Button>
              <Button variant="outline" onClick={() => navigate("/admin/safety/drill")} className="h-auto py-4">
                <Shield className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Schedule Drill</div>
                  <div className="text-xs text-muted-foreground">Coordinate district-wide drills</div>
                </div>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Engagement Trends (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { day: "Week 1", active: 1240, avg_score: 82 },
                    { day: "Week 2", active: 1350, avg_score: 84 },
                    { day: "Week 3", active: 1420, avg_score: 86 },
                    { day: "Week 4", active: 1580, avg_score: 88 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="active" stroke="hsl(var(--primary))" name="Active Users" strokeWidth={2} />
                    <Line type="monotone" dataKey="avg_score" stroke="hsl(var(--chart-2))" name="Avg Score" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate District Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={exportRoster} variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Export Full District Roster (CSV)
                </Button>
                <Button onClick={exportDistrictReport} variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Export Performance Report (JSON)
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.print()}>
                  <FileText className="mr-2 h-4 w-4" />
                  Print Summary Report (PDF)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" onClick={() => navigate("/admin/calendar")}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  View District Calendar
                </Button>
                <Button variant="outline" onClick={() => navigate("/admin/settings")}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  District Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default DistrictDashboard;
