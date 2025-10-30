import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Bell, Mail, Loader2 } from "lucide-react";

interface NotificationPreferences {
  notify_assignments: boolean;
  notify_tests: boolean;
  notify_events: boolean;
  notification_days_before: number;
  email_enabled: boolean;
  in_app_enabled: boolean;
}

export default function NotificationSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notify_assignments: true,
    notify_tests: true,
    notify_events: true,
    notification_days_before: 1,
    email_enabled: true,
    in_app_enabled: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get parent account
      const { data: parentData } = await supabase.rpc("get_parent_account", {
        _user_id: session.user.id,
      });

      if (!parentData || parentData.length === 0) {
        toast.error("Parent account not found");
        navigate("/");
        return;
      }

      const currentParentId = parentData[0].id;
      setParentId(currentParentId);

      // Load existing preferences
      const { data: prefsData, error } = await supabase
        .from("parent_notification_preferences")
        .select("*")
        .eq("parent_id", currentParentId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (prefsData) {
        setPreferences({
          notify_assignments: prefsData.notify_assignments,
          notify_tests: prefsData.notify_tests,
          notify_events: prefsData.notify_events,
          notification_days_before: prefsData.notification_days_before,
          email_enabled: prefsData.email_enabled,
          in_app_enabled: prefsData.in_app_enabled,
        });
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
      toast.error("Failed to load notification preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!parentId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("parent_notification_preferences")
        .upsert({
          parent_id: parentId,
          ...preferences,
        });

      if (error) throw error;

      toast.success("Notification preferences saved successfully");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save notification preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onSignOut={() => navigate("/auth")} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onSignOut={() => navigate("/auth")} />
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Configure how and when you receive notifications about your child's activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Notification Types */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">What to Notify About</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-assignments">Assignments</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about upcoming assignments and homework
                  </p>
                </div>
                <Switch
                  id="notify-assignments"
                  checked={preferences.notify_assignments}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, notify_assignments: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-tests">Tests & Quizzes</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about upcoming tests and quizzes
                  </p>
                </div>
                <Switch
                  id="notify-tests"
                  checked={preferences.notify_tests}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, notify_tests: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-events">Events & Field Trips</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about field trips, guest speakers, and special events
                  </p>
                </div>
                <Switch
                  id="notify-events"
                  checked={preferences.notify_events}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, notify_events: checked })
                  }
                />
              </div>
            </div>

            {/* Notification Timing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">When to Notify</h3>
              
              <div className="space-y-2">
                <Label htmlFor="days-before">Notify me this many days before:</Label>
                <Select
                  value={preferences.notification_days_before.toString()}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, notification_days_before: parseInt(value) })
                  }
                >
                  <SelectTrigger id="days-before">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">On the day</SelectItem>
                    <SelectItem value="1">1 day before</SelectItem>
                    <SelectItem value="2">2 days before</SelectItem>
                    <SelectItem value="3">3 days before</SelectItem>
                    <SelectItem value="5">5 days before</SelectItem>
                    <SelectItem value="7">1 week before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notification Channels */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">How to Notify</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.email_enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, email_enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="inapp-notifications">In-App Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      See notifications when you log in to the platform
                    </p>
                  </div>
                </div>
                <Switch
                  id="inapp-notifications"
                  checked={preferences.in_app_enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, in_app_enabled: checked })
                  }
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
