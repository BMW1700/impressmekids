import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useClassroomFeatures } from "@/hooks/useClassroomFeatures";
import { liquidGlassTabClass } from "@/components/ui/liquid-glass-button";
import { useTabOrder } from "@/hooks/useTabOrder";
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
} from "lucide-react";

interface ClassroomTabsListProps {
  classroomId: string;
  isTeacher: boolean;
  parentRequests: any[];
}

// Tab configuration with icons and labels
const TAB_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; label: string; isToolkit?: boolean }
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
};

// Student tabs - fixed order
const STUDENT_TABS = [
  "syllabus",
  "assignments",
  "announcements",
  "study",
  "tournaments",
  "trends",
  "discussions",
];

export const ClassroomTabsList = ({
  classroomId,
  isTeacher,
  parentRequests,
}: ClassroomTabsListProps) => {
  const { isFeatureEnabled } = useClassroomFeatures(classroomId);
  const {
    orderedTabs,
    isOrganizing,
    setIsOrganizing,
    reorderTabs,
    saveTabOrder,
    cancelOrganizing,
    isSaving,
  } = useTabOrder(classroomId);

  const triggerClass = liquidGlassTabClass;

  // Filter tabs based on enabled features (for teacher)
  const getVisibleTeacherTabs = () => {
    return orderedTabs.filter((tabId) => {
      const config = TAB_CONFIG[tabId];
      if (!config) return false;
      if (config.isToolkit) {
        return isFeatureEnabled(tabId);
      }
      return true;
    });
  };

  const visibleTabs = isTeacher ? getVisibleTeacherTabs() : STUDENT_TABS;
  const pendingCount = parentRequests.filter((r) => r.status === "pending").length;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(orderedTabs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    reorderTabs(items);
  };

  const renderTabContent = (tabId: string) => {
    const config = TAB_CONFIG[tabId];
    if (!config) {
      if (tabId === "trends") {
        return (
          <>
            <BarChart3 className="mr-2 h-4 w-4" />
            Trends
          </>
        );
      }
      return null;
    }

    const Icon = config.icon;
    const isParentRequests = tabId === "parent-requests";

    return (
      <>
        <Icon className="mr-2 h-4 w-4" />
        {config.label}
        {isParentRequests && pendingCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
          >
            {pendingCount}
          </Badge>
        )}
      </>
    );
  };

  const renderTabTrigger = (
    tabId: string,
    index: number,
    isDraggable: boolean
  ) => {
    const config = TAB_CONFIG[tabId];
    if (!config && tabId !== "trends") return null;

    if (isDraggable && isOrganizing) {
      return (
        <Draggable key={tabId} draggableId={tabId} index={index}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={provided.draggableProps.style}
              className={cn(
                "transition-transform duration-200 ease-out",
                snapshot.isDragging && "z-50 scale-105 shadow-lg"
              )}
            >
              <TabsTrigger
                value={tabId}
                className={cn("relative cursor-grab", triggerClass)}
                disabled
              >
                {renderTabContent(tabId)}
              </TabsTrigger>
            </div>
          )}
        </Draggable>
      );
    }

    return (
      <TabsTrigger
        key={tabId}
        value={tabId}
        className={cn("relative", triggerClass)}
      >
        {renderTabContent(tabId)}
      </TabsTrigger>
    );
  };

  const renderClone = (provided: any, snapshot: any, rubric: any) => {
    const tabId = visibleTabs[rubric.source.index];
    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className="z-50 scale-105 shadow-lg"
      >
        <TabsTrigger
          value={tabId}
          className={cn("relative cursor-grabbing", triggerClass)}
          disabled
        >
          {renderTabContent(tabId)}
        </TabsTrigger>
      </div>
    );
  };

  if (isTeacher) {
    return (
      <div className="relative">
        {/* Organize/Save button - top right, small text */}
        <div className="absolute -top-6 right-0 z-10">
          {isOrganizing ? (
            <div className="flex gap-2">
              <button
                onClick={cancelOrganizing}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={saveTabOrder}
                className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsOrganizing(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Organize Tabs
            </button>
          )}
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable 
            droppableId="tabs" 
            direction="horizontal"
            renderClone={renderClone}
          >
            {(provided) => (
              <TabsList
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-5 w-full h-auto p-2 bg-muted/50 rounded-xl gap-2"
              >
                {visibleTabs.map((tabId, index) =>
                  renderTabTrigger(tabId, index, true)
                )}
                {provided.placeholder}
              </TabsList>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    );
  }

  // Student view - no drag and drop
  return (
    <TabsList className="grid grid-cols-3 w-full h-auto p-2 bg-muted/50 rounded-xl gap-2">
      {STUDENT_TABS.map((tabId, index) => renderTabTrigger(tabId, index, false))}
    </TabsList>
  );
};
