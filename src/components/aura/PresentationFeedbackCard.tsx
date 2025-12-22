import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Mic2, 
  Timer, 
  MessageSquareOff, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb,
  Volume2,
  Sparkles
} from "lucide-react";
import { type PresentationMetrics, type PresentationFeedback, generatePresentationFeedback } from "@/lib/presentationAnalysis";

interface PresentationFeedbackCardProps {
  metrics: PresentationMetrics;
  transcript: string;
  durationSeconds: number;
  targetDuration?: number;
}

export const PresentationFeedbackCard = ({
  metrics,
  transcript,
  durationSeconds,
  targetDuration = 60,
}: PresentationFeedbackCardProps) => {
  const feedback = generatePresentationFeedback(metrics);
  
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-blue-500';
      case 'C': return 'bg-amber-500';
      case 'D': return 'bg-orange-500';
      default: return 'bg-red-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const timeDiff = durationSeconds - targetDuration;
  const timeMessage = Math.abs(timeDiff) <= 5 
    ? 'Perfect timing!' 
    : timeDiff > 0 
      ? `${Math.round(timeDiff)}s over target` 
      : `${Math.round(Math.abs(timeDiff))}s under target`;

  return (
    <div className="space-y-4">
      {/* Main Score Card */}
      <Card className="overflow-hidden">
        <div className={`${getGradeColor(metrics.grade)} p-4 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Presentation Score</h3>
              <p className="text-white/80 text-sm">Overall performance</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{metrics.overallScore}</div>
              <Badge className="bg-white/20 text-white border-white/30">
                Grade {metrics.grade}
              </Badge>
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Mic2 className="h-5 w-5 mx-auto mb-1 text-primary" />
              <div className={`text-xl font-bold ${getScoreColor(metrics.confidenceScore)}`}>
                {metrics.confidenceScore}%
              </div>
              <div className="text-xs text-muted-foreground">Confidence</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Timer className="h-5 w-5 mx-auto mb-1 text-primary" />
              <div className={`text-xl font-bold ${getScoreColor(metrics.pacingScore)}`}>
                {metrics.pacingScore}%
              </div>
              <div className="text-xs text-muted-foreground">Pacing</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <MessageSquareOff className="h-5 w-5 mx-auto mb-1 text-primary" />
              <div className={`text-xl font-bold ${metrics.fillerWordCount > 5 ? 'text-red-600' : metrics.fillerWordCount > 2 ? 'text-amber-600' : 'text-green-600'}`}>
                {metrics.fillerWordCount}
              </div>
              <div className="text-xs text-muted-foreground">Filler Words</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
              <div className={`text-xl font-bold ${getScoreColor(metrics.structureScore)}`}>
                {metrics.structureScore}%
              </div>
              <div className="text-xs text-muted-foreground">Structure</div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="space-y-3 mb-6">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Speaking Pace</span>
                <span className="font-medium">{Math.round(metrics.wordsPerMinute)} WPM</span>
              </div>
              <Progress 
                value={Math.min(100, (metrics.wordsPerMinute / 200) * 100)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ideal: 130-170 WPM
              </p>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Voice Variation</span>
                <span className="font-medium">{metrics.voiceVariation}%</span>
              </div>
              <Progress value={metrics.voiceVariation} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Clarity</span>
                <span className="font-medium">{metrics.clarityScore}%</span>
              </div>
              <Progress value={metrics.clarityScore} className="h-2" />
            </div>
          </div>

          {/* Filler Words Breakdown */}
          {metrics.fillerWords.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquareOff className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800 dark:text-amber-200">Filler Words Detected</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {metrics.fillerWords.slice(0, 5).map((fw, i) => (
                  <Badge key={i} variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300">
                    "{fw.word}" × {fw.count}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                {metrics.fillerWordsPerMinute.toFixed(1)} per minute • Try pausing silently instead
              </p>
            </div>
          )}

          {/* Structure Indicators */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant={metrics.hasStrongOpening ? "default" : "outline"} className={metrics.hasStrongOpening ? "bg-green-500" : ""}>
              {metrics.hasStrongOpening ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
              Strong Opening
            </Badge>
            <Badge variant={metrics.hasTransitions ? "default" : "outline"} className={metrics.hasTransitions ? "bg-green-500" : ""}>
              {metrics.hasTransitions ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
              Good Transitions
            </Badge>
            <Badge variant={metrics.hasStrongClosing ? "default" : "outline"} className={metrics.hasStrongClosing ? "bg-green-500" : ""}>
              {metrics.hasStrongClosing ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
              Strong Closing
            </Badge>
          </div>

          {/* Timing */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              <span className="text-sm">Duration</span>
            </div>
            <div className="text-right">
              <span className="font-medium">
                {Math.floor(durationSeconds / 60)}:{Math.round(durationSeconds % 60).toString().padStart(2, '0')}
              </span>
              <span className="text-muted-foreground text-sm ml-2">
                ({timeMessage})
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Personalized Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedback.map((item, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg flex items-start gap-3 ${
                item.type === 'strength'
                  ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                  : item.type === 'improvement'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
                  : 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
              }`}
            >
              {item.type === 'strength' && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />}
              {item.type === 'improvement' && <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />}
              {item.type === 'tip' && <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />}
              <div>
                <Badge variant="outline" className="text-xs mb-1">
                  {item.category}
                </Badge>
                <p className="text-sm">{item.message}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
