import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle, Info, TrendingUp, Activity } from "lucide-react";
import { type RealtimeFeedbackEvent } from "@/lib/realtimeAudioAnalysis";

interface FeedbackTimelineProps {
  events: RealtimeFeedbackEvent[];
  isRecording: boolean;
}

const FeedbackTimeline = ({ events, isRecording }: FeedbackTimelineProps) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'pace': return <TrendingUp className="w-4 h-4" />;
      case 'clarity': return <CheckCircle className="w-4 h-4" />;
      case 'volume': return <AlertCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getVariant = (severity: string) => {
    switch (severity) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  const formatTimestamp = (timestamp: number, startTime: number) => {
    const seconds = Math.floor((timestamp - startTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (events.length === 0 && !isRecording) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No feedback yet. Start recording to see real-time tips!</p>
        </CardContent>
      </Card>
    );
  }

  const startTime = events.length > 0 ? events[0].timestamp : Date.now();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Real-time Feedback
          {isRecording && (
            <Badge variant="outline" className="ml-auto">
              {events.length} tips
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-3">
            {events.slice().reverse().map((event, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className={`
                  mt-0.5 p-1.5 rounded-full
                  ${event.severity === 'success' ? 'bg-green-100 text-green-700' :
                    event.severity === 'warning' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'}
                `}>
                  {getIcon(event.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{event.message}</span>
                    <Badge variant={getVariant(event.severity)} className="text-xs">
                      {event.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatTimestamp(event.timestamp, startTime)}</span>
                    <span>•</span>
                    <span>{Math.round(event.confidence * 100)}% confidence</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FeedbackTimeline;