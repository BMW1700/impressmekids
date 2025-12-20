import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, Clock, TrendingUp, AlertTriangle, CheckCircle, Search, Download } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SchoolMetrics {
  school_id: string;
  school_name: string;
  total_drills: number;
  avg_completion_time: number;
  avg_accountability_rate: number;
  last_drill_date: string | null;
  compliance_status: "compliant" | "at_risk" | "non_compliant";
  total_students: number;
  total_teachers: number;
}

interface DrillSummary {
  school_name: string;
  drills_completed: number;
  avg_time: number;
  accountability: number;
}

export function MultiDistrictDashboard() {
  const [schools, setSchools] = useState<SchoolMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [chartData, setChartData] = useState<DrillSummary[]>([]);

  useEffect(() => {
    fetchDistrictData();
  }, []);

  const fetchDistrictData = async () => {
    try {
      // Fetch all schools/districts
      const { data: districts } = await supabase
        .from("districts")
        .select("*")
        .eq("is_visible", true);

      if (!districts) {
        setLoading(false);
        return;
      }

      const metricsPromises = districts.map(async (district) => {
        // Get drill sessions for this school
        const { data: drillSessions } = await supabase
          .from("drill_sessions")
          .select("*")
          .eq("school_id", district.district_code)
          .eq("status", "completed");

        // Get teachers count
        const { count: teacherCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("district_id", district.district_code)
          .eq("role", "teacher");

        // Get students count  
        const { count: studentCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("district_id", district.district_code)
          .eq("role", "student");

        const totalDrills = drillSessions?.length || 0;
        let avgCompletionTime = 0;
        let avgAccountability = 0;
        let lastDrillDate: string | null = null;

        if (drillSessions && drillSessions.length > 0) {
          // Calculate average completion time
          const completionTimes = drillSessions
            .filter((d) => d.started_at && d.ended_at)
            .map((d) => (new Date(d.ended_at!).getTime() - new Date(d.started_at!).getTime()) / 60000);

          avgCompletionTime = completionTimes.length > 0 
            ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length 
            : 0;

          // Get attendance data for accountability rate
          for (const session of drillSessions.slice(0, 10)) {
            const { data: attendance } = await supabase
              .from("drill_attendance")
              .select("status")
              .eq("drill_session_id", session.id);

            if (attendance && attendance.length > 0) {
              const accounted = attendance.filter((a) => a.status === "present").length;
              avgAccountability += (accounted / attendance.length) * 100;
            }
          }
          avgAccountability = avgAccountability / Math.min(drillSessions.length, 10);

          // Get last drill date
          const sortedDrills = drillSessions.sort(
            (a, b) => new Date(b.started_at!).getTime() - new Date(a.started_at!).getTime()
          );
          lastDrillDate = sortedDrills[0]?.started_at || null;
        }

        // Determine compliance status
        let complianceStatus: "compliant" | "at_risk" | "non_compliant" = "compliant";
        if (totalDrills === 0 || avgAccountability < 80) {
          complianceStatus = "non_compliant";
        } else if (avgAccountability < 90 || avgCompletionTime > 10) {
          complianceStatus = "at_risk";
        }

        return {
          school_id: district.district_code,
          school_name: district.name,
          total_drills: totalDrills,
          avg_completion_time: avgCompletionTime,
          avg_accountability_rate: avgAccountability,
          last_drill_date: lastDrillDate,
          compliance_status: complianceStatus,
          total_students: studentCount || 0,
          total_teachers: teacherCount || 0,
        };
      });

      const metrics = await Promise.all(metricsPromises);
      setSchools(metrics);

      // Prepare chart data
      const chartData = metrics.slice(0, 10).map((m) => ({
        school_name: m.school_name.length > 15 ? m.school_name.substring(0, 15) + "..." : m.school_name,
        drills_completed: m.total_drills,
        avg_time: parseFloat(m.avg_completion_time.toFixed(1)),
        accountability: parseFloat(m.avg_accountability_rate.toFixed(1)),
      }));
      setChartData(chartData);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching district data:", error);
      setLoading(false);
    }
  };

  const filteredSchools = schools.filter((school) => {
    const matchesSearch = school.school_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || school.compliance_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "compliant":
        return <Badge className="bg-green-500">Compliant</Badge>;
      case "at_risk":
        return <Badge className="bg-yellow-500">At Risk</Badge>;
      case "non_compliant":
        return <Badge variant="destructive">Non-Compliant</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const exportReport = () => {
    const headers = ["School", "Drills", "Avg Time (min)", "Accountability %", "Status", "Last Drill", "Teachers", "Students"];
    const rows = filteredSchools.map((s) => [
      s.school_name,
      s.total_drills.toString(),
      s.avg_completion_time.toFixed(1),
      s.avg_accountability_rate.toFixed(1),
      s.compliance_status,
      s.last_drill_date ? format(new Date(s.last_drill_date), "yyyy-MM-dd") : "Never",
      s.total_teachers.toString(),
      s.total_students.toString(),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `district-drill-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalStudents = schools.reduce((sum, s) => sum + s.total_students, 0);
  const totalTeachers = schools.reduce((sum, s) => sum + s.total_teachers, 0);
  const compliantCount = schools.filter((s) => s.compliance_status === "compliant").length;
  const atRiskCount = schools.filter((s) => s.compliance_status === "at_risk").length;
  const nonCompliantCount = schools.filter((s) => s.compliance_status === "non_compliant").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">District Safety Overview</h2>
          <p className="text-muted-foreground">Monitor drill performance across all schools</p>
        </div>
        <Button onClick={exportReport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{schools.length}</div>
              <div className="text-sm text-muted-foreground">Schools</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{totalStudents.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Students</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{compliantCount}</div>
              <div className="text-sm text-muted-foreground">Compliant</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <div className="text-2xl font-bold">{nonCompliantCount + atRiskCount}</div>
              <div className="text-sm text-muted-foreground">Need Attention</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">School Performance Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="school_name" fontSize={12} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="drills_completed" fill="hsl(var(--primary))" name="Drills Completed" />
              <Bar yAxisId="right" dataKey="accountability" fill="#22c55e" name="Accountability %" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search schools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schools</SelectItem>
            <SelectItem value="compliant">Compliant</SelectItem>
            <SelectItem value="at_risk">At Risk</SelectItem>
            <SelectItem value="non_compliant">Non-Compliant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Schools Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">School</th>
                <th className="text-center py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Drills</th>
                <th className="text-right py-3 px-4">Avg Time</th>
                <th className="text-right py-3 px-4">Accountability</th>
                <th className="text-right py-3 px-4">Last Drill</th>
                <th className="text-right py-3 px-4">Staff/Students</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchools.map((school) => (
                <tr key={school.school_id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">{school.school_name}</td>
                  <td className="py-3 px-4 text-center">{getStatusBadge(school.compliance_status)}</td>
                  <td className="py-3 px-4 text-right">{school.total_drills}</td>
                  <td className="py-3 px-4 text-right">{school.avg_completion_time.toFixed(1)} min</td>
                  <td className="py-3 px-4 text-right">{school.avg_accountability_rate.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right">
                    {school.last_drill_date
                      ? format(new Date(school.last_drill_date), "MMM dd, yyyy")
                      : "Never"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {school.total_teachers} / {school.total_students}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSchools.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No schools found matching your criteria
          </div>
        )}
      </Card>
    </div>
  );
}
