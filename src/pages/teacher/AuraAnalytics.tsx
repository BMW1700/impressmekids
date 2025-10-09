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
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="phonemes" className="gap-1">
                    <Sparkles className="w-4 h-4" />
                    Phoneme Analysis
                  </TabsTrigger>
                  <TabsTrigger value="alerts">At-Risk Alerts</TabsTrigger>
                  <TabsTrigger value="prosody">Prosody & Fluency</TabsTrigger>
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
