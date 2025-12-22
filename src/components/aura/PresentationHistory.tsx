import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Presentation, TrendingUp, TrendingDown, Minus, Calendar, Clock, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface PresentationHistoryProps {
  studentId: string;
}

interface PresentationRecord {
  id: string;
  created_at: string;
  presentation_topic: string | null;
  presentation_type: string | null;
  presentation_confidence_score: number | null;
  pacing_score: number | null;
  structure_score: number | null;
  filler_word_count: number | null;
  grade: number | null;
  duration_s: number;
  wpm: number;
}

export function PresentationHistory({ studentId }: PresentationHistoryProps) {
  const { data: presentations, isLoading } = useQuery({
    queryKey: ['presentation-history', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aura_records')
        .select('id, created_at, presentation_topic, presentation_type, presentation_confidence_score, pacing_score, structure_score, filler_word_count, grade, duration_s, wpm')
        .eq('profile_id', studentId)
        .not('presentation_type', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as PresentationRecord[];
    },
    enabled: !!studentId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading presentation history...
        </CardContent>
      </Card>
    );
  }

  if (!presentations || presentations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <Presentation className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Presentations Yet</h3>
          <p className="text-muted-foreground text-sm">
            Complete your first presentation practice to see your history here!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate trends
  const recentScores = presentations.slice(0, 5).map(p => p.grade || 0);
  const olderScores = presentations.slice(5, 10).map(p => p.grade || 0);
  
  const recentAvg = recentScores.length > 0 
    ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length 
    : 0;
  const olderAvg = olderScores.length > 0 
    ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length 
    : recentAvg;
  
  const trend = recentAvg - olderAvg;
  
  // Calculate averages
  const avgConfidence = presentations.reduce((sum, p) => sum + (p.presentation_confidence_score || 0), 0) / presentations.length;
  const avgPacing = presentations.reduce((sum, p) => sum + (p.pacing_score || 0), 0) / presentations.length;
  const avgStructure = presentations.reduce((sum, p) => sum + (p.structure_score || 0), 0) / presentations.length;
  const avgFillers = presentations.reduce((sum, p) => sum + (p.filler_word_count || 0), 0) / presentations.length;

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'bg-green-500';
    if (grade >= 80) return 'bg-blue-500';
    if (grade >= 70) return 'bg-yellow-500';
    if (grade >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getGradeLetter = (grade: number) => {
    if (grade >= 90) return 'A';
    if (grade >= 80) return 'B';
    if (grade >= 70) return 'C';
    if (grade >= 60) return 'D';
    return 'F';
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Presentation className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold">{presentations.length}</p>
            <p className="text-xs text-muted-foreground">presentations</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              {trend > 5 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : trend < -5 ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">Trend</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(recentAvg)}</p>
            <p className="text-xs text-muted-foreground">
              {trend > 0 ? `+${Math.round(trend)}` : Math.round(trend)} pts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Avg Fillers</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(avgFillers)}</p>
            <p className="text-xs text-muted-foreground">per presentation</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Confidence</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(avgConfidence)}</p>
            <p className="text-xs text-muted-foreground">avg score</p>
          </CardContent>
        </Card>
      </div>

      {/* Skill Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Skill Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Confidence</span>
              <span>{Math.round(avgConfidence)}%</span>
            </div>
            <Progress value={avgConfidence} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Pacing</span>
              <span>{Math.round(avgPacing)}%</span>
            </div>
            <Progress value={avgPacing} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Structure</span>
              <span>{Math.round(avgStructure)}%</span>
            </div>
            <Progress value={avgStructure} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Presentations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Presentations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {presentations.slice(0, 10).map((presentation) => (
            <div
              key={presentation.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full ${getGradeColor(presentation.grade || 0)} flex items-center justify-center text-white font-bold`}>
                  {getGradeLetter(presentation.grade || 0)}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {presentation.presentation_topic || presentation.presentation_type || 'Presentation'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(presentation.created_at), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.round(presentation.duration_s)}s
                    </span>
                    <span>{presentation.wpm} WPM</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-1">
                  {presentation.grade || 0}/100
                </Badge>
                {presentation.filler_word_count !== null && (
                  <p className="text-xs text-muted-foreground">
                    {presentation.filler_word_count} fillers
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
