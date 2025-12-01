import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, Shield, Activity, BarChart3, Users } from "lucide-react";
import { CreateSafetyAlertModal } from "@/components/safety/CreateSafetyAlertModal";
import { DrillSessionCard } from "@/components/safety/DrillSessionCard";
import { AdminLiveView } from "@/components/admin/AdminLiveView";
import { SafetyAnalytics } from "@/components/admin/SafetyAnalytics";
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
  const [activeDrill, setActiveDrill] = useState<any>(null);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [selectedDrillType, setSelectedDrillType] = useState<string>("");
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
    const [alertsData, drillsData, classroomsData] = await Promise.all([
      supabase
        .from("safety_alerts")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("drill_sessions")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10),
      supabase
        .from("classrooms")
        .select("id, name")
        .order("name")
    ]);

    if (alertsData.data) setAlerts(alertsData.data);
    if (drillsData.data) {
      setDrills(drillsData.data);
      const active = drillsData.data.find(d => d.status === "active");
      setActiveDrill(active || null);
    }
    if (classroomsData.data) setClassrooms(classroomsData.data);
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
          status: "active",
          created_by: session.user.id,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (parentError) throw parentError;

      // Create drill sessions for all classrooms
      const drillSessions = classrooms.map(classroom => ({
        classroom_id: classroom.id,
        drill_type: selectedDrillType,
        status: "active",
        created_by: session.user.id,
        started_at: new Date().toISOString(),
        school_drill_id: parentDrill.id
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

      toast({
        title: "School-Wide Drill Started",
        description: `${selectedDrillType} drill initiated for all classrooms`,
      });

      await fetchData();
      setSelectedDrillType("");
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
              >
                <Users className="mr-2 h-5 w-5" />
                {startingSchoolWideDrill ? "Starting..." : "Start School-Wide Drill"}
              </Button>
            </div>
          </div>
        </div>

        {activeDrill && (
          <Card className="p-6 mb-6 border-red-500 border-2 bg-red-500/10">
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
        )}

        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
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
            <TabsTrigger value="analytics">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
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
            {drills.length === 0 ? (
              <Card className="p-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Drill Sessions</h3>
                <p className="text-muted-foreground">
                  Drill sessions will appear here once created
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {drills.map((drill) => (
                  <DrillSessionCard key={drill.id} drill={drill} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="live">
            <AdminLiveView activeDrillId={activeDrill?.id || null} />
          </TabsContent>

          <TabsContent value="analytics">
            <SafetyAnalytics />
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
    </div>
  );
}
