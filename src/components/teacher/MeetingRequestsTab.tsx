import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Clock, Plus, Trash2, Calendar, Loader2, Repeat, Users, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfToday, isBefore } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Office hours are teacher-wide, not classroom-specific
interface MeetingRequestsTabProps {
  classroomId?: string; // Optional - kept for routing but not used in queries
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
  const [isRecurring, setIsRecurring] = useState(true);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [specificDate, setSpecificDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [meetingDuration, setMeetingDuration] = useState("30");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch office hours (teacher-wide, not classroom-specific)
  const { data: allOfficeHours = [], isLoading } = useQuery({
    queryKey: ["office-hours"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("teacher_office_hours")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch upcoming meeting bookings
  const { data: upcomingBookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["teacher-meeting-bookings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const today = format(startOfToday(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("meeting_bookings")
        .select(`
          *,
          parent_accounts (
            full_name,
            email
          ),
          profiles!meeting_bookings_student_id_fkey (
            full_name
          )
        `)
        .eq("teacher_id", user.id)
        .eq("status", "booked")
        .gte("booking_date", today)
        .order("booking_date", { ascending: true })
        .order("start_time", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Filter out office hours that have been booked
  const officeHours = allOfficeHours.filter((hours) => {
    return !upcomingBookings.some(
      (booking: any) =>
        booking.office_hours_id === hours.id &&
        booking.booking_date === hours.specific_date &&
        booking.start_time === hours.start_time
    );
  });
  // Helper to generate time slots
  const generateTimeSlots = (start: string, end: string, durationMinutes: number) => {
    const slots: { start: string; end: string }[] = [];
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    
    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    while (currentMinutes + durationMinutes <= endMinutes) {
      const slotStartHour = Math.floor(currentMinutes / 60);
      const slotStartMin = currentMinutes % 60;
      const slotEndMinutes = currentMinutes + durationMinutes;
      const slotEndHour = Math.floor(slotEndMinutes / 60);
      const slotEndMin = slotEndMinutes % 60;
      
      slots.push({
        start: `${slotStartHour.toString().padStart(2, "0")}:${slotStartMin.toString().padStart(2, "0")}`,
        end: `${slotEndHour.toString().padStart(2, "0")}:${slotEndMin.toString().padStart(2, "0")}`,
      });
      
      currentMinutes += durationMinutes;
    }
    
    return slots;
  };

  // Add office hours mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const durationMinutes = parseInt(meetingDuration);
      const slots = generateTimeSlots(startTime, endTime, durationMinutes);
      
      if (slots.length === 0) {
        throw new Error("Time range is too short for the selected meeting duration");
      }

      const records = slots.map(slot => ({
        teacher_id: user.id,
        is_recurring: isRecurring,
        days_of_week: isRecurring ? selectedDays : [],
        specific_date: isRecurring ? null : specificDate || null,
        start_date: isRecurring ? startDate || null : null,
        end_date: isRecurring ? endDate || null : null,
        start_time: slot.start,
        end_time: slot.end,
        meeting_duration_minutes: durationMinutes,
        location: location || null,
        notes: notes || null,
      }));

      const { error } = await supabase
        .from("teacher_office_hours")
        .insert(records);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office-hours"] });
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
      queryClient.invalidateQueries({ queryKey: ["office-hours"] });
      toast.success("Office hours deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setIsRecurring(true);
    setSelectedDays([]);
    setSpecificDate("");
    setStartDate("");
    setEndDate("");
    setStartTime("09:00");
    setEndTime("10:00");
    setMeetingDuration("30");
    setLocation("");
    setNotes("");
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return format(new Date(dateStr), "MMM d, yyyy");
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
          <h2 className="text-2xl font-bold">Office Hours</h2>
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
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="recurring">Recurring</Label>
                  <p className="text-xs text-muted-foreground">
                    Repeat on selected days each week
                  </p>
                </div>
                <Switch
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
              </div>

              {isRecurring ? (
                <>
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
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="specific-date">Date</Label>
                  <Input
                    id="specific-date"
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                  />
                </div>
              )}

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
                disabled={(isRecurring ? selectedDays.length === 0 : !specificDate) || addMutation.isPending}
              >
                {addMutation.isPending ? "Adding..." : "Add Office Hours"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList>
          <TabsTrigger value="bookings">
            <Users className="h-4 w-4 mr-2" />
            Upcoming Bookings ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="hours">
            <Clock className="h-4 w-4 mr-2" />
            My Office Hours ({officeHours.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-6">
          {loadingBookings ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : upcomingBookings.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No Upcoming Meetings</h3>
              <p className="text-muted-foreground">
                You don't have any scheduled meetings yet. Parents can book meetings during your office hours.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking: any) => (
                <Card key={booking.id} className="shadow-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          {format(new Date(booking.booking_date + 'T00:00:00'), "EEEE, MMMM d, yyyy")}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </div>
                        </CardDescription>
                      </div>
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        Booked
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Booked by:</span>{" "}
                        <span className="font-medium">{booking.parent_accounts?.full_name || "Unknown Parent"}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Student:</span>{" "}
                        <span className="font-medium">{booking.profiles?.full_name || "Unknown Student"}</span>
                      </div>
                      {booking.parent_accounts?.email && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Email:</span>{" "}
                          <span>{booking.parent_accounts.email}</span>
                        </div>
                      )}
                    </div>
                    {booking.meeting_reason && (
                      <div className="p-3 border rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Meeting Purpose:</div>
                        <p className="text-sm">{booking.meeting_reason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hours" className="mt-6">
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
                          {hours.is_recurring ? (
                            <Repeat className="h-5 w-5 text-primary" />
                          ) : (
                            <Calendar className="h-5 w-5 text-primary" />
                          )}
                          {hours.is_recurring 
                            ? formatDays(hours.days_of_week || [])
                            : hours.specific_date ? formatDate(hours.specific_date) : "One-time"
                          }
                        </CardTitle>
                        <CardDescription className="mt-1 space-y-1">
                          <div>{formatTime(hours.start_time)} - {formatTime(hours.end_time)}</div>
                          <div className="text-xs">{hours.meeting_duration_minutes}-minute meetings</div>
                          {hours.is_recurring && hours.start_date && hours.end_date && (
                            <div className="text-xs">
                              {formatDate(hours.start_date)} - {formatDate(hours.end_date)}
                            </div>
                          )}
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
                      <div className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
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
        </TabsContent>
      </Tabs>
    </div>
  );
};
