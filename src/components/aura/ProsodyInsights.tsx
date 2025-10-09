import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap, Volume2 } from "lucide-react";

interface ProsodyInsightsProps {
  records: any[];
  skillVectors: any[];
}

const ProsodyInsights = ({ records, skillVectors }: ProsodyInsightsProps) => {
  // Aggregate prosody metrics
  const aggregateProsody = () => {
    const pitchVariances: number[] = [];
    const speakingRates: number[] = [];
    const confidenceScores: number[] = [];

    records.forEach((record) => {
      if (record.wpm) speakingRates.push(record.wpm);
      if (record.confidence) confidenceScores.push(record.confidence);
      
      // Extract pitch variance from prosody_metrics if available
      const vector = skillVectors.find((v) => v.student_id === record.profile_id);
      if (vector?.prosody_metrics?.pitch_variance) {
        pitchVariances.push(vector.prosody_metrics.pitch_variance);
      }
    });

    return { pitchVariances, speakingRates, confidenceScores };
  };

  const { pitchVariances, speakingRates, confidenceScores } = aggregateProsody();

  // Calculate averages
  const avgPitchVariance = pitchVariances.length > 0
    ? Math.round(pitchVariances.reduce((a, b) => a + b, 0) / pitchVariances.length)
    : null;
  
  const avgWPM = speakingRates.length > 0
    ? Math.round(speakingRates.reduce((a, b) => a + b, 0) / speakingRates.length)
    : 0;

  const avgConfidence = confidenceScores.length > 0
    ? Math.round((confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length) * 100) / 100
    : 0;

  // Speaking rate distribution
  const rateDistribution = [
    { range: "< 100", count: speakingRates.filter((r) => r < 100).length },
    { range: "100-130", count: speakingRates.filter((r) => r >= 100 && r < 130).length },
    { range: "130-160", count: speakingRates.filter((r) => r >= 130 && r < 160).length },
    { range: "160-190", count: speakingRates.filter((r) => r >= 160 && r < 190).length },
    { range: "> 190", count: speakingRates.filter((r) => r >= 190).length },
  ];

  // Class-wide insights
  const insights = [];
  
  if (avgWPM > 180) {
    insights.push({
      type: "warning",
      icon: <Zap className="w-4 h-4" />,
      message: `Class speaks too quickly (avg ${avgWPM} WPM). Target: 130-160 WPM.`,
    });
  } else if (avgWPM < 110) {
    insights.push({
      type: "warning",
      icon: <Zap className="w-4 h-4" />,
      message: `Class speaks too slowly (avg ${avgWPM} WPM). Encourage more fluency.`,
    });
  }

  if (avgPitchVariance && avgPitchVariance < 30) {
    insights.push({
      type: "warning",
      icon: <Volume2 className="w-4 h-4" />,
      message: "Low pitch variance indicates monotone speech. Practice expressiveness.",
    });
  }

  if (avgConfidence < 3) {
    insights.push({
      type: "info",
      icon: <TrendingUp className="w-4 h-4" />,
      message: "Overall confidence is developing. Positive reinforcement recommended.",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prosody & Fluency Insights</CardTitle>
        <p className="text-sm text-muted-foreground">
          Speaking quality analysis beyond pronunciation
        </p>
      </CardHeader>
      <CardContent>
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 border rounded-lg">
            <p className="text-2xl font-bold">{avgWPM}</p>
            <p className="text-xs text-muted-foreground">Avg WPM</p>
            <Badge variant="secondary" className="mt-1 text-xs">
              Target: 130-160
            </Badge>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <p className="text-2xl font-bold">{avgConfidence.toFixed(1)}/5</p>
            <p className="text-xs text-muted-foreground">Avg Confidence</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <p className="text-2xl font-bold">
              {avgPitchVariance !== null ? avgPitchVariance : "-"}
            </p>
            <p className="text-xs text-muted-foreground">Pitch Variance</p>
            <Badge variant="secondary" className="mt-1 text-xs">
              Expressiveness
            </Badge>
          </div>
        </div>

        {/* Speaking Rate Distribution */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">Speaking Rate Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rateDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Class-Wide Insights */}
        {insights.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Class-Wide Patterns</h3>
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 p-3 rounded-lg ${
                  insight.type === "warning"
                    ? "bg-orange-500/10 border border-orange-500/50"
                    : "bg-blue-500/10 border border-blue-500/50"
                }`}
              >
                {insight.icon}
                <p className="text-sm">{insight.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Prosody Coaching Tips */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h3 className="text-sm font-medium mb-2">💡 Prosody Coaching Tips</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Encourage students to vary pitch when reading dialogue</li>
            <li>Practice emphasizing key words in sentences</li>
            <li>Use poetry and dramatic readings to build expressiveness</li>
            <li>Record and playback to build self-awareness</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProsodyInsights;
