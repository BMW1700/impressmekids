import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export const SiteSettingsSection = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("demo_gate_enabled, updated_at")
        .eq("id", 1)
        .maybeSingle();
      if (!error && data) {
        setEnabled(data.demo_gate_enabled);
        setUpdatedAt(data.updated_at);
      }
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("app_settings_admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        (payload: any) => {
          if (payload.new) {
            setEnabled(payload.new.demo_gate_enabled);
            setUpdatedAt(payload.new.updated_at);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleToggle = async (next: boolean) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("app_settings")
      .update({ demo_gate_enabled: next, updated_by: user?.id })
      .eq("id", 1);
    setSaving(false);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    setEnabled(next);
    toast({
      title: next ? "Private Preview enabled" : "Site is now public",
      description: next
        ? "Visitors must enter the access code to enter the app."
        : "All visitors can access the app without a code.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>
        <p className="text-muted-foreground mt-1">Owner-only global controls.</p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {enabled ? (
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-destructive" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldOff className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                <CardTitle>Private Preview Gate</CardTitle>
                <CardDescription>
                  Controls whether visitors must enter an access code before using the app.
                </CardDescription>
              </div>
            </div>
            <Badge variant={enabled ? "destructive" : "default"}>
              {enabled ? "LOCKED" : "PUBLIC"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="gate-toggle" className="text-base">
                Show "Private Preview" access code screen to all visitors
              </Label>
              <p className="text-sm text-muted-foreground">
                When ON, everyone (except those who already entered the code on this device) sees the lock screen.
                When OFF, the app is wide open to anyone.
              </p>
            </div>
            <Switch
              id="gate-toggle"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={saving}
            />
          </div>

          {updatedAt && (
            <p className="text-xs text-muted-foreground">
              Last changed {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
            </p>
          )}

          <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">⚡ Realtime</p>
            Changes propagate to every open browser within ~1 second. No redeploy needed.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
