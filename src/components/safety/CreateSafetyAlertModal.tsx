import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Building2 } from "lucide-react";

interface CreateSafetyAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface School {
  id: string;
  name: string;
}

export function CreateSafetyAlertModal({ open, onOpenChange, onSuccess }: CreateSafetyAlertModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingDistrict, setFetchingDistrict] = useState(false);
  const [districtError, setDistrictError] = useState<string | null>(null);
  const [userDistrict, setUserDistrict] = useState<string | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    alert_type: "weather" as "weather" | "closing" | "drill" | "emergency" | "early_dismissal",
    severity: "info" as "info" | "warning" | "critical",
    affects_attendance: false,
    school_id: "" as string, // Empty string means all schools
  });

  // Fetch the user's district and schools on mount
  useEffect(() => {
    const fetchUserDistrictAndSchools = async () => {
      setFetchingDistrict(true);
      setDistrictError(null);
      setUserDistrict(null);
      setSchools([]);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setDistrictError("You must be logged in to create alerts");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("district_id")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setDistrictError("Failed to load your profile. Please try again.");
          return;
        }

        if (!profile?.district_id) {
          setDistrictError("You must be associated with a district to create safety alerts. Please contact your administrator.");
          return;
        }

        setUserDistrict(profile.district_id);

        // Fetch schools in this district
        const { data: schoolsData, error: schoolsError } = await supabase
          .from("schools")
          .select("id, name")
          .eq("district_id", profile.district_id)
          .order("name");

        if (schoolsError) {
          console.error("Error fetching schools:", schoolsError);
          // Non-fatal - can still create district-wide alerts
        } else if (schoolsData) {
          setSchools(schoolsData);
        }
      } catch (err) {
        console.error("Error in fetchUserDistrictAndSchools:", err);
        setDistrictError("An unexpected error occurred. Please try again.");
      } finally {
        setFetchingDistrict(false);
      }
    };
    
    if (open) {
      fetchUserDistrictAndSchools();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      if (!userDistrict) {
        throw new Error("You must be associated with a district to create alerts");
      }

      // Include district_id and optional school_id to scope the alert
      const alertPayload: any = {
        title: formData.title,
        message: formData.message,
        alert_type: formData.alert_type,
        severity: formData.severity,
        affects_attendance: formData.affects_attendance,
        created_by: session.user.id,
        district_id: userDistrict,
      };

      // Only include school_id if a specific school is selected
      if (formData.school_id && formData.school_id !== "all") {
        alertPayload.school_id = formData.school_id;
      }

      const { data: alertData, error } = await supabase
        .from("safety_alerts")
        .insert(alertPayload)
        .select('id')
        .single();

      if (error) throw error;

      // Send emails and push notifications to parents in this district/school
      const { error: sendError, data: sendResult } = await supabase.functions.invoke('send-safety-alert', {
        body: { alertId: alertData.id }
      });

      if (sendError) {
        console.error('Error sending notifications:', sendError);
        toast({
          title: "Alert Created",
          description: "Alert saved but notifications may have failed to send",
          variant: "destructive"
        });
      } else {
        const details = sendResult?.details;
        const scopeMessage = formData.school_id && formData.school_id !== "all"
          ? "selected school"
          : "all schools in your district";
        
        toast({
          title: "Alert Sent Successfully",
          description: `Notified ${details?.parentsNotified || 0} parents in ${scopeMessage} (${details?.emailsSent || 0} emails, ${details?.pushSent || 0} push notifications)`
        });
      }

      setFormData({
        title: "",
        message: "",
        alert_type: "weather",
        severity: "info",
        affects_attendance: false,
        school_id: "",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <AlertTriangle className="h-6 w-6 text-primary" />
            Create Safety Alert
          </DialogTitle>
        </DialogHeader>

        {fetchingDistrict && (
          <div className="bg-muted/50 border rounded-lg p-4 mb-4 flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-muted-foreground text-sm">Loading your district information...</p>
          </div>
        )}

        {districtError && !fetchingDistrict && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
            <p className="text-destructive text-sm">{districtError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* School Scope Selection */}
          {schools.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="school" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Target School
              </Label>
              <Select
                value={formData.school_id || "all"}
                onValueChange={(value) =>
                  setFormData({ ...formData, school_id: value === "all" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select school scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools in District</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose a specific school or send to all schools in your district
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="alert_type">Alert Type</Label>
            <Select
              value={formData.alert_type}
              onValueChange={(value) =>
                setFormData({ ...formData, alert_type: value as typeof formData.alert_type })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weather">Weather</SelectItem>
                <SelectItem value="closing">School Closure</SelectItem>
                <SelectItem value="drill">Drill</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="early_dismissal">Early Dismissal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Severity Level</Label>
            <Select
              value={formData.severity}
              onValueChange={(value) =>
                setFormData({ ...formData, severity: value as typeof formData.severity })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Informational</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Alert Title</Label>
            <Input
              id="title"
              placeholder="e.g., School Closure - Snow Day"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Alert Message</Label>
            <Textarea
              id="message"
              placeholder="Detailed message to parents and students..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={6}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="affects_attendance"
              checked={formData.affects_attendance}
              onChange={(e) => setFormData({ ...formData, affects_attendance: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="affects_attendance" className="font-normal cursor-pointer">
              This alert affects attendance (e.g., school closure, early dismissal)
            </Label>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fetchingDistrict || !userDistrict}>
              {loading ? "Sending..." : fetchingDistrict ? "Loading..." : "Send Alert"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
