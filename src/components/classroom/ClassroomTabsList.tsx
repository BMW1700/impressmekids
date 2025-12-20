import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useClassroomFeatures } from "@/hooks/useClassroomFeatures";
import { useTeacherTabOrder } from "@/hooks/useTeacherTabOrder";
import { liquidGlassTabClass } from "@/components/ui/liquid-glass-button";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  FileText,
  UserCheck,
  Users,
  Shield,
  Trophy,
  Grid3X3,
  Megaphone,
  MessageSquare,
  BarChart3,
  UserPlus,
  BookOpen,
  Play,
  BookHeart,
  GripVertical,
} from "lucide-react";
import { useMemo } from "react";

interface ClassroomTabsListProps {
  classroomId: string;
  isTeacher: boolean;
  parentRequests: any[];
}

// Tab configuration with icons and labels
const TAB_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string; isToolkit?: boolean }
> = {
  syllabus: { icon: FileText, label: "Syllabus" },
  attendance: { icon: UserCheck, label: "Attendance" },
  students: { icon: Users, label: "Students" },
  safety: { icon: Shield, label: "Safety" },
  "parent-requests": { icon: UserPlus, label: "Parent Requests" },
  announcements: { icon: Megaphone, label: "Announcements" },
  assignments: { icon: FileText, label: "Assignments" },
  discussions: { icon: MessageSquare, label: "Discussions" },
  study: { icon: BookOpen, label: "Study Materials" },
  tournaments: { icon: Play, label: "Study Games" },
  leaderboard: { icon: Trophy, label: "Leaderboard", isToolkit: true },
  rubrics: { icon: Grid3X3, label: "Rubrics", isToolkit: true },
  "ai-insights": { icon: BarChart3, label: "AI Insights", isToolkit: true },
  behavior: { icon: Trophy, label: "Behavior", isToolkit: true },
  journal: { icon: BookHeart, label: "Journal", isToolkit: true },
  trends: { icon: BarChart3, label: "Trends" },
};

export const ClassroomTabsList = ({
  classroomId,
  isTeacher,
  parentRequests,
}: ClassroomTabsListProps) => {
  const { isFeatureEnabled } = useClassroomFeatures(classroomId);
  const { reorderTabs, getOrderedTabs } = useTeacherTabOrder(classroomId);

  const triggerClass = liquidGlassTabClass;

  // Get visible tabs for teacher
  const visibleTeacherTabs = useMemo(() => {
    const defaultTabs = [
      "syllabus",
      "attendance",
      "students",
      "safety",
      "parent-requests",
      "announcements",
      "assignments",
      "discussions",
      "study",
      "tournaments",
    ];
    const toolkitTabs = ["leaderboard", "rubrics", "ai-insights", "behavior", "journal"].filter(
      (id) => isFeatureEnabled(id)
    );
    return [...defaultTabs, ...toolkitTabs];
  }, [isFeatureEnabled]);

  // Get ordered tabs
  const orderedTeacherTabs = useMemo(
    () => getOrderedTabs(visibleTeacherTabs),
    [visibleTeacherTabs, getOrderedTabs]
  );

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderTabs(result.source.index, result.destination.index);
  };

  const pendingRequests = parentRequests.filter((r) => r.status === "pending").length;

  // Render a single tab trigger
  const renderTabTrigger = (tabId: string, isDragging?: boolean) => {
    const config = TAB_CONFIG[tabId];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <TabsTrigger
        value={tabId}
        className={cn(
          triggerClass,
          isDragging && "shadow-2xl ring-2 ring-primary/50",
          tabId === "parent-requests" && "relative"
        )}
      >
        <Icon className="mr-2 h-4 w-4" />
        {config.label}
        {tabId === "parent-requests" && pendingRequests > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
          >
            {pendingRequests}
          </Badge>
        )}
      </TabsTrigger>
    );
  };

  // Student tabs (not draggable)
  if (!isTeacher) {
    return (
      <TabsList className="grid w-full h-auto p-2 bg-muted/50 rounded-xl gap-2 grid-cols-3 sm:grid-cols-4">
        <TabsTrigger value="syllabus" className={triggerClass}>
          <FileText className="mr-2 h-4 w-4" />
          Syllabus
        </TabsTrigger>
        <TabsTrigger value="assignments" className={triggerClass}>
          <FileText className="mr-2 h-4 w-4" />
          Assignments
        </TabsTrigger>
        <TabsTrigger value="announcements" className={triggerClass}>
          <Megaphone className="mr-2 h-4 w-4" />
          Announcements
        </TabsTrigger>
        <TabsTrigger value="study" className={triggerClass}>
          <BookOpen className="mr-2 h-4 w-4" />
          Study Materials
        </TabsTrigger>
        <TabsTrigger value="tournaments" className={triggerClass}>
          <Trophy className="mr-2 h-4 w-4" />
          Study Games
        </TabsTrigger>
        <TabsTrigger value="trends" className={triggerClass}>
          <BarChart3 className="mr-2 h-4 w-4" />
          Trends
        </TabsTrigger>
        <TabsTrigger value="discussions" className={triggerClass}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Discussions
        </TabsTrigger>
      </TabsList>
    );
  }

  // Teacher tabs with drag and drop
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="teacher-tabs" direction="horizontal">
        {(provided) => (
          <TabsList
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-wrap w-full h-auto p-2 bg-muted/50 rounded-xl gap-2"
          >
            {orderedTeacherTabs.map((tabId, index) => (
              <Draggable key={tabId} draggableId={tabId} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                      "touch-none",
                      snapshot.isDragging && "z-50"
                    )}
                  >
                    {renderTabTrigger(tabId, snapshot.isDragging)}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </TabsList>
        )}
      </Droppable>
    </DragDropContext>
  );
};
