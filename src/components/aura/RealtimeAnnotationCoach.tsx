/**
 * PATENTABLE ALGORITHM #5: Real-Time Annotation Coaching Engine
 * Live AI feedback during the annotation process
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, TrendingUp, AlertCircle } from "lucide-react";
import { 
  calculateCognitiveDistribution 
} from "@/lib/ml/bloomsTaxonomyML";
import { 
  analyzeSemanticClusters, 
  calculateConceptCoverage,
  detectHighlightStrategy 
} from "@/lib/ml/semanticHighlightAnalysisML";

interface RealtimeAnnotationCoachProps {
  highlights: Array<{
    id: string;
    highlighted_text: string;
    annotation: string;
    start_offset: number;
    end_offset: number;
    color: string;
  }>;
  passageText: string;
  enabled: boolean;
}

export function RealtimeAnnotationCoach({ 
  highlights, 
  passageText,
  enabled 
}: RealtimeAnnotationCoachProps) {
  const [coachingFeedback, setCoachingFeedback] = useState<string[]>([]);
  const [cognitiveLevel, setCognitiveLevel] = useState<number>(2);
  const [improvementSuggestions, setImprovementSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const analyzeHighlights = async () => {
    if (!enabled || highlights.length === 0) {
      setCoachingFeedback([]);
      return;
    }

    // Real-time coaching analysis
    const feedback: string[] = [];
    const suggestions: string[] = [];

    // Analyze semantic clustering
    const clusters = await analyzeSemanticClusters(highlights, passageText);
    const conceptCoverage = calculateConceptCoverage(clusters);
    const strategy = detectHighlightStrategy(highlights, passageText.length);

    // Analyze cognitive depth
    const annotations = highlights.map(h => h.annotation || '').filter(Boolean);
    const cognitiveDistribution = await calculateCognitiveDistribution(annotations);
    setCognitiveLevel(cognitiveDistribution.avgLevel);

    // Generate real-time feedback
    if (highlights.length < 3) {
      feedback.push("Keep going! Try to identify at least 5-7 key points in the passage.");
    } else if (highlights.length > 20) {
      feedback.push("You have many highlights. Focus on selecting the most important concepts.");
    }

    // Check for main idea identification
    const hasMainIdea = highlights.some(h => 
      (h.annotation?.toLowerCase() || '').match(/main|central|key|important|thesis/)
    );
    
    if (highlights.length > 3 && !hasMainIdea) {
      suggestions.push("💡 Try identifying the main idea of the passage");
    }

    // Check cognitive depth
    if (cognitiveDistribution.avgLevel < 2.5 && annotations.length > 2) {
      suggestions.push("🧠 Your annotations are descriptive - try adding WHY this matters");
    } else if (cognitiveDistribution.avgLevel >= 3.5) {
      feedback.push("Excellent! Your annotations show critical thinking.");
    }

    // Check concept coverage
    if (conceptCoverage < 40 && highlights.length > 5) {
      suggestions.push("⚖️ Balance main ideas with supporting details");
    }

    // Check highlight strategy
    if (strategy.type === 'scattered') {
      suggestions.push("📍 Your highlights are scattered - this may indicate confusion in understanding");
    } else if (strategy.type === 'strategic') {
      feedback.push("Great strategy! You're identifying key concepts effectively.");
    }

    // Paragraph coverage check
    const passageParagraphs = passageText.split('\n\n').filter(p => p.trim());
    const highlightedParagraphs = new Set(
      highlights.map(h => {
        const offset = h.start_offset;
        let currentOffset = 0;
        return passageParagraphs.findIndex(p => {
          currentOffset += p.length + 2;
          return offset < currentOffset;
        });
      })
    );

    const coveragePercent = (highlightedParagraphs.size / passageParagraphs.length) * 100;
    if (coveragePercent < 50 && highlights.length > 3) {
      const missingParas = passageParagraphs.length - highlightedParagraphs.size;
      suggestions.push(`📄 You're skipping ${missingParas} paragraphs - make sure to read the entire passage`);
    }

    setCoachingFeedback(feedback);
    setImprovementSuggestions(suggestions);
    };
    
    analyzeHighlights();
  }, [highlights, passageText, enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-primary" />
          AI Reading Coach
          <Badge variant="secondary" className="ml-auto">
            Live Feedback
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Cognitive Level Indicator */}
        <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Thinking Level:</span>
          </div>
          <Badge variant={cognitiveLevel >= 3.5 ? "default" : "secondary"}>
            {cognitiveLevel >= 4.5 ? "Advanced" : 
             cognitiveLevel >= 3.5 ? "Analytical" :
             cognitiveLevel >= 2.5 ? "Understanding" : "Basic"}
          </Badge>
        </div>

        {/* Positive Feedback */}
        {coachingFeedback.length > 0 && (
          <div className="space-y-2">
            {coachingFeedback.map((fb, idx) => (
              <Alert key={`feedback-${idx}`} className="bg-green-50 border-green-200">
                <AlertDescription className="text-sm text-green-800">
                  {fb}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Improvement Suggestions */}
        {improvementSuggestions.length > 0 && (
          <div className="space-y-2">
            {improvementSuggestions.map((suggestion, idx) => (
              <Alert key={`suggestion-${idx}`} className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-800">
                  {suggestion}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Progress Stats */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="text-center p-2 bg-background/50 rounded">
            <div className="text-2xl font-bold text-primary">{highlights.length}</div>
            <div className="text-xs text-muted-foreground">Highlights</div>
          </div>
          <div className="text-center p-2 bg-background/50 rounded">
            <div className="text-2xl font-bold text-primary">
              {highlights.filter(h => h.annotation).length}
            </div>
            <div className="text-xs text-muted-foreground">Annotations</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
