import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, TrendingUp, Award, AlertTriangle } from "lucide-react";

interface ClassroomAuraOverviewProps {
  records: any[];
  students: any[];
}

const ClassroomAuraOverview = ({ records, students }: ClassroomAuraOverviewProps) => {
  const studentStats = students.map(student => {
    const studentRecords = records.filter(r => r.profile_id === student.student_id);
    const avgGrade = studentRecords.length > 0
      ? studentRecords.reduce((sum, r) => sum + r.grade, 0) / studentRecords.length
      : 0;
    
    return {
      name: student.profiles?.full_name || 'Unknown',
      avgGrade: Math.round(avgGrade),
      recordCount: studentRecords.length,
    };
  });

  const classAvgGrade = studentStats.length > 0
    ? Math.round(studentStats.reduce((sum, s) => sum + s.avgGrade, 0) / studentStats.length)
    : 0;

  const activeStudents = studentStats.filter(s => s.recordCount > 0).length;
  const strugglingStudents = studentStats.filter(s => s.avgGrade > 0 && s.avgGrade < 70).length;
  const topPerformers = studentStats.filter(s => s.avgGrade >= 90).length;

  const chartData = studentStats
    .filter(s => s.recordCount > 0)
    .sort((a, b) => b.avgGrade - a.avgGrade)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{activeStudents}/{students.length}</div>
                <div className="text-sm text-muted-foreground">Active Students</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{classAvgGrade}</div>
                <div className="text-sm text-muted-foreground">Class Average</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-yellow-100">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{topPerformers}</div>
                <div className="text-sm text-muted-foreground">Top Performers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{strugglingStudents}</div>
                <div className="text-sm text-muted-foreground">Need Support</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="avgGrade" fill="hsl(var(--primary))" name="Average Grade" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No student practice data available yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassroomAuraOverview;
