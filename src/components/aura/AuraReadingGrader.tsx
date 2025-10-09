import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, BookOpen, Brain, TrendingUp, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AuraReadingGraderProps {
  assignmentId: string;
  highlights: any[];
  passageText: string;
  studentId: string;
  onGradeGenerated?: (grade: number, feedback: string) => void;
}

export function AuraReadingGrader({ 
  assignmentId, 
  highlights, 
  passageText, 
  studentId,
  onGradeGenerated 
}: AuraReadingGraderProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();

  const handleGenerateGrade = async () => {
    if (highlights.length === 0) {
      toast({
        title: "No Highlights Found",
        description: "Student must add highlights before AI grading",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-aura', {
        body: {
          readingMode: true,
          assignmentId,
          highlights,
          passageText,
        }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      
      // Generate comprehensive feedback
      const feedback = `
**AURA AI Reading Analysis**

📊 Overall Comprehension: ${data.analysis.grade}/100
- Comprehension Depth: ${data.analysis.comprehension_depth}/100
- Highlight Quality: ${data.analysis.highlight_quality}/100
- Critical Thinking: ${data.analysis.critical_thinking}/100
- Annotation Quality: ${data.analysis.annotation_quality_score}/100

🎯 **Strengths:**
${data.analysis.strengths.map((s: string) => `• ${s}`).join('\n')}

📈 **Areas for Improvement:**
${data.analysis.improvements.map((i: string) => `• ${i}`).join('\n')}

💬 **AI Feedback:**
${data.analysis.feedback.map((f: string) => `• ${f}`).join('\n')}

🎤 **Cross-Modal Prediction:**
Based on your reading comprehension, your predicted speaking/oral reading performance is ${data.analysis.predicted_speaking_score}/100. ${
  Math.abs(data.analysis.predicted_speaking_score - data.analysis.grade) > 20 
    ? 'There\'s a significant gap between reading and predicted speaking - consider AURA speech practice!' 
    : 'Your reading and speaking skills are well-aligned!'
}
      `.trim();

      onGradeGenerated?.(data.analysis.grade, feedback);

      toast({
        title: "AI Grading Complete! ✨",
        description: `Generated grade: ${data.analysis.grade}/100`,
      });

    } catch (error: any) {
      console.error('AI grading error:', error);
      toast({
        title: "AI Grading Failed",
        description: error.message || "Failed to analyze reading comprehension",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">AURA AI Reading Assistant</CardTitle>
            <CardDescription>
              Cross-modal literacy analysis powered by speech + reading AI
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis ? (
          <>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                AI will analyze <strong>{highlights.length} highlights</strong> to assess comprehension depth, 
                critical thinking, and annotation quality. It will also predict speaking performance based on reading patterns.
              </p>
            </div>
            
            <Separator />

            <Button 
              onClick={handleGenerateGrade} 
              disabled={isAnalyzing || highlights.length === 0}
              className="w-full bg-gradient-primary hover:opacity-90"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Reading Comprehension...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate AI Grade & Insights
                </>
              )}
            </Button>

            {highlights.length === 0 && (
              <p className="text-xs text-center text-muted-foreground">
                Student needs to add highlights first
              </p>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3">
              {/* Overall Grade */}
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Comprehension</span>
                  <Badge variant="default" className="text-lg font-bold">
                    {analysis.grade}/100
                  </Badge>
                </div>
                <Progress value={analysis.grade} className="h-2" />
              </div>

              {/* Sub-scores */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="text-xs text-muted-foreground mb-1">Comprehension Depth</div>
                  <div className="flex items-center gap-2">
                    <Brain className="h-3 w-3 text-primary" />
                    <span className="font-semibold">{analysis.comprehension_depth}/100</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="text-xs text-muted-foreground mb-1">Highlight Quality</div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3 w-3 text-primary" />
                    <span className="font-semibold">{analysis.highlight_quality}/100</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="text-xs text-muted-foreground mb-1">Critical Thinking</div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="font-semibold">{analysis.critical_thinking}/100</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="text-xs text-muted-foreground mb-1">Annotation Quality</div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span className="font-semibold">{analysis.annotation_quality_score}/100</span>
                  </div>
                </div>
              </div>

              {/* Cross-Modal Prediction */}
              <div className={`p-4 rounded-lg border ${
                Math.abs(analysis.predicted_speaking_score - analysis.grade) > 20
                  ? 'bg-orange-500/10 border-orange-500/20'
                  : 'bg-green-500/10 border-green-500/20'
              }`}>
                <div className="flex items-start gap-2 mb-2">
                  {Math.abs(analysis.predicted_speaking_score - analysis.grade) > 20 ? (
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-semibold text-sm mb-1">Cross-Modal Prediction</div>
                    <p className="text-xs text-muted-foreground">
                      Predicted Speaking Performance: <strong>{analysis.predicted_speaking_score}/100</strong>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.abs(analysis.predicted_speaking_score - analysis.grade) > 20
                        ? '⚠️ Significant gap detected - student may benefit from AURA speech practice'
                        : '✅ Reading and speaking skills are well-aligned'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleGenerateGrade} 
              variant="outline"
              disabled={isAnalyzing}
              className="w-full"
              size="sm"
            >
              <Sparkles className="mr-2 h-3 w-3" />
              Re-analyze
            </Button>
          </div>
        )}

        <div className="pt-2 text-xs text-center text-muted-foreground">
          Powered by AURA Cross-Modal AI • Speaking + Reading Unified
        </div>
      </CardContent>
    </Card>
  );
}