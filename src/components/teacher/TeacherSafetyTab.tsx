import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TeacherSafetyTabProps {
  classroomId: string;
  students: any[];
}

export const TeacherSafetyTab = ({ classroomId, students }: TeacherSafetyTabProps) => {
  const { toast } = useToast();
  const [activeDrill, setActiveDrill] = useState<any>(null);
  const [isStartingDrill, setIsStartingDrill] = useState(false);
  const [drillAttendance, setDrillAttendance] = useState<any[]>([]);

  const fetchDrillAttendance = async () => {
    if (!activeDrill) return;
    const { data } = await supabase
      .from('drill_attendance')
      .select('*')
      .eq('drill_session_id', activeDrill.id);
    setDrillAttendance(data || []);
  };

  useEffect(() => {
    checkActiveDrill();
  }, [classroomId]);

  useEffect(() => {
    if (activeDrill) {
      fetchDrillAttendance();
      
      // Subscribe to drill_attendance changes
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
      .eq('status', 'active')
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
          status: 'active',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (drillError) throw drillError;

      // Create drill_attendance records for all students (status = 'pending' by default)
      const attendanceRecords = students.map(student => ({
        drill_session_id: drill.id,
        classroom_id: classroomId,
        student_id: student.student_id,
        status: 'pending'
      }));

      const { error: attendanceError } = await supabase
        .from('drill_attendance')
        .insert(attendanceRecords);

      if (attendanceError) throw attendanceError;

      setActiveDrill(drill);
      toast({
        title: "Drill Started",
        description: `${drillType.replace(/_/g, ' ')} drill is now active. Mark student attendance.`
      });
      
      fetchDrillAttendance();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsStartingDrill(false);
    }
  };

  const handleEndDrill = async () => {
    if (!activeDrill) return;
    
    try {
      const { error } = await supabase
        .from('drill_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', activeDrill.id);

      if (error) throw error;

      toast({
        title: "Drill Ended",
        description: "All students accounted for. Drill session completed."
      });
      
      setActiveDrill(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleMarkAttendance = async (studentId: string, status: 'present' | 'absent' | 'unaccounted') => {
    if (!activeDrill) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('drill_attendance')
        .update({
          status,
          marked_at: new Date().toISOString(),
          marked_by: session.user.id
        })
        .eq('drill_session_id', activeDrill.id)
        .eq('student_id', studentId);

      if (error) throw error;

      fetchDrillAttendance();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStudentDrillStatus = (studentId: string) => {
    const record = drillAttendance?.find(r => 
      r.student_id === studentId && r.drill_session_id === activeDrill?.id
    );
    return record?.status || 'pending';
  };

  const accountedCount = drillAttendance.filter(r => 
    r.drill_session_id === activeDrill?.id && r.status === 'present'
  ).length;

  const unaccountedCount = drillAttendance.filter(r => 
    r.drill_session_id === activeDrill?.id && r.status === 'unaccounted'
  ).length;

  if (!activeDrill) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Safety Drill Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Start a safety drill to track student attendance during emergency procedures.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => handleStartDrill('fire_drill')}
                disabled={isStartingDrill}
                className="h-20"
              >
                {isStartingDrill ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Fire Drill"}
              </Button>
              
              <Button
                onClick={() => handleStartDrill('lockdown_drill')}
                disabled={isStartingDrill}
                className="h-20"
                variant="outline"
              >
                {isStartingDrill ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Lockdown Drill"}
              </Button>
              
              <Button
                onClick={() => handleStartDrill('tornado_drill')}
                disabled={isStartingDrill}
                className="h-20"
                variant="outline"
              >
                {isStartingDrill ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Tornado Drill"}
              </Button>
              
              <Button
                onClick={() => handleStartDrill('evacuation_drill')}
                disabled={isStartingDrill}
                className="h-20"
                variant="outline"
              >
                {isStartingDrill ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Evacuation Drill"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Drill Header */}
      <Card className="border-orange-500 bg-orange-500/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500 rounded-full animate-pulse">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {activeDrill.drill_type.replace(/_/g, ' ').toUpperCase()} ACTIVE
                </h3>
                <p className="text-sm text-muted-foreground">
                  Started at {new Date(activeDrill.started_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <Button onClick={handleEndDrill} variant="destructive">
              End Drill
            </Button>
          </div>
          
          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{accountedCount}</div>
              <div className="text-xs text-muted-foreground">Accounted For</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{unaccountedCount}</div>
              <div className="text-xs text-muted-foreground">Unaccounted</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{students.length}</div>
              <div className="text-xs text-muted-foreground">Total Students</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Attendance Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Mark Student Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {students.map((student) => {
              const status = getStudentDrillStatus(student.student_id);
              return (
                <div
                  key={student.student_id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'present' ? 'bg-green-500' :
                      status === 'unaccounted' ? 'bg-red-500 animate-pulse' :
                      'bg-muted'
                    }`} />
                    <span className="font-medium">{student.profiles?.full_name}</span>
                  </div>
                  
                  <Select
                    value={status}
                    onValueChange={(value: any) => handleMarkAttendance(student.student_id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <span className="flex items-center gap-2">
                          Pending
                        </span>
                      </SelectItem>
                      <SelectItem value="present">
                        <span className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Present
                        </span>
                      </SelectItem>
                      <SelectItem value="unaccounted">
                        <span className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          Unaccounted
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
