import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";

interface ClubCardProps {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  memberCount: number;
  pendingRequestCount?: number;
  meetingDays?: string[] | null;
  startTime?: string | null;
  endTime?: string | null;
  createdAt: string;
  onClick?: () => void;
}

export const ClubCard = ({
  name,
  description,
  location,
  memberCount,
  pendingRequestCount = 0,
  meetingDays,
  startTime,
  endTime,
  createdAt,
  onClick,
}: ClubCardProps) => {
  const formatMeetingDays = (days: string[] | null | undefined) => {
    if (!days || days.length === 0) return null;
    const dayAbbrev: Record<string, string> = {
      monday: "Mon",
      tuesday: "Tue",
      wednesday: "Wed",
      thursday: "Thu",
      friday: "Fri",
      saturday: "Sat",
      sunday: "Sun",
    };
    return days.map(d => dayAbbrev[d] || d).join(", ");
  };

  const formatTime = (time: string | null | undefined) => {
    if (!time) return null;
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg line-clamp-1">{name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Created {format(new Date(createdAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>
          {pendingRequestCount > 0 && (
            <Badge variant="destructive" className="flex-shrink-0">
              {pendingRequestCount} pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{memberCount} member{memberCount !== 1 ? "s" : ""}</span>
          </div>

          {location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
          )}

          {meetingDays && meetingDays.length > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatMeetingDays(meetingDays)}</span>
            </div>
          )}

          {startTime && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {formatTime(startTime)}
                {endTime && ` - ${formatTime(endTime)}`}
              </span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-3">
          <Button variant="gradient" className="w-full shadow-glow-purple group-hover:shadow-glow-purple-lg" onClick={onClick}>
            View Club
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
