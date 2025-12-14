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
import { Users, AlertTriangle, CheckCircle, Clock, PlayCircle, Target, TrendingUp } from "lucide-react";
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

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
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
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-4 w-4 text-primary" />
              </div>
              Universal Screening
            </CardTitle>
            <CardDescription className="text-sm">
              {currentPeriod} {schoolYear} Assessment Window
            </CardDescription>
          </div>
          {activePeriod ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse" />
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="shadow-sm">
              Not Started
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {/* Completion Progress - Enhanced */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Screening Progress</span>
            <span className="text-sm font-bold">
              {summary?.assessedStudents || 0} / {summary?.totalStudents || 0}
            </span>
          </div>
          <div className="relative">
            <Progress value={completionRate} className="h-3 bg-muted/50" />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {completionRate}% complete
          </p>
        </div>

        {/* RTI Tier Distribution - Professional Cards */}
        {summary && summary.assessedStudents > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Risk Tier Distribution</h4>
            <div className="grid grid-cols-3 gap-2">
              {/* Tier 1 */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Tier 1</span>
                </div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{summary.tierDistribution.tier1}</p>
                <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">Core</p>
              </div>
              
              {/* Tier 2 */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-200/60 dark:border-amber-800/40">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Tier 2</span>
                </div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{summary.tierDistribution.tier2}</p>
                <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-medium">Strategic</p>
              </div>
              
              {/* Tier 3 */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/40 dark:to-rose-900/20 border border-rose-200/60 dark:border-rose-800/40">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">Tier 3</span>
                </div>
                <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{summary.tierDistribution.tier3}</p>
                <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 font-medium">Intensive</p>
              </div>
            </div>
            
            {/* Visual distribution bar */}
            <div className="flex h-2 rounded-full overflow-hidden shadow-inner bg-muted/30">
              {summary.assessedStudents > 0 && (
                <>
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500" 
                    style={{ width: `${(summary.tierDistribution.tier1 / summary.assessedStudents) * 100}%` }}
                  />
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500" 
                    style={{ width: `${(summary.tierDistribution.tier2 / summary.assessedStudents) * 100}%` }}
                  />
                  <div 
                    className="bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-500" 
                    style={{ width: `${(summary.tierDistribution.tier3 / summary.assessedStudents) * 100}%` }}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Class Average - Refined */}
        {summary && summary.assessedStudents > 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Class Average</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary">{summary.avgWCPM}</span>
                <span className="text-xs text-muted-foreground">WCPM</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Enhanced */}
        <div className="flex gap-2 pt-1">
          {!activePeriod && onStartScreening && (
            <Button 
              onClick={onStartScreening} 
              className="flex-1 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Start Screening
            </Button>
          )}
          {summary && summary.assessedStudents > 0 && onViewResults && (
            <Button 
              variant="outline" 
              onClick={onViewResults} 
              className="flex-1 shadow-sm hover:shadow-md transition-all"
            >
              View Full Results
            </Button>
          )}
        </div>

        {/* Active Period Info - Refined */}
        {activePeriod && (
          <div className="text-xs text-muted-foreground border-t border-border/50 pt-4 space-y-1">
            <p className="font-medium">
              {activePeriod.period_name} {activePeriod.school_year}
            </p>
            <p className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(activePeriod.start_date), "MMM d")} - {format(new Date(activePeriod.end_date), "MMM d, yyyy")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
