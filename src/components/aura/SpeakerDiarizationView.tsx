import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock } from "lucide-react";

interface SpeakerSegment {
  start: number;
  end: number;
  speaker_id: string;
  confidence: number;
}

interface SpeakerDiarizationViewProps {
  segments: SpeakerSegment[];
  diarizationConfidence?: number;
}

const SpeakerDiarizationView = ({ segments, diarizationConfidence }: SpeakerDiarizationViewProps) => {
  if (!segments || segments.length === 0) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSpeakerColor = (speakerId: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
    ];
    const hash = speakerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getSpeakerLabel = (speakerId: string) => {
    return speakerId === 'speaker_0' ? 'You' : `Speaker ${speakerId.slice(-1)}`;
  };

  // Get unique speakers
  const uniqueSpeakers = Array.from(new Set(segments.map(s => s.speaker_id)));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Speaker Analysis
            </CardTitle>
            <CardDescription>
              {uniqueSpeakers.length} speaker{uniqueSpeakers.length !== 1 ? 's' : ''} detected
            </CardDescription>
          </div>
          {diarizationConfidence && (
            <Badge variant="outline">
              {Math.round(diarizationConfidence)}% confidence
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Speaker Legend */}
        <div className="flex flex-wrap gap-2">
          {uniqueSpeakers.map((speakerId) => (
            <div key={speakerId} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getSpeakerColor(speakerId)}`} />
              <span className="text-sm font-medium">{getSpeakerLabel(speakerId)}</span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          {segments.map((segment, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
              <div className={`w-2 h-2 rounded-full ${getSpeakerColor(segment.speaker_id)}`} />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm font-medium">{getSpeakerLabel(segment.speaker_id)}</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(segment.start)} - {formatTime(segment.end)}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(segment.confidence * 100)}%
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Speaking time distribution */}
        <div className="pt-3 border-t">
          <p className="text-sm font-medium mb-3">Speaking Time Distribution</p>
          {uniqueSpeakers.map((speakerId) => {
            const speakerSegments = segments.filter(s => s.speaker_id === speakerId);
            const totalTime = speakerSegments.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
            const totalDuration = segments[segments.length - 1]?.end || 1;
            const percentage = Math.round((totalTime / totalDuration) * 100);

            return (
              <div key={speakerId} className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${getSpeakerColor(speakerId)}`} />
                <span className="text-sm w-20">{getSpeakerLabel(speakerId)}</span>
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${getSpeakerColor(speakerId)} transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeakerDiarizationView;