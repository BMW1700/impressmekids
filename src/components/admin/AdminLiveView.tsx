import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DrillAttendance {
  id: string;
  student_id: string;
  status: string;
  marked_at: string | null;
  student: {
    full_name: string;
  };
}

interface ClassroomDrillStatus {
  classroom_id: string;
  classroom_name: string;
  teacher_name: string;
  total_students: number;
  accounted: number;
  unaccounted: number;
  status: 'complete' | 'in_progress' | 'pending';
  drill_session_id: string;
}

export function AdminLiveView({ activeDrillId }: { activeDrillId: string | null }) {
  const [classrooms, setClassrooms] = useState<ClassroomDrillStatus[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
  const [studentDetails, setStudentDetails] = useState<DrillAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeDrillId) {
      setLoading(false);
      return;
    }

    fetchDrillStatus();
    
    // Real-time subscription for drill attendance changes
    const channel = supabase
      .channel('drill-attendance-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'drill_attendance'
      }, () => {
        fetchDrillStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeDrillId]);

  const fetchDrillStatus = async () => {
    if (!activeDrillId) return;

    try {
      // Get all drill sessions for this school-wide drill
      const { data: drillSessions } = await supabase
        .from('drill_sessions')
        .select(`
          id,
          classroom_id,
          classrooms!inner (
            id,
            name,
            teacher:profiles!classrooms_teacher_id_fkey (
              full_name
            )
          )
        `)
        .or(`id.eq.${activeDrillId},school_drill_id.eq.${activeDrillId}`);

      if (!drillSessions) {
        setClassrooms([]);
        setLoading(false);
        return;
      }

      // Get attendance for all drill sessions
      const classroomStatuses: ClassroomDrillStatus[] = [];

      for (const session of drillSessions) {
        const { data: attendance } = await supabase
          .from('drill_attendance')
          .select('status')
          .eq('drill_session_id', session.id);

        const total = attendance?.length || 0;
        const accounted = attendance?.filter(a => a.status === 'present').length || 0;
        const unaccounted = attendance?.filter(a => a.status === 'unaccounted').length || 0;

        let status: 'complete' | 'in_progress' | 'pending' = 'pending';
        if (total > 0) {
          if (unaccounted === 0) {
            status = 'complete';
          } else {
            status = 'in_progress';
          }
        }

        classroomStatuses.push({
          classroom_id: session.classroom_id!,
          classroom_name: session.classrooms.name,
          teacher_name: session.classrooms.teacher.full_name,
          total_students: total,
          accounted,
          unaccounted,
          status,
          drill_session_id: session.id
        });
      }

      setClassrooms(classroomStatuses);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching drill status:', error);
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (drillSessionId: string) => {
    const { data } = await supabase
      .from('drill_attendance')
      .select(`
        id,
        student_id,
        status,
        marked_at,
        student:profiles!drill_attendance_student_id_fkey (
          full_name
        )
      `)
      .eq('drill_session_id', drillSessionId)
      .order('status', { ascending: false });

    setStudentDetails(data || []);
  };

  const handleClassroomClick = (classroomId: string, drillSessionId: string) => {
    setSelectedClassroom(classroomId === selectedClassroom ? null : classroomId);
    if (classroomId !== selectedClassroom) {
      fetchStudentDetails(drillSessionId);
    }
  };

  if (!activeDrillId) {
    return (
      <Card className="p-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Active Drills</h3>
        <p className="text-muted-foreground">
          Start a drill from the Drills tab to begin live monitoring
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalStudents = classrooms.reduce((sum, c) => sum + c.total_students, 0);
  const totalAccounted = classrooms.reduce((sum, c) => sum + c.accounted, 0);
  const totalUnaccounted = classrooms.reduce((sum, c) => sum + c.unaccounted, 0);

  return (
    <div className="space-y-6">
      {/* School-Wide Summary */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <div className="text-3xl font-bold">{totalStudents}</div>
              <div className="text-sm text-muted-foreground">Total Students</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-3xl font-bold text-green-600">{totalAccounted}</div>
              <div className="text-sm text-muted-foreground">Accounted</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <div className="text-3xl font-bold text-red-600">{totalUnaccounted}</div>
              <div className="text-sm text-muted-foreground">Unaccounted</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Classroom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classrooms.map((classroom) => (
          <div key={classroom.classroom_id}>
            <Card
              className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                classroom.status === 'complete'
                  ? 'border-green-500 bg-green-500/5'
                  : classroom.unaccounted > 0
                  ? 'border-red-500 bg-red-500/5'
                  : 'border-yellow-500 bg-yellow-500/5'
              } ${selectedClassroom === classroom.classroom_id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => handleClassroomClick(classroom.classroom_id, classroom.drill_session_id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{classroom.classroom_name}</h3>
                  <p className="text-sm text-muted-foreground">{classroom.teacher_name}</p>
                </div>
                <Badge
                  variant={
                    classroom.status === 'complete'
                      ? 'default'
                      : classroom.status === 'in_progress'
                      ? 'secondary'
                      : 'outline'
                  }
                  className={
                    classroom.status === 'complete'
                      ? 'bg-green-500'
                      : classroom.status === 'in_progress'
                      ? 'bg-yellow-500'
                      : ''
                  }
                >
                  {classroom.status === 'complete' ? 'Complete' : 'In Progress'}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Students:</span>
                  <span className="font-semibold">{classroom.total_students}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">Accounted:</span>
                  <span className="font-semibold text-green-600">{classroom.accounted}</span>
                </div>
                {classroom.unaccounted > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-red-600">Unaccounted:</span>
                    <span className="font-semibold text-red-600">{classroom.unaccounted}</span>
                  </div>
                )}
              </div>

              {selectedClassroom === classroom.classroom_id && (
                <Button size="sm" variant="outline" className="w-full mt-3">
                  View Details
                </Button>
              )}
            </Card>

            {/* Student Details Dropdown */}
            {selectedClassroom === classroom.classroom_id && studentDetails.length > 0 && (
              <Card className="p-4 mt-2 border-l-4 border-l-primary">
                <h4 className="font-semibold mb-3">Student Status</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {studentDetails.map((student) => (
                    <div key={student.id} className="flex items-center justify-between text-sm">
                      <span>{student.student.full_name}</span>
                      <Badge
                        variant={student.status === 'present' ? 'default' : 'destructive'}
                        className={student.status === 'present' ? 'bg-green-500' : 'bg-red-500'}
                      >
                        {student.status === 'present' ? 'Present' : 'Unaccounted'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        ))}
      </div>

      {classrooms.length === 0 && (
        <Card className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Classrooms Found</h3>
          <p className="text-muted-foreground">
            No classrooms are associated with this drill session
          </p>
        </Card>
      )}
    </div>
  );
}
