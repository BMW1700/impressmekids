import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, MapPin, User, FileText, ExternalLink, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { CalendarItem } from "@/hooks/useCalendarData";
import { getCategoryColor, getCategoryIcon, formatTime, getTypeColor } from "@/lib/calendarUtils";
import { useNavigate } from "react-router-dom";
import { EditEventModal } from "@/components/teacher/EditEventModal";
import { supabase } from "@/integrations/supabase/client";

interface CalendarItemDetailModalProps {
  item: CalendarItem;
  onClose: () => void;
  userRole: "student" | "teacher" | "admin" | "parent";
}

export const CalendarItemDetailModal = ({ item, onClose, userRole }: CalendarItemDetailModalProps) => {
  const navigate = useNavigate();
  const categoryColor = getCategoryColor(item.category);
  const typeColor = getTypeColor(item.type);
  const [showEditModal, setShowEditModal] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [teacherId, setTeacherId] = useState<string>("");

  const handleViewAssignment = () => {
    if (item.type === "assignment") {
      navigate(`/complete-assignment/${item.id}`);
    }
  };

  const handleEdit = async () => {
    if (item.type === "event") {
      // Fetch full event data
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("id", item.id)
        .single();

      if (data) {
        setEventData(data);
        setTeacherId(data.teacher_id);
        setShowEditModal(true);
      }
    } else if (item.type === "assignment") {
      navigate(`/classrooms/${item.classroomId}?tab=assignments&edit=${item.id}`);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <span className="text-3xl">{getCategoryIcon(item.category) || typeColor.icon}</span>
            {item.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={typeColor.bg}>
              {item.type.replace("_", " ")}
            </Badge>
            {item.category && (
              <Badge className={categoryColor.bg}>
                {item.category.replace("_", " ")}
              </Badge>
            )}
            {item.isDraft && userRole === "teacher" && (
              <Badge variant="outline">Draft</Badge>
            )}
            {item.recentlyPosted && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                📌 New
              </Badge>
            )}
            {item.isSubmitted && (
              <Badge variant="secondary">✓ Submitted</Badge>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{item.description}</p>
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date & Time */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Date:</span>
                <span>{format(new Date(item.date), "EEEE, MMMM d, yyyy")}</span>
              </div>
              {item.startTime && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Time:</span>
                  <span>
                    {formatTime(item.startTime)}
                    {item.endTime && ` - ${formatTime(item.endTime)}`}
                  </span>
                </div>
              )}
            </div>

            {/* Location & Teacher */}
            <div className="space-y-2">
              {item.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Location:</span>
                  <span>{item.location}</span>
                </div>
              )}
              {item.teacherName && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Teacher:</span>
                  <span>{item.teacherName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Classroom Info */}
          {item.classroomName && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">📚</span>
                <div>
                  <p className="font-medium">{item.classroomName}</p>
                  {item.teacherName && (
                    <p className="text-sm text-muted-foreground">{item.teacherName}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Attachments */}
          {item.attachments && item.attachments.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Attachments & Links</h4>
              <div className="space-y-2">
                {item.attachments.map((attachment: any, idx: number) => (
                  <a
                    key={idx}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="flex-1">{attachment.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {item.type === "assignment" && !item.isSubmitted && userRole === "student" && (
              <Button onClick={handleViewAssignment} className="w-full" size="lg">
                Start Assignment
              </Button>
            )}
            {item.type === "assignment" && item.isSubmitted && userRole === "student" && (
              <Button onClick={handleViewAssignment} variant="outline" className="w-full" size="lg">
                View Submission
              </Button>
            )}
            {userRole === "teacher" && (item.type === "event" || item.type === "assignment") && (
              <Button onClick={handleEdit} className="w-full gap-2">
                <Edit className="h-4 w-4" />
                Edit {item.type === "event" ? "Event" : "Assignment"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Edit Event Modal */}
      {showEditModal && eventData && (
        <EditEventModal
          open={showEditModal}
          onOpenChange={(open) => {
            setShowEditModal(open);
            if (!open) onClose();
          }}
          event={eventData}
          teacherId={teacherId}
        />
      )}
    </Dialog>
  );
};
