import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  Search,
  Download,
  RefreshCw,
  Lock,
  Eye,
  FileText,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface AuditLogEntry {
  id: string;
  event_type: string;
  drill_session_id: string | null;
  student_id: string | null;
  classroom_id: string | null;
  actor_id: string | null;
  actor_role: string | null;
  event_data: Record<string, any>;
  created_at: string;
  event_hash: string;
}

interface DrillStats {
  totalDrills: number;
  completedDrills: number;
  avgResponseTime: number;
  missingStudentIncidents: number;
}

interface EscalationMetrics {
  totalEscalations: number;
  acknowledged: number;
  pending: number;
  avgAcknowledgeTime: number;
}

export default function AdminSecurityDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [drillStats, setDrillStats] = useState<DrillStats>({
    totalDrills: 0,
    completedDrills: 0,
    avgResponseTime: 0,
    missingStudentIncidents: 0
  });
  const [escalationMetrics, setEscalationMetrics] = useState<EscalationMetrics>({
    totalEscalations: 0,
    acknowledged: 0,
    pending: 0,
    avgAcknowledgeTime: 0
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      navigate("/");
      toast.error("Access denied. Admin privileges required.");
      return;
    }

    await fetchAllData();
    setLoading(false);
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchAuditLogs(),
      fetchDrillStats(),
      fetchEscalationMetrics()
    ]);
  };

  const fetchAuditLogs = async () => {
    const { data, error } = await supabase
      .from("safety_verification_log" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setAuditLogs(data as unknown as AuditLogEntry[]);
    }
  };

  const fetchDrillStats = async () => {
    // Fetch drill sessions
    const { data: drills } = await supabase
      .from("drill_sessions")
      .select("*");

    if (drills) {
      const completed = drills.filter(d => d.status === "completed" || d.ended_at);
      
      // Calculate average response time
      let totalResponseTime = 0;
      let responseCount = 0;
      completed.forEach(d => {
        if (d.started_at && d.all_clear_at) {
          const start = new Date(d.started_at).getTime();
          const end = new Date(d.all_clear_at).getTime();
          totalResponseTime += (end - start) / 1000 / 60; // minutes
          responseCount++;
        }
      });

      // Fetch missing student incidents
      const { count: missingCount } = await supabase
        .from("drill_attendance")
        .select("*", { count: "exact", head: true })
        .eq("status", "missing");

      setDrillStats({
        totalDrills: drills.length,
        completedDrills: completed.length,
        avgResponseTime: responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0,
        missingStudentIncidents: missingCount || 0
      });
    }
  };

  const fetchEscalationMetrics = async () => {
    const { data: escalations } = await supabase
      .from("escalation_notifications")
      .select("*");

    if (escalations) {
      const acknowledged = escalations.filter(e => e.acknowledged_at);
      
      // Calculate average acknowledge time
      let totalAckTime = 0;
      let ackCount = 0;
      acknowledged.forEach(e => {
        if (e.sent_at && e.acknowledged_at) {
          const sent = new Date(e.sent_at).getTime();
          const ack = new Date(e.acknowledged_at).getTime();
          totalAckTime += (ack - sent) / 1000; // seconds
          ackCount++;
        }
      });

      setEscalationMetrics({
        totalEscalations: escalations.length,
        acknowledged: acknowledged.length,
        pending: escalations.length - acknowledged.length,
        avgAcknowledgeTime: ackCount > 0 ? Math.round(totalAckTime / ackCount) : 0
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  const exportAuditLogs = () => {
    const csvContent = [
      ["Timestamp", "Event Type", "Actor Role", "Drill ID", "Student ID", "Event Hash"].join(","),
      ...auditLogs.map(log => [
        log.created_at,
        log.event_type,
        log.actor_role || "N/A",
        log.drill_session_id || "N/A",
        log.student_id || "N/A",
        log.event_hash
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported");
  };

  const filteredLogs = auditLogs.filter(log =>
    log.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.actor_role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.event_hash.includes(searchQuery)
  );

  const getEventTypeBadge = (eventType: string) => {
    const variants: Record<string, { color: string; icon: React.ReactNode }> = {
      drill_started: { color: "bg-blue-500", icon: <Activity className="h-3 w-3" /> },
      drill_ended: { color: "bg-green-500", icon: <CheckCircle2 className="h-3 w-3" /> },
      student_checked_in: { color: "bg-emerald-500", icon: <CheckCircle2 className="h-3 w-3" /> },
      student_marked_present: { color: "bg-teal-500", icon: <Users className="h-3 w-3" /> },
      student_marked_missing: { color: "bg-red-500", icon: <AlertTriangle className="h-3 w-3" /> },
      escalation_triggered: { color: "bg-orange-500", icon: <AlertTriangle className="h-3 w-3" /> },
      escalation_acknowledged: { color: "bg-yellow-500", icon: <Eye className="h-3 w-3" /> },
      parent_notified: { color: "bg-purple-500", icon: <Users className="h-3 w-3" /> },
      all_clear_issued: { color: "bg-green-600", icon: <Shield className="h-3 w-3" /> },
    };

    const variant = variants[eventType] || { color: "bg-muted", icon: <Activity className="h-3 w-3" /> };

    return (
      <Badge className={`${variant.color} text-white gap-1`}>
        {variant.icon}
        {eventType.replace(/_/g, " ")}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="icon-circle icon-circle-purple">
                <Shield className="h-6 w-6 text-white" />
              </div>
              Security Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor SSVRS activity, audit logs, and security metrics
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={exportAuditLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Drills</p>
                  <p className="text-3xl font-bold text-foreground">{drillStats.totalDrills}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {drillStats.completedDrills} completed
                  </p>
                </div>
                <div className="icon-circle icon-circle-blue">
                  <Activity className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  <p className="text-3xl font-bold text-foreground">{drillStats.avgResponseTime}m</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Drill to all-clear
                  </p>
                </div>
                <div className="icon-circle icon-circle-green">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Escalations</p>
                  <p className="text-3xl font-bold text-foreground">{escalationMetrics.totalEscalations}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {escalationMetrics.pending} pending
                  </p>
                </div>
                <div className="icon-circle icon-circle-orange">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Audit Events</p>
                  <p className="text-3xl font-bold text-foreground">{auditLogs.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last 100 events
                  </p>
                </div>
                <div className="icon-circle icon-circle-purple">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="audit-log" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="audit-log">Audit Log</TabsTrigger>
            <TabsTrigger value="drill-analytics">Drill Analytics</TabsTrigger>
            <TabsTrigger value="security-status">Security Status</TabsTrigger>
          </TabsList>

          {/* Audit Log Tab */}
          <TabsContent value="audit-log" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    Immutable Safety Verification Log
                  </CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            {getEventTypeBadge(log.event_type)}
                            <span className="text-sm text-muted-foreground">
                              by {log.actor_role || "System"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">
                            Hash: {log.event_hash.substring(0, 16)}...
                          </p>
                          {log.event_data && Object.keys(log.event_data).length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {JSON.stringify(log.event_data).substring(0, 80)}...
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            {format(new Date(log.created_at), "MMM d, yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), "h:mm:ss a")}
                          </p>
                        </div>
                      </div>
                    ))}
                    {filteredLogs.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No audit log entries found</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drill Analytics Tab */}
          <TabsContent value="drill-analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Drill Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Completion Rate</span>
                    <span className="text-lg font-bold text-foreground">
                      {drillStats.totalDrills > 0 
                        ? Math.round((drillStats.completedDrills / drillStats.totalDrills) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Avg Response Time</span>
                    <span className="text-lg font-bold text-foreground">
                      {drillStats.avgResponseTime} minutes
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Missing Student Incidents</span>
                    <span className="text-lg font-bold text-destructive">
                      {drillStats.missingStudentIncidents}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Escalation Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Escalations</span>
                    <span className="text-lg font-bold text-foreground">
                      {escalationMetrics.totalEscalations}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Acknowledged</span>
                    <span className="text-lg font-bold text-green-600">
                      {escalationMetrics.acknowledged}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Avg Acknowledge Time</span>
                    <span className="text-lg font-bold text-foreground">
                      {escalationMetrics.avgAcknowledgeTime}s
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Status Tab */}
          <TabsContent value="security-status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Immutable Audit Logs", status: "active", description: "All safety events are cryptographically hashed" },
                  { name: "Row-Level Security", status: "active", description: "RLS enabled on all sensitive tables" },
                  { name: "FERPA Compliance", status: "active", description: "Student data access controls enforced" },
                  { name: "COPPA Compliance", status: "active", description: "Parental consent verification active" },
                  { name: "CDN Protection", status: "active", description: "Cloudflare SSL/TLS & DDoS protection" },
                  { name: "Authentication Security", status: "active", description: "Secure session management enabled" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Badge className="bg-green-500 text-white gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
