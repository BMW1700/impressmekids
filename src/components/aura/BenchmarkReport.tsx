import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AudioPlaybackButton } from "./AudioPlaybackButton";
import { AIConfidenceBadge } from "./AIConfidenceBadge";
import { TeacherWordVerification } from "./TeacherWordVerification";
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
import { Download, FileText, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Printer, Shield } from "lucide-react";

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
  const { data: results, isLoading, refetch } = useStudentBenchmarkResults(studentId, classroomId);
  const printRef = useRef<HTMLDivElement>(null);
  const [showVerification, setShowVerification] = useState(false);
  
  // Parse confidence info from notes field (supports both JSON and legacy text format)
  interface ParsedConfidence {
    score: number;
    level: 'high' | 'medium' | 'low';
    flaggedCount: number;
    flaggedWords: Array<{
      index: number;
      expected: string;
      spoken: string;
      aiResult: boolean;
      confidence: 'high' | 'medium' | 'low';
      matchScore: number;
      speechConfidence: number;
      timestampMs: number;
    }>;
  }

  const parseConfidenceFromNotes = (notes: string | null): ParsedConfidence | null => {
    if (!notes) return null;
    
    // Try JSON format first (new format)
    try {
      const parsed = JSON.parse(notes);
      if (parsed.aiConfidence !== undefined) {
        return {
          score: parsed.aiConfidence,
          level: parsed.level as 'high' | 'medium' | 'low',
          flaggedCount: parsed.flaggedCount || 0,
          flaggedWords: parsed.flaggedWords || [],
        };
      }
    } catch {
      // Not JSON, try legacy text format
    }
    
    // Legacy text format fallback
    const match = notes.match(/AI Confidence: (\d+)% \((high|medium|low)\)\. (\d+) words flagged/);
    if (match) {
      return {
        score: parseInt(match[1]),
        level: match[2] as 'high' | 'medium' | 'low',
        flaggedCount: parseInt(match[3]),
        flaggedWords: [],
      };
    }
    const noFlagMatch = notes.match(/AI Confidence: (\d+)% \((high|medium|low)\)\./);
    if (noFlagMatch) {
      return {
        score: parseInt(noFlagMatch[1]),
        level: noFlagMatch[2] as 'high' | 'medium' | 'low',
        flaggedCount: 0,
        flaggedWords: [],
      };
    }
    return null;
  };

  // PDF Export handler using browser print
  const handleExportPDF = () => {
    if (onExportPDF) {
      onExportPDF();
      return;
    }

    // Use browser print functionality with print-specific CSS
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      <style>
        @page { margin: 0.75in; size: letter; }
        body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; line-height: 1.5; }
        .report-header { text-align: center; border-bottom: 2px solid #e5e5e5; padding-bottom: 16px; margin-bottom: 24px; }
        .report-title { font-size: 24px; font-weight: bold; margin: 0; }
        .report-subtitle { font-size: 14px; color: #666; margin-top: 4px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
        .metric-card { padding: 16px; border: 1px solid #e5e5e5; border-radius: 8px; text-align: center; }
        .metric-label { font-size: 10px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; }
        .metric-value { font-size: 28px; font-weight: bold; margin: 4px 0; }
        .metric-detail { font-size: 11px; color: #666; }
        .section { margin: 24px 0; }
        .section-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
        .norms-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; text-align: center; }
        .norm-cell { padding: 8px; background: #f5f5f5; border-radius: 4px; }
        .norm-label { font-size: 10px; color: #666; }
        .norm-value { font-size: 14px; font-weight: bold; }
        .recommendation { padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .history-item { display: flex; justify-content: space-between; padding: 8px 12px; background: #f5f5f5; border-radius: 4px; margin-bottom: 4px; }
        .assessment-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .assessment-item { }
        .assessment-label { font-size: 11px; color: #666; }
        .assessment-value { font-size: 13px; font-weight: 500; }
        .footer { text-align: center; font-size: 10px; color: #999; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
        .status-at { background: #dcfce7; color: #166534; }
        .status-above { background: #dbeafe; color: #1e40af; }
        .status-below { background: #fef3c7; color: #92400e; }
        .status-well-below { background: #fee2e2; color: #991b1b; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    `;

    const latestResult = results?.[0];
    const rtiTier = latestResult ? getRTITier(latestResult.benchmark_status as BenchmarkStatus) : 1;
    const percentileRange = latestResult ? getPercentileRange(latestResult.wcpm, gradeLevel, getCurrentScreeningPeriod()) : '';
    const norm = getFluencyNorm(gradeLevel, getCurrentScreeningPeriod());

    const statusClass = latestResult?.benchmark_status === 'at' ? 'status-at' :
                        latestResult?.benchmark_status === 'above' ? 'status-above' :
                        latestResult?.benchmark_status === 'below' ? 'status-below' : 'status-well-below';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Benchmark Report - ${studentName}</title>
        ${styles}
      </head>
      <body>
        <div class="report-header">
          <h1 class="report-title">${studentName}</h1>
          <p class="report-subtitle">Grade ${gradeLevel} • Oral Reading Fluency Benchmark Report</p>
          <p class="report-subtitle">Generated ${format(new Date(), "MMMM d, yyyy")}</p>
        </div>

        ${latestResult ? `
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">WCPM</div>
            <div class="metric-value">${latestResult.wcpm}</div>
            <div class="metric-detail">${percentileRange} percentile</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Accuracy</div>
            <div class="metric-value">${latestResult.accuracy_percentage || 'N/A'}%</div>
            <div class="metric-detail">${latestResult.fluency_level ? getFluencyLevelLabel(latestResult.fluency_level as FluencyLevel) : ''} Level</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Prosody</div>
            <div class="metric-value">${latestResult.prosody_score || 'N/A'}/4</div>
            <div class="metric-detail">NAEP Scale</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">RTI Tier</div>
            <div class="metric-value">Tier ${rtiTier}</div>
            <div class="metric-detail">${getRTITierDescription(rtiTier)}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Benchmark Status</div>
          <span class="status-badge ${statusClass}">${getBenchmarkStatusLabel(latestResult.benchmark_status as BenchmarkStatus)}</span>
        </div>

        ${norm ? `
        <div class="section">
          <div class="section-title">Grade ${gradeLevel} ${getCurrentScreeningPeriod()} Benchmark Norms</div>
          <div class="norms-grid">
            <div class="norm-cell"><div class="norm-label">10th %ile</div><div class="norm-value">${norm.percentile10}</div></div>
            <div class="norm-cell"><div class="norm-label">25th %ile</div><div class="norm-value">${norm.percentile25}</div></div>
            <div class="norm-cell"><div class="norm-label">50th %ile</div><div class="norm-value">${norm.percentile50}</div></div>
            <div class="norm-cell"><div class="norm-label">75th %ile</div><div class="norm-value">${norm.percentile75}</div></div>
            <div class="norm-cell"><div class="norm-label">90th %ile</div><div class="norm-value">${norm.percentile90}</div></div>
          </div>
          <p style="font-size: 10px; color: #999; margin-top: 8px; font-style: italic;">Based on Hasbrouck & Tindal (2017) Oral Reading Fluency Norms</p>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Assessment Details</div>
          <div class="assessment-grid">
            <div class="assessment-item"><div class="assessment-label">Date</div><div class="assessment-value">${format(new Date(latestResult.assessment_date), "MMMM d, yyyy")}</div></div>
            <div class="assessment-item"><div class="assessment-label">Words Read</div><div class="assessment-value">${latestResult.words_read || 'N/A'}</div></div>
            <div class="assessment-item"><div class="assessment-label">Miscues</div><div class="assessment-value">${latestResult.miscue_count}</div></div>
            <div class="assessment-item"><div class="assessment-label">Self-Corrections</div><div class="assessment-value">${latestResult.self_corrections}</div></div>
            ${latestResult.passage_title ? `<div class="assessment-item" style="grid-column: span 2;"><div class="assessment-label">Passage</div><div class="assessment-value">${latestResult.passage_title}</div></div>` : ''}
          </div>
        </div>

        <div class="section">
          <div class="recommendation">
            <div class="section-title" style="margin-bottom: 8px;">Recommendation</div>
            <p style="margin: 0; font-size: 13px;">
              ${rtiTier === 1 ? "Continue with core classroom instruction. Student is meeting grade-level expectations." : 
                rtiTier === 2 ? "Consider supplemental small-group instruction 2-3 times per week focusing on fluency building." :
                "Intensive intervention recommended. Daily 1-on-1 or small group instruction with progress monitoring every 1-2 weeks."}
            </p>
          </div>
        </div>

        ${results && results.length > 1 ? `
        <div class="section">
          <div class="section-title">Assessment History</div>
          ${results.slice(0, 5).map((r: any) => `
            <div class="history-item">
              <span>${format(new Date(r.assessment_date), "MMM d, yyyy")}</span>
              <span><strong>${r.wcpm} WCPM</strong> • ${getBenchmarkStatusLabel(r.benchmark_status as BenchmarkStatus)}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
        ` : '<p>No benchmark data available for this student.</p>'}

        <div class="footer">
          <p>AURA Reading Assessment System • Confidential Student Record</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };
  
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
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="print:hidden">
              <Printer className="h-4 w-4 mr-1" />
              Export PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* AI Confidence Badge & Verify Button */}
        {(() => {
          const confidence = parseConfidenceFromNotes((latestResult as any).notes);
          if (confidence) {
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">AI Assessment Confidence</p>
                      <p className="text-xs text-muted-foreground">
                        {confidence.flaggedCount > 0 
                          ? `${confidence.flaggedCount} words flagged for verification`
                          : 'High confidence - no verification needed'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AIConfidenceBadge 
                      score={confidence.score} 
                      level={confidence.level}
                      flaggedWordCount={confidence.flaggedCount}
                      showTooltip
                    />
                    {confidence.flaggedCount > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowVerification(!showVerification)}
                        className="print:hidden"
                      >
                        <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                        {showVerification ? 'Hide' : 'Verify'}
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Teacher Verification Panel */}
                {showVerification && confidence.flaggedWords.length > 0 && (
                  <TeacherWordVerification
                    resultId={latestResult.id}
                    studentName={studentName}
                    flaggedWords={confidence.flaggedWords}
                    audioPath={(latestResult as any).audio_url}
                    originalWcpm={latestResult.wcpm}
                    originalAccuracy={latestResult.accuracy_percentage || 0}
                    totalWords={latestResult.words_read || 0}
                    onVerificationComplete={() => {
                      refetch();
                      setShowVerification(false);
                    }}
                  />
                )}
              </div>
            );
          }
          return null;
        })()}

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
          
          {/* Audio Playback for the assessment - KEY INTEGRATION */}
          {(latestResult as any).audio_url && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Listen to Recording:</p>
              <AudioPlaybackButton
                audioUrl={null}
                audioPath={(latestResult as any).audio_url}
                showProgress={true}
              />
            </div>
          )}
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
