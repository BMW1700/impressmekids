import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SendPhonemeReportDialog } from "./SendPhonemeReportDialog";
import { ipaToEnglish } from "@/lib/phonemeDisplayUtils";

interface PhonemeHeatmapProps {
  students: any[];
  skillVectors: any[];
  classroomId: string;
  classroomName: string;
  hideClassAverage?: boolean;
  gradeMode?: string;
}

// All 44 phonemes with IPA symbols (matches database) and teacher-friendly labels
const COMMON_PHONEMES = [
  // === Consonants (24) ===
  { symbol: "b", label: "/b/", example: "bat" },
  { symbol: "d", label: "/d/", example: "dog" },
  { symbol: "f", label: "/f/", example: "fish" },
  { symbol: "ɡ", label: "/g/", example: "go" },
  { symbol: "h", label: "/h/", example: "hat" },
  { symbol: "dʒ", label: "/j/", example: "jump" },
  { symbol: "k", label: "/k/", example: "kite" },
  { symbol: "l", label: "/l/", example: "lamp" },
  { symbol: "m", label: "/m/", example: "man" },
  { symbol: "n", label: "/n/", example: "nut" },
  { symbol: "ŋ", label: "/ng/", example: "sing" },
  { symbol: "p", label: "/p/", example: "pen" },
  { symbol: "ɹ", label: "/r/", example: "rabbit" },
  { symbol: "s", label: "/s/", example: "snake" },
  { symbol: "t", label: "/t/", example: "top" },
  { symbol: "v", label: "/v/", example: "van" },
  { symbol: "w", label: "/w/", example: "water" },
  { symbol: "j", label: "/y/", example: "yes" },
  { symbol: "z", label: "/z/", example: "zebra" },
  { symbol: "θ", label: "/th/", example: "think" },
  { symbol: "ð", label: "/th/", example: "this" },
  { symbol: "tʃ", label: "/ch/", example: "chair" },
  { symbol: "ʃ", label: "/sh/", example: "ship" },
  { symbol: "ʒ", label: "/zh/", example: "measure" },
  // === Short Vowels (5) ===
  { symbol: "æ", label: "/a/", example: "cat" },
  { symbol: "ɛ", label: "/e/", example: "bed" },
  { symbol: "ɪ", label: "/i/", example: "sit" },
  { symbol: "ɑ", label: "/o/", example: "hot" },
  { symbol: "ʌ", label: "/u/", example: "cup" },
  // === Long Vowels (5) ===
  { symbol: "eɪ", label: "/ae/", example: "make" },
  { symbol: "i", label: "/ee/", example: "tree" },
  { symbol: "aɪ", label: "/ie/", example: "like" },
  { symbol: "oʊ", label: "/oe/", example: "home" },
  { symbol: "u", label: "/ue/", example: "blue" },
  // === Other Vowels (3) ===
  { symbol: "ʊ", label: "/oo/", example: "book" },
  { symbol: "ɔ", label: "/au/", example: "saw" },
  { symbol: "ə", label: "/er/", example: "about" },
  // === R-controlled Vowels (3) ===
  { symbol: "ɝ", label: "/ur/", example: "bird" },
  // === Diphthongs (2) ===
  { symbol: "aʊ", label: "/ow/", example: "out" },
  { symbol: "ɔɪ", label: "/oi/", example: "boy" },
  // === R-Controlled Vowels (4) ===
  { symbol: "ɑɹ", label: "/ar/", example: "car" },
  { symbol: "ɔɹ", label: "/or/", example: "for" },
  { symbol: "ɛɹ", label: "/air/", example: "fair" },
  { symbol: "ɪɹ", label: "/ear/", example: "ear" },
];

const PhonemeHeatmap = ({ students, skillVectors, classroomId, classroomName, hideClassAverage = false, gradeMode }: PhonemeHeatmapProps) => {
  const [selectedCell, setSelectedCell] = useState<{ studentId: string; phoneme: string } | null>(null);
  const [reportDialogData, setReportDialogData] = useState<{ studentId: string; studentName: string } | null>(null);

  // Fetch reading sessions with phoneme_accuracy for students — scoped by gradeMode
  const studentIds = students.map(s => s.student_id);
  const { data: readingSessions, isLoading } = useQuery({
    queryKey: ['reading-sessions-phonemes', studentIds, gradeMode],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      let query = supabase
        .from('reading_sessions')
        .select('student_id, phoneme_accuracy')
        .in('student_id', studentIds)
        .not('phoneme_accuracy', 'is', null);
      if (gradeMode) query = query.eq('grade_mode', gradeMode);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: studentIds.length > 0,
  });

  // Calculate phoneme scores from reading_sessions if skill_vectors is empty
  const getPhonemeScore = (studentId: string, phoneme: string) => {
    // First try skill_vectors (original source)
    const vector = skillVectors.find((v) => v.student_id === studentId);
    if (vector?.phoneme_scores?.[phoneme] !== undefined) {
      return vector.phoneme_scores[phoneme];
    }

    // Fallback: aggregate from reading_sessions phoneme_accuracy
    if (readingSessions && readingSessions.length > 0) {
      const studentSessions = readingSessions.filter(s => s.student_id === studentId);
      if (studentSessions.length === 0) return null;

      const scores: number[] = [];
      studentSessions.forEach(session => {
        const accuracy = session.phoneme_accuracy as Record<string, number> | null;
        if (accuracy && accuracy[phoneme] !== undefined) {
          scores.push(accuracy[phoneme]);
        }
      });

      if (scores.length > 0) {
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      }
    }

    return null;
  };

  const getCellColor = (score: number | null) => {
    if (score === null) return "bg-muted hover:bg-muted/80";
    if (score >= 90) return "bg-gradient-to-br from-green-500/30 to-green-600/20 hover:from-green-500/40 hover:to-green-600/30 border-green-500/20";
    if (score >= 70) return "bg-gradient-to-br from-yellow-500/30 to-yellow-600/20 hover:from-yellow-500/40 hover:to-yellow-600/30 border-yellow-500/20";
    return "bg-gradient-to-br from-red-500/30 to-red-600/20 hover:from-red-500/40 hover:to-red-600/30 border-red-500/20";
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

  if (isLoading) {
    return (
      <Card className="shadow-elegant border-2 border-primary/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading phoneme data...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elegant border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-card">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Sound Accuracy Heatmap</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              See which sounds each student has mastered • Click any cell for details
            </p>
          </div>
        </div>
        {/* Visual Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-green-500/40 border border-green-500/50" />
            <span>90%+ Mastered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-yellow-500/40 border border-yellow-500/50" />
            <span>70-89% Developing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-red-500/40 border border-red-500/50" />
            <span>&lt;70% Needs Practice</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-muted border border-muted-foreground/20" />
            <span>No data yet</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border-2 border-primary/10">
          <table className="w-full border-collapse">
            <thead className="bg-gradient-to-r from-primary/10 to-primary/5">
              <tr>
                <th className="p-4 text-left border-2 border-primary/10 font-semibold text-base">Student</th>
                {COMMON_PHONEMES.map((p, idx) => (
                  <th 
                    key={p.symbol} 
                    className="p-4 text-center border-2 border-primary/10 font-semibold min-w-[90px] animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                    title={`Example: "${p.example}"`}
                  >
                    <div className="text-sm font-bold">{p.label}</div>
                    <div className="text-xs text-muted-foreground italic">"{p.example}"</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student, studentIdx) => (
                <tr 
                  key={student.student_id} 
                  className="hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${studentIdx * 100}ms` }}
                >
                  <td className="p-4 border-2 border-primary/10 font-semibold text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        {student.profiles?.full_name || "Unknown"}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setReportDialogData({
                          studentId: student.student_id,
                          studentName: student.profiles?.full_name || "Unknown"
                        })}
                        title="Send report to parent"
                      >
                        <Send className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    </div>
                  </td>
                  {COMMON_PHONEMES.map((p) => {
                    const score = getPhonemeScore(student.student_id, p.symbol);
                    return (
                      <td
                        key={p.symbol}
                        className={`p-4 border-2 text-center cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md ${getCellColor(score)}`}
                        onClick={() => setSelectedCell({ studentId: student.student_id, phoneme: p.symbol })}
                      >
                        {score !== null ? (
                          <div className="flex flex-col items-center gap-1">
                            <Badge variant={getScoreBadgeVariant(score)} className="text-xs font-bold px-2">
                              {score}%
                            </Badge>
                            {score >= 90 && <TrendingUp className="h-3 w-3 text-green-600" />}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Class Average Row */}
              {!hideClassAverage && (
              <tr className="bg-gradient-to-r from-primary/20 to-primary/10 font-bold border-t-4 border-primary/30">
                <td className="p-4 border-2 border-primary/20 text-base">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Class Average
                  </div>
                </td>
                {COMMON_PHONEMES.map((p) => {
                  const avg = getClassAverage(p.symbol);
                  return (
                    <td key={p.symbol} className="p-4 border-2 border-primary/20 text-center">
                      {avg !== null ? (
                        <Badge variant={getScoreBadgeVariant(avg)} className="text-sm font-bold px-3 shadow-md">
                          {avg}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedCell && (
          <div className="mt-6 p-4 border-2 border-primary rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Selected: <strong>{students.find(s => s.student_id === selectedCell.studentId)?.profiles?.full_name}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Phoneme: <strong className="font-mono text-primary">{ipaToEnglish(selectedCell.phoneme)}</strong>
                </p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-xs">
              <p className="font-medium mb-1">📊 Detailed Analysis:</p>
              <p className="text-muted-foreground">
                View student's practice recordings, identify error patterns, and generate targeted exercises for this phoneme.
              </p>
            </div>
          </div>
        )}

        {/* Send Phoneme Report Dialog */}
        {reportDialogData && (
          <SendPhonemeReportDialog
            open={!!reportDialogData}
            onOpenChange={(open) => {
              if (!open) setReportDialogData(null);
            }}
            studentId={reportDialogData.studentId}
            studentName={reportDialogData.studentName}
            classroomId={classroomId}
            classroomName={classroomName}
            phonemes={COMMON_PHONEMES.map((p) => ({
              ...p,
              score: getPhonemeScore(reportDialogData.studentId, p.symbol),
            }))}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default PhonemeHeatmap;