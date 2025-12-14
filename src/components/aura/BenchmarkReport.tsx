import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  getFluencyNorm,
  getBenchmarkStatusLabel,
  getFluencyLevelLabel,
  getPercentileRange,
  getRTITier,
  getRTITierDescription,
  getCurrentScreeningPeriod,
  type BenchmarkStatus,
  type FluencyLevel,
  type ScreeningPeriod
} from "@/lib/fluencyBenchmarks";
import { BenchmarkStatusBadge } from "./BenchmarkStatusBadge";
import { useStudentBenchmarkResults } from "@/hooks/useBenchmarkData";
import { format } from "date-fns";
import { Download, FileText, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

interface BenchmarkReportProps {
  studentId: string;
  studentName: string;
  gradeLevel: number;
  classroomId?: string;
  onExportPDF?: () => void;
}

export function BenchmarkReport({
  studentId,
  studentName,
  gradeLevel,
  classroomId,
  onExportPDF,
}: BenchmarkReportProps) {
  const { data: results, isLoading } = useStudentBenchmarkResults(studentId, classroomId);
  
  const latestResult = results?.[0];
  const previousResult = results?.[1];
  const currentPeriod = getCurrentScreeningPeriod();
  const norm = getFluencyNorm(gradeLevel, currentPeriod);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latestResult) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">No Benchmark Data</h3>
          <p className="text-sm text-muted-foreground">
            No benchmark assessments have been recorded for this student yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const wcpmChange = previousResult 
    ? latestResult.wcpm - previousResult.wcpm 
    : null;
  
  const rtiTier = getRTITier(latestResult.benchmark_status as BenchmarkStatus);
  const percentileRange = getPercentileRange(latestResult.wcpm, gradeLevel, currentPeriod);

  return (
    <Card className="print:shadow-none">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{studentName}</CardTitle>
            <CardDescription>
              Grade {gradeLevel} • Oral Reading Fluency Report
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <BenchmarkStatusBadge 
              status={latestResult.benchmark_status as BenchmarkStatus} 
              size="lg" 
            />
            {onExportPDF && (
              <Button variant="outline" size="sm" onClick={onExportPDF} className="print:hidden">
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* WCPM */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">WCPM</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-primary">{latestResult.wcpm}</p>
              {wcpmChange !== null && (
                <span className={`text-sm flex items-center ${wcpmChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {wcpmChange >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                  {wcpmChange >= 0 ? '+' : ''}{wcpmChange}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{percentileRange} percentile</p>
          </div>
          
          {/* Accuracy */}
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Accuracy</p>
            <p className="text-3xl font-bold text-green-700">
              {latestResult.accuracy_percentage ? `${latestResult.accuracy_percentage}%` : 'N/A'}
            </p>
            {latestResult.fluency_level && (
              <p className="text-xs text-green-600 mt-1">
                {getFluencyLevelLabel(latestResult.fluency_level as FluencyLevel)} Level
              </p>
            )}
          </div>
          
          {/* Prosody */}
          <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Prosody</p>
            <p className="text-3xl font-bold text-purple-700">
              {latestResult.prosody_score ? `${latestResult.prosody_score}/4` : 'N/A'}
            </p>
            <p className="text-xs text-purple-600 mt-1">NAEP Scale</p>
          </div>
          
          {/* RTI Tier */}
          <div className={`p-4 rounded-lg border ${
            rtiTier === 1 ? 'bg-green-50 border-green-200' :
            rtiTier === 2 ? 'bg-yellow-50 border-yellow-200' :
            'bg-red-50 border-red-200'
          }`}>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">RTI Tier</p>
            <p className={`text-3xl font-bold ${
              rtiTier === 1 ? 'text-green-700' :
              rtiTier === 2 ? 'text-yellow-700' :
              'text-red-700'
            }`}>
              Tier {rtiTier}
            </p>
            <p className={`text-xs mt-1 ${
              rtiTier === 1 ? 'text-green-600' :
              rtiTier === 2 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {getRTITierDescription(rtiTier)}
            </p>
          </div>
        </div>

        <Separator />

        {/* Grade Level Norms Reference */}
        {norm && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Grade {gradeLevel} {currentPeriod} Benchmark Norms</h4>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-red-50">
                <p className="text-muted-foreground">10th %ile</p>
                <p className="font-bold text-red-700">{norm.percentile10}</p>
              </div>
              <div className="p-2 rounded bg-orange-50">
                <p className="text-muted-foreground">25th %ile</p>
                <p className="font-bold text-orange-700">{norm.percentile25}</p>
              </div>
              <div className="p-2 rounded bg-green-50">
                <p className="text-muted-foreground">50th %ile</p>
                <p className="font-bold text-green-700">{norm.percentile50}</p>
              </div>
              <div className="p-2 rounded bg-blue-50">
                <p className="text-muted-foreground">75th %ile</p>
                <p className="font-bold text-blue-700">{norm.percentile75}</p>
              </div>
              <div className="p-2 rounded bg-purple-50">
                <p className="text-muted-foreground">90th %ile</p>
                <p className="font-bold text-purple-700">{norm.percentile90}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Based on Hasbrouck & Tindal (2017) Oral Reading Fluency Norms
            </p>
          </div>
        )}

        <Separator />

        {/* Assessment Details */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Latest Assessment Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">{format(new Date(latestResult.assessment_date), "MMMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Words Read</p>
              <p className="font-medium">{latestResult.words_read || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Miscues</p>
              <p className="font-medium">{latestResult.miscue_count}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Self-Corrections</p>
              <p className="font-medium">{latestResult.self_corrections}</p>
            </div>
            {latestResult.passage_title && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Passage</p>
                <p className="font-medium">{latestResult.passage_title}</p>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="flex items-center gap-2">
            {rtiTier === 1 ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            )}
            <h4 className="font-medium">Recommendation</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {rtiTier === 1 && "Continue with core classroom instruction. Student is meeting grade-level expectations."}
            {rtiTier === 2 && "Consider supplemental small-group instruction 2-3 times per week focusing on fluency building."}
            {rtiTier === 3 && "Intensive intervention recommended. Daily 1-on-1 or small group instruction with progress monitoring every 1-2 weeks."}
          </p>
        </div>

        {/* Assessment History */}
        {results && results.length > 1 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Assessment History</h4>
            <div className="space-y-2">
              {results.slice(0, 5).map((result, idx) => (
                <div 
                  key={result.id} 
                  className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm"
                >
                  <span className="text-muted-foreground">
                    {format(new Date(result.assessment_date), "MMM d, yyyy")}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{result.wcpm} WCPM</span>
                    <BenchmarkStatusBadge 
                      status={result.benchmark_status as BenchmarkStatus} 
                      size="sm" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
