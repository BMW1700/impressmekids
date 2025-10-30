import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Settings } from "lucide-react";
import { toast } from "sonner";

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

export default function SchoolSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    school_year_start: "",
    school_year_end: "",
    timezone: "America/New_York",
    school_start_time: "08:00",
    school_end_time: "15:00",
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (userRole?.role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/auth");
    }
  };

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["school-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_settings")
        .select("*")
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !loading,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        school_year_start: settings.school_year_start,
        school_year_end: settings.school_year_end,
        timezone: settings.timezone,
        school_start_time: settings.school_start_time,
        school_end_time: settings.school_end_time,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase
        .from("school_settings")
        .update({
          ...data,
          updated_by: session?.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-settings"] });
      toast.success("School settings updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update settings: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.school_year_start || !formData.school_year_end) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (new Date(formData.school_year_end) <= new Date(formData.school_year_start)) {
      toast.error("School year end date must be after start date");
      return;
    }

    updateMutation.mutate(formData);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showAuthButtons={false} onSignOut={handleSignOut} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">School Settings</h1>
              <p className="text-muted-foreground">Configure school-wide calendar settings</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Calendar Configuration</CardTitle>
              <CardDescription>
                Set the school year dates, timezone, and daily schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="school_year_start">School Year Start Date *</Label>
                    <Input
                      id="school_year_start"
                      type="date"
                      value={formData.school_year_start}
                      onChange={(e) => setFormData({ ...formData, school_year_start: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school_year_end">School Year End Date *</Label>
                    <Input
                      id="school_year_end"
                      type="date"
                      value={formData.school_year_end}
                      onChange={(e) => setFormData({ ...formData, school_year_end: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone *</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Daily Schedule</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="time"
                        value={formData.school_start_time}
                        onChange={(e) => setFormData({ ...formData, school_start_time: e.target.value })}
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={formData.school_end_time}
                        onChange={(e) => setFormData({ ...formData, school_end_time: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/admin")}
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}