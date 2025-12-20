import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Settings, AlertCircle, CheckCircle, Clock, Phone } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface SMSLog {
  id: string;
  phone_number: string;
  message_type: string;
  message_content: string;
  status: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

interface SMSSettingsProps {
  drillSessionId?: string;
  onSend?: () => void;
}

export function SMSNotificationSettings({ drillSessionId, onSend }: SMSSettingsProps) {
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(true);

  useEffect(() => {
    if (drillSessionId) {
      fetchLogs();
    }
  }, [drillSessionId]);

  const fetchLogs = async () => {
    if (!drillSessionId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sms_notification_logs")
        .select("*")
        .eq("drill_session_id", drillSessionId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching SMS logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async (messageType: "drill_started" | "student_status" | "all_clear" | "emergency") => {
    if (!drillSessionId) {
      toast.error("No active drill session");
      return;
    }

    setSending(true);
    try {
      const response = await supabase.functions.invoke("send-sms-notification", {
        body: {
          drill_session_id: drillSessionId,
          message_type: messageType,
          recipient_type: "all",
          custom_message: messageType === "emergency" ? customMessage : undefined,
        },
      });

      if (response.error) throw response.error;

      const result = response.data;
      if (result.success) {
        toast.success(`Sent ${result.sent} SMS notifications`);
        fetchLogs();
        onSend?.();
      } else {
        toast.warning(result.message || "SMS service not configured");
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast.error("Failed to send SMS notifications");
    } finally {
      setSending(false);
      setCustomMessage("");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">SMS Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Send SMS alerts to parents and emergency contacts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="sms-enabled"
              checked={smsEnabled}
              onCheckedChange={setSmsEnabled}
            />
            <Label htmlFor="sms-enabled">Enabled</Label>
          </div>
        </div>

        {smsEnabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => sendNotification("drill_started")}
                disabled={sending || !drillSessionId}
              >
                <Send className="h-5 w-5" />
                <span className="text-xs">Drill Started</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => sendNotification("student_status")}
                disabled={sending || !drillSessionId}
              >
                <Phone className="h-5 w-5" />
                <span className="text-xs">Status Update</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 border-green-500 text-green-600 hover:bg-green-50"
                onClick={() => sendNotification("all_clear")}
                disabled={sending || !drillSessionId}
              >
                <CheckCircle className="h-5 w-5" />
                <span className="text-xs">All Clear</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 border-red-500 text-red-600 hover:bg-red-50"
                onClick={() => {
                  if (!customMessage.trim()) {
                    toast.error("Please enter a custom message for emergency alerts");
                    return;
                  }
                  sendNotification("emergency");
                }}
                disabled={sending || !drillSessionId}
              >
                <AlertCircle className="h-5 w-5" />
                <span className="text-xs">Emergency</span>
              </Button>
            </div>

            <div>
              <Label>Custom Emergency Message</Label>
              <Textarea
                placeholder="Enter custom message for emergency alerts..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
        )}
      </Card>

      {/* SMS Logs */}
      {drillSessionId && logs.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Recent SMS Activity</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 border rounded-lg"
              >
                {getStatusIcon(log.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{log.phone_number}</span>
                    <Badge variant="secondary" className="text-xs">
                      {log.message_type.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {log.message_content}
                  </p>
                  {log.error_message && (
                    <p className="text-xs text-red-500 mt-1">{log.error_message}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {log.sent_at ? format(new Date(log.sent_at), "h:mm a") : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Configuration Notice */}
      <Card className="p-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
        <div className="flex items-start gap-3">
          <Settings className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              SMS Configuration Required
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              To enable SMS notifications, configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, 
              and TWILIO_PHONE_NUMBER in your backend secrets.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
