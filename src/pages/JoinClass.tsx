import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users } from "lucide-react";

const JoinClass = () => {
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleJoinClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a join code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Find classroom by join code
      const { data: classroom, error: classroomError } = await supabase
        .from('classrooms')
        .select('id, name')
        .eq('join_code', joinCode.toUpperCase().trim())
        .single();

      if (classroomError || !classroom) {
        toast({
          title: "Invalid Code",
          description: "The join code you entered is not valid",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if already joined
      const { data: existing } = await supabase
        .from('classroom_students')
        .select('id')
        .eq('classroom_id', classroom.id)
        .eq('student_id', session.user.id)
        .single();

      if (existing) {
        toast({
          title: "Already Joined",
          description: `You're already in ${classroom.name}`,
        });
        navigate('/student/dashboard');
        return;
      }

      // Join classroom
      const { error: joinError } = await supabase
        .from('classroom_students')
        .insert({
          classroom_id: classroom.id,
          student_id: session.user.id,
        });

      if (joinError) throw joinError;

      toast({
        title: "Success!",
        description: `You've joined ${classroom.name}`,
      });

      navigate('/student/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join classroom",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuthButtons={false} />
      
      <main className="flex-1 py-8 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-md">
          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle className="text-2xl">Join a Classroom</CardTitle>
              <CardDescription>
                Enter the 6-character join code from your teacher
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinClassroom}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="joinCode">Join Code</Label>
                    <Input
                      id="joinCode"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="ABC123"
                      maxLength={6}
                      className="font-mono text-lg text-center tracking-wider"
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Join Classroom
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/student/dashboard')}
                    disabled={isLoading}
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default JoinClass;
