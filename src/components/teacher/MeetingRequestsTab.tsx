import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, Trash2, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface MeetingRequestsTabProps {
  classroomId: string;
}

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
];

const MEETING_DURATIONS = [
  { value: "15", label: "15 minutes" },
  { value: "20", label: "20 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
];

export const MeetingRequestsTab = ({ classroomId }: MeetingRequestsTabProps) => {
  const queryClient = useQueryClient();
  const [showAddHours, setShowAddHours] = useState(false);
  
  // Form state
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [meetingDuration, setMeetingDuration] = useState("30");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch office hours
  const { data: officeHours = [], isLoading } = useQuery({
    queryKey: ["office-hours", classroomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_office_hours")
        .select("*")
        .eq("classroom_id", classroomId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Add office hours mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("teacher_office_hours")
        .insert({
          classroom_id: classroomId,
          teacher_id: user.id,
          days_of_week: selectedDays,
          start_time: startTime,
          end_time: endTime,
          meeting_duration_minutes: parseInt(meetingDuration),
          location: location || null,
          notes: notes || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office-hours", classroomId] });
      toast.success("Office hours added successfully");
      resetForm();
      setShowAddHours(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete office hours mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("teacher_office_hours")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office-hours", classroomId] });
      toast.success("Office hours deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setSelectedDays([]);
    setStartTime("09:00");
    setEndTime("10:00");
    setMeetingDuration("30");
    setLocation("");
    setNotes("");
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDays = (days: string[]) => {
    return days.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(", ");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Meeting Requests</h2>
          <p className="text-muted-foreground mt-1">
            Set your office hours and availability for parent/student meetings
          </p>
        </div>
        <Dialog open={showAddHours} onOpenChange={setShowAddHours}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Add Office Hours
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Office Hours</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Days of the Week</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={selectedDays.includes(day.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDayToggle(day.value)}
                    >
                      {day.label.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-duration">Meeting Duration</Label>
                <Select value={meetingDuration} onValueChange={setMeetingDuration}>
                  <SelectTrigger id="meeting-duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEETING_DURATIONS.map(duration => (
                      <SelectItem key={duration.value} value={duration.value}>
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Your availability will be divided into {meetingDuration}-minute slots
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  placeholder="e.g., Room 204, Virtual Meeting Link"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information for meetings..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={() => addMutation.mutate()}
                disabled={selectedDays.length === 0 || addMutation.isPending}
              >
                {addMutation.isPending ? "Adding..." : "Add Office Hours"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {officeHours.length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">No Office Hours Set</h3>
          <p className="text-muted-foreground mb-4">
            Add your availability so parents and students can schedule meetings with you
          </p>
          <Button 
            className="bg-gradient-primary hover:opacity-90"
            onClick={() => setShowAddHours(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Office Hours
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {officeHours.map((hours) => (
            <Card key={hours.id} className="shadow-card hover:shadow-elegant transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {formatDays(hours.days_of_week || [])}
                    </CardTitle>
                    <CardDescription className="mt-1 space-y-1">
                      <div>{formatTime(hours.start_time)} - {formatTime(hours.end_time)}</div>
                      <div className="text-xs">{hours.meeting_duration_minutes}-minute meetings</div>
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(hours.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {hours.location && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Location:</span>{" "}
                    <span className="font-medium">{hours.location}</span>
                  </div>
                )}
                {hours.notes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Notes:</span>{" "}
                    <span>{hours.notes}</span>
                  </div>
                )}
                <Badge variant="secondary" className="mt-2">
                  <Clock className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
