import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, GraduationCap, BookOpen, TrendingUp, Download } from "lucide-react";
import { toast } from "sonner";

interface DistrictStats {
  totalClassrooms: number;
  totalTeachers: number;
  totalStudents: number;
  avgAuraScore: number;
  activeUsersToday: number;
}

const DistrictDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DistrictStats>({
    totalClassrooms: 0,
    totalTeachers: 0,
    totalStudents: 0,
    avgAuraScore: 0,
    activeUsersToday: 0
  });
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

    // Check if district admin account exists
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
  };

  const loadStats = async () => {
    // Get total classrooms
    const { count: classroomCount } = await supabase
      .from("classrooms")
      .select("*", { count: "exact", head: true });

    // Get total teachers (unique teacher_ids from classrooms)
    const { data: teachers } = await supabase
      .from("classrooms")
      .select("teacher_id");
    const uniqueTeachers = new Set(teachers?.map(t => t.teacher_id)).size;

    // Get total students
    const { count: studentCount } = await supabase
      .from("classroom_students")
      .select("*", { count: "exact", head: true });

    // Get average AURA score
    const { data: auraRecords } = await supabase
      .from("aura_records")
      .select("grade");
    
    const avgAura = auraRecords && auraRecords.length > 0
      ? Math.round(auraRecords.reduce((sum, r) => sum + (r.grade || 0), 0) / auraRecords.length)
      : 0;

    // Get active users today (AURA records or assignment submissions)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: activeCount } = await supabase
      .from("aura_records")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    setStats({
      totalClassrooms: classroomCount || 0,
      totalTeachers: uniqueTeachers,
      totalStudents: studentCount || 0,
      avgAuraScore: avgAura,
      activeUsersToday: activeCount || 0
    });

    setLoading(false);
  };

  const exportRoster = async () => {
    // Get all students with their classrooms
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

    // Convert to CSV
    const csv = [
      ["Student Name", "Student Email", "Classroom", "Student ID"].join(","),
      ...data.map((row: any) => [
        row.profiles?.full_name || "Unknown",
        row.profiles?.email || "Unknown",
        row.classrooms?.name || "Unknown",
        row.student_id
      ].join(","))
    ].join("\n");

    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `district-roster-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Roster exported successfully");
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
            <p className="text-muted-foreground">Platform-wide analytics and management</p>
          </div>
          <Button onClick={exportRoster}>
            <Download className="mr-2 h-4 w-4" />
            Export Roster (CSV)
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Classrooms</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClassrooms}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg AURA Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgAuraScore}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsersToday}</div>
              <p className="text-xs text-muted-foreground">Students using platform today</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" onClick={() => navigate("/district/classrooms")}>
              <BookOpen className="mr-2 h-4 w-4" />
              View All Classrooms
            </Button>
            <Button variant="outline" onClick={() => navigate("/district/teachers")}>
              <GraduationCap className="mr-2 h-4 w-4" />
              View All Teachers
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default DistrictDashboard;
