import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface CreateClubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateClubModal = ({ open, onOpenChange, onSuccess }: CreateClubModalProps) => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [scheduleStartDate, setScheduleStartDate] = useState("");
  const [scheduleEndDate, setScheduleEndDate] = useState("");
  const [meetingDays, setMeetingDays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const daysOfWeek = [
    { value: "monday", label: "Mon" },
    { value: "tuesday", label: "Tue" },
    { value: "wednesday", label: "Wed" },
    { value: "thursday", label: "Thu" },
    { value: "friday", label: "Fri" },
    { value: "saturday", label: "Sat" },
    { value: "sunday", label: "Sun" },
  ];

  const toggleMeetingDay = (day: string) => {
    setMeetingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const resetForm = () => {
    setName("");
    setLocation("");
    setStartTime("");
    setEndTime("");
    setScheduleStartDate("");
    setScheduleEndDate("");
    setMeetingDays([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Club name is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("clubs")
        .insert({
          name: name.trim(),
          owner_id: session.user.id,
          location: location.trim() || null,
          meeting_days: meetingDays.length > 0 ? meetingDays : null,
          start_time: startTime || null,
          end_time: endTime || null,
          schedule_start_date: scheduleStartDate || null,
          schedule_end_date: scheduleEndDate || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Club created successfully!",
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create club",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Club</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="clubName">Club Name *</Label>
              <Input
                id="clubName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Chess Club"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="clubLocation">Room/Location (Optional)</Label>
              <Input
                id="clubLocation"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Room 105"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label>Meeting Days (Optional)</Label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={meetingDays.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleMeetingDay(day.value)}
                    disabled={isLoading}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="clubStartTime">Start Time (Optional)</Label>
                <Input
                  id="clubStartTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="clubEndTime">End Time (Optional)</Label>
                <Input
                  id="clubEndTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="clubScheduleStartDate">Start Date (Optional)</Label>
                <Input
                  id="clubScheduleStartDate"
                  type="date"
                  value={scheduleStartDate}
                  onChange={(e) => setScheduleStartDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="clubScheduleEndDate">End Date (Optional)</Label>
                <Input
                  id="clubScheduleEndDate"
                  type="date"
                  value={scheduleEndDate}
                  onChange={(e) => setScheduleEndDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Club
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
