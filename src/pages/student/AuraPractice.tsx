import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VoiceRecorder } from "@/components/aura/VoiceRecorder";
import AuraFeedbackCard from "@/components/aura/AuraFeedbackCard";
import AuraProgressChart from "@/components/aura/AuraProgressChart";
import SpeakerDiarizationView from "@/components/aura/SpeakerDiarizationView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, TrendingUp, BookOpen } from "lucide-react";
import GeneratedExercises from "@/components/aura/GeneratedExercises";
import PhonemeMasteryPathway from "@/components/aura/PhonemeMasteryPathway";
import DifficultyProgressCard from "@/components/aura/DifficultyProgressCard";
import { PhonemePracticeExercises } from "@/components/aura/PhonemePracticeExercises";

const AuraPractice = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/auth'); return; }
    
    const { data: profileResult } = await supabase.rpc('get_user_profile', { 
      _user_id: session.user.id 
    });
    
    if (!profileResult || profileResult.length === 0) { 
      navigate('/auth'); 
      return; 
    }
    
    const profileData = profileResult[0];
    
    // Redirect non-students to their dashboards
    if (profileData.role === 'district_manager') navigate('/district-manager/dashboard');
    else if (profileData.role === 'teacher') navigate('/teacher/dashboard');
    else if (profileData.role === 'admin') navigate('/admin/dashboard');
    else if (profileData.role === 'parent') navigate('/parent/dashboard');
  };

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: records, refetch } = useQuery({
    queryKey: ['aura-records', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aura_records')
        .select('*')
        .eq('profile_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: skillVector } = useQuery({
    queryKey: ['skill-vector', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_skill_vectors')
        .select('*')
        .eq('student_id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleTranscriptionComplete = async (
    text: string, 
    audioUrl: string, 
    durationSeconds: number,
    audioFeatures?: any,
    phonemes?: any[]
  ) => {
    setIsAnalyzing(true);
    try {
      console.log('🚀 Sending to AURA AI backend...');
      console.log('Phonemes detected:', phonemes?.length || 0);
      console.log('Audio features:', !!audioFeatures);
      
      const { data, error } = await supabase.functions.invoke('analyze-aura', {
        body: {
          transcript: text,
          durationSeconds,
          audioUrl,
          audioFeatures,
          phonemes,
        },
      });

      if (error) throw error;

      setLatestAnalysis(data.analysis);
      toast({
        title: "✨ Analysis Complete!",
        description: `Your speaking grade: ${data.analysis.grade}/100`,
      });
      
      refetch();
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze your recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-full bg-primary/10">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AURA Practice</h1>
              <p className="text-muted-foreground">Improve your speaking skills with AI-powered feedback</p>
            </div>
          </div>

          <Tabs defaultValue="practice" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="practice" className="hover:scale-105 transition-transform">
                <Mic className="h-4 w-4 mr-2" />
                Practice
              </TabsTrigger>
              <TabsTrigger value="progress" className="hover:scale-105 transition-transform">
                <TrendingUp className="h-4 w-4 mr-2" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="exercises" className="hover:scale-105 transition-transform">
                <BookOpen className="h-4 w-4 mr-2" />
                Exercises
              </TabsTrigger>
            </TabsList>

            <TabsContent value="practice" className="space-y-6 mt-6">
              <Card className="hover:scale-[1.01] transition-transform duration-200">
                <CardHeader>
                  <CardTitle>Record Your Practice</CardTitle>
                  <CardDescription>
                    Read a passage, answer a question, or practice pronunciation. Our AI will analyze your speech.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VoiceRecorder 
                    onTranscriptionComplete={handleTranscriptionComplete}
                    isAnalyzing={isAnalyzing}
                  />
                </CardContent>
              </Card>

              {latestAnalysis && (
                <>
                  <AuraFeedbackCard analysis={latestAnalysis} />
                  
                  {latestAnalysis.speakerSegments && latestAnalysis.speakerSegments.length > 0 && (
                    <SpeakerDiarizationView
                      segments={latestAnalysis.speakerSegments}
                      diarizationConfidence={latestAnalysis.diarizationConfidence}
                    />
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
              {!records || records.length === 0 ? (
                <Card className="hover:scale-[1.01] transition-transform duration-200">
                  <CardContent className="text-center py-12">
                    <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                      <Mic className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Practice Sessions Yet</h3>
                    <p className="text-muted-foreground">Start recording to see your progress!</p>
                  </CardContent>
                </Card>
              ) : (
                <AuraProgressChart records={records} />
              )}
            </TabsContent>

            <TabsContent value="exercises" className="mt-6 space-y-6">
              {user?.id && (
                <PhonemePracticeExercises studentId={user.id} />
              )}
              
              {skillVector && (
                <DifficultyProgressCard
                  currentLevel={skillVector.current_difficulty_level || 1}
                  performanceTrend={skillVector.performance_trend || 0}
                  recentGrades={(records || []).slice(0, 5).map(r => r.grade).filter(g => g !== null)}
                  difficultyHistory={(skillVector.difficulty_history as any) || []}
                />
              )}
              
              <PhonemeMasteryPathway
                masteredPhonemes={latestAnalysis?.masteredPhonemes || []}
                strugglingPhonemes={latestAnalysis?.problematicPhonemes || []}
                studentGrade={5}
              />
              
              <GeneratedExercises 
                problematicPhonemes={latestAnalysis?.problematicPhonemes || []}
                studentGrade={5}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AuraPractice;
