import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Target, 
  BookOpen, 
  Mic,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  BarChart3
} from "lucide-react";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { Loader2 } from "lucide-react";
import { ImprovementTracker } from "@/components/shared/ImprovementTracker";

interface ParentWeeklyReportProps {
  studentId: string;
  studentName: string;
}

// Phoneme to friendly name mapping
const phonemeNames: Record<string, string> = {
  "AA": "ah (as in 'father')",
  "AE": "a (as in 'cat')",
  "AH": "uh (as in 'but')",
  "AO": "aw (as in 'dog')",
  "AW": "ow (as in 'cow')",
  "AY": "eye (as in 'my')",
  "B": "b sound",
  "CH": "ch (as in 'chair')",
  "D": "d sound",
  "DH": "th (as in 'the')",
  "EH": "e (as in 'bed')",
  "ER": "er (as in 'bird')",
  "EY": "ay (as in 'say')",
  "F": "f sound",
  "G": "g sound",
  "HH": "h sound",
  "IH": "i (as in 'sit')",
  "IY": "ee (as in 'see')",
  "JH": "j sound",
  "K": "k sound",
  "L": "l sound",
  "M": "m sound",
  "N": "n sound",
  "NG": "ng (as in 'sing')",
  "OW": "oh (as in 'go')",
  "OY": "oy (as in 'boy')",
  "P": "p sound",
  "R": "r sound",
  "S": "s sound",
  "SH": "sh (as in 'ship')",
  "T": "t sound",
  "TH": "th (as in 'think')",
  "UH": "oo (as in 'book')",
  "UW": "oo (as in 'boot')",
  "V": "v sound",
  "W": "w sound",
  "Y": "y sound",
  "Z": "z sound",
  "ZH": "zh (as in 'measure')",
};

const getPhonemeLabel = (phoneme: string) => {
  return phonemeNames[phoneme.toUpperCase()] || phoneme;
};

export const ParentWeeklyReport = ({ studentId, studentName }: ParentWeeklyReportProps) => {
  const { data: progress, isLoading } = useWeeklyProgress(studentId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No reading data available yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Once {studentName} starts reading practice, you'll see progress here
          </p>
        </CardContent>
      </Card>
    );
  }

  const { currentWeek, previousWeek, wcpmChange, accuracyChange, topStrengths, areasForPractice, phonemeSubstitutions, isImproving } = progress;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Detailed Analysis
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB - Simple, parent-friendly */}
        <TabsContent value="overview" className="space-y-4">
          {/* Hero Summary Card */}
          <Card className={`border-0 ${isImproving ? "bg-gradient-to-br from-green-500/10 to-emerald-500/5" : "bg-gradient-to-br from-blue-500/10 to-primary/5"} shadow-lg`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isImproving ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <Minus className="h-5 w-5 text-blue-600" />
                )}
                This Week's Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Reading Speed */}
                <div className="text-center p-4 rounded-xl bg-background/60 backdrop-blur-sm">
                  <p className="text-4xl font-bold text-primary">
                    {currentWeek?.avgWcpm || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Words Per Minute</p>
                  {wcpmChange !== 0 && (
                    <div className={`flex items-center justify-center gap-1 mt-2 ${wcpmChange > 0 ? "text-green-600" : "text-red-600"}`}>
                      {wcpmChange > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      <span className="text-sm font-medium">{Math.abs(wcpmChange)} vs last week</span>
                    </div>
                  )}
                </div>

                {/* Accuracy */}
                <div className="text-center p-4 rounded-xl bg-background/60 backdrop-blur-sm">
                  <p className="text-4xl font-bold text-primary">
                    {currentWeek?.avgAccuracy || 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Reading Accuracy</p>
                  {accuracyChange !== 0 && (
                    <div className={`flex items-center justify-center gap-1 mt-2 ${accuracyChange > 0 ? "text-green-600" : "text-red-600"}`}>
                      {accuracyChange > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      <span className="text-sm font-medium">{Math.abs(accuracyChange)}% vs last week</span>
                    </div>
                  )}
                </div>

                {/* Sessions */}
                <div className="text-center p-4 rounded-xl bg-background/60 backdrop-blur-sm">
                  <p className="text-4xl font-bold text-primary">
                    {currentWeek?.sessionsCount || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Practice Sessions</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {currentWeek?.totalWordsRead || 0} total words read
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Simple Strengths & Practice Areas */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* What's Going Well */}
            <Card className="border-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  What's Going Well
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topStrengths.length > 0 ? (
                  <ul className="space-y-2">
                    {topStrengths.slice(0, 3).map((phoneme, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>Great at the <strong>{getPhonemeLabel(phoneme)}</strong></span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Keep practicing! We'll identify strengths soon.
                  </p>
                )}
                {currentWeek && currentWeek.avgWcpm > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-green-500/10">
                    <p className="text-sm">
                      📚 {studentName} read <strong>{currentWeek.totalWordsRead} words</strong> this week!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Areas for Home Practice */}
            <Card className="border-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                  <Target className="h-5 w-5" />
                  Practice at Home
                </CardTitle>
              </CardHeader>
              <CardContent>
                {areasForPractice.length > 0 ? (
                  <>
                    <ul className="space-y-2">
                      {areasForPractice.slice(0, 3).map((phoneme, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                          <span>Practice the <strong>{getPhonemeLabel(phoneme)}</strong></span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 p-3 rounded-lg bg-amber-500/10">
                      <p className="text-sm">
                        💡 <strong>Tip:</strong> Read aloud together for 15 minutes daily!
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No specific areas to practice identified yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Simple Progress Chart */}
          <ImprovementTracker 
            studentId={studentId} 
            studentName={studentName}
            variant="simple"
          />
        </TabsContent>

        {/* DETAILED TAB - In-depth phoneme analysis */}
        <TabsContent value="detailed" className="space-y-4">
          <Card className="border-0 bg-gradient-to-br from-purple-500/5 to-primary/5 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-purple-600" />
                Detailed Sound Analysis
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Advanced breakdown of pronunciation patterns
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Phoneme Substitution Patterns */}
              {phonemeSubstitutions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Common Sound Substitutions
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    These are sounds your child sometimes substitutes when reading:
                  </p>
                  <div className="space-y-3">
                    {phonemeSubstitutions.map((sub, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {sub.expected}
                            </Badge>
                            <span className="text-muted-foreground">→</span>
                            <Badge variant="secondary" className="font-mono">
                              {sub.actual}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {sub.count} times
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Says "{getPhonemeLabel(sub.actual)}" instead of "{getPhonemeLabel(sub.expected)}"
                        </p>
                        {sub.examples.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Example words: {sub.examples.join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Phoneme Scores */}
              {currentWeek && Object.keys(currentWeek.phonemeAccuracy).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">All Sound Scores This Week</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(currentWeek.phonemeAccuracy)
                      .sort(([, a], [, b]) => b - a)
                      .map(([phoneme, score]) => (
                        <div key={phoneme} className="p-2 rounded-lg bg-muted/30">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-mono text-sm">{phoneme}</span>
                            <span className={`text-sm font-bold ${
                              score >= 80 ? "text-green-600" : 
                              score >= 60 ? "text-yellow-600" : "text-red-600"
                            }`}>
                              {Math.round(score)}%
                            </span>
                          </div>
                          <Progress 
                            value={score} 
                            className="h-1.5"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {getPhonemeLabel(phoneme)}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Week Comparison */}
              {previousWeek && previousWeek.sessionsCount > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Week-by-Week Comparison</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Last Week</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">WPM</span>
                          <span className="font-bold">{previousWeek.avgWcpm}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Accuracy</span>
                          <span className="font-bold">{previousWeek.avgAccuracy}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Sessions</span>
                          <span className="font-bold">{previousWeek.sessionsCount}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">This Week</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">WPM</span>
                          <span className="font-bold">{currentWeek?.avgWcpm || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Accuracy</span>
                          <span className="font-bold">{currentWeek?.avgAccuracy || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Sessions</span>
                          <span className="font-bold">{currentWeek?.sessionsCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Full Improvement Tracker */}
          <ImprovementTracker 
            studentId={studentId} 
            studentName={studentName}
            variant="detailed"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
