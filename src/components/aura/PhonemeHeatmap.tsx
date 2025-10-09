import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface PhonemeHeatmapProps {
  students: any[];
  skillVectors: any[];
}

const COMMON_PHONEMES = [
  { symbol: "/r/", label: "R" },
  { symbol: "/θ/", label: "TH" },
  { symbol: "/ð/", label: "TH-voiced" },
  { symbol: "/l/", label: "L" },
  { symbol: "/s/", label: "S" },
  { symbol: "/z/", label: "Z" },
  { symbol: "/ʃ/", label: "SH" },
  { symbol: "/tʃ/", label: "CH" },
  { symbol: "/dʒ/", label: "J" },
  { symbol: "/v/", label: "V" },
  { symbol: "/w/", label: "W" },
];

const PhonemeHeatmap = ({ students, skillVectors }: PhonemeHeatmapProps) => {
  const [selectedCell, setSelectedCell] = useState<{ studentId: string; phoneme: string } | null>(null);

  const getPhonemeScore = (studentId: string, phoneme: string) => {
    const vector = skillVectors.find((v) => v.student_id === studentId);
    if (!vector?.phoneme_scores) return null;
    return vector.phoneme_scores[phoneme] || null;
  };

  const getCellColor = (score: number | null) => {
    if (score === null) return "bg-muted";
    if (score >= 90) return "bg-green-500/20 hover:bg-green-500/30";
    if (score >= 70) return "bg-yellow-500/20 hover:bg-yellow-500/30";
    return "bg-red-500/20 hover:bg-red-500/30";
  };

  const getScoreBadgeVariant = (score: number | null): "default" | "secondary" | "destructive" => {
    if (score === null) return "secondary";
    if (score >= 90) return "default";
    if (score >= 70) return "secondary";
    return "destructive";
  };

  // Calculate class averages
  const getClassAverage = (phoneme: string) => {
    const scores = students
      .map((s) => getPhonemeScore(s.student_id, phoneme))
      .filter((score): score is number => score !== null);
    
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phoneme Struggle Heatmap</CardTitle>
        <p className="text-sm text-muted-foreground">
          Click any cell to see recordings with that phoneme issue
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left border font-medium">Student</th>
                {COMMON_PHONEMES.map((p) => (
                  <th key={p.symbol} className="p-2 text-center border font-medium min-w-[60px]">
                    <div className="text-xs">{p.label}</div>
                    <div className="text-xs text-muted-foreground">{p.symbol}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.student_id}>
                  <td className="p-2 border font-medium">
                    {student.profiles?.full_name || "Unknown"}
                  </td>
                  {COMMON_PHONEMES.map((p) => {
                    const score = getPhonemeScore(student.student_id, p.symbol);
                    return (
                      <td
                        key={p.symbol}
                        className={`p-2 border text-center cursor-pointer transition-colors ${getCellColor(score)}`}
                        onClick={() => setSelectedCell({ studentId: student.student_id, phoneme: p.symbol })}
                      >
                        {score !== null ? (
                          <Badge variant={getScoreBadgeVariant(score)} className="text-xs">
                            {score}%
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Class Average Row */}
              <tr className="bg-muted/50 font-bold">
                <td className="p-2 border">Class Average</td>
                {COMMON_PHONEMES.map((p) => {
                  const avg = getClassAverage(p.symbol);
                  return (
                    <td key={p.symbol} className="p-2 border text-center">
                      {avg !== null ? (
                        <Badge variant={getScoreBadgeVariant(avg)} className="text-xs">
                          {avg}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {selectedCell && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <p className="text-sm">
              Selected: <strong>{students.find(s => s.student_id === selectedCell.studentId)?.profiles?.full_name}</strong> - Phoneme: <strong>{selectedCell.phoneme}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              (Future: Show student's recordings with this phoneme issue)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhonemeHeatmap;
