import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

interface CreateSafetyAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateSafetyAlertModal({ open, onOpenChange, onSuccess }: CreateSafetyAlertModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    alert_type: "weather" as "weather" | "closing" | "drill" | "emergency" | "early_dismissal",
    severity: "info" as "info" | "warning" | "critical",
    affects_attendance: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase.from("safety_alerts").insert({
        ...formData,
        created_by: session.user.id
      });

      if (error) throw error;

      toast({
        title: "Alert Created",
        description: "Safety alert has been sent to all parents and students"
      });

      setFormData({
        title: "",
        message: "",
        alert_type: "weather",
        severity: "info",
        affects_attendance: false,
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

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Alert"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
