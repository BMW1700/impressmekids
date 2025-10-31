import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { GRADES_K12 } from "@/lib/gradeUtils";

interface EditClassroomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  classroom: any;
}

export const EditClassroomModal = ({ open, onOpenChange, onSuccess, classroom }: EditClassroomModalProps) => {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [scheduleStartDate, setScheduleStartDate] = useState("");
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

  useEffect(() => {
    const loadFullClassroomData = async () => {
      if (classroom && open) {
        console.log('Loading classroom data:', classroom);
        
        // Fetch full classroom data to ensure we have all fields
        const { data: fullClassroom, error } = await supabase
          .from('classrooms')
          .select('*')
          .eq('id', classroom.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading full classroom data:', error);
          // Fall back to using the passed classroom data
          setName(classroom.name || "");
          setLocation(classroom.location || "");
          setStartTime(classroom.start_time || "");
          setEndTime(classroom.end_time || "");
          setScheduleStartDate(classroom.schedule_start_date || "");
          setMeetingDays(classroom.meeting_days || []);
        } else if (fullClassroom) {
          console.log('Full classroom data loaded:', fullClassroom);
          setName(fullClassroom.name || "");
          setGrade(fullClassroom.grade?.toString() || "");
          setSubject(fullClassroom.subject || "");
          setLocation(fullClassroom.location || "");
          setStartTime(fullClassroom.start_time || "");
          setEndTime(fullClassroom.end_time || "");
          setScheduleStartDate(fullClassroom.schedule_start_date || "");
          setMeetingDays(fullClassroom.meeting_days || []);
        }
      }
    };

    loadFullClassroomData();
  }, [classroom, open]);

  const toggleMeetingDay = (day: string) => {
    setMeetingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Classroom name is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('classrooms')
        .update({
          name: name.trim(),
          grade: grade ? parseInt(grade) : null,
          subject: subject.trim() || null,
          meeting_days: meetingDays.length > 0 ? meetingDays : null,
          start_time: startTime || null,
          end_time: endTime || null,
          location: location.trim() || null,
          schedule_start_date: scheduleStartDate || null,
        })
        .eq('id', classroom.id)
        .eq('teacher_id', session.user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Classroom updated successfully!",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update classroom",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Classroom</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Classroom Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Math Period 3"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="grade">Grade (Optional)</Label>
              <Select value={grade} onValueChange={setGrade} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES_K12.map((g) => (
                    <SelectItem key={g.value} value={g.value.toString()}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Mathematics"
                disabled={isLoading}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="location">Room/Location (Optional)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Room 203"
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
                <Label htmlFor="startTime">Start Time (Optional)</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time (Optional)</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="scheduleStartDate">Schedule Start Date (Optional)</Label>
              <Input
                id="scheduleStartDate"
                type="date"
                value={scheduleStartDate}
                onChange={(e) => setScheduleStartDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Classroom
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
