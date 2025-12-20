import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isAfter, isBefore, parse, startOfToday, isSameDay } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, MapPin, Check, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RequestMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  classroomName: string;
}

interface TimeSlot {
  officeHoursId: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string | null;
  notes: string | null;
  isBooked: boolean;
}

const DAYS_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export const RequestMeetingDialog = ({
  open,
  onOpenChange,
  teacherId,
  teacherName,
  studentId,
  studentName,
  classroomName,
}: RequestMeetingDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [meetingReason, setMeetingReason] = useState("");

  // Fetch teacher's office hours
  const { data: officeHours = [], isLoading: loadingHours } = useQuery({
    queryKey: ["teacher-office-hours", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_office_hours")
        .select("*")
        .eq("teacher_id", teacherId);

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!teacherId,
  });

  // Fetch existing bookings for this teacher
  const { data: existingBookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["teacher-bookings", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_bookings")
        .select("*")
        .eq("teacher_id", teacherId)
        .eq("status", "booked")
        .gte("booking_date", format(startOfToday(), "yyyy-MM-dd"));

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!teacherId,
  });

  // Generate available time slots for the next 14 days
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const today = startOfToday();
    const twoWeeksLater = addDays(today, 14);

    officeHours.forEach((hours) => {
      if (hours.is_recurring) {
        // Handle recurring office hours
        const daysOfWeek = hours.days_of_week || [];
        let currentDate = today;

        while (isBefore(currentDate, twoWeeksLater) || isSameDay(currentDate, twoWeeksLater)) {
          const dayName = format(currentDate, "EEEE").toLowerCase();
          
          if (daysOfWeek.includes(dayName)) {
            // Check if within date range (if specified)
            const startDate = hours.start_date ? new Date(hours.start_date) : null;
            const endDate = hours.end_date ? new Date(hours.end_date) : null;
            
            const withinRange = 
              (!startDate || !isBefore(currentDate, startDate)) &&
              (!endDate || !isAfter(currentDate, endDate));

            if (withinRange) {
              slots.push({
                officeHoursId: hours.id,
                date: new Date(currentDate),
                startTime: hours.start_time,
                endTime: hours.end_time,
                location: hours.location,
                notes: hours.notes,
                isBooked: false,
              });
            }
          }
          currentDate = addDays(currentDate, 1);
        }
      } else if (hours.specific_date) {
        // Handle specific date office hours
        const specificDate = new Date(hours.specific_date);
        
        if (!isBefore(specificDate, today) && !isAfter(specificDate, twoWeeksLater)) {
          slots.push({
            officeHoursId: hours.id,
            date: specificDate,
            startTime: hours.start_time,
            endTime: hours.end_time,
            location: hours.location,
            notes: hours.notes,
            isBooked: false,
          });
        }
      }
    });

    // Mark booked slots
    slots.forEach((slot) => {
      const isBooked = existingBookings.some(
        (booking) =>
          booking.office_hours_id === slot.officeHoursId &&
          booking.booking_date === format(slot.date, "yyyy-MM-dd") &&
          booking.start_time === slot.startTime
      );
      slot.isBooked = isBooked;
    });

    // Sort by date and time
    return slots.sort((a, b) => {
      const dateCompare = a.date.getTime() - b.date.getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  };

  const timeSlots = generateTimeSlots();

  // Book meeting mutation
  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSlot) throw new Error("No slot selected");

      // Get parent account
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: parentAccount, error: parentError } = await supabase
        .from("parent_accounts")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (parentError) throw parentError;

      const bookingDate = format(selectedSlot.date, "yyyy-MM-dd");

      // Create parent event first
      const { data: parentEvent, error: eventError } = await supabase
        .from("parent_student_events")
        .insert({
          parent_id: parentAccount.id,
          student_id: studentId,
          title: `Meeting with ${teacherName}`,
          description: meetingReason || `Meeting about ${studentName} in ${classroomName}`,
          event_date: bookingDate,
          start_time: selectedSlot.startTime,
          end_time: selectedSlot.endTime,
          location: selectedSlot.location,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create the booking
      const { error: bookingError } = await supabase
        .from("meeting_bookings")
        .insert({
          office_hours_id: selectedSlot.officeHoursId,
          parent_id: parentAccount.id,
          student_id: studentId,
          teacher_id: teacherId,
          booking_date: bookingDate,
          start_time: selectedSlot.startTime,
          end_time: selectedSlot.endTime,
          meeting_reason: meetingReason || null,
          parent_event_id: parentEvent.id,
        });

      if (bookingError) {
        // Rollback the event if booking fails
        await supabase.from("parent_student_events").delete().eq("id", parentEvent.id);
        throw bookingError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-bookings", teacherId] });
      queryClient.invalidateQueries({ queryKey: ["parent-calendar"] });
      toast.success("Meeting booked successfully!");
      setSelectedSlot(null);
      setMeetingReason("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isLoading = loadingHours || loadingBookings;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Request Meeting with {teacherName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : timeSlots.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Available Office Hours</h3>
            <p className="text-muted-foreground">
              This teacher hasn't set up any office hours yet. Please try again later.
            </p>
          </div>
        ) : selectedSlot ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {format(selectedSlot.date, "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>
                  {formatTimeDisplay(selectedSlot.startTime)} - {formatTimeDisplay(selectedSlot.endTime)}
                </span>
              </div>
              {selectedSlot.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{selectedSlot.location}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-reason">What is this meeting about?</Label>
              <Textarea
                id="meeting-reason"
                placeholder="Describe the purpose of this meeting..."
                value={meetingReason}
                onChange={(e) => setMeetingReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedSlot(null)}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={() => bookMutation.mutate()}
                disabled={bookMutation.isPending}
              >
                {bookMutation.isPending ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {timeSlots.map((slot, index) => (
                <div
                  key={`${slot.officeHoursId}-${format(slot.date, "yyyy-MM-dd")}-${slot.startTime}-${index}`}
                  className={`p-4 border rounded-lg ${
                    slot.isBooked
                      ? "bg-muted/30 border-muted"
                      : "hover:border-primary hover:bg-primary/5 cursor-pointer"
                  }`}
                  onClick={() => !slot.isBooked && setSelectedSlot(slot)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(slot.date, "EEE, MMM d")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                        </span>
                      </div>
                      {slot.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{slot.location}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      {slot.isBooked ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <X className="h-3 w-3" />
                          Unavailable
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline">
                          Book This Time
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
