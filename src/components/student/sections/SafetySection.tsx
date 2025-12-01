import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DrillSession {
  id: string;
  drill_type: string;
  status: string;
  started_at: string;
  scheduled_for: string | null;
  classroom_id: string;
}

interface DrillAttendance {
  id: string;
  student_checked_in: boolean;
  student_checkin_at: string | null;
}

export function SafetySection() {
  const [activeDrill, setActiveDrill] = useState<DrillSession | null>(null);
  const [scheduledDrills, setScheduledDrills] = useState<DrillSession[]>([]);
  const [attendance, setAttendance] = useState<DrillAttendance | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDrillData();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('student-drill-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'drill_sessions'
      }, () => {
        fetchDrillData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDrillData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get student's classrooms
    const { data: classrooms } = await supabase
      .from('classroom_students')
      .select('classroom_id')
      .eq('student_id', session.user.id);

    if (!classrooms || classrooms.length === 0) return;

    const classroomIds = classrooms.map(c => c.classroom_id);

    // Get active drill
    const { data: activeDrillData } = await supabase
      .from('drill_sessions')
      .select('*')
      .in('classroom_id', classroomIds)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    setActiveDrill(activeDrillData || null);

    // Get scheduled drills
    const { data: scheduledData } = await supabase
      .from('drill_sessions')
      .select('*')
      .in('classroom_id', classroomIds)
      .eq('status', 'scheduled')
      .order('scheduled_for', { ascending: true });

    setScheduledDrills(scheduledData || []);

    // If there's an active drill, get attendance record
    if (activeDrillData) {
      const { data: attendanceData } = await supabase
        .from('drill_attendance')
        .select('*')
        .eq('drill_session_id', activeDrillData.id)
        .eq('student_id', session.user.id)
        .single();

      setAttendance(attendanceData || null);
    }
  };

  const handleCheckIn = async () => {
    if (!activeDrill || !attendance) return;

    setIsCheckingIn(true);

    const { error } = await supabase
      .from('drill_attendance')
      .update({
        student_checked_in: true,
        student_checkin_at: new Date().toISOString(),
        status: 'present'
      })
      .eq('id', attendance.id);

    if (error) {
      toast({
        title: 'Check-in Failed',
        description: 'Could not mark you as safe. Please try again.',
        variant: 'destructive',
      });
      setIsCheckingIn(false);
      return;
    }

    // Send notification to parents
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.functions.invoke('send-drill-notification', {
          body: {
            type: 'student_checkin',
            drillSessionId: activeDrill.id,
            studentId: session.user.id,
          },
        });
      }
    } catch (notifError) {
      console.error('Error sending parent notification:', notifError);
      // Don't fail the check-in if notification fails
    }

    toast({
      title: 'Successfully Checked In!',
      description: 'Your parents have been notified that you are safe.',
    });
    fetchDrillData();
    setIsCheckingIn(false);
  };

  const getDrillTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDrillInstructions = (type: string) => {
    const instructions: Record<string, string> = {
      fire_drill: "Follow your teacher's instructions to evacuate the building calmly and quickly.",
      lockdown_drill: "Remain quiet and stay in your designated safe location until the all-clear is given.",
      earthquake_drill: "Drop, cover, and hold on. Stay under cover until shaking stops.",
      tornado_drill: "Move to your designated shelter area and protect your head and neck.",
      evacuation_drill: "Follow evacuation routes to the designated assembly point."
    };
    return instructions[type] || "Follow your teacher's instructions carefully.";
  };

  if (activeDrill) {
    const hasCheckedIn = attendance?.student_checked_in;

    return (
      <div className="space-y-6">
        <Card className="p-6 border-red-500 border-2 bg-red-500/5 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500 rounded-full">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-red-700 mb-2">
                🚨 DRILL IN PROGRESS
              </h2>
              <p className="text-lg font-semibold mb-2">
                {getDrillTypeLabel(activeDrill.drill_type)}
              </p>
              <p className="text-muted-foreground mb-4">
                {getDrillInstructions(activeDrill.drill_type)}
              </p>

              {hasCheckedIn ? (
                <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-700">You're marked safe!</p>
                    <p className="text-sm text-muted-foreground">
                      Your parents have been notified at {format(new Date(attendance!.student_checkin_at!), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ) : (
                <Button
                  size="lg"
                  onClick={handleCheckIn}
                  disabled={isCheckingIn}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  {isCheckingIn ? 'Checking In...' : "✅ I'm Back in Class"}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Safety Center</h2>
            <p className="text-muted-foreground">Stay informed about school safety drills and procedures</p>
          </div>
        </div>

        {scheduledDrills.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Upcoming Drills</h3>
            {scheduledDrills.map(drill => (
              <Card key={drill.id} className="p-4 bg-blue-500/5 border-blue-500">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold">{getDrillTypeLabel(drill.drill_type)}</p>
                    <p className="text-sm text-muted-foreground">
                      Scheduled for {format(new Date(drill.scheduled_for!), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No drills scheduled at this time</p>
            <p className="text-sm text-muted-foreground mt-2">
              When a drill is active, you'll be able to check in here
            </p>
          </div>
        )}
      </Card>

      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-3">Safety Tips</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Always follow your teacher's instructions during drills</li>
          <li>• Stay calm and help others stay calm</li>
          <li>• Know your classroom's evacuation routes</li>
          <li>• Check in here once you're safely back in class</li>
        </ul>
      </Card>
    </div>
  );
}
