import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AudioPlaybackButton } from './AudioPlaybackButton';
import { useReadingSessions } from '@/hooks/useReadingSessions';
import { format } from 'date-fns';
import { BookOpen, Clock, Target, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

interface ReadingSessionsListProps {
  studentId: string;
  studentName?: string;
  limit?: number;
  showHeader?: boolean;
}

export function ReadingSessionsList({
  studentId,
  studentName,
  limit = 10,
  showHeader = true,
}: ReadingSessionsListProps) {
  const { data: sessions, isLoading } = useReadingSessions(studentId);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const displaySessions = sessions?.slice(0, limit) || [];

  if (displaySessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No reading sessions recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Reading Sessions
          </CardTitle>
          <CardDescription>
            {studentName ? `${studentName}'s ` : ''}recent oral reading fluency recordings
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {displaySessions.map((session: any) => (
          <div
            key={session.id}
            className="border rounded-lg p-4 space-y-3"
          >
            {/* Header Row */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm">
                  Reading Session
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(session.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {session.wcpm !== null && session.wcpm > 0 && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    {session.wcpm} WCPM
                  </Badge>
                )}
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-muted/50 rounded">
                <p className="text-muted-foreground">Words</p>
                <p className="font-bold">{session.words_read || '-'}</p>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <p className="text-muted-foreground">Accuracy</p>
                <p className="font-bold">{session.accuracy_percent ? `${Math.round(session.accuracy_percent)}%` : '-'}</p>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <p className="text-muted-foreground">Duration</p>
                <p className="font-bold">{session.duration_seconds ? `${Math.round(session.duration_seconds)}s` : '-'}</p>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <p className="text-muted-foreground">Fluency</p>
                <p className="font-bold">{session.fluency_score ? `${Math.round(session.fluency_score)}` : '-'}</p>
              </div>
            </div>

            {/* Audio Playback - This is the key integration! */}
            {session.audio_url && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Student Recording:</p>
                <AudioPlaybackButton
                  audioUrl={null}
                  audioPath={session.audio_url}
                  showProgress={true}
                />
              </div>
            )}

            {/* Expandable Details */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setExpanded(expanded === session.id ? null : session.id)}
            >
              {expanded === session.id ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show Details
                </>
              )}
            </Button>

            {expanded === session.id && (
              <div className="pt-2 border-t space-y-2 text-sm">
                {session.miscue_analysis && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Miscues</span>
                    <span>{(session.miscue_analysis as any)?.total_miscues || 0}</span>
                  </div>
                )}
                {session.cognitive_load_avg !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cognitive Load</span>
                    <span>{Number(session.cognitive_load_avg).toFixed(2)}</span>
                  </div>
                )}
                {session.fluency_level && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fluency Level</span>
                    <Badge variant="outline">{session.fluency_level}</Badge>
                  </div>
                )}
                {session.recommended_difficulty !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recommended Level</span>
                    <span>Grade {session.recommended_difficulty}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {sessions && sessions.length > limit && (
          <p className="text-xs text-center text-muted-foreground">
            Showing {limit} of {sessions.length} sessions
          </p>
        )}
      </CardContent>
    </Card>
  );
}
