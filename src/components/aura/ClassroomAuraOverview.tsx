import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, TrendingUp, Award, AlertTriangle, BarChart3 } from "lucide-react";

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="p-4 rounded-2xl bg-primary/20 shadow-card">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-1">
                    {activeStudents}
                  </div>
                  <div className="text-sm text-muted-foreground">of {students.length}</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-primary">Active Students</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-2 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="p-4 rounded-2xl bg-green-200/50 dark:bg-green-800/50 shadow-card">
                  <TrendingUp className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {classAvgGrade}
                  </div>
                  <div className="text-sm text-muted-foreground">out of 100</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-green-700 dark:text-green-300">Class Average</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/50 border-2 border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="p-4 rounded-2xl bg-yellow-200/50 dark:bg-yellow-800/50 shadow-card">
                  <Award className="h-7 w-7 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                    {topPerformers}
                  </div>
                  <div className="text-sm text-muted-foreground">students</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Top Performers</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border-2 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="p-4 rounded-2xl bg-red-200/50 dark:bg-red-800/50 shadow-card">
                  <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-red-600 dark:text-red-400 mb-1">
                    {strugglingStudents}
                  </div>
                  <div className="text-sm text-muted-foreground">students</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-red-700 dark:text-red-300">Need Support</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-elegant border-2 border-primary/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-primary shadow-card">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Student Performance Comparison</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Top 10 students by average AURA grade</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '2px solid hsl(var(--primary))',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
                <Bar 
                  dataKey="avgGrade" 
                  fill="hsl(var(--primary))" 
                  name="Average Grade"
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
              <Users className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">No student practice data available yet</p>
              <p className="text-sm">Students will appear here after completing AURA practice sessions</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassroomAuraOverview;
