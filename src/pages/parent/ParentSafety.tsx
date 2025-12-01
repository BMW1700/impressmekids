import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CloudRain, DoorClosed, Shield, MessageSquare, QrCode, CheckCircle2, Clock, Settings } from "lucide-react";
import { UnaccountedChildAlert } from "@/components/safety/UnaccountedChildAlert";
import { ParentQuickMessagePanel } from "@/components/safety/ParentQuickMessagePanel";
import { StudentQRCode } from "@/components/safety/StudentQRCode";
import { useToast } from "@/hooks/use-toast";

export default function ParentSafety() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [parentId, setParentId] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [unaccountedChildren, setUnaccountedChildren] = useState<any[]>([]);
  const [activeDrillStatus, setActiveDrillStatus] = useState<any[]>([]);
  const [recessNotificationEnabled, setRecessNotificationEnabled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkAuth();
    subscribeToAlerts();
    subscribeToDrillAttendance();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: parentAccount } = await supabase
      .from("parent_accounts")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (!parentAccount) {
      navigate("/");
      return;
    }

    setParentId(parentAccount.id);
    await fetchData(parentAccount.id);
    setLoading(false);
  };

  const fetchData = async (pId: string) => {
    const { data: links } = await supabase
      .from("parent_student_links")
      .select(`
        student_id,
        notify_on_recess_return,
        profiles!parent_student_links_student_id_fkey(full_name)
      `)
      .eq("parent_id", pId)
      .eq("approved", true);

    if (links) {
      setStudents(links);
      
      // Set recess notification preferences
      const prefs: Record<string, boolean> = {};
      links.forEach((link: any) => {
        prefs[link.student_id] = link.notify_on_recess_return || false;
      });
      setRecessNotificationEnabled(prefs);
      
      await checkUnaccountedStatus(links.map(l => l.student_id));
    }

    const { data: alertsData } = await supabase
      .from("safety_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (alertsData) setAlerts(alertsData);
  };

  const checkUnaccountedStatus = async (studentIds: string[]) => {
    // Check for unaccounted children
    const { data: drillData } = await supabase
      .from("drill_attendance")
      .select(`
        *,
        drill_sessions(drill_type, status, is_real_emergency),
        profiles(full_name)
      `)
      .in("student_id", studentIds)
      .eq("status", "unaccounted");

    if (drillData) {
      setUnaccountedChildren(drillData.filter((d: any) => d.drill_sessions?.status === "in_progress"));
    }

    // Check active drill status for all children
    const { data: activeStatus } = await supabase
      .from("drill_attendance")
      .select(`
        *,
        drill_sessions(drill_type, status, is_real_emergency, started_at),
        profiles(full_name)
      `)
      .in("student_id", studentIds)
      .eq("drill_sessions.status", "in_progress");

    if (activeStatus) {
      setActiveDrillStatus(activeStatus);
    }
  };

  const subscribeToAlerts = () => {
    const channel = supabase
      .channel("safety-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "safety_alerts"
        },
        (payload) => {
          setAlerts((prev) => [payload.new as any, ...prev]);
          toast({
            title: "New Safety Alert",
            description: (payload.new as any).title
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToDrillAttendance = () => {
    const channel = supabase
      .channel("drill-attendance-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "drill_attendance"
        },
        async (payload) => {
          if (students.some(s => s.student_id === (payload.new as any)?.student_id)) {
            await checkUnaccountedStatus(students.map(s => s.student_id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const acknowledgeAlert = async (alertId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("safety_alert_acknowledgments").insert({
      alert_id: alertId,
      user_id: session.user.id
    });

    if (!error) {
      toast({
        title: "Acknowledged",
        description: "Alert has been acknowledged"
      });
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

  const filterAlertsByType = (type: string) => {
    return alerts.filter(a => a.alert_type === type);
  };

  const toggleRecessNotification = async (studentId: string) => {
    if (!parentId) return;

    const newValue = !recessNotificationEnabled[studentId];

    const { error } = await supabase
      .from("parent_student_links")
      .update({ notify_on_recess_return: newValue })
      .eq("parent_id", parentId)
      .eq("student_id", studentId);

    if (!error) {
      setRecessNotificationEnabled(prev => ({
        ...prev,
        [studentId]: newValue
      }));
      toast({
        title: newValue ? "Notifications Enabled" : "Notifications Disabled",
        description: newValue 
          ? "You'll be notified when your child returns from recess"
          : "Recess return notifications disabled"
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update notification preference",
        variant: "destructive"
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <Shield className="h-10 w-10 text-primary" />
            Safety & Alerts
          </h1>
          <p className="text-muted-foreground mt-2">
            Stay informed about school safety, emergencies, and important updates
          </p>
        </div>

        {activeDrillStatus.length > 0 && (
          <Card className={`mb-6 p-6 ${
            activeDrillStatus.some((s: any) => s.drill_sessions?.is_real_emergency)
              ? "border-red-600 border-2 bg-red-600/20 animate-pulse"
              : "border-yellow-500 border-2 bg-yellow-500/10"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-yellow-600" />
              <h2 className="text-xl font-bold">
                {activeDrillStatus.some((s: any) => s.drill_sessions?.is_real_emergency)
                  ? "🚨 EMERGENCY IN PROGRESS"
                  : "Active Drill Status"}
              </h2>
            </div>
            <div className="space-y-3">
              {activeDrillStatus.map((status: any) => (
                <div key={status.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {status.student_checked_in ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-orange-600 animate-pulse" />
                    )}
                    <div>
                      <p className="font-semibold">{status.profiles.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {status.drill_sessions.drill_type.replace(/_/g, " ")} 
                        {status.drill_sessions.is_real_emergency && " (REAL EMERGENCY)"}
                      </p>
                    </div>
                  </div>
                  <Badge className={status.student_checked_in ? "bg-green-600" : "bg-orange-600"}>
                    {status.student_checked_in 
                      ? `✓ SAFE (${new Date(status.student_checkin_at).toLocaleTimeString()})`
                      : "Awaiting check-in..."}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {unaccountedChildren.length > 0 && (
          <div className="mb-6 space-y-4">
            {unaccountedChildren.map((child) => (
              <UnaccountedChildAlert
                key={child.id}
                studentName={(child.profiles as any).full_name}
                drillType={(child.drill_sessions as any).drill_type}
                onAcknowledge={() => acknowledgeAlert(child.id)}
              />
            ))}
          </div>
        )}

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">
              <AlertTriangle className="mr-2 h-4 w-4" />
              All Alerts
            </TabsTrigger>
            <TabsTrigger value="weather">
              <CloudRain className="mr-2 h-4 w-4" />
              Weather
            </TabsTrigger>
            <TabsTrigger value="closure">
              <DoorClosed className="mr-2 h-4 w-4" />
              Closures
            </TabsTrigger>
            <TabsTrigger value="drill">
              <Shield className="mr-2 h-4 w-4" />
              Drills
            </TabsTrigger>
            <TabsTrigger value="qr">
              <QrCode className="mr-2 h-4 w-4" />
              Emergency QR
            </TabsTrigger>
            <TabsTrigger value="message">
              <MessageSquare className="mr-2 h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {alerts.length === 0 ? (
              <Card className="p-12 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Alerts</h3>
                <p className="text-muted-foreground">
                  Safety alerts and notifications will appear here
                </p>
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
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{alert.title}</h3>
                        <p className="text-muted-foreground mb-3">{alert.message}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="weather">
            {filterAlertsByType("weather").length === 0 ? (
              <Card className="p-12 text-center">
                <CloudRain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No weather alerts</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filterAlertsByType("weather").map((alert) => (
                  <Card key={alert.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge className={`${getSeverityColor(alert.severity)} mb-2`}>
                          {alert.severity}
                        </Badge>
                        <h3 className="text-xl font-semibold mb-2">{alert.title}</h3>
                        <p className="text-muted-foreground">{alert.message}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => acknowledgeAlert(alert.id)}>
                        Acknowledge
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="closure">
            {filterAlertsByType("closure").length === 0 ? (
              <Card className="p-12 text-center">
                <DoorClosed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No closure alerts</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filterAlertsByType("closure").map((alert) => (
                  <Card key={alert.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge className={`${getSeverityColor(alert.severity)} mb-2`}>
                          {alert.severity}
                        </Badge>
                        <h3 className="text-xl font-semibold mb-2">{alert.title}</h3>
                        <p className="text-muted-foreground">{alert.message}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => acknowledgeAlert(alert.id)}>
                        Acknowledge
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="drill">
            {filterAlertsByType("drill").length === 0 ? (
              <Card className="p-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No drill alerts</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filterAlertsByType("drill").map((alert) => (
                  <Card key={alert.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge className={`${getSeverityColor(alert.severity)} mb-2`}>
                          {alert.severity}
                        </Badge>
                        <h3 className="text-xl font-semibold mb-2">{alert.title}</h3>
                        <p className="text-muted-foreground">{alert.message}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => acknowledgeAlert(alert.id)}>
                        Acknowledge
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="qr">
            {students.length === 0 ? (
              <Card className="p-12 text-center">
                <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Students</h3>
                <p className="text-muted-foreground">
                  You need to have approved student access to view emergency QR codes
                </p>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {students.map((student: any) => (
                  <StudentQRCode
                    key={student.student_id}
                    studentId={student.student_id}
                    studentName={student.profiles.full_name}
                    parentId={parentId!}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="message">
            {students.length > 0 && <ParentQuickMessagePanel students={students} />}
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Settings className="h-6 w-6" />
                Notification Preferences
              </h2>
              <p className="text-muted-foreground mb-6">
                Manage how you receive safety and activity notifications for your children
              </p>

              {students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students linked to your account
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recess Return Notifications</h3>
                    <div className="space-y-4">
                      {students.map((student: any) => (
                        <div key={student.student_id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                          <div className="space-y-1">
                            <Label htmlFor={`recess-${student.student_id}`} className="text-base font-medium">
                              {student.profiles.full_name}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Get notified when your child returns to class from recess
                            </p>
                          </div>
                          <Switch
                            id={`recess-${student.student_id}`}
                            checked={recessNotificationEnabled[student.student_id] || false}
                            onCheckedChange={() => toggleRecessNotification(student.student_id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
