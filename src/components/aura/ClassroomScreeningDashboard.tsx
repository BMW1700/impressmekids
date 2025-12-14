import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useClassroomBenchmarkSummary, useBenchmarkPeriods } from "@/hooks/useBenchmarkData";
import { BenchmarkStatusBadge } from "./BenchmarkStatusBadge";
import { ProgressMonitoringChart } from "./ProgressMonitoringChart";
import { BenchmarkReport } from "./BenchmarkReport";
import { ScreeningPassageSelector } from "./ScreeningPassageSelector";
import { UniversalScreeningCard } from "./UniversalScreeningCard";
import { ScreeningModeSelector } from "./ScreeningModeSelector";
import { 
  getRTITier, 
  getRTITierDescription,
  type BenchmarkStatus 
} from "@/lib/fluencyBenchmarks";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  FileText, 
  Download,
  Users,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";

interface ClassroomScreeningDashboardProps {
  classroomId: string;
  classroomName?: string;
}

export function ClassroomScreeningDashboard({ 
  classroomId,
  classroomName 
}: ClassroomScreeningDashboardProps) {
  const { data: summary, isLoading, refetch } = useClassroomBenchmarkSummary(classroomId);
  const { data: periods } = useBenchmarkPeriods(classroomId);
  
  const [showScreeningSetup, setShowScreeningSetup] = useState(false);
  const [showPassageSelector, setShowPassageSelector] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedPassage, setSelectedPassage] = useState<any>(null);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-48 bg-muted rounded-lg" />
        <div className="animate-pulse h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Universal Screening Dashboard</h2>
          <p className="text-muted-foreground">
            {classroomName ? `${classroomName} • ` : ''}DIBELS-compatible benchmark assessments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Student Results</TabsTrigger>
          <TabsTrigger value="progress">Progress Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Screening Status Card */}
            <UniversalScreeningCard 
              classroomId={classroomId}
              onStartScreening={() => setShowScreeningSetup(true)}
            />

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quick Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold">{summary?.totalStudents || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Students</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold">{summary?.assessedStudents || 0}</p>
                    <p className="text-xs text-muted-foreground">Assessed</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold text-primary">{summary?.avgWCPM || 0}</p>
                    <p className="text-xs text-muted-foreground">Avg WCPM</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {summary?.tierDistribution.tier3 || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Need Intervention</p>
                  </div>
                </div>

                {/* Past Screening Periods */}
                {periods && periods.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Screening History</h4>
                    <div className="space-y-1">
                      {periods.slice(0, 3).map(period => (
                        <div 
                          key={period.id}
                          className="flex items-center justify-between text-sm p-2 rounded bg-muted/30"
                        >
                          <span>{period.period_name} {period.school_year}</span>
                          <Badge variant={period.is_active ? "default" : "secondary"} className="text-xs">
                            {period.is_active ? 'Active' : 'Completed'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Benchmark Results</CardTitle>
              <CardDescription>
                Click on a student to view their detailed benchmark report
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summary && summary.students.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead className="text-center">WCPM</TableHead>
                      <TableHead className="text-center">Accuracy</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">RTI Tier</TableHead>
                      <TableHead className="text-center">Trend</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.students.map(student => {
                      const rtiTier = getRTITier(student.latest_benchmark_status);
                      return (
                        <TableRow key={student.student_id}>
                          <TableCell className="font-medium">
                            {student.student_name}
                          </TableCell>
                          <TableCell>{student.grade || '-'}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-bold">{student.latest_wcpm}</span>
                              {student.wcpm_change !== null && (
                                <span className={`text-xs ${
                                  student.wcpm_change > 0 ? 'text-green-600' : 
                                  student.wcpm_change < 0 ? 'text-red-600' : 'text-muted-foreground'
                                }`}>
                                  ({student.wcpm_change > 0 ? '+' : ''}{student.wcpm_change})
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {student.latest_accuracy ? `${student.latest_accuracy}%` : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {student.assessment_count > 0 ? (
                              <BenchmarkStatusBadge 
                                status={student.latest_benchmark_status} 
                                size="sm" 
                              />
                            ) : (
                              <Badge variant="outline">Not Assessed</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {student.assessment_count > 0 && (
                              <Badge 
                                variant="outline"
                                className={
                                  rtiTier === 1 ? 'border-green-500 text-green-700' :
                                  rtiTier === 2 ? 'border-yellow-500 text-yellow-700' :
                                  'border-red-500 text-red-700'
                                }
                              >
                                Tier {rtiTier}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {getTrendIcon(student.trend)}
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  disabled={student.assessment_count === 0}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Benchmark Report</DialogTitle>
                                </DialogHeader>
                                <BenchmarkReport
                                  studentId={student.student_id}
                                  studentName={student.student_name}
                                  gradeLevel={student.grade || 3}
                                  classroomId={classroomId}
                                />
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No students in this classroom yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Progress Monitoring</CardTitle>
              <CardDescription>
                Track WCPM growth over time for intervention students
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summary && summary.students.filter(s => s.assessment_count > 0).length > 0 ? (
                <div className="space-y-6">
                  {/* Students needing intervention (Tier 2 & 3) first */}
                  {summary.students
                    .filter(s => s.assessment_count > 0)
                    .sort((a, b) => {
                      // Sort by RTI tier (higher tier = more urgent)
                      const tierA = getRTITier(a.latest_benchmark_status);
                      const tierB = getRTITier(b.latest_benchmark_status);
                      return tierB - tierA;
                    })
                    .slice(0, 5)
                    .map(student => (
                      <div key={student.student_id} className="border-b pb-4 last:border-0">
                        <div className="text-sm text-muted-foreground mb-2">
                          {student.assessment_count} assessment{student.assessment_count > 1 ? 's' : ''} recorded
                        </div>
                        {/* Note: In a full implementation, we'd fetch the actual data points */}
                        <ProgressMonitoringChart
                          data={[
                            { 
                              date: new Date().toISOString(), 
                              wcpm: student.latest_wcpm, 
                              accuracy: student.latest_accuracy || undefined,
                              benchmark_status: student.latest_benchmark_status 
                            }
                          ]}
                          studentName={student.student_name}
                          gradeLevel={student.grade || 3}
                          showBenchmarkLines={true}
                          height={200}
                        />
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No assessment data available for progress monitoring</p>
                  <p className="text-sm mt-2">Complete benchmark assessments to see progress charts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Screening Setup Dialog */}
      <Dialog open={showScreeningSetup} onOpenChange={setShowScreeningSetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Screening Period</DialogTitle>
          </DialogHeader>
          <ScreeningModeSelector 
            classroomId={classroomId}
            onPeriodCreated={() => {
              setShowScreeningSetup(false);
              setShowPassageSelector(true); // Show passage selector after creating period
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Standardized Passage Selection Dialog */}
      <Dialog open={showPassageSelector} onOpenChange={setShowPassageSelector}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Screening Passage</DialogTitle>
          </DialogHeader>
          <ScreeningPassageSelector
            gradeLevel={3} // Default to grade 3, could be made dynamic
            onSelectPassage={(passage) => {
              setSelectedPassage(passage);
              setShowPassageSelector(false);
              // TODO: Store selected passage for classroom screening session
              console.log('Selected passage for screening:', passage);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
