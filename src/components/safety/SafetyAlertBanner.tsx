import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

export function SafetyAlertBanner() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  useEffect(() => {
    fetchCriticalAlerts();
    subscribeToAlerts();

    const dismissed = localStorage.getItem("dismissedSafetyAlerts");
    if (dismissed) {
      setDismissedAlerts(JSON.parse(dismissed));
    }
  }, []);

  const fetchCriticalAlerts = async () => {
    const { data } = await supabase
      .from("safety_alerts")
      .select("*")
      .in("severity", ["critical", "high"])
      .order("created_at", { ascending: false })
      .limit(3);

    if (data) {
      setAlerts(data);
    }
  };

  const subscribeToAlerts = () => {
    const channel = supabase
      .channel("critical-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "safety_alerts"
        },
        (payload) => {
          const newAlert = payload.new as any;
          if (newAlert.severity === "critical" || newAlert.severity === "high") {
            setAlerts((prev) => [newAlert, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const dismissAlert = (alertId: string) => {
    const newDismissed = [...dismissedAlerts, alertId];
    setDismissedAlerts(newDismissed);
    localStorage.setItem("dismissedSafetyAlerts", JSON.stringify(newDismissed));
  };

  const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.includes(alert.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {visibleAlerts.map((alert) => (
        <Card
          key={alert.id}
          className={`p-4 border-2 ${
            alert.severity === "critical"
              ? "border-red-500 bg-red-500/10"
              : "border-orange-500 bg-orange-500/10"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`h-6 w-6 flex-shrink-0 ${
                alert.severity === "critical" ? "text-red-500" : "text-orange-500"
              }`}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{alert.title}</h3>
              <p className="text-sm text-muted-foreground">{alert.message}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissAlert(alert.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
