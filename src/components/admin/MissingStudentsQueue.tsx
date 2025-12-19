import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertTriangle, Clock, CheckCircle, Phone, User, MapPin, RefreshCw } from "lucide-react";

interface MissingStudent {
  attendance_id: string;
  student_id: string;
  student_name: string;
  classroom_id: string;
  classroom_name: string;
  teacher_name: string;
  status: string;
  escalation_level: number;
  escalation_started_at: string | null;
  time_missing_seconds: number;
  parent_phone: string | null;
}

interface MissingStudentsQueueProps {
  drillSessionId: string;
  isRealEmergency?: boolean;
}

export const MissingStudentsQueue = ({ drillSessionId, isRealEmergency }: MissingStudentsQueueProps) => {
  const [missingStudents, setMissingStudents] = useState<MissingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<MissingStudent | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolvedStatus, setResolvedStatus] = useState<"accounted" | "absent" | "other_location">("accounted");
  const [isChecking, setIsChecking] = useState(false);

  const fetchMissingStudents = async () => {
    try {
      // Use direct query since the RPC function isn't in types yet
      const { data, error } = await supabase
        .from("drill_attendance" as any)
        .select(`
          id,
          student_id,
          classroom_id,
          status,
          escalation_level,
          escalation_started_at,
          profiles!drill_attendance_student_id_fkey(full_name),
          classrooms!drill_attendance_classroom_id_fkey(
            name,
            teacher_id,
            profiles!classrooms_teacher_id_fkey(full_name)
          )
        `)
        .eq("drill_session_id", drillSessionId)
        .in("status", ["pending", "missing", "unaccounted"]);

      if (error) throw error;
      
      // Transform data to match expected format
      const transformed: MissingStudent[] = (data || []).map((item: any) => ({
        attendance_id: item.id,
        student_id: item.student_id,
        student_name: item.profiles?.full_name || "Unknown Student",
        classroom_id: item.classroom_id,
        classroom_name: item.classrooms?.name || "Unknown Classroom",
        teacher_name: item.classrooms?.profiles?.full_name || "Unknown Teacher",
        status: item.status,
        escalation_level: item.escalation_level || 0,
        escalation_started_at: item.escalation_started_at,
        time_missing_seconds: item.escalation_started_at 
          ? Math.floor((Date.now() - new Date(item.escalation_started_at).getTime()) / 1000)
          : 0,
        parent_phone: null
      }));
      
      // Sort by escalation level descending
      transformed.sort((a, b) => b.escalation_level - a.escalation_level);
      
      setMissingStudents(transformed);
    } catch (err) {
      console.error("Error fetching missing students:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkEscalations = async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("escalation-engine", {
        body: { drill_session_id: drillSessionId, action: "check_escalations" }
      });

      if (error) throw error;
      
      if (data?.escalations_triggered > 0) {
        toast.warning(`${data.escalations_triggered} escalation(s) triggered`);
      }
      
      await fetchMissingStudents();
    } catch (err) {
      console.error("Error checking escalations:", err);
      toast.error("Failed to check escalations");
    } finally {
      setIsChecking(false);
    }
  };

  const resolveStudent = async () => {
    if (!selectedStudent) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.functions.invoke("escalation-engine", {
        body: {
          action: "resolve_missing_student",
          attendance_id: selectedStudent.attendance_id,
          user_id: user?.id,
          resolution_notes: resolutionNotes,
          resolved_status: resolvedStatus
        }
      });

      if (error) throw error;

      toast.success(`${selectedStudent.student_name} marked as ${resolvedStatus}`);
      setResolveDialogOpen(false);
      setSelectedStudent(null);
      setResolutionNotes("");
      await fetchMissingStudents();
    } catch (err) {
      console.error("Error resolving student:", err);
      toast.error("Failed to resolve student status");
    }
  };

  useEffect(() => {
    fetchMissingStudents();

    // Set up real-time subscription
    const channel = supabase
      .channel(`missing-students-${drillSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "drill_attendance",
          filter: `drill_session_id=eq.${drillSessionId}`
        },
        () => {
          fetchMissingStudents();
        }
      )
      .subscribe();

    // Auto-check escalations every 30 seconds
    const escalationInterval = setInterval(checkEscalations, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(escalationInterval);
    };
  }, [drillSessionId]);

  const getEscalationColor = (level: number) => {
    switch (level) {
      case 0:
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500";
      case 1:
        return "bg-orange-500/20 text-orange-700 border-orange-500";
      case 2:
        return "bg-red-500/20 text-red-700 border-red-500";
      case 3:
        return "bg-red-600/30 text-red-800 border-red-600";
      case 4:
        return "bg-red-900/40 text-red-900 border-red-900 animate-pulse";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getEscalationLabel = (level: number) => {
    switch (level) {
      case 0:
        return "Pending";
      case 1:
        return "Level 1 - Teacher";
      case 2:
        return "Level 2 - Admin";
      case 3:
        return "Level 3 - District";
      case 4:
        return "EMERGENCY";
      default:
        return "Unknown";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          Loading missing students...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className={`h-6 w-6 ${isRealEmergency ? "text-red-600 animate-pulse" : "text-orange-500"}`} />
          <h2 className="text-xl font-bold">
            Missing Students Queue
            {missingStudents.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {missingStudents.length}
              </Badge>
            )}
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={checkEscalations}
          disabled={isChecking}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? "animate-spin" : ""}`} />
          Check Escalations
        </Button>
      </div>

      {missingStudents.length === 0 ? (
        <Card className="border-green-500/50 bg-green-500/10">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-700">All Students Accounted For</h3>
            <p className="text-green-600/80">No missing or pending students</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {missingStudents.map((student) => (
            <Card
              key={student.attendance_id}
              className={`border-2 ${getEscalationColor(student.escalation_level)}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-5 w-5" />
                      <span className="font-bold text-lg">{student.student_name}</span>
                      <Badge variant="outline" className={getEscalationColor(student.escalation_level)}>
                        {getEscalationLabel(student.escalation_level)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{student.classroom_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{student.teacher_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono font-bold">
                          {formatTime(student.time_missing_seconds)}
                        </span>
                      </div>
                      {student.parent_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{student.parent_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => {
                      setSelectedStudent(student);
                      setResolveDialogOpen(true);
                    }}
                    variant={student.escalation_level >= 3 ? "destructive" : "default"}
                  >
                    Resolve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resolution Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Missing Student</DialogTitle>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold">{selectedStudent.student_name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedStudent.classroom_name} • Missing for {formatTime(selectedStudent.time_missing_seconds)}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Resolution Status</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={resolvedStatus === "accounted" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setResolvedStatus("accounted")}
                  >
                    Found Safe
                  </Button>
                  <Button
                    variant={resolvedStatus === "other_location" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setResolvedStatus("other_location")}
                  >
                    Other Location
                  </Button>
                  <Button
                    variant={resolvedStatus === "absent" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setResolvedStatus("absent")}
                  >
                    Absent Today
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Resolution Notes (Required)</label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Where was the student found? Any relevant details..."
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={resolveStudent}
              disabled={!resolutionNotes.trim()}
            >
              Confirm Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
