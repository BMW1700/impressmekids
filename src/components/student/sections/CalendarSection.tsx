import { CalendarWidget } from "@/components/calendar/CalendarWidget";

interface CalendarSectionProps {
  studentId: string;
}

export const CalendarSection = ({ studentId }: CalendarSectionProps) => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
      <CalendarWidget userId={studentId} userRole="student" />
    </div>
  );
};
