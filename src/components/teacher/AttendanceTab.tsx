import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, UserCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useClassroomAttendance, useSaveAttendance } from "@/hooks/useAttendance";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AttendanceTabProps {
  classroomId: string;
  students: Array<{
    student_id: string;
    full_name: string;
    avatar_url?: string;
  }>;
}

export const AttendanceTab = ({ classroomId, students }: AttendanceTabProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateString = format(selectedDate, "yyyy-MM-dd");

  const { data: attendanceRecords, isLoading } = useClassroomAttendance(
    classroomId,
    dateString
  );
  const saveAttendance = useSaveAttendance();

  const getStudentStatus = (studentId: string) => {
    const record = attendanceRecords?.find((r) => r.student_id === studentId);
    return record?.status || null;
  };

  const handleStatusChange = async (
    studentId: string,
    status: "Present" | "Tardy" | "Absent"
  ) => {
    try {
      await saveAttendance.mutateAsync({
        classroomId,
        studentId,
        date: dateString,
        status,
      });
      toast.success("Attendance saved");
    } catch (error) {
      toast.error("Failed to save attendance");
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status)
      return <Badge variant="outline" className="bg-muted">Not Recorded</Badge>;
    if (status === "Present")
      return <Badge className="bg-green-500 hover:bg-green-600">Present</Badge>;
    if (status === "Tardy")
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Tardy</Badge>;
    if (status === "Absent")
      return <Badge variant="destructive">Absent</Badge>;
    return null;
  };

  const stats = {
    present: attendanceRecords?.filter((r) => r.status === "Present").length || 0,
    tardy: attendanceRecords?.filter((r) => r.status === "Tardy").length || 0,
    absent: attendanceRecords?.filter((r) => r.status === "Absent").length || 0,
    notRecorded: students.length - (attendanceRecords?.length || 0),
  };

  return (
    <div className="space-y-6">
      {/* Header with Date Picker and Stats */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium">{stats.present} Present</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span className="text-sm font-medium">{stats.tardy} Tardy</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-sm font-medium">{stats.absent} Absent</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border">
            <div className="w-2 h-2 bg-muted-foreground rounded-full" />
            <span className="text-sm font-medium">{stats.notRecorded} Not Recorded</span>
          </div>
        </div>
      </div>

      {/* Student Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No students in this classroom
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => {
                const status = getStudentStatus(student.student_id);
                return (
                  <div
                    key={student.student_id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={student.avatar_url} />
                        <AvatarFallback>
                          {student.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{student.full_name}</p>
                        {getStatusBadge(status)}
                      </div>
                    </div>

                    <Select
                      value={status || ""}
                      onValueChange={(value) =>
                        handleStatusChange(
                          student.student_id,
                          value as "Present" | "Tardy" | "Absent"
                        )
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Present">Present</SelectItem>
                        <SelectItem value="Tardy">Tardy</SelectItem>
                        <SelectItem value="Absent">Absent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
