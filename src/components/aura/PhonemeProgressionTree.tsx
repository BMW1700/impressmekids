import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, CheckCircle2, Circle, AlertCircle } from "lucide-react";

interface PhonemeProgressionTreeProps {
  studentId: string;
  studentName: string;
  phonemeScores: Record<string, number>;
  transferPredictions?: any[];
}

// Phoneme progression pathway with dependencies
const PHONEME_TREE = [
  { 
    level: 1, 
    phonemes: [
      { symbol: "/m/", label: "M", depends: [] },
      { symbol: "/p/", label: "P", depends: [] },
      { symbol: "/b/", label: "B", depends: [] },
    ]
  },
  { 
    level: 2, 
    phonemes: [
      { symbol: "/w/", label: "W", depends: ["/m/"] },
      { symbol: "/f/", label: "F", depends: ["/p/"] },
      { symbol: "/v/", label: "V", depends: ["/b/", "/f/"] },
    ]
  },
  { 
    level: 3, 
    phonemes: [
      { symbol: "/s/", label: "S", depends: ["/f/"] },
      { symbol: "/z/", label: "Z", depends: ["/s/"] },
      { symbol: "/θ/", label: "TH", depends: ["/f/", "/s/"] },
    ]
  },
  { 
    level: 4, 
    phonemes: [
      { symbol: "/ʃ/", label: "SH", depends: ["/s/"] },
      { symbol: "/tʃ/", label: "CH", depends: ["/ʃ/"] },
      { symbol: "/dʒ/", label: "J", depends: ["/tʃ/"] },
    ]
  },
  { 
    level: 5, 
    phonemes: [
      { symbol: "/r/", label: "R", depends: ["/w/"] },
      { symbol: "/l/", label: "L", depends: ["/w/"] },
      { symbol: "/ð/", label: "TH-v", depends: ["/θ/", "/z/"] },
    ]
  },
];

const PhonemeProgressionTree = ({ 
  studentId, 
  studentName, 
  phonemeScores,
  transferPredictions = []
}: PhonemeProgressionTreeProps) => {
  const getPhonemeStatus = (symbol: string) => {
    const score = phonemeScores[symbol] || 0;
    if (score >= 90) return { status: "mastered", color: "green", icon: CheckCircle2 };
    if (score >= 70) return { status: "in-progress", color: "yellow", icon: Circle };
    if (score > 0) return { status: "struggling", color: "red", icon: AlertCircle };
    return { status: "not-started", color: "gray", icon: Circle };
  };

  const getDependenciesMastered = (depends: string[]) => {
    if (depends.length === 0) return true;
    return depends.every(dep => (phonemeScores[dep] || 0) >= 90);
  };

  // Find next best phoneme to practice
  const findNextPhoneme = () => {
    for (const level of PHONEME_TREE) {
      for (const phoneme of level.phonemes) {
        const score = phonemeScores[phoneme.symbol] || 0;
        const dependenciesMet = getDependenciesMastered(phoneme.depends);
        if (score < 90 && dependenciesMet) {
          return phoneme;
        }
      }
    }
    return null;
  };

  const nextPhoneme = findNextPhoneme();

  return (
    <Card className="shadow-elegant border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          Phoneme Mastery Pathway
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Optimal learning sequence for {studentName}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Next Best Action */}
          {nextPhoneme && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/20 animate-pulse">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">🚀 Next Best Phoneme</p>
                  <p className="text-2xl font-bold">
                    {nextPhoneme.label} <span className="text-muted-foreground text-base">/{nextPhoneme.label.toLowerCase()}/</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dependencies met • Ready to practice
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progression Tree */}
          <div className="space-y-4">
            {PHONEME_TREE.map((level, levelIdx) => (
              <div key={level.level} className="space-y-3 animate-fade-in" style={{ animationDelay: `${levelIdx * 100}ms` }}>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Level {level.level}
                  </Badge>
                  <div className="h-px flex-1 bg-border" />
                </div>
                
                <div className="grid grid-cols-3 md:grid-cols-3 gap-3">
                  {level.phonemes.map((phoneme, idx) => {
                    const { status, color, icon: Icon } = getPhonemeStatus(phoneme.symbol);
                    const score = phonemeScores[phoneme.symbol] || 0;
                    const dependenciesMet = getDependenciesMastered(phoneme.depends);
                    const isNext = nextPhoneme?.symbol === phoneme.symbol;

                    const colorClasses = {
                      green: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400",
                      yellow: "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400",
                      red: "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400",
                      gray: "bg-muted border-border text-muted-foreground",
                    };

                    return (
                      <div 
                        key={phoneme.symbol}
                        className={`
                          relative p-4 rounded-lg border-2 transition-all duration-300
                          ${colorClasses[color as keyof typeof colorClasses]}
                          ${isNext ? 'ring-2 ring-primary ring-offset-2 shadow-lg scale-105' : 'hover:scale-102'}
                        `}
                      >
                        {isNext && (
                          <div className="absolute -top-2 -right-2 p-1 rounded-full bg-primary animate-pulse">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-lg font-bold">{phoneme.label}</div>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        <div className="text-xs font-mono mb-2">/{phoneme.label.toLowerCase()}/</div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">
                            {score > 0 ? `${score}%` : 'Not started'}
                          </span>
                          {phoneme.depends.length > 0 && (
                            <Badge 
                              variant={dependenciesMet ? "default" : "secondary"} 
                              className="text-xs h-5"
                            >
                              {dependenciesMet ? '✓' : '○'} Deps
                            </Badge>
                          )}
                        </div>

                        {/* Show dependencies */}
                        {phoneme.depends.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-current/20">
                            <div className="text-xs opacity-70 flex items-center gap-1">
                              <ArrowRight className="h-3 w-3" />
                              <span>Needs: {phoneme.depends.map(d => d.replace(/\//g, '')).join(', ')}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Mastered (90+)</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Circle className="h-4 w-4 text-yellow-600" />
              <span>In Progress (70-89)</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span>Struggling (&lt;70)</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Circle className="h-4 w-4 text-muted-foreground" />
              <span>Not Started</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PhonemeProgressionTree;
