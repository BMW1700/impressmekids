import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import ClassroomAuraOverview from "@/components/aura/ClassroomAuraOverview";
import StudentAuraMetrics from "@/components/aura/StudentAuraMetrics";
import PhonemeHeatmap from "@/components/aura/PhonemeHeatmap";
import AtRiskAlerts from "@/components/aura/AtRiskAlerts";
import ProsodyInsights from "@/components/aura/ProsodyInsights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ArrowLeft, Sparkles } from "lucide-react";
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
        .from('classrooms')
        .select('*')
        .eq('teacher_id', user.id);

      if (error) throw error;
      return data;
    },
  });

  const { data: students } = useQuery({
    queryKey: ['classroom-students', classroomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classroom_students')
        .select(`
          student_id,
          profiles (
            id,
            full_name,
            email
          )
        `)
        .eq('classroom_id', classroomId!);

      if (error) throw error;
      return data;
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
              <div className="p-3 rounded-full bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">AURA Analytics</h1>
                <p className="text-muted-foreground">Track student speaking progress</p>
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
                  <TabsTrigger value="prosody">Prosody & Fluency</TabsTrigger>
                  <TabsTrigger value="cross-modal" className="gap-1">
                    <Sparkles className="w-4 h-4" />
                    Cross-Modal
                  </TabsTrigger>
                  <TabsTrigger value="transfer" className="gap-1">
                    <Sparkles className="w-4 h-4" />
                    Transfer Learning
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
                  />
                </TabsContent>

                <TabsContent value="prosody" className="space-y-6">
                  <ProsodyInsights 
                    records={auraRecords}
                    skillVectors={skillVectors}
                  />
                </TabsContent>

                <TabsContent value="cross-modal" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Cross-Modal Literacy Insights
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Unified view of speaking + reading performance
                      </p>
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

                <TabsContent value="transfer" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Transfer Learning Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {skillVectors && skillVectors.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid gap-4">
                            {students?.map((studentData: any) => {
                              const student = studentData.profiles;
                              const skillVector = skillVectors.find(sv => sv.student_id === student.id);
                              
                              if (!skillVector?.transfer_learning_insights) return null;

                              const insights = skillVector.transfer_learning_insights as any;
                              const predictions = insights.predictions || [];

                              return (
                                <Card key={student.id} className="border-primary/20">
                                  <CardContent className="pt-6">
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="font-semibold">{student.full_name}</h4>
                                        <p className="text-sm text-muted-foreground">{student.email}</p>
                                      </div>

                                      {predictions.length > 0 ? (
                                        <>
                                          <div>
                                            <p className="text-sm font-medium mb-2">🚀 Top Predicted Gains:</p>
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
                                              <p className="font-medium mb-1">Next Phoneme: /{predictions[0].phoneme}/</p>
                                              <p className="text-muted-foreground">{predictions[0].reasoning}</p>
                                            </div>
                                          )}

                                          {insights.accuracy && (
                                            <div className="flex items-center gap-4 text-sm">
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
                                        </>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">
                                          No transfer predictions yet. Student needs more practice data.
                                        </p>
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
                              About Transfer Learning
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Our AI predicts which phonemes students will master next based on articulatory similarity 
                              to sounds they've already mastered. This helps personalize practice exercises and accelerate 
                              learning by targeting phonemes students are ready to learn.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No transfer learning data yet. Students need to complete AURA practice sessions.</p>
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
