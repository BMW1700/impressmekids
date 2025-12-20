import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, Shield, Activity, BarChart3, Users, Calendar as CalendarIcon, Building2, UserCheck, MessageSquare } from "lucide-react";
import { CreateSafetyAlertModal } from "@/components/safety/CreateSafetyAlertModal";
import { ScheduleDrillModal } from "@/components/admin/ScheduleDrillModal";
import { DrillSessionCard } from "@/components/safety/DrillSessionCard";
import { AdminLiveView } from "@/components/admin/AdminLiveView";
import { SafetyAnalytics } from "@/components/admin/SafetyAnalytics";
import { MissingStudentsQueue } from "@/components/admin/MissingStudentsQueue";
import { MultiDistrictDashboard } from "@/components/safety/MultiDistrictDashboard";
import { VisitorManagement } from "@/components/safety/VisitorManagement";
import { SMSNotificationSettings } from "@/components/safety/SMSNotificationSettings";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminSafetyDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [drills, setDrills] = useState<any[]>([]);
  const [scheduledDrills, setScheduledDrills] = useState<any[]>([]);
  const [activeDrill, setActiveDrill] = useState<any>(null);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [showScheduleDrill, setShowScheduleDrill] = useState(false);
  const [selectedDrillType, setSelectedDrillType] = useState<string>("");
  const [isRealEmergency, setIsRealEmergency] = useState(false);
  const [startingSchoolWideDrill, setStartingSchoolWideDrill] = useState(false);
  const [classrooms, setClassrooms] = useState<any[]>([]);

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

    await fetchData();
    setLoading(false);
  };

  const fetchData = async () => {
    const [alertsData, drillsData, scheduledData, classroomsData] = await Promise.all([
      supabase
        .from("safety_alerts")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("drill_sessions")
        .select("*")
        .in("status", ["in_progress", "completed"])
        .order("started_at", { ascending: false })
        .limit(10),
      supabase
        .from("drill_sessions")
        .select("*")
        .eq("status", "scheduled")
        .order("scheduled_for", { ascending: true }),
      supabase
        .from("classrooms")
        .select("id, name")
        .order("name")
    ]);

    if (alertsData.data) setAlerts(alertsData.data);
    if (drillsData.data) {
      setDrills(drillsData.data);
      const active = drillsData.data.find(d => d.status === "in_progress");
      setActiveDrill(active || null);
    }
    if (scheduledData.data) setScheduledDrills(scheduledData.data);
    if (classroomsData.data) setClassrooms(classroomsData.data);
  };

  const handleScheduleDrill = async (drillType: string, scheduledFor: Date) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: newDrill, error } = await supabase
        .from("drill_sessions")
        .insert({
          drill_type: drillType,
          status: "scheduled",
          scheduled_for: scheduledFor.toISOString(),
          announced_at: new Date().toISOString(),
          created_by: session.user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Send scheduled drill notification
      try {
        await supabase.functions.invoke('send-drill-notification', {
          body: {
            type: 'drill_scheduled',
            drillSessionId: newDrill.id,
          },
        });
      } catch (notifError) {
        console.error('Error sending scheduled drill notification:', notifError);
      }

      toast({
        title: "Drill Scheduled",
        description: `${drillType.replace(/_/g, ' ')} has been scheduled. All users will be notified.`,
      });

      await fetchData();
    } catch (error) {
      console.error("Error scheduling drill:", error);
      toast({
        title: "Error",
        description: "Failed to schedule drill",
        variant: "destructive",
      });
    }
  };

  const startSchoolWideDrill = async () => {
    if (!selectedDrillType) {
      toast({
        title: "Select Drill Type",
        description: "Please select a drill type before starting",
        variant: "destructive",
      });
      return;
    }

    setStartingSchoolWideDrill(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Create parent drill session
      const { data: parentDrill, error: parentError } = await supabase
        .from("drill_sessions")
        .insert({
          drill_type: selectedDrillType,
          status: "in_progress",
          created_by: session.user.id,
          started_at: new Date().toISOString(),
          is_real_emergency: isRealEmergency
        })
        .select()
        .single();

      if (parentError) throw parentError;

      // Create drill sessions for all classrooms
      const drillSessions = classrooms.map(classroom => ({
        classroom_id: classroom.id,
        drill_type: selectedDrillType,
        status: "in_progress",
        created_by: session.user.id,
        started_at: new Date().toISOString(),
        school_drill_id: parentDrill.id,
        is_real_emergency: isRealEmergency
      }));

      const { error: sessionsError } = await supabase
        .from("drill_sessions")
        .insert(drillSessions);

      if (sessionsError) throw sessionsError;

      // Create drill attendance records for all students in all classrooms
      for (const classroom of classrooms) {
        const { data: students } = await supabase
          .from("classroom_students")
          .select("student_id")
          .eq("classroom_id", classroom.id);

        if (students && students.length > 0) {
          const attendanceRecords = students.map(student => ({
            drill_session_id: parentDrill.id,
            classroom_id: classroom.id,
            student_id: student.student_id,
            status: "unaccounted"
          }));

          await supabase
            .from("drill_attendance")
            .insert(attendanceRecords);
        }
      }

      // Send drill started notification
      try {
        await supabase.functions.invoke('send-drill-notification', {
          body: {
            type: 'drill_started',
            drillSessionId: parentDrill.id,
          },
        });
      } catch (notifError) {
        console.error('Error sending drill started notification:', notifError);
      }

      toast({
        title: isRealEmergency ? "🚨 EMERGENCY ACTIVATED" : "School-Wide Drill Started",
        description: isRealEmergency 
          ? `REAL ${selectedDrillType.replace(/_/g, ' ').toUpperCase()} EMERGENCY - All staff and parents notified`
          : `${selectedDrillType} drill initiated for all classrooms`,
      });

      await fetchData();
      setSelectedDrillType("");
      setIsRealEmergency(false);
    } catch (error) {
      console.error("Error starting school-wide drill:", error);
      toast({
        title: "Error",
        description: "Failed to start school-wide drill",
        variant: "destructive",
      });
    } finally {
      setStartingSchoolWideDrill(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Shield className="h-10 w-10 text-primary" />
              Safety Command Center
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage safety alerts, drills, and emergency communications
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowCreateAlert(true)} size="lg" variant="outline">
              <Plus className="mr-2 h-5 w-5" />
              Create Alert
            </Button>
            <Button onClick={() => setShowScheduleDrill(true)} size="lg" variant="outline">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Schedule Drill
            </Button>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Select value={selectedDrillType} onValueChange={setSelectedDrillType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select drill type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fire">Fire Drill</SelectItem>
                    <SelectItem value="lockdown">Lockdown</SelectItem>
                    <SelectItem value="tornado">Tornado</SelectItem>
                    <SelectItem value="earthquake">Earthquake</SelectItem>
                    <SelectItem value="reunification">Reunification</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={startSchoolWideDrill} 
                  size="lg"
                  disabled={!selectedDrillType || startingSchoolWideDrill}
                  className={isRealEmergency ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  <Users className="mr-2 h-5 w-5" />
                  {startingSchoolWideDrill ? "Starting..." : (isRealEmergency ? "🚨 ACTIVATE EMERGENCY" : "Start Now")}
                </Button>
              </div>
              <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg ${
                isRealEmergency ? "bg-red-500/20 border border-red-500" : "bg-muted"
              }`}>
                <input 
                  type="checkbox" 
                  checked={isRealEmergency}
                  onChange={(e) => setIsRealEmergency(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className={`text-sm font-semibold ${isRealEmergency ? "text-red-600" : ""}`}>
                  {isRealEmergency ? "🚨 REAL EMERGENCY (NOT A DRILL)" : "🟡 This is a practice drill"}
                </span>
              </label>
            </div>
          </div>
        </div>

        {activeDrill && (
          <div className="space-y-6 mb-6">
            <Card className="p-6 border-red-500 border-2 bg-red-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="h-6 w-6 text-red-500 animate-pulse" />
                  <div>
                    <h3 className="font-semibold text-lg">Active Drill in Progress</h3>
                    <p className="text-sm text-muted-foreground">
                      {activeDrill.drill_type} - Started {new Date(activeDrill.started_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => navigate(`/admin/safety/drill/${activeDrill.id}`)}>
                  Monitor Live
                </Button>
              </div>
            </Card>
            
            {/* Missing Students Queue - Shows during active drills */}
            <MissingStudentsQueue 
              drillSessionId={activeDrill.id} 
              isRealEmergency={activeDrill.is_real_emergency} 
            />
          </div>
        )}

        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="alerts">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="drills">
              <Shield className="mr-2 h-4 w-4" />
              Drills
            </TabsTrigger>
            <TabsTrigger value="live">
              <Activity className="mr-2 h-4 w-4" />
              Live View
            </TabsTrigger>
            <TabsTrigger value="visitors">
              <UserCheck className="mr-2 h-4 w-4" />
              Visitors
            </TabsTrigger>
            <TabsTrigger value="districts">
              <Building2 className="mr-2 h-4 w-4" />
              Districts
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="sms">
              <MessageSquare className="mr-2 h-4 w-4" />
              SMS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4">
            {alerts.length === 0 ? (
              <Card className="p-12 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Safety Alerts</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first safety alert to notify parents and students
                </p>
                <Button onClick={() => setShowCreateAlert(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Alert
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {alerts.map((alert) => (
                  <Card key={alert.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline">{alert.alert_type}</Badge>
                          {alert.is_authority_verified && (
                            <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                              ✓ Authority Verified
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{alert.title}</h3>
                        <p className="text-muted-foreground mb-3">{alert.message}</p>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="drills" className="space-y-4">
            {scheduledDrills.length > 0 && (
              <div className="space-y-3 mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Scheduled Drills
                </h3>
                <div className="grid gap-3">
                  {scheduledDrills.map((drill) => (
                    <DrillSessionCard key={drill.id} drill={drill} />
                  ))}
                </div>
              </div>
            )}

            {drills.length === 0 && scheduledDrills.length === 0 ? (
              <Card className="p-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Drills Yet</h3>
                <p className="text-muted-foreground">
                  Schedule or start your first safety drill
                </p>
              </Card>
            ) : (
              drills.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Recent Drills</h3>
                  <div className="grid gap-3">
                    {drills.map((drill) => (
                      <DrillSessionCard key={drill.id} drill={drill} />
                    ))}
                  </div>
                </div>
              )
            )}
          </TabsContent>

          <TabsContent value="live">
            <AdminLiveView activeDrillId={activeDrill?.id || null} />
          </TabsContent>

          <TabsContent value="visitors">
            <VisitorManagement />
          </TabsContent>

          <TabsContent value="districts">
            <MultiDistrictDashboard />
          </TabsContent>

          <TabsContent value="analytics">
            <SafetyAnalytics />
          </TabsContent>

          <TabsContent value="sms">
            <SMSNotificationSettings drillSessionId={activeDrill?.id} />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      <CreateSafetyAlertModal
        open={showCreateAlert}
        onOpenChange={setShowCreateAlert}
        onSuccess={() => {
          setShowCreateAlert(false);
          fetchData();
        }}
      />

      <ScheduleDrillModal
        open={showScheduleDrill}
        onOpenChange={setShowScheduleDrill}
        onSchedule={handleScheduleDrill}
      />
    </div>
  );
}
