import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Volume2, Activity, Zap, Mic } from "lucide-react";
import { type LiveMetrics } from "@/lib/realtimeAudioAnalysis";

interface LiveFeedbackDisplayProps {
  metrics: LiveMetrics | null;
  isRecording: boolean;
}

const LiveFeedbackDisplay = ({ metrics, isRecording }: LiveFeedbackDisplayProps) => {
  if (!metrics || !isRecording) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Card className="border-2 border-primary/20 animate-in fade-in-50 duration-300">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Live Indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Mic className="w-5 h-5 text-primary" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>
              <span className="text-sm font-semibold">Live Analysis</span>
            </div>
            <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
              RECORDING
            </Badge>
          </div>

          {/* Volume Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Volume</span>
              </div>
              <span className={`font-bold ${getScoreColor(metrics.currentVolume)}`}>
                {metrics.currentVolume}
              </span>
            </div>
            <Progress 
              value={metrics.currentVolume} 
              className={`h-2 ${getScoreBgColor(metrics.currentVolume)}`}
            />
          </div>

          {/* Clarity Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Clarity</span>
              </div>
              <span className={`font-bold ${getScoreColor(metrics.clarityScore)}`}>
                {metrics.clarityScore}%
              </span>
            </div>
            <Progress 
              value={metrics.clarityScore} 
              className={`h-2 ${getScoreBgColor(metrics.clarityScore)}`}
            />
          </div>

          {/* Confidence Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Confidence</span>
              </div>
              <span className={`font-bold ${getScoreColor(metrics.confidenceScore)}`}>
                {metrics.confidenceScore}%
              </span>
            </div>
            <Progress 
              value={metrics.confidenceScore} 
              className={`h-2 ${getScoreBgColor(metrics.confidenceScore)}`}
            />
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div className="text-center p-2 rounded bg-muted/50">
              <div className="text-xs text-muted-foreground">Pitch</div>
              <div className="text-lg font-bold">{metrics.avgPitch} Hz</div>
            </div>
            <div className="text-center p-2 rounded bg-muted/50">
              <div className="text-xs text-muted-foreground">Energy</div>
              <div className="text-lg font-bold">{metrics.energyLevel}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveFeedbackDisplay;