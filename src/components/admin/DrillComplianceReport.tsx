import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Users,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface DrillComplianceData {
  drill_id: string;
  drill_type: string;
  started_at: string;
  ended_at: string | null;
  is_real_emergency: boolean;
  total_students: number;
  accounted_within_2min: number;
  accounted_within_5min: number;
  unaccounted_at_end: number;
  completion_time_minutes: number | null;
  classrooms: {
    name: string;
    teacher: string;
    total: number;
    accounted: number;
    completion_time: number | null;
  }[];
  missing_students: {
    name: string;
    classroom: string;
    resolution: string | null;
  }[];
  parent_responses: {
    total: number;
    confirmed_safe: number;
    en_route: number;
    picked_up: number;
    needs_help: number;
  };
}

interface DrillComplianceReportProps {
  drillId: string;
  onClose?: () => void;
}

export function DrillComplianceReport({ drillId, onClose }: DrillComplianceReportProps) {
  const { toast } = useToast();
  const [data, setData] = useState<DrillComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [previousDrill, setPreviousDrill] = useState<{ completion_time: number; rate_2min: number } | null>(null);

  useState(() => {
    fetchReportData();
  });

  const fetchReportData = async () => {
    try {
      // Fetch main drill data
      const { data: drill } = await supabase
        .from("drill_sessions")
        .select("*")
        .eq("id", drillId)
        .single();

      if (!drill) {
        setLoading(false);
        return;
      }

      // Fetch attendance data
      const { data: attendance } = await supabase
        .from("drill_attendance")
        .select(`
          *,
          student:profiles!drill_attendance_student_id_fkey(full_name),
          classroom:classrooms(name, teacher:profiles!classrooms_teacher_id_fkey(full_name))
        `)
        .eq("drill_session_id", drillId);

      // Fetch parent responses
      const { data: parentResponses } = await supabase
        .from("parent_drill_responses")
        .select("response_type")
        .eq("drill_session_id", drillId);

      // Calculate metrics
      const total = attendance?.length || 0;
      const startTime = new Date(drill.started_at);
      
      const accountedWithin2Min = attendance?.filter(
        (a) => a.status === "present" && a.marked_at && 
        (new Date(a.marked_at).getTime() - startTime.getTime()) / 60000 <= 2
      ).length || 0;

      const accountedWithin5Min = attendance?.filter(
        (a) => a.status === "present" && a.marked_at && 
        (new Date(a.marked_at).getTime() - startTime.getTime()) / 60000 <= 5
      ).length || 0;

      const unaccountedAtEnd = attendance?.filter(a => a.status === "unaccounted").length || 0;

      let completionTime = null;
      if (drill.ended_at && drill.started_at) {
        completionTime = (new Date(drill.ended_at).getTime() - new Date(drill.started_at).getTime()) / 60000;
      }

      // Group by classroom
      const classroomMap = new Map<string, any>();
      attendance?.forEach((a: any) => {
        const classroomId = a.classroom_id;
        if (!classroomMap.has(classroomId)) {
          classroomMap.set(classroomId, {
            name: a.classroom?.name || "Unknown",
            teacher: a.classroom?.teacher?.full_name || "Unknown",
            total: 0,
            accounted: 0,
            times: []
          });
        }
        const c = classroomMap.get(classroomId);
        c.total++;
        if (a.status === "present") {
          c.accounted++;
          if (a.marked_at) {
            c.times.push((new Date(a.marked_at).getTime() - startTime.getTime()) / 60000);
          }
        }
      });

      const classrooms = Array.from(classroomMap.values()).map(c => ({
        ...c,
        completion_time: c.times.length > 0 ? Math.max(...c.times) : null
      }));

      // Missing students
      const missingStudents = attendance?.filter(a => a.status === "unaccounted" || a.status === "missing")
        .map((a: any) => ({
          name: a.student?.full_name || "Unknown",
          classroom: a.classroom?.name || "Unknown",
          resolution: a.resolution_notes
        })) || [];

      // Parent response counts
      const responseTypes = {
        total: parentResponses?.length || 0,
        confirmed_safe: parentResponses?.filter(r => r.response_type === "confirmed_safe").length || 0,
        en_route: parentResponses?.filter(r => r.response_type === "en_route").length || 0,
        picked_up: parentResponses?.filter(r => r.response_type === "picked_up").length || 0,
        needs_help: parentResponses?.filter(r => r.response_type === "needs_help").length || 0
      };

      setData({
        drill_id: drill.id,
        drill_type: drill.drill_type,
        started_at: drill.started_at,
        ended_at: drill.ended_at,
        is_real_emergency: drill.is_real_emergency,
        total_students: total,
        accounted_within_2min: accountedWithin2Min,
        accounted_within_5min: accountedWithin5Min,
        unaccounted_at_end: unaccountedAtEnd,
        completion_time_minutes: completionTime,
        classrooms,
        missing_students: missingStudents,
        parent_responses: responseTypes
      });

      // Fetch previous drill for comparison
      const { data: prevDrills } = await supabase
        .from("drill_sessions")
        .select("*")
        .eq("drill_type", drill.drill_type)
        .eq("status", "completed")
        .lt("started_at", drill.started_at)
        .order("started_at", { ascending: false })
        .limit(1);

      if (prevDrills && prevDrills.length > 0) {
        const prev = prevDrills[0];
        const { data: prevAttendance } = await supabase
          .from("drill_attendance")
          .select("status, marked_at")
          .eq("drill_session_id", prev.id);

        if (prevAttendance) {
          const prevStartTime = new Date(prev.started_at);
          const prev2Min = prevAttendance.filter(
            (a) => a.status === "present" && a.marked_at && 
            (new Date(a.marked_at).getTime() - prevStartTime.getTime()) / 60000 <= 2
          ).length;
          const prevTotal = prevAttendance.length;
          const prevCompletionTime = prev.ended_at 
            ? (new Date(prev.ended_at).getTime() - prevStartTime.getTime()) / 60000 
            : null;

          setPreviousDrill({
            completion_time: prevCompletionTime || 0,
            rate_2min: prevTotal > 0 ? (prev2Min / prevTotal) * 100 : 0
          });
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    if (!data) return;

    const rows = [
      ["DRILL COMPLIANCE REPORT"],
      [""],
      ["Drill Type", data.drill_type.replace(/_/g, " ").toUpperCase()],
      ["Date", format(new Date(data.started_at), "MMMM dd, yyyy")],
      ["Start Time", format(new Date(data.started_at), "h:mm a")],
      ["End Time", data.ended_at ? format(new Date(data.ended_at), "h:mm a") : "N/A"],
      ["Duration", data.completion_time_minutes ? `${data.completion_time_minutes.toFixed(2)} minutes` : "N/A"],
      [""],
      ["STUDENT ACCOUNTING"],
      ["Total Students", data.total_students.toString()],
      ["Accounted within 2 min", data.accounted_within_2min.toString()],
      ["Accounted within 5 min", data.accounted_within_5min.toString()],
      ["Unaccounted at end", data.unaccounted_at_end.toString()],
      [""],
      ["PARENT RESPONSES"],
      ["Total Responses", data.parent_responses.total.toString()],
      ["Confirmed Safe", data.parent_responses.confirmed_safe.toString()],
      ["En Route", data.parent_responses.en_route.toString()],
      ["Picked Up", data.parent_responses.picked_up.toString()],
      ["Needs Help", data.parent_responses.needs_help.toString()],
      [""],
      ["CLASSROOM BREAKDOWN"],
      ["Classroom", "Teacher", "Total", "Accounted", "Time (min)"],
      ...data.classrooms.map(c => [
        c.name,
        c.teacher,
        c.total.toString(),
        c.accounted.toString(),
        c.completion_time ? c.completion_time.toFixed(2) : "N/A"
      ])
    ];

    if (data.missing_students.length > 0) {
      rows.push([""], ["UNACCOUNTED STUDENTS"], ["Name", "Classroom", "Resolution"]);
      data.missing_students.forEach(s => {
        rows.push([s.name, s.classroom, s.resolution || "Pending"]);
      });
    }

    const csvContent = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `drill-compliance-${format(new Date(data.started_at), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: "CSV report has been downloaded"
    });
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Could not load report data</p>
      </Card>
    );
  }

  const rate2Min = data.total_students > 0 ? (data.accounted_within_2min / data.total_students) * 100 : 0;
  const rate5Min = data.total_students > 0 ? (data.accounted_within_5min / data.total_students) * 100 : 0;
  const improvementTime = previousDrill && data.completion_time_minutes 
    ? previousDrill.completion_time - data.completion_time_minutes 
    : null;
  const improvement2Min = previousDrill ? rate2Min - previousDrill.rate_2min : null;

  return (
    <div className="space-y-6 print:space-y-4" id="compliance-report">
      {/* Header Actions */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Drill Compliance Report</h2>
            <p className="text-muted-foreground">
              {data.drill_type.replace(/_/g, " ")} - {format(new Date(data.started_at), "MMMM dd, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownloadCSV}>
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>
      </div>

      {/* Printable Header */}
      <div className="hidden print:block text-center border-b pb-4">
        <h1 className="text-2xl font-bold">SAFETY DRILL COMPLIANCE REPORT</h1>
        <p className="text-lg">{data.drill_type.replace(/_/g, " ").toUpperCase()}</p>
        <p>{format(new Date(data.started_at), "MMMM dd, yyyy")}</p>
        {data.is_real_emergency && (
          <Badge className="bg-red-600 mt-2">REAL EMERGENCY</Badge>
        )}
      </div>

      {/* Drill Details */}
      <Card className="p-6 print:shadow-none print:border">
        <h3 className="text-lg font-semibold mb-4">Drill Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Drill Type</p>
            <p className="font-semibold capitalize">{data.drill_type.replace(/_/g, " ")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Start Time</p>
            <p className="font-semibold">{format(new Date(data.started_at), "h:mm a")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">End Time</p>
            <p className="font-semibold">
              {data.ended_at ? format(new Date(data.ended_at), "h:mm a") : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-semibold">
              {data.completion_time_minutes ? `${data.completion_time_minutes.toFixed(2)} min` : "N/A"}
            </p>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <Card className="p-6 print:shadow-none print:border">
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{data.total_students}</div>
            <div className="text-sm text-muted-foreground">Total Students</div>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-lg">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{rate2Min.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Accounted in 2 min</div>
            {improvement2Min !== null && (
              <div className={`text-xs flex items-center justify-center gap-1 ${improvement2Min >= 0 ? "text-green-600" : "text-red-600"}`}>
                {improvement2Min >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(improvement2Min).toFixed(1)}% vs prev
              </div>
            )}
          </div>
          <div className="text-center p-4 bg-blue-500/10 rounded-lg">
            <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{rate5Min.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Accounted in 5 min</div>
          </div>
          <div className={`text-center p-4 rounded-lg ${data.unaccounted_at_end > 0 ? "bg-red-500/10" : "bg-green-500/10"}`}>
            <AlertTriangle className={`h-6 w-6 mx-auto mb-2 ${data.unaccounted_at_end > 0 ? "text-red-600" : "text-green-600"}`} />
            <div className={`text-2xl font-bold ${data.unaccounted_at_end > 0 ? "text-red-600" : "text-green-600"}`}>
              {data.unaccounted_at_end}
            </div>
            <div className="text-sm text-muted-foreground">Unaccounted at End</div>
          </div>
        </div>

        {improvementTime !== null && data.completion_time_minutes && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${improvementTime > 0 ? "bg-green-500/10" : "bg-orange-500/10"}`}>
            {improvementTime > 0 ? (
              <>
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-green-600 font-medium">
                  {improvementTime.toFixed(1)} minutes faster than previous drill!
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="h-5 w-5 text-orange-600" />
                <span className="text-orange-600 font-medium">
                  {Math.abs(improvementTime).toFixed(1)} minutes slower than previous drill
                </span>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Parent Responses */}
      <Card className="p-6 print:shadow-none print:border">
        <h3 className="text-lg font-semibold mb-4">Parent Response Summary</h3>
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold">{data.parent_responses.total}</div>
            <div className="text-sm text-muted-foreground">Total Responses</div>
          </div>
          <div className="text-center text-green-600">
            <div className="text-xl font-bold">{data.parent_responses.confirmed_safe}</div>
            <div className="text-sm">Confirmed Safe</div>
          </div>
          <div className="text-center text-blue-600">
            <div className="text-xl font-bold">{data.parent_responses.en_route}</div>
            <div className="text-sm">En Route</div>
          </div>
          <div className="text-center text-purple-600">
            <div className="text-xl font-bold">{data.parent_responses.picked_up}</div>
            <div className="text-sm">Picked Up</div>
          </div>
          <div className="text-center text-orange-600">
            <div className="text-xl font-bold">{data.parent_responses.needs_help}</div>
            <div className="text-sm">Needs Help</div>
          </div>
        </div>
      </Card>

      {/* Classroom Breakdown */}
      <Card className="p-6 print:shadow-none print:border">
        <h3 className="text-lg font-semibold mb-4">Classroom Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Classroom</th>
                <th className="text-left py-2 px-3">Teacher</th>
                <th className="text-right py-2 px-3">Students</th>
                <th className="text-right py-2 px-3">Accounted</th>
                <th className="text-right py-2 px-3">Rate</th>
                <th className="text-right py-2 px-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.classrooms.map((c, i) => (
                <tr key={i} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3">{c.name}</td>
                  <td className="py-2 px-3">{c.teacher}</td>
                  <td className="py-2 px-3 text-right">{c.total}</td>
                  <td className="py-2 px-3 text-right">{c.accounted}</td>
                  <td className="py-2 px-3 text-right">
                    <Badge className={c.accounted === c.total ? "bg-green-600" : "bg-orange-600"}>
                      {((c.accounted / c.total) * 100).toFixed(0)}%
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-right">
                    {c.completion_time ? `${c.completion_time.toFixed(2)} min` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Missing Students */}
      {data.missing_students.length > 0 && (
        <Card className="p-6 border-red-500 print:shadow-none print:border">
          <h3 className="text-lg font-semibold mb-4 text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Unaccounted Students
          </h3>
          <div className="space-y-2">
            {data.missing_students.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.classroom}</p>
                </div>
                <Badge variant={s.resolution ? "default" : "destructive"}>
                  {s.resolution || "Unresolved"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Signature Line - Print Only */}
      <div className="hidden print:block mt-12 pt-8 border-t">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="border-b border-black mb-2 h-12"></div>
            <p className="text-sm">Principal Signature</p>
          </div>
          <div>
            <div className="border-b border-black mb-2 h-12"></div>
            <p className="text-sm">Date</p>
          </div>
        </div>
      </div>
    </div>
  );
}