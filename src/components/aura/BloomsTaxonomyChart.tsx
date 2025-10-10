/**
 * Visualization for PATENTABLE ALGORITHM #2: Bloom's Taxonomy Classifier
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";
import { BloomLevel, CognitiveDistribution } from "@/lib/ml/bloomsTaxonomyML";

interface BloomsTaxonomyChartProps {
  distribution: CognitiveDistribution;
}

const BLOOM_COLORS = {
  1: "bg-slate-400",
  2: "bg-blue-400",
  3: "bg-green-400",
  4: "bg-yellow-400",
  5: "bg-orange-400",
  6: "bg-red-400",
};

export function BloomsTaxonomyChart({ distribution }: BloomsTaxonomyChartProps) {
  const maxPercentage = Math.max(...distribution.levels.map(l => l.percentage));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Cognitive Depth Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Average Level */}
        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">Average Thinking Level</div>
            <div className="text-2xl font-bold">{distribution.avgLevel}/6</div>
          </div>
          <Badge variant="default" className="text-lg px-4 py-2">
            {distribution.sophisticationScore}
          </Badge>
        </div>

        {/* Bloom's Levels */}
        <div className="space-y-2">
          {distribution.levels.map((level: BloomLevel) => (
            <div key={level.level} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  L{level.level}: {level.name}
                </span>
                <span className="text-muted-foreground">
                  {level.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${BLOOM_COLORS[level.level as keyof typeof BLOOM_COLORS]} transition-all`}
                  style={{ width: `${level.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <div><strong>L1-L2:</strong> Remember & Understand</div>
            <div><strong>L3-L4:</strong> Apply & Analyze</div>
            <div><strong>L5-L6:</strong> Evaluate & Create</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
