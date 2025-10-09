/**
 * Visualization for PATENTABLE ALGORITHM #1: Semantic Clustering
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network } from "lucide-react";

interface SemanticCluster {
  theme: string;
  highlights: string[];
  centrality: number;
}

interface SemanticClusterVisualizationProps {
  clusters: SemanticCluster[];
  conceptCoverage: number;
  semanticDensity: number;
  highlightStrategy: {
    type: string;
    score: number;
    description: string;
  };
}

export function SemanticClusterVisualization({
  clusters,
  conceptCoverage,
  semanticDensity,
  highlightStrategy,
}: SemanticClusterVisualizationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Semantic Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Clusters */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Thematic Clusters</div>
          <div className="flex flex-wrap gap-2">
            {clusters.map((cluster, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="text-sm"
                style={{
                  fontSize: `${0.75 + (cluster.centrality / 200)}rem`,
                }}
              >
                {cluster.theme} ({cluster.highlights.length})
              </Badge>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Concept Coverage</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{conceptCoverage}</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${conceptCoverage}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Semantic Density</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{semanticDensity}</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${semanticDensity}%` }}
              />
            </div>
          </div>
        </div>

        {/* Highlight Strategy */}
        <div className="p-3 bg-muted/50 rounded-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Reading Strategy</span>
            <Badge variant={
              highlightStrategy.score >= 85 ? "default" : "secondary"
            }>
              {highlightStrategy.type}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {highlightStrategy.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
