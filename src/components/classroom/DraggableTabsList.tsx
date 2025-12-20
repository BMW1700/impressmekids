import { useState, useRef, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useClassroomFeatures } from "@/hooks/useClassroomFeatures";
import { useTabOrder } from "@/hooks/useTabOrder";
import { liquidGlassTabClass } from "@/components/ui/liquid-glass-button";
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

interface DraggableTabsListProps {
  classroomId: string;
  isTeacher: boolean;
  parentRequests: any[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  syllabus: FileText,
  attendance: UserCheck,
  students: Users,
  safety: Shield,
  "parent-requests": UserPlus,
  announcements: Megaphone,
  assignments: FileText,
  discussions: MessageSquare,
  study: BookOpen,
  tournaments: Play,
  leaderboard: Trophy,
  rubrics: Grid3X3,
  "ai-insights": BarChart3,
  behavior: Trophy,
  journal: BookHeart,
  trends: BarChart3,
};

const LABEL_MAP: Record<string, string> = {
  syllabus: "Syllabus",
  attendance: "Attendance",
  students: "Students",
  safety: "Safety",
  "parent-requests": "Parent Requests",
  announcements: "Announcements",
  assignments: "Assignments",
  discussions: "Discussions",
  study: "Study Materials",
  tournaments: "Study Games",
  leaderboard: "Leaderboard",
  rubrics: "Rubrics",
  "ai-insights": "AI Insights",
  behavior: "Behavior",
  journal: "Journal",
  trends: "Trends",
};

const STUDENT_TABS = [
  "syllabus",
  "assignments",
  "announcements",
  "study",
  "tournaments",
  "trends",
  "discussions",
];

const TOOLKIT_FEATURES = ["leaderboard", "rubrics", "ai-insights", "behavior", "journal"];

export const DraggableTabsList = ({
  classroomId,
  isTeacher,
  parentRequests,
}: DraggableTabsListProps) => {
  const { isFeatureEnabled } = useClassroomFeatures(classroomId);
  const { tabOrder, reorderTabs } = useTabOrder(classroomId, isTeacher);
  
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [holdingIndex, setHoldingIndex] = useState<number | null>(null);

  // Handle long press to enable dragging (1 second hold)
  const handleMouseDown = useCallback((index: number) => {
    if (!isTeacher) return;
    
    setHoldingIndex(index);
    holdTimerRef.current = setTimeout(() => {
      setIsDragEnabled(true);
      setHoldingIndex(null);
    }, 1000);
  }, [isTeacher]);

  const handleMouseUp = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldingIndex(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldingIndex(null);
  }, []);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      setIsDragEnabled(false);
      
      if (!result.destination) return;
      if (result.source.index === result.destination.index) return;

      reorderTabs(result.source.index, result.destination.index);
    },
    [reorderTabs]
  );

  // Get visible tabs based on user type
  const getVisibleTabs = () => {
    if (!isTeacher) {
      return STUDENT_TABS;
    }

    // Get enabled toolkit features
    const enabledToolkit = TOOLKIT_FEATURES.filter((id) => isFeatureEnabled(id));
    
    // Combine default tabs with enabled toolkit features, respecting saved order
    const allTabs = [...tabOrder, ...enabledToolkit.filter((t) => !tabOrder.includes(t))];
    
    return allTabs.filter((tabId) => {
      // Always show default teacher tabs
      if (!TOOLKIT_FEATURES.includes(tabId)) return true;
      // Only show enabled toolkit features
      return isFeatureEnabled(tabId);
    });
  };

  const visibleTabs = getVisibleTabs();
  const pendingRequestsCount = parentRequests.filter((r) => r.status === "pending").length;

  // Student view - no drag functionality
  if (!isTeacher) {
    return (
      <TabsList className="grid w-full h-auto p-2 bg-muted/50 rounded-xl gap-2 grid-cols-3">
        {visibleTabs.map((tabId) => {
          const Icon = ICON_MAP[tabId];
          const label = LABEL_MAP[tabId];

          return (
            <TabsTrigger key={tabId} value={tabId} className={liquidGlassTabClass}>
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {label}
            </TabsTrigger>
          );
        })}
      </TabsList>
    );
  }

  // Teacher view - with drag functionality
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="tabs" direction="horizontal">
        {(provided, snapshot) => (
          <TabsList
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "grid w-full h-auto p-2 bg-muted/50 rounded-xl gap-2 grid-cols-5",
              snapshot.isDraggingOver && "ring-2 ring-primary/30",
              isDragEnabled && "cursor-grabbing"
            )}
          >
            {visibleTabs.map((tabId, index) => {
              const Icon = ICON_MAP[tabId];
              const label = LABEL_MAP[tabId];
              const isHolding = holdingIndex === index;

              return (
                <Draggable
                  key={tabId}
                  draggableId={tabId}
                  index={index}
                  isDragDisabled={!isDragEnabled}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      onMouseDown={() => handleMouseDown(index)}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseLeave}
                      onTouchStart={() => handleMouseDown(index)}
                      onTouchEnd={handleMouseUp}
                      className={cn(
                        "relative",
                        snapshot.isDragging && "z-50"
                      )}
                    >
                      {/* Hold indicator ring */}
                      {isHolding && (
                        <div className="absolute inset-0 rounded-xl border-2 border-primary animate-pulse pointer-events-none z-10" />
                      )}
                      
                      <TabsTrigger
                        value={tabId}
                        className={cn(
                          liquidGlassTabClass,
                          "w-full",
                          snapshot.isDragging && "ring-2 ring-primary shadow-2xl scale-105",
                          isDragEnabled && "cursor-grab",
                          isHolding && "scale-[0.98] transition-transform"
                        )}
                      >
                        {isDragEnabled && (
                          <GripVertical className="mr-1 h-3 w-3 text-muted-foreground" />
                        )}
                        {Icon && <Icon className="mr-2 h-4 w-4" />}
                        {label}
                        {tabId === "parent-requests" && pendingRequestsCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                          >
                            {pendingRequestsCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </TabsList>
        )}
      </Droppable>
    </DragDropContext>
  );
};
