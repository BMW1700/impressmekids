import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  getCurrentScreeningPeriod, 
  getCurrentSchoolYear,
  getRTITier,
  getRTITierDescription,
  type ScreeningPeriod 
} from "@/lib/fluencyBenchmarks";
import { useClassroomBenchmarkSummary, useActiveBenchmarkPeriod } from "@/hooks/useBenchmarkData";
import { Users, AlertTriangle, CheckCircle, Clock, PlayCircle } from "lucide-react";
import { format } from "date-fns";

interface UniversalScreeningCardProps {
  classroomId: string;
  onStartScreening?: () => void;
  onViewResults?: () => void;
}

export function UniversalScreeningCard({ 
  classroomId, 
  onStartScreening,
  onViewResults 
}: UniversalScreeningCardProps) {
  const { data: summary, isLoading } = useClassroomBenchmarkSummary(classroomId);
  const { data: activePeriod } = useActiveBenchmarkPeriod(classroomId);
  
  const currentPeriod = getCurrentScreeningPeriod();
  const schoolYear = getCurrentSchoolYear();
  
  const completionRate = summary 
    ? Math.round((summary.assessedStudents / summary.totalStudents) * 100)
    : 0;

  const tierColors = {
    tier1: 'bg-green-500',
    tier2: 'bg-yellow-500',
    tier3: 'bg-red-500',
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Universal Screening
            </CardTitle>
            <CardDescription>
              {currentPeriod} {schoolYear} Benchmark Assessment
            </CardDescription>
          </div>
          {activePeriod ? (
            <Badge variant="default" className="bg-green-600">
              <Clock className="h-3 w-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="secondary">
              Not Started
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Completion Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Screening Progress</span>
            <span className="font-medium">
              {summary?.assessedStudents || 0} / {summary?.totalStudents || 0} students
            </span>
          </div>
          <Progress value={completionRate} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {completionRate}% complete
          </p>
        </div>

        {/* RTI Tier Distribution */}
        {summary && summary.assessedStudents > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Risk Tier Distribution</h4>
            <div className="flex gap-2">
              {/* Tier 1 */}
              <div className="flex-1 p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Tier 1</span>
                </div>
                <p className="text-2xl font-bold text-green-700">{summary.tierDistribution.tier1}</p>
                <p className="text-xs text-green-600">Core Instruction</p>
              </div>
              
              {/* Tier 2 */}
              <div className="flex-1 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-700">Tier 2</span>
                </div>
                <p className="text-2xl font-bold text-yellow-700">{summary.tierDistribution.tier2}</p>
                <p className="text-xs text-yellow-600">Strategic</p>
              </div>
              
              {/* Tier 3 */}
              <div className="flex-1 p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-medium text-red-700">Tier 3</span>
                </div>
                <p className="text-2xl font-bold text-red-700">{summary.tierDistribution.tier3}</p>
                <p className="text-xs text-red-600">Intensive</p>
              </div>
            </div>
            
            {/* Visual bar */}
            <div className="flex h-3 rounded-full overflow-hidden">
              <div 
                className={tierColors.tier1} 
                style={{ width: `${(summary.tierDistribution.tier1 / summary.assessedStudents) * 100}%` }}
              />
              <div 
                className={tierColors.tier2} 
                style={{ width: `${(summary.tierDistribution.tier2 / summary.assessedStudents) * 100}%` }}
              />
              <div 
                className={tierColors.tier3} 
                style={{ width: `${(summary.tierDistribution.tier3 / summary.assessedStudents) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Class Average */}
        {summary && summary.assessedStudents > 0 && (
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Class Average WCPM</span>
              <span className="text-xl font-bold">{summary.avgWCPM}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!activePeriod && onStartScreening && (
            <Button onClick={onStartScreening} className="flex-1">
              <PlayCircle className="h-4 w-4 mr-2" />
              Start Screening
            </Button>
          )}
          {summary && summary.assessedStudents > 0 && onViewResults && (
            <Button variant="outline" onClick={onViewResults} className="flex-1">
              View Full Results
            </Button>
          )}
        </div>

        {/* Active Period Info */}
        {activePeriod && (
          <div className="text-xs text-muted-foreground border-t pt-3">
            <p>
              Period: {activePeriod.period_name} {activePeriod.school_year}
            </p>
            <p>
              {format(new Date(activePeriod.start_date), "MMM d")} - {format(new Date(activePeriod.end_date), "MMM d, yyyy")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
