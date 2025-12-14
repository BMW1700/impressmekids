/**
 * AURA Reading Results Card
 * Displays comprehensive reading analysis: WCPM, miscue analysis, prosody metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  Volume2, 
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import type { MiscueAnalysis, getMiscueInterventions } from '@/lib/miscueAnalysis';
import type { ProsodyMetrics } from '@/lib/prosodyAnalysis';

interface ReadingResultsCardProps {
  wpm: number;
  wcpm: number;
  accuracy: number;
  miscueAnalysis?: MiscueAnalysis;
  prosodyMetrics?: ProsodyMetrics;
  fluencyLevel?: 'frustration' | 'instructional' | 'independent';
  xpEarned?: number;
  interventions?: string[];
}

const FluencyLevelBadge = ({ level }: { level: string }) => {
  const config: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary'; icon: typeof BookOpen }> = {
    independent: { label: 'Independent Reader', variant: 'default', icon: CheckCircle2 },
    instructional: { label: 'Instructional Level', variant: 'secondary', icon: BookOpen },
    frustration: { label: 'Needs Support', variant: 'destructive', icon: AlertTriangle },
  };
  
  const { label, variant, icon: Icon } = config[level] || config.instructional;
  
  return (
    <Badge variant={variant} className="gap-1.5 px-3 py-1">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
};

const MetricBar = ({ 
  label, 
  value, 
  max = 4, 
  color = 'primary' 
}: { 
  label: string; 
  value: number; 
  max?: number; 
  color?: string;
}) => {
  const percent = (value / max) * 100;
  const colorClass = 
    percent >= 75 ? 'bg-green-500' : 
    percent >= 50 ? 'bg-amber-500' : 
    'bg-red-500';
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export const ReadingResultsCard = ({
  wpm,
  wcpm,
  accuracy,
  miscueAnalysis,
  prosodyMetrics,
  fluencyLevel,
  xpEarned,
  interventions,
}: ReadingResultsCardProps) => {
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Reading Analysis
          </CardTitle>
          {fluencyLevel && <FluencyLevelBadge level={fluencyLevel} />}
        </div>
        {xpEarned && (
          <Badge variant="outline" className="w-fit bg-amber-500/10 text-amber-600 border-amber-500/30">
            +{xpEarned} XP Earned
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Primary Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
            <div className="text-3xl font-bold text-blue-600">{wpm}</div>
            <div className="text-xs text-muted-foreground mt-1">WPM</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
            <div className="text-3xl font-bold text-green-600">{wcpm}</div>
            <div className="text-xs text-muted-foreground mt-1">WCPM</div>
            <div className="text-[10px] text-muted-foreground">(Words Correct)</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
            <div className="text-3xl font-bold text-purple-600">{accuracy}%</div>
            <div className="text-xs text-muted-foreground mt-1">Accuracy</div>
          </div>
        </div>

        {/* Prosody Metrics (if available) */}
        {prosodyMetrics && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Fluency (NAEP Scale)
              </h4>
              <div className="grid gap-3">
                <MetricBar label="Phrasing" value={prosodyMetrics.phrasing} />
                <MetricBar label="Expression" value={prosodyMetrics.expression} />
                <MetricBar label="Smoothness" value={prosodyMetrics.smoothness} />
                <MetricBar label="Pace" value={prosodyMetrics.pace} />
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Overall Fluency</span>
                <span className="text-lg font-bold text-primary">{prosodyMetrics.overallScore}%</span>
              </div>
            </div>
          </>
        )}

        {/* Miscue Analysis (if available) */}
        {miscueAnalysis && miscueAnalysis.totalMiscues > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Miscue Analysis
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {miscueAnalysis.miscuesByType.substitution > 0 && (
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span>Substitutions</span>
                    <Badge variant="outline">{miscueAnalysis.miscuesByType.substitution}</Badge>
                  </div>
                )}
                {miscueAnalysis.miscuesByType.omission > 0 && (
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span>Omissions</span>
                    <Badge variant="outline">{miscueAnalysis.miscuesByType.omission}</Badge>
                  </div>
                )}
                {miscueAnalysis.miscuesByType.insertion > 0 && (
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span>Insertions</span>
                    <Badge variant="outline">{miscueAnalysis.miscuesByType.insertion}</Badge>
                  </div>
                )}
                {miscueAnalysis.miscuesByType.self_correction > 0 && (
                  <div className="flex justify-between p-2 rounded bg-green-500/10">
                    <span>Self-Corrections</span>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                      {miscueAnalysis.miscuesByType.self_correction}
                    </Badge>
                  </div>
                )}
              </div>
              {miscueAnalysis.selfCorrectionRate > 20 && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Great self-monitoring! {miscueAnalysis.selfCorrectionRate}% self-correction rate
                </p>
              )}
            </div>
          </>
        )}

        {/* Feedback */}
        {prosodyMetrics?.feedback && prosodyMetrics.feedback.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Coaching Tips
              </h4>
              <ul className="space-y-1.5">
                {prosodyMetrics.feedback.slice(0, 3).map((tip, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Intervention Recommendations */}
        {interventions && interventions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                What to Practice Next
              </h4>
              <ul className="space-y-1.5">
                {interventions.slice(0, 4).map((intervention, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5 shrink-0">→</span>
                    {intervention}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
