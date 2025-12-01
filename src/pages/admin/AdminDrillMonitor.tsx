import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Clock, ArrowLeft, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DrillAttendance {
  id: string;
  student_id: string;
  status: string;
  marked_at: string | null;
  student: {
    full_name: string;
  };
  classroom: {
    name: string;
  };
}

export default function AdminDrillMonitor() {
  const { drillId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [drill, setDrill] = useState<any>(null);
  const [attendance, setAttendance] = useState<DrillAttendance[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") {
      navigate("/");
      return;
    }

    await fetchDrillData();
    setLoading(false);
  };

  useEffect(() => {
    if (!drill || drill.status === 'completed') return;

    const interval = setInterval(() => {
      if (drill.started_at) {
        const elapsed = (new Date().getTime() - new Date(drill.started_at).getTime()) / 1000;
        setElapsedTime(Math.floor(elapsed));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [drill]);

  useEffect(() => {
    if (!drillId) return;

    // Real-time subscription for drill attendance changes
    const channel = supabase
      .channel('drill-monitor')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'drill_attendance'
      }, () => {
        fetchAttendance();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [drillId]);

  const fetchDrillData = async () => {
    if (!drillId) return;

    const { data } = await supabase
      .from('drill_sessions')
      .select('*')
      .eq('id', drillId)
      .single();

    setDrill(data);
    await fetchAttendance();
  };

  const fetchAttendance = async () => {
    if (!drillId) return;

    const { data } = await supabase
      .from('drill_attendance')
      .select(`
        id,
        student_id,
        status,
        marked_at,
        student:profiles!drill_attendance_student_id_fkey (
          full_name
        ),
        classroom:classrooms!drill_attendance_classroom_id_fkey (
          name
        )
      `)
      .eq('drill_session_id', drillId)
      .order('status', { ascending: false })
      .order('marked_at', { ascending: true });

    setAttendance(data || []);
  };

  const handleEndDrill = async () => {
    if (!drillId) return;

    try {
      const { error } = await supabase
        .from('drill_sessions')
        .update({ status: 'completed', ended_at: new Date().toISOString() })
        .eq('id', drillId);

      if (error) throw error;

      toast({
        title: "Drill Ended",
        description: "Drill session has been marked as complete",
      });

      navigate('/admin/safety');
    } catch (error) {
      console.error('Error ending drill:', error);
      toast({
        title: "Error",
        description: "Failed to end drill session",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!drill) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Drill Not Found</h3>
            <Button onClick={() => navigate('/admin/safety')}>
              Return to Safety Dashboard
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const totalStudents = attendance.length;
  const accountedStudents = attendance.filter(a => a.status === 'present').length;
  const unaccountedStudents = attendance.filter(a => a.status === 'unaccounted').length;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/admin/safety')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Safety Dashboard
        </Button>

        {/* Drill Header */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-red-500/10 to-orange-500/10 border-2 border-red-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield className="h-12 w-12 text-red-500" />
              <div>
                <h1 className="text-3xl font-bold capitalize">{drill.drill_type} Drill</h1>
                <p className="text-muted-foreground">Live Monitoring</p>
              </div>
            </div>
            
            {drill.status === 'in_progress' && (
              <div className="text-center">
                <div className="text-5xl font-mono font-bold text-primary">
                  {formatTime(elapsedTime)}
                </div>
                <div className="text-sm text-muted-foreground">Elapsed Time</div>
              </div>
            )}
          </div>
        </Card>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <div className="text-3xl font-bold">{totalStudents}</div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-green-500 bg-green-500/5">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-3xl font-bold text-green-600">{accountedStudents}</div>
                <div className="text-sm text-muted-foreground">Accounted</div>
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {totalStudents > 0 ? ((accountedStudents / totalStudents) * 100).toFixed(1) : 0}% Complete
            </div>
          </Card>

          <Card className="p-6 border-red-500 bg-red-500/5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-3xl font-bold text-red-600">{unaccountedStudents}</div>
                <div className="text-sm text-muted-foreground">Unaccounted</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Student Status List */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Student Status</h2>
            {drill.status === 'in_progress' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="default" size="lg" disabled={unaccountedStudents > 0}>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Mark All Clear
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>End Drill Session?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark the drill as complete. Make sure all students have been accounted for.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleEndDrill}>
                      End Drill
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <div className="space-y-2">
            {attendance.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="font-medium">{record.student.full_name}</div>
                  <div className="text-sm text-muted-foreground">{record.classroom.name}</div>
                </div>
                <Badge
                  variant={record.status === 'present' ? 'default' : 'destructive'}
                  className={record.status === 'present' ? 'bg-green-500' : 'bg-red-500'}
                >
                  {record.status === 'present' ? 'Accounted' : 'Unaccounted'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
