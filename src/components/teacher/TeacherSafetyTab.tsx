import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle, CheckCircle2, Shield, Users } from "lucide-react";
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

interface TeacherSafetyTabProps {
  classroomId: string;
  students: any[];
}

export const TeacherSafetyTab = ({ classroomId, students }: TeacherSafetyTabProps) => {
  const { toast } = useToast();
  const [activeDrill, setActiveDrill] = useState<any>(null);
  const [isStartingDrill, setIsStartingDrill] = useState(false);
  const [drillAttendance, setDrillAttendance] = useState<any[]>([]);
  const [isEndingDrill, setIsEndingDrill] = useState(false);
  const [isSendingAllClear, setIsSendingAllClear] = useState(false);

  const fetchDrillAttendance = async () => {
    if (!activeDrill) return;
    const { data } = await supabase
      .from('drill_attendance')
      .select('*, profiles(full_name)')
      .eq('drill_session_id', activeDrill.id);
    setDrillAttendance(data || []);
  };

  useEffect(() => {
    checkActiveDrill();
  }, [classroomId]);

  useEffect(() => {
    if (activeDrill) {
      fetchDrillAttendance();
      
      // Subscribe to real-time drill_attendance changes
      const channel = supabase
        .channel('drill-attendance-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'drill_attendance',
            filter: `classroom_id=eq.${classroomId}`
          },
          () => {
            fetchDrillAttendance();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeDrill, classroomId]);

  const checkActiveDrill = async () => {
    const { data } = await supabase
      .from('drill_sessions')
      .select('*')
      .eq('classroom_id', classroomId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();
    
    setActiveDrill(data);
  };

  const handleStartDrill = async (drillType: string) => {
    setIsStartingDrill(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Create drill session
      const { data: drill, error: drillError } = await supabase
        .from('drill_sessions')
        .insert({
          drill_type: drillType,
          classroom_id: classroomId,
          created_by: session.user.id,
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (drillError) throw drillError;

      // Create drill_attendance records for all students
      const attendanceRecords = students.map(student => ({
        drill_session_id: drill.id,
        classroom_id: classroomId,
        student_id: student.student_id,
        status: 'unaccounted',
        student_checked_in: false
      }));

      const { error: attendanceError } = await supabase
        .from('drill_attendance')
        .insert(attendanceRecords);

      if (attendanceError) throw attendanceError;

      toast({
        title: "Drill Started",
        description: `${drillType.replace(/_/g, ' ')} drill is now in progress.`,
      });

      checkActiveDrill();
    } catch (error) {
      console.error('Error starting drill:', error);
      toast({
        title: "Error",
        description: "Failed to start drill",
        variant: "destructive",
      });
    } finally {
      setIsStartingDrill(false);
    }
  };

  const handleEndDrill = async () => {
    if (!activeDrill) return;
    setIsEndingDrill(true);

    const { error } = await supabase
      .from('drill_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString()
      })
      .eq('id', activeDrill.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to end drill",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Drill Ended",
        description: "Drill session has been marked as completed.",
      });
      setActiveDrill(null);
      setDrillAttendance([]);
    }

    setIsEndingDrill(false);
  };

  const handleSendAllClear = async () => {
    if (!activeDrill) return;
    setIsSendingAllClear(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('drill_sessions')
      .update({
        all_clear_at: new Date().toISOString(),
        all_clear_by: session.user.id
      })
      .eq('id', activeDrill.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send all-clear notification",
        variant: "destructive",
      });
      setIsSendingAllClear(false);
      return;
    }

    // Send notifications to parents and admins
    try {
      await supabase.functions.invoke('send-drill-notification', {
        body: {
          type: 'all_clear',
          drillSessionId: activeDrill.id,
          classroomId: classroomId,
        },
      });

      toast({
        title: "All Clear Sent!",
        description: "Parents and admins have been notified that all students are safe.",
      });
    } catch (notifError) {
      console.error('Error sending all-clear notifications:', notifError);
      toast({
        title: "Partial Success",
        description: "All-clear recorded but some notifications may have failed.",
        variant: "destructive",
      });
    }

    checkActiveDrill();
    setIsSendingAllClear(false);
  };

  const checkedInStudents = drillAttendance.filter(a => a.student_checked_in);
  const missingStudents = drillAttendance.filter(a => !a.student_checked_in);
  const allStudentsAccountedFor = drillAttendance.length > 0 && missingStudents.length === 0;
  const percentageCheckedIn = drillAttendance.length > 0 
    ? Math.round((checkedInStudents.length / drillAttendance.length) * 100)
    : 0;

  const getDrillTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (activeDrill) {
    return (
      <div className="space-y-6">
        <Card className={`border-2 ${
          activeDrill.is_real_emergency 
            ? "border-red-600 bg-red-600/20 animate-pulse" 
            : "border-red-500 bg-red-500/5"
        }`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-6 w-6 ${activeDrill.is_real_emergency ? "text-red-700" : "text-red-600"}`} />
                <div>
                  <CardTitle className={activeDrill.is_real_emergency ? "text-red-800" : "text-red-700"}>
                    {activeDrill.is_real_emergency && "🚨 REAL EMERGENCY - "}
                    {getDrillTypeLabel(activeDrill.drill_type)}
                    {!activeDrill.is_real_emergency && " (DRILL)"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Started: {new Date(activeDrill.started_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <Badge variant={allStudentsAccountedFor ? "default" : "destructive"} className="text-lg px-4 py-2">
                {percentageCheckedIn}% Checked In
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Students Accounted For</p>
                <p className="text-2xl font-bold">{checkedInStudents.length} / {drillAttendance.length}</p>
              </div>
              {allStudentsAccountedFor && !activeDrill.all_clear_at && (
                <Button 
                  size="lg" 
                  onClick={handleSendAllClear}
                  disabled={isSendingAllClear}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  {isSendingAllClear ? 'Sending...' : 'Send All Clear'}
                </Button>
              )}
              {activeDrill.all_clear_at && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  All Clear Sent
                </Badge>
              )}
            </div>

            {allStudentsAccountedFor && (
              <div className="p-4 bg-green-500/10 border border-green-500 rounded-lg text-center animate-pulse">
                <p className="text-xl font-bold text-green-700">
                  ✅ ALL STUDENTS ACCOUNTED FOR
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {/* Checked In Students */}
              <Card className="bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Checked In ({checkedInStudents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {checkedInStudents.map(student => (
                      <div key={student.id} className="flex items-center gap-2 p-2 bg-background rounded">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="flex-1">{student.profiles?.full_name || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(student.student_checkin_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                    {checkedInStudents.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No students checked in yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Missing Students */}
              <Card className={missingStudents.length > 0 ? "bg-red-50 border-red-300 animate-pulse" : "bg-muted"}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${missingStudents.length > 0 ? 'text-red-700' : 'text-muted-foreground'}`}>
                    <AlertTriangle className="h-5 w-5" />
                    Not Checked In ({missingStudents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {missingStudents.map(student => (
                      <div key={student.id} className="flex items-center gap-2 p-2 bg-background rounded">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="flex-1">{student.profiles?.full_name || 'Unknown'}</span>
                      </div>
                    ))}
                    {missingStudents.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        All students checked in! 🎉
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    End Drill
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>End Drill Session?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark the drill as completed. {missingStudents.length > 0 && `There are still ${missingStudents.length} students who haven't checked in.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleEndDrill} disabled={isEndingDrill}>
                      {isEndingDrill ? 'Ending...' : 'End Drill'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No active drill - show start options
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <CardTitle>Safety Drills</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Start a drill to track student attendance and safety
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => handleStartDrill('fire_drill')}
            disabled={isStartingDrill}
          >
            🔥
            <span>Fire Drill</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => handleStartDrill('lockdown_drill')}
            disabled={isStartingDrill}
          >
            🔒
            <span>Lockdown</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => handleStartDrill('earthquake_drill')}
            disabled={isStartingDrill}
          >
            🌊
            <span>Earthquake</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => handleStartDrill('tornado_drill')}
            disabled={isStartingDrill}
          >
            🌪️
            <span>Tornado</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => handleStartDrill('evacuation_drill')}
            disabled={isStartingDrill}
          >
            🚶
            <span>Evacuation</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
