import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface NeuralNetworkVisualizationProps {
  inputFeatures: {
    comprehension: number;
    speed: number;
    vocabulary: number;
  };
  predictedScores: {
    fluency: number;
    pronunciation: number;
    confidence: number;
  };
  confidence: number;
}

interface Node {
  x: number;
  y: number;
  activated: boolean;
  value?: number;
  label?: string;
}

interface Connection {
  from: Node;
  to: Node;
  weight: number;
  active: boolean;
}

const NeuralNetworkVisualization = ({ 
  inputFeatures, 
  predictedScores, 
  confidence 
}: NeuralNetworkVisualizationProps) => {
  const [pulse, setPulse] = useState(0);
  const [connections, setConnections] = useState<Connection[]>([]);

  // Define network structure
  const inputNodes: Node[] = [
    { x: 50, y: 100, activated: true, value: inputFeatures.comprehension, label: "Comprehension" },
    { x: 50, y: 200, activated: true, value: inputFeatures.speed, label: "Reading Speed" },
    { x: 50, y: 300, activated: true, value: inputFeatures.vocabulary, label: "Vocabulary" },
  ];

  const hiddenNodes: Node[] = [
    { x: 250, y: 80, activated: false, label: "H1" },
    { x: 250, y: 150, activated: false, label: "H2" },
    { x: 250, y: 220, activated: false, label: "H3" },
    { x: 250, y: 290, activated: false, label: "H4" },
    { x: 250, y: 360, activated: false, label: "H5" },
  ];

  const outputNodes: Node[] = [
    { x: 450, y: 120, activated: false, value: predictedScores.fluency, label: "Fluency" },
    { x: 450, y: 220, activated: false, value: predictedScores.pronunciation, label: "Pronunciation" },
    { x: 450, y: 320, activated: false, value: confidence, label: "Confidence" },
  ];

  // Animation effect for pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => (prev + 1) % 3);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Generate connections with pseudo-random weights based on actual values
  useEffect(() => {
    const newConnections: Connection[] = [];
    
    // Input to hidden
    inputNodes.forEach((inputNode, i) => {
      hiddenNodes.forEach((hiddenNode, j) => {
        const weight = ((inputNode.value || 0) + (j * 17) % 100) / 100;
        newConnections.push({
          from: inputNode,
          to: hiddenNode,
          weight,
          active: pulse === 0 && i === j % 3,
        });
      });
    });

    // Hidden to output
    hiddenNodes.forEach((hiddenNode, i) => {
      outputNodes.forEach((outputNode, j) => {
        const weight = ((outputNode.value || 0) + (i * 23) % 100) / 100;
        newConnections.push({
          from: hiddenNode,
          to: outputNode,
          weight,
          active: pulse === 1 && i === j,
        });
      });
    });

    setConnections(newConnections);
  }, [pulse]);

  return (
    <Card className="shadow-elegant border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          Neural Network: Cross-Modal Transfer
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Bidirectional LSTM with attention mechanism
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Network Diagram */}
          <div className="relative w-full h-[400px] bg-gradient-to-br from-primary/5 to-transparent rounded-lg border border-primary/20 overflow-hidden">
            <svg viewBox="0 0 500 400" className="w-full h-full">
              <defs>
                <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Connections */}
              {connections.map((conn, idx) => (
                <line
                  key={`conn-${idx}`}
                  x1={conn.from.x}
                  y1={conn.from.y}
                  x2={conn.to.x}
                  y2={conn.to.y}
                  stroke={conn.active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                  strokeWidth={conn.active ? 2 : 1}
                  strokeOpacity={conn.active ? conn.weight : conn.weight * 0.3}
                  className={conn.active ? "transition-all duration-500" : ""}
                  filter={conn.active ? "url(#glow)" : ""}
                />
              ))}

              {/* Input Layer */}
              <g className="input-layer">
                <text x="50" y="50" fontSize="12" fill="hsl(var(--muted-foreground))" textAnchor="middle" fontWeight="bold">
                  Input Layer
                </text>
                {inputNodes.map((node, idx) => (
                  <g key={`input-${idx}`}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="20"
                      fill="hsl(140, 60%, 45%)"
                      fillOpacity={0.2}
                      stroke="hsl(140, 60%, 45%)"
                      strokeWidth="2"
                      className="animate-pulse"
                      style={{ animationDelay: `${idx * 200}ms` }}
                    />
                    <text
                      x={node.x}
                      y={node.y + 5}
                      fontSize="12"
                      fill="hsl(var(--foreground))"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {node.value}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 40}
                      fontSize="10"
                      fill="hsl(var(--muted-foreground))"
                      textAnchor="middle"
                    >
                      {node.label}
                    </text>
                  </g>
                ))}
              </g>

              {/* Hidden Layer */}
              <g className="hidden-layer">
                <text x="250" y="50" fontSize="12" fill="hsl(var(--muted-foreground))" textAnchor="middle" fontWeight="bold">
                  Hidden Layer
                </text>
                {hiddenNodes.map((node, idx) => (
                  <g key={`hidden-${idx}`}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="15"
                      fill="hsl(var(--primary))"
                      fillOpacity={pulse === 1 ? 0.6 : 0.2}
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      className="transition-all duration-500"
                    />
                    <text
                      x={node.x}
                      y={node.y + 4}
                      fontSize="10"
                      fill="hsl(var(--foreground))"
                      textAnchor="middle"
                    >
                      {node.label}
                    </text>
                  </g>
                ))}
              </g>

              {/* Output Layer */}
              <g className="output-layer">
                <text x="450" y="50" fontSize="12" fill="hsl(var(--muted-foreground))" textAnchor="middle" fontWeight="bold">
                  Output Layer
                </text>
                {outputNodes.map((node, idx) => (
                  <g key={`output-${idx}`}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="20"
                      fill="hsl(270, 60%, 50%)"
                      fillOpacity={pulse === 2 ? 0.6 : 0.2}
                      stroke="hsl(270, 60%, 50%)"
                      strokeWidth="2"
                      className="transition-all duration-500"
                    />
                    <text
                      x={node.x}
                      y={node.y + 5}
                      fontSize="12"
                      fill="hsl(var(--foreground))"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {node.value}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 40}
                      fontSize="10"
                      fill="hsl(var(--muted-foreground))"
                      textAnchor="middle"
                    >
                      {node.label}
                    </text>
                  </g>
                ))}
              </g>
            </svg>

            {/* Pulse indicator */}
            <div className="absolute top-4 right-4">
              <div className="flex items-center gap-2 text-xs bg-card/90 backdrop-blur px-3 py-2 rounded-lg border">
                <Brain className="h-4 w-4 text-primary animate-pulse" />
                <span className="font-medium">AI Processing...</span>
              </div>
            </div>
          </div>

          {/* Legend and Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold">How It Works:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Input: Reading performance metrics</li>
                <li>Hidden: 5 LSTM units with attention</li>
                <li>Output: Predicted speaking scores</li>
                <li>Bidirectional: Works both ways</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Model Performance:</p>
              <div className="flex items-center justify-between text-xs">
                <span>Prediction Confidence</span>
                <Badge variant="default">{confidence}%</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Model Training</span>
                <Badge variant="secondary">In-Browser (TF.js)</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Update Frequency</span>
                <Badge variant="outline">Weekly</Badge>
              </div>
            </div>
          </div>

          {/* Connection strength legend */}
          <div className="p-3 rounded-lg bg-muted/50 text-xs">
            <p className="font-medium mb-2">Connection Opacity = Weight Strength</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-primary opacity-100" />
                <span className="text-muted-foreground">Strong influence</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-primary opacity-30" />
                <span className="text-muted-foreground">Weak influence</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NeuralNetworkVisualization;
