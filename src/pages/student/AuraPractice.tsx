import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VoiceRecorder } from "@/components/aura/VoiceRecorder";
import AuraFeedbackCard from "@/components/aura/AuraFeedbackCard";
import AuraProgressChart from "@/components/aura/AuraProgressChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, TrendingUp, BookOpen } from "lucide-react";
import GeneratedExercises from "@/components/aura/GeneratedExercises";
import PhonemeMasteryPathway from "@/components/aura/PhonemeMasteryPathway";

const AuraPractice = () => {
  const { toast } = useToast();
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
      
      <main className="flex-1 container mx-auto px-4 py-8">
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
              <TabsTrigger value="practice">
                <Mic className="h-4 w-4 mr-2" />
                Practice
              </TabsTrigger>
              <TabsTrigger value="progress">
                <TrendingUp className="h-4 w-4 mr-2" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="exercises">
                <BookOpen className="h-4 w-4 mr-2" />
                Exercises
              </TabsTrigger>
            </TabsList>

            <TabsContent value="practice" className="space-y-6 mt-6">
              <Card>
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
                <AuraFeedbackCard analysis={latestAnalysis} />
              )}
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
              <AuraProgressChart records={records || []} />
            </TabsContent>

            <TabsContent value="exercises" className="mt-6 space-y-6">
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
