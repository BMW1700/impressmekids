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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type ScreeningPassage } from "@/data/screeningPassages";
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
  const { data: periods, refetch: refetchPeriods } = useBenchmarkPeriods(classroomId);
  
  const [showScreeningSetup, setShowScreeningSetup] = useState(false);
  const [showPassageSelector, setShowPassageSelector] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [newPeriodId, setNewPeriodId] = useState<string | null>(null);

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
          <h2 className="text-2xl font-bold tracking-tight">Benchmark Assessment Dashboard</h2>
          <p className="text-muted-foreground">
            {classroomName ? `${classroomName} • ` : ''}Oral Reading Fluency Assessments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="shadow-sm">
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

            {/* Quick Stats - Professional Design */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  Class Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-border/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
                    </div>
                    <p className="text-3xl font-bold">{summary?.totalStudents || 0}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Assessed</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{summary?.assessedStudents || 0}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Avg WCPM</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{summary?.avgWCPM || 0}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/50 dark:to-rose-900/30 border border-rose-200/50 dark:border-rose-800/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                      <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wide">Intervention</p>
                    </div>
                    <p className="text-3xl font-bold text-rose-700 dark:text-rose-300">{summary?.tierDistribution.tier3 || 0}</p>
                  </div>
                </div>

                {/* Past Screening Periods - Refined */}
                {periods && periods.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-border/50">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Screening History</h4>
                    <div className="space-y-2">
                      {periods.slice(0, 3).map(period => (
                        <div 
                          key={period.id}
                          className="flex items-center justify-between text-sm p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <span className="font-medium">{period.period_name} {period.school_year}</span>
                          <Badge 
                            variant={period.is_active ? "default" : "secondary"} 
                            className={`text-xs ${period.is_active ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                          >
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
            onPeriodCreated={(periodId) => {
              setNewPeriodId(periodId);
              setShowScreeningSetup(false);
              setShowPassageSelector(true); // Show passage selector after creating period
              refetch();
              refetchPeriods();
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
            onSelectPassage={async (passage: ScreeningPassage) => {
              // Store selected passage in the active period
              if (newPeriodId) {
                const { error } = await supabase
                  .from('benchmark_assessment_periods')
                  .update({ screening_passage_id: passage.id } as any)
                  .eq('id', newPeriodId);
                
                if (error) {
                  console.error('Failed to save passage:', error);
                  toast.error('Failed to save screening passage');
                } else {
                  toast.success(`Selected passage: ${passage.title}`);
                }
              }
              setShowPassageSelector(false);
              setNewPeriodId(null);
              refetchPeriods();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
