/**
 * ML Insights Dashboard - Comprehensive view of all 4 patentable ML models
 * For teacher analytics view
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Brain, TrendingUp, Zap, AlertTriangle, Activity } from "lucide-react";
import NeuralNetworkVisualization from "./NeuralNetworkVisualization";
import PhonemeProgressionTree from "./PhonemeProgressionTree";
import LiveCognitiveLoadMeter from "./LiveCognitiveLoadMeter";

interface MLInsightsDashboardProps {
  studentId: string;
  studentName: string;
  skillVector: any;
  auraRecords: any[];
  recentExercises: any[];
}

const MLInsightsDashboard = ({ 
  studentId, 
  studentName, 
  skillVector, 
  auraRecords,
  recentExercises 
}: MLInsightsDashboardProps) => {
  // Extract ML insights
  const transferInsights = skillVector?.transfer_learning_insights as any;
  const crossModalRisk = skillVector?.cross_modal_risk_score || 0;
  const currentDifficulty = skillVector?.current_difficulty_level || 1;
  const performanceTrend = skillVector?.performance_trend || 0;
  const weeklyImprovement = skillVector?.weekly_improvement || 0;

  // Get latest RL-enhanced exercise
  const latestRLExercise = recentExercises.find(
    (ex: any) => (ex.adaptive_metadata as any)?.version === 'v2_rl_enhanced'
  );

  // Calculate cognitive load from recent records
  const avgCognitiveLoad = auraRecords.length > 0
    ? auraRecords
        .slice(0, 5)
        .reduce((sum, r) => sum + ((r.performance_metrics as any)?.cognitive_load || 0), 0) / Math.min(5, auraRecords.length)
    : 0;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-primary shadow-card animate-pulse">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                AI Insights for {studentName}
                <Badge variant="default" className="text-xs">Personalized</Badge>
              </div>
              <CardDescription className="mt-1">
                Smart analysis of reading and speaking skills
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1">
          <TabsTrigger value="overview" className="flex flex-col gap-1 py-2">
            <Activity className="h-4 w-4" />
            <span className="text-xs">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="patent1" className="flex flex-col gap-1 py-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Skill Transfer</span>
          </TabsTrigger>
          <TabsTrigger value="patent2" className="flex flex-col gap-1 py-2">
            <Brain className="h-4 w-4" />
            <span className="text-xs">Highlights</span>
          </TabsTrigger>
          <TabsTrigger value="patent3" className="flex flex-col gap-1 py-2">
            <Zap className="h-4 w-4" />
            <span className="text-xs">Sound Practice</span>
          </TabsTrigger>
          <TabsTrigger value="patent4" className="flex flex-col gap-1 py-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">Difficulty</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Difficulty Level</span>
                    <Badge variant="default" className="shadow-md">Level {currentDifficulty}/5</Badge>
                  </div>
                  <Progress value={currentDifficulty * 20} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Performance Trend</span>
                    <span className={performanceTrend > 0 ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>
                      {performanceTrend > 0 ? '+' : ''}{Math.round(performanceTrend)}%
                    </span>
                  </div>
                  <Progress value={50 + performanceTrend} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Weekly Improvement</span>
                    <span className="font-semibold">{weeklyImprovement > 0 ? '+' : ''}{Math.round(weeklyImprovement)}%</span>
                  </div>
                  <Progress value={Math.min(100, weeklyImprovement + 50)} className="h-3" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Areas to Watch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Skill Gap</span>
                    <Badge variant={crossModalRisk > 60 ? 'destructive' : 'secondary'} className="shadow-md">
                      {crossModalRisk > 60 ? 'Needs Attention' : crossModalRisk > 30 ? 'Moderate' : 'On Track'}
                    </Badge>
                  </div>
                  <Progress value={crossModalRisk} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">Reading vs speaking skill balance</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Effort Level</span>
                    <span className="text-xs font-semibold">{avgCognitiveLoad > 0.7 ? 'High' : avgCognitiveLoad > 0.4 ? 'Medium' : 'Low'}</span>
                  </div>
                  <Progress value={avgCognitiveLoad * 100} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">How hard the student is working</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patent1" className="space-y-4">
          <Card className="shadow-elegant border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-card">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div>Reading ↔ Speaking Connection</div>
                  <CardDescription className="mt-1">
                    How skills transfer between reading and speaking
                  </CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 shadow-md">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    What this shows:
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Students who read well often speak well too. This AI tracks how improvements in one area 
                    help the other, identifying gaps where targeted practice would help most.
                  </p>
                </div>

                <NeuralNetworkVisualization 
                  inputFeatures={{
                    comprehension: skillVector?.predicted_comprehension_score || 70,
                    speed: 75,
                    vocabulary: 80
                  }}
                  predictedScores={{
                    fluency: skillVector?.current_difficulty_level ? skillVector.current_difficulty_level * 18 : 75,
                    pronunciation: 80,
                    confidence: 85
                  }}
                  confidence={85}
                />

                <div>
                  <p className="text-sm font-medium mb-2">Skill Gap Score:</p>
                  <div className="flex items-center gap-3">
                    <Progress value={crossModalRisk} className="h-3 flex-1" />
                    <Badge variant={crossModalRisk > 60 ? 'destructive' : 'default'}>
                      {crossModalRisk > 60 ? 'Large Gap' : crossModalRisk > 30 ? 'Some Gap' : 'Aligned'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {crossModalRisk > 60 
                      ? '⚠️ Reading and speaking skills are developing unevenly - focus on the weaker area'
                      : '✅ Reading and speaking skills are developing together nicely'}
                  </p>
                </div>

                {skillVector?.predicted_comprehension_score && (
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs font-medium mb-1">Predicted Comprehension Score:</p>
                    <p className="text-2xl font-bold">{skillVector.predicted_comprehension_score}/100</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patent2" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Highlighting Patterns
              </CardTitle>
              <CardDescription>
                How this student approaches reading annotations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm font-medium mb-2">💡 What this shows:</p>
                  <p className="text-xs text-muted-foreground">
                    The AI learns each student's unique way of highlighting important information.
                    It tracks whether they focus on main ideas, details, or a mix - helping you understand their comprehension strategy.
                  </p>
                </div>

                {skillVector?.highlight_strategy_profile && (
                  <div>
                    <p className="text-sm font-medium mb-2">Reading Style:</p>
                    <div className="space-y-2">
                      <div className="p-2 rounded bg-muted text-xs">
                        <strong>Approach:</strong> {(skillVector.highlight_strategy_profile as any)?.dominant_strategy === 'scattered' ? 'Explores broadly' : (skillVector.highlight_strategy_profile as any)?.dominant_strategy === 'strategic' ? 'Focuses on key points' : 'Reads sequentially'}
                      </div>
                      <div className="p-2 rounded bg-muted text-xs">
                        <strong>Improvement:</strong> {Math.round((skillVector.annotation_sophistication_trend || 0) * 100)}% growth in highlighting quality
                      </div>
                    </div>
                  </div>
                )}

                {skillVector?.semantic_clusters && (
                  <div>
                    <p className="text-sm font-medium mb-2">Topics They Focus On:</p>
                    <div className="flex flex-wrap gap-2">
                      {(skillVector.semantic_clusters as any[])?.slice(0, 5).map((cluster: any, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {cluster.label || `Topic ${idx + 1}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patent3" className="space-y-4">
          <Card className="shadow-elegant border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-card">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div>Sound Practice Recommendations</div>
                  <CardDescription className="mt-1">
                    Smart suggestions for which sounds to practice next
                  </CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 shadow-md">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    What this shows:
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The AI learns which sounds each student struggles with and recommends personalized practice.
                    It also knows when students are getting tired and suggests breaks to prevent frustration.
                  </p>
                </div>

                <PhonemeProgressionTree 
                  studentId={studentId}
                  studentName={studentName}
                  phonemeScores={skillVector?.phoneme_scores || {}}
                  transferPredictions={transferInsights?.predictions || []}
                />

                {latestRLExercise && (
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs font-medium mb-2">Latest Practice Session:</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Difficulty:</span>
                        <Badge>{latestRLExercise.difficulty_level}/5</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Tiredness Level:</span>
                        <span>{Math.round(((latestRLExercise.adaptive_metadata as any)?.articulatory_fatigue_risk || 0) * 100)}%</span>
                      </div>
                      {(latestRLExercise.adaptive_metadata as any)?.recommended_rest_minutes > 0 && (
                        <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          Break suggested: {(latestRLExercise.adaptive_metadata as any).recommended_rest_minutes} minutes
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {transferInsights?.predictions && (
                  <div>
                    <p className="text-sm font-medium mb-2">Sounds Ready to Improve:</p>
                    <div className="space-y-2">
                      {transferInsights.predictions.slice(0, 3).map((pred: any) => (
                        <div key={pred.phoneme} className="p-2 rounded bg-muted text-xs flex justify-between items-center">
                          <div>
                            <span className="font-mono font-bold">/{pred.phoneme}/</span>
                            <span className="ml-2 text-muted-foreground">{pred.reasoning}</span>
                          </div>
                          <Badge variant={pred.readinessLevel === 'high' ? 'default' : 'secondary'}>
                            {pred.transferProbability}% ready
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patent4" className="space-y-4">
          <Card className="shadow-elegant border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-card">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div>Difficulty & Effort Tracking</div>
                  <CardDescription className="mt-1">
                    How hard the student is working and when to adjust
                  </CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 shadow-md">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    What this shows:
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The AI detects when students are struggling (hesitation, pauses, confidence dips) and 
                    automatically adjusts the difficulty. It prevents frustration by giving easier content when needed.
                  </p>
                </div>

                <LiveCognitiveLoadMeter 
                  currentLoad={avgCognitiveLoad}
                  recentSessions={auraRecords.slice(0, 10).map((record, idx) => ({
                    session: idx + 1,
                    load: (record.performance_metrics as any)?.cognitive_load || 0,
                    timestamp: new Date(record.created_at).toLocaleDateString(),
                    throttled: (record.performance_metrics as any)?.feedback_throttled || false
                  }))}
                  studentName={studentName}
                />

                <div>
                  <p className="text-sm font-medium mb-2">Average Effort Level (Last 5 sessions):</p>
                  <div className="flex items-center gap-3">
                    <Progress value={avgCognitiveLoad * 100} className="h-3 flex-1" />
                    <Badge variant={avgCognitiveLoad > 0.7 ? 'destructive' : avgCognitiveLoad > 0.4 ? 'default' : 'secondary'}>
                      {avgCognitiveLoad > 0.7 ? 'High Effort' : avgCognitiveLoad > 0.4 ? 'Moderate' : 'Low Effort'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {avgCognitiveLoad > 0.7
                      ? '⚠️ High cognitive load detected - student may be struggling'
                      : avgCognitiveLoad > 0.4
                      ? '✅ Moderate cognitive load - optimal learning zone'
                      : '💡 Low cognitive load - ready for harder challenges'}
                  </p>
                </div>

                {auraRecords.slice(0, 5).map((record, idx) => {
                  const cogLoad = (record.performance_metrics as any)?.cognitive_load || 0;
                  const feedbackThrottled = (record.performance_metrics as any)?.feedback_throttled || false;
                  
                  return (
                    <div key={record.id} className="p-2 rounded bg-muted text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span>Session {idx + 1}</span>
                        <Badge variant={cogLoad > 0.7 ? 'destructive' : 'secondary'} className="text-xs">
                          {Math.round(cogLoad * 100)}%
                        </Badge>
                      </div>
                      {feedbackThrottled && (
                        <p className="text-amber-600 dark:text-amber-400">
                          <Zap className="w-3 h-3 inline mr-1" />
                          Adaptive throttling engaged
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MLInsightsDashboard;
