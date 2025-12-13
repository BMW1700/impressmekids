import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import ClassroomAuraOverview from "@/components/aura/ClassroomAuraOverview";
import StudentAuraMetrics from "@/components/aura/StudentAuraMetrics";
import PhonemeHeatmap from "@/components/aura/PhonemeHeatmap";
import CrossModalScatterPlot from "@/components/aura/CrossModalScatterPlot";
import AtRiskAlerts from "@/components/aura/AtRiskAlerts";
import ProsodyInsights from "@/components/aura/ProsodyInsights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ArrowLeft, Sparkles, TrendingUp, Brain, Users, Activity, BookOpen, Timer, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const AuraAnalytics = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();

  const { data: classrooms } = useQuery({
    queryKey: ['teacher-classrooms'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .rpc('get_teacher_classrooms', { p_teacher_id: user.id });

      if (error) throw error;
      return data;
    },
  });

  const { data: students } = useQuery({
    queryKey: ['classroom-students', classroomId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .rpc('get_classroom_students', {
          _user_id: user.id,
          _classroom_id: classroomId!
        });

      if (error) throw error;
      
      // Transform to match expected format
      return data?.map((student: any) => ({
        student_id: student.student_id,
        profiles: {
          id: student.student_id,
          full_name: student.full_name,
          email: student.email
        }
      })) || [];
    },
    enabled: !!classroomId,
  });

  const { data: auraRecords } = useQuery({
    queryKey: ['classroom-aura-records', classroomId],
    queryFn: async () => {
      if (!students) return [];

      const studentIds = students.map(s => s.student_id);
      const { data, error } = await supabase
        .from('aura_records')
        .select('*')
        .in('profile_id', studentIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!students,
  });

  // NEW: Fetch reading_sessions data (this is where WordByWordReader saves data!)
  const { data: readingSessions } = useQuery({
    queryKey: ['classroom-reading-sessions', classroomId],
    queryFn: async () => {
      if (!students) return [];

      const studentIds = students.map(s => s.student_id);
      const { data, error } = await supabase
        .from('reading_sessions')
        .select('*')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Reading sessions fetch error:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!students,
  });

  const { data: skillVectors } = useQuery({
    queryKey: ['classroom-skill-vectors', classroomId],
    queryFn: async () => {
      if (!students) return [];

      const studentIds = students.map(s => s.student_id);
      const { data, error } = await supabase
        .from('student_skill_vectors')
        .select('*')
        .in('student_id', studentIds);

      if (error) throw error;
      return data;
    },
    enabled: !!students,
  });

  const handleClassroomChange = (newClassroomId: string) => {
    navigate(`/teacher/aura-analytics/${newClassroomId}`);
  };

  // Calculate reading session stats
  const readingStats = {
    totalSessions: readingSessions?.length || 0,
    avgAccuracy: readingSessions?.length 
      ? Math.round(readingSessions.reduce((sum, r) => sum + (r.accuracy_percent || 0), 0) / readingSessions.length)
      : 0,
    totalWordsRead: readingSessions?.reduce((sum, r) => sum + (r.words_read || 0), 0) || 0,
    avgWpm: readingSessions?.length 
      ? Math.round(readingSessions.reduce((sum, r) => sum + (r.wpm || 0), 0) / readingSessions.length)
      : 0,
    activeReaders: new Set(readingSessions?.map(r => r.student_id) || []).size,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/teacher/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="p-3 rounded-full bg-gradient-primary shadow-card">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  AURA Analytics
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 animate-pulse">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-primary">AI Powered</span>
                  </div>
                </h1>
                <p className="text-muted-foreground">Track student speaking progress with ML insights</p>
              </div>
            </div>

            <Select value={classroomId} onValueChange={handleClassroomChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select classroom" />
              </SelectTrigger>
              <SelectContent>
                {classrooms?.map((classroom) => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Stats Bar - COMBINED aura_records + reading_sessions */}
          {classroomId && students && (
            <div className="grid grid-cols-4 lg:grid-cols-8 gap-4 mb-6 animate-fade-in">
              {/* READING PRACTICE STATS (from reading_sessions - WordByWordReader) */}
              <Card className="border-2 border-green-500/30 bg-green-500/5">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Reading Sessions</p>
                      <p className="text-2xl font-bold text-green-600">{readingStats.totalSessions}</p>
                    </div>
                    <BookOpen className="h-6 w-6 text-green-500 opacity-70" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-500/30 bg-green-500/5">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg Accuracy</p>
                      <p className="text-2xl font-bold text-green-600">{readingStats.avgAccuracy}%</p>
                    </div>
                    <Target className="h-6 w-6 text-green-500 opacity-70" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-500/30 bg-green-500/5">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Words Read</p>
                      <p className="text-2xl font-bold text-green-600">{readingStats.totalWordsRead.toLocaleString()}</p>
                    </div>
                    <Sparkles className="h-6 w-6 text-green-500 opacity-70" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-500/30 bg-green-500/5">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg WPM</p>
                      <p className="text-2xl font-bold text-green-600">{readingStats.avgWpm}</p>
                    </div>
                    <Timer className="h-6 w-6 text-green-500 opacity-70" />
                  </div>
                </CardContent>
              </Card>
              
              {/* AURA SPEAKING STATS (from aura_records - VoiceRecorder/Speaking) */}
              <Card className="border-2 border-primary/20">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Active Readers</p>
                      <p className="text-2xl font-bold">{readingStats.activeReaders}</p>
                    </div>
                    <Users className="h-6 w-6 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/20">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">ML Predictions</p>
                      <p className="text-2xl font-bold">{skillVectors?.length || 0}</p>
                    </div>
                    <Brain className="h-6 w-6 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/20">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Speaking Sessions</p>
                      <p className="text-2xl font-bold">{auraRecords?.length || 0}</p>
                    </div>
                    <Activity className="h-6 w-6 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/20">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg Score</p>
                      <p className="text-2xl font-bold">
                        {auraRecords?.length ? Math.round(auraRecords.reduce((sum, r) => sum + (r.grade || 0), 0) / auraRecords.length) : 0}
                      </p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {classroomId && auraRecords && skillVectors && (
            <>
              <ClassroomAuraOverview records={auraRecords} students={students || []} />

              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="phonemes" className="gap-1">
                    <Sparkles className="w-4 h-4" />
                    Phoneme Analysis
                  </TabsTrigger>
                  <TabsTrigger value="alerts">At-Risk Alerts</TabsTrigger>
                  <TabsTrigger value="prosody">Reading Fluency</TabsTrigger>
                  <TabsTrigger value="cross-modal" className="gap-1">
                    <Sparkles className="w-4 h-4" />
                    Reading vs Speaking
                  </TabsTrigger>
                  <TabsTrigger value="transfer" className="gap-1">
                    <Sparkles className="w-4 h-4" />
                    Skill Progress
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Student Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <StudentAuraMetrics 
                        students={students || []} 
                        records={auraRecords}
                        readingSessions={readingSessions || []}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="phonemes" className="space-y-6">
                  <PhonemeHeatmap 
                    students={students || []}
                    skillVectors={skillVectors}
                  />
                </TabsContent>

                <TabsContent value="alerts" className="space-y-6">
                  <AtRiskAlerts 
                    students={students || []}
                    records={auraRecords}
                    skillVectors={skillVectors}
                    classroomId={classroomId!}
                    classroomName={classrooms?.find(c => c.id === classroomId)?.name || "Classroom"}
                  />
                </TabsContent>

                <TabsContent value="prosody" className="space-y-6">
                  <ProsodyInsights 
                    records={auraRecords}
                    skillVectors={skillVectors}
                    classroomId={classroomId}
                  />
                </TabsContent>

                <TabsContent value="cross-modal" className="space-y-6">
                  <CrossModalScatterPlot 
                    students={students || []}
                    skillVectors={skillVectors || []}
                    auraRecords={auraRecords || []}
                    classroomId={classroomId}
                  />
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Individual Student Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {skillVectors && skillVectors.length > 0 ? (
                        <div className="space-y-4">
                          {students?.map((student) => {
                            const vector = skillVectors.find(v => v.student_id === student.student_id);
                            const studentRecords = auraRecords?.filter(r => r.profile_id === student.student_id) || [];
                            const readingRecords = studentRecords.filter(r => r.reading_type === 'reading');
                            const speakingRecords = studentRecords.filter(r => r.reading_type === 'speaking');

                            if (!vector) return null;

                            const avgReadingGrade = readingRecords.length > 0
                              ? Math.round(readingRecords.reduce((sum, r) => sum + (r.grade || 0), 0) / readingRecords.length)
                              : null;
                            
                            const avgSpeakingGrade = speakingRecords.length > 0
                              ? Math.round(speakingRecords.reduce((sum, r) => sum + (r.grade || 0), 0) / speakingRecords.length)
                              : null;

                            const crossModalRisk = vector.cross_modal_risk_score || 0;
                            const predictedComprehension = vector.predicted_comprehension_score || 0;

                            return (
                              <div key={student.student_id} className="p-4 rounded-lg border bg-muted/30">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <h4 className="font-semibold">{student.profiles?.full_name}</h4>
                                    <p className="text-xs text-muted-foreground">{student.profiles?.email}</p>
                                  </div>
                                  <Badge variant={crossModalRisk > 50 ? "destructive" : "secondary"}>
                                    Risk: {crossModalRisk}/100
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-3 gap-3 text-sm">
                                  <div className="p-2 rounded bg-background">
                                    <div className="text-xs text-muted-foreground mb-1">Speaking Avg</div>
                                    <div className="font-semibold">
                                      {avgSpeakingGrade !== null ? `${avgSpeakingGrade}/100` : 'No data'}
                                    </div>
                                  </div>
                                  <div className="p-2 rounded bg-background">
                                    <div className="text-xs text-muted-foreground mb-1">Reading Avg</div>
                                    <div className="font-semibold">
                                      {avgReadingGrade !== null ? `${avgReadingGrade}/100` : 'No data'}
                                    </div>
                                  </div>
                                  <div className="p-2 rounded bg-background">
                                    <div className="text-xs text-muted-foreground mb-1">Predicted</div>
                                    <div className="font-semibold">
                                      {predictedComprehension > 0 ? `${predictedComprehension}/100` : 'N/A'}
                                    </div>
                                  </div>
                                </div>

                                {avgSpeakingGrade !== null && avgReadingGrade !== null && (
                                  <div className="mt-3 p-2 rounded bg-primary/5 text-xs">
                                    {Math.abs(avgSpeakingGrade - avgReadingGrade) > 20 ? (
                                      <p>⚠️ <strong>Divergent Performance:</strong> {avgSpeakingGrade > avgReadingGrade ? 'Strong speaker, needs reading support' : 'Strong reader, needs speaking practice'}</p>
                                    ) : (
                                      <p>✅ <strong>Aligned Performance:</strong> Speaking and reading skills are balanced</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No cross-modal data yet. Students need to complete both AURA speech practice and reading assignments.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="transfer" className="mt-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Transfer Learning & Difficulty Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {skillVectors && skillVectors.length > 0 ? (
                        <div className="space-y-6">
                          {/* Class Difficulty Overview */}
                          <div className="grid grid-cols-5 gap-3">
                            {[1, 2, 3, 4, 5].map((level) => {
                              const studentsAtLevel = skillVectors.filter(sv => sv.current_difficulty_level === level).length;
                              const percentage = Math.round((studentsAtLevel / skillVectors.length) * 100);
                              
                              return (
                                <Card key={level} className="text-center">
                                  <CardContent className="pt-4">
                                    <div className="text-2xl font-bold">{studentsAtLevel}</div>
                                    <div className="text-xs text-muted-foreground">Level {level}</div>
                                    <div className="text-xs font-medium">{percentage}%</div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>

                          <div className="grid gap-4">
                            {students?.map((studentData: any) => {
                              const student = studentData.profiles;
                              const skillVector = skillVectors.find(sv => sv.student_id === student.id);
                              
                              if (!skillVector) return null;

                              const insights = skillVector.transfer_learning_insights as any;
                              const predictions = insights?.predictions || [];
                              const difficultyLevel = skillVector.current_difficulty_level || 1;
                              const performanceTrend = skillVector.performance_trend || 0;

                              const getDifficultyColor = (level: number) => {
                                const colors = ['green', 'blue', 'purple', 'orange', 'red'];
                                return colors[level - 1] || 'gray';
                              };

                              return (
                                <Card key={student.id} className="border-primary/20">
                                  <CardContent className="pt-6">
                                    <div className="space-y-4">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <h4 className="font-semibold flex items-center gap-2">
                                            {student.full_name}
                                            <Badge variant="default" className={`bg-${getDifficultyColor(difficultyLevel)}-500 text-white`}>
                                              Level {difficultyLevel}
                                            </Badge>
                                          </h4>
                                          <p className="text-sm text-muted-foreground">{student.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                          {performanceTrend > 5 ? (
                                            <>
                                              <TrendingUp className="w-4 h-4 text-green-600" />
                                              <span className="text-green-600 font-medium">+{Math.round(performanceTrend)}%</span>
                                            </>
                                          ) : performanceTrend < -5 ? (
                                            <>
                                              <Badge variant="outline" className="border-amber-600 text-amber-600">
                                                Needs Support
                                              </Badge>
                                            </>
                                          ) : (
                                            <span className="text-muted-foreground">Stable</span>
                                          )}
                                        </div>
                                      </div>

                                      {predictions.length > 0 && (
                                        <>
                                          <div>
                                            <p className="text-sm font-medium mb-2">🚀 Predicted Gains:</p>
                                            <div className="flex flex-wrap gap-2">
                                              {predictions.slice(0, 5).map((pred: any) => (
                                                <Badge key={pred.phoneme} variant={
                                                  pred.readinessLevel === 'high' ? 'default' : 
                                                  pred.readinessLevel === 'medium' ? 'secondary' : 'outline'
                                                }>
                                                  /{pred.phoneme}/ ({pred.transferProbability}%)
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>

                                          {predictions[0] && (
                                            <div className="p-3 rounded-lg bg-primary/5 text-sm">
                                              <p className="font-medium mb-1">Next Target: /{predictions[0].phoneme}/</p>
                                              <p className="text-muted-foreground">{predictions[0].reasoning}</p>
                                            </div>
                                          )}
                                        </>
                                      )}

                                      {insights?.accuracy && (
                                        <div className="flex items-center gap-4 text-sm border-t pt-3">
                                          <div>
                                            <span className="text-muted-foreground">Prediction Accuracy: </span>
                                            <span className="font-semibold">{insights.accuracy}%</span>
                                          </div>
                                          {insights.totalPredictions && (
                                            <div className="text-muted-foreground">
                                              {insights.correctPredictions || 0} / {insights.totalPredictions} correct
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>

                          <div className="mt-6 p-4 rounded-lg bg-muted/50">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              About This Feature
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              Our adaptive system combines transfer learning with difficulty scaling to create 
                              personalized learning pathways. Each student progresses at their own pace, with 
                              exercises automatically adjusted based on performance.
                            </p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="font-medium mb-1">📈 Difficulty Scaling</p>
                                <p className="text-muted-foreground">Exercises adapt from Level 1 (Beginner) to Level 5 (Expert) based on mastery</p>
                              </div>
                              <div>
                                <p className="font-medium mb-1">🎯 Transfer Learning</p>
                                <p className="text-muted-foreground">AI predicts next phonemes to master using articulatory similarity</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No data yet. Students need to complete AURA practice sessions.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}

          {!classroomId && (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Select a classroom to view AURA analytics</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AuraAnalytics;
