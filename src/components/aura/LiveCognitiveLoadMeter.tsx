import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface LiveCognitiveLoadMeterProps {
  currentLoad: number;
  recentSessions: Array<{
    session: number;
    load: number;
    timestamp: string;
    throttled: boolean;
  }>;
  studentName: string;
}

const LiveCognitiveLoadMeter = ({ currentLoad, recentSessions, studentName }: LiveCognitiveLoadMeterProps) => {
  // Calculate angle for gauge needle (0-180 degrees)
  const needleAngle = (currentLoad * 180) - 90;
  
  // Determine load zone
  const getLoadZone = (load: number) => {
    if (load < 0.3) return { label: "Low Load", color: "blue", bgColor: "bg-blue-500", message: "Ready for harder challenges" };
    if (load < 0.7) return { label: "Optimal Zone", color: "green", bgColor: "bg-green-500", message: "Perfect learning zone" };
    return { label: "High Load", color: "red", bgColor: "bg-red-500", message: "May need support" };
  };

  const currentZone = getLoadZone(currentLoad);
  const avgLoad = recentSessions.length > 0
    ? recentSessions.reduce((sum, s) => sum + s.load, 0) / recentSessions.length
    : 0;

  return (
    <Card className="shadow-elegant border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary animate-pulse" />
          Real-Time Cognitive Load Monitor
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Patent #4: Speech pattern analysis for {studentName}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Speedometer Gauge */}
          <div className="relative w-full max-w-md mx-auto">
            <svg viewBox="0 0 200 120" className="w-full">
              {/* Background arc zones */}
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(210, 70%, 50%)" />
                  <stop offset="30%" stopColor="hsl(140, 60%, 45%)" />
                  <stop offset="70%" stopColor="hsl(45, 85%, 50%)" />
                  <stop offset="100%" stopColor="hsl(0, 70%, 50%)" />
                </linearGradient>
              </defs>
              
              {/* Main gauge arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="20"
                strokeLinecap="round"
                opacity="0.3"
              />
              
              {/* Active gauge arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="20"
                strokeLinecap="round"
                strokeDasharray={`${currentLoad * 251.2} 251.2`}
                className="transition-all duration-1000"
              />
              
              {/* Needle */}
              <g transform={`rotate(${needleAngle} 100 100)`}>
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="30"
                  stroke="hsl(var(--foreground))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
                <circle cx="100" cy="100" r="6" fill="hsl(var(--primary))" />
              </g>
              
              {/* Zone markers */}
              <text x="30" y="110" fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="middle">0%</text>
              <text x="100" y="20" fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="middle">50%</text>
              <text x="170" y="110" fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="middle">100%</text>
            </svg>
            
            {/* Current value display */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
              <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {Math.round(currentLoad * 100)}%
              </div>
              <Badge className={`${currentZone.bgColor} text-white border-0`}>
                {currentZone.label}
              </Badge>
            </div>
          </div>

          {/* Status message */}
          <div className={`p-4 rounded-lg border-2 ${
            currentLoad < 0.3 ? 'bg-blue-500/10 border-blue-500/30' :
            currentLoad < 0.7 ? 'bg-green-500/10 border-green-500/30' :
            'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center gap-3">
              {currentLoad < 0.3 ? <TrendingUp className="h-5 w-5 text-blue-600" /> :
               currentLoad < 0.7 ? <CheckCircle className="h-5 w-5 text-green-600" /> :
               <AlertTriangle className="h-5 w-5 text-red-600" />}
              <div>
                <p className="font-semibold text-sm">{currentZone.message}</p>
                <p className="text-xs text-muted-foreground">
                  Average load (last 10 sessions): {Math.round(avgLoad * 100)}%
                </p>
              </div>
            </div>
          </div>

          {/* Adaptive Feedback Status */}
          {recentSessions.some(s => s.throttled) && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-amber-500/20 animate-pulse">
                  <Brain className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-amber-700 dark:text-amber-400">Adaptive Throttling Active</p>
                  <p className="text-muted-foreground">AI reduced feedback frequency to prevent overload</p>
                </div>
              </div>
            </div>
          )}

          {/* Historical trend chart */}
          {recentSessions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Cognitive Load History (Last 10 Sessions)</p>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={recentSessions}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis 
                    dataKey="session" 
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Session', position: 'insideBottom', offset: -5, fontSize: 11 }}
                  />
                  <YAxis 
                    domain={[0, 1]} 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `${Math.round(value * 100)}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: any) => [`${Math.round(value * 100)}%`, 'Load']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="load" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    animationDuration={1000}
                  />
                  {/* Reference line at 70% (optimal threshold) */}
                  <Line 
                    type="monotone" 
                    dataKey={() => 0.7} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground justify-center">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Optimal (30-70%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>High (&gt;70%)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveCognitiveLoadMeter;
