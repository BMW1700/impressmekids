import type React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useClassroomFeatures } from "@/hooks/useClassroomFeatures";
import { liquidGlassTabClass } from "@/components/ui/liquid-glass-button";
import { useTabOrder } from "@/hooks/useTabOrder";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  GraduationCap,
  Calendar,
} from "lucide-react";

interface ClassroomTabsListProps {
  classroomId: string;
  isTeacher: boolean;
  parentRequests: any[];
  currentTab?: string;
  onTabChange?: (value: string) => void;
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
  "meeting-requests": { icon: Calendar, label: "Office Hours" },
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
  grades: { icon: GraduationCap, label: "Grades" },
  calendar: { icon: Calendar, label: "Calendar" },
};

// Student tabs - fixed order (9 tabs for 3x3 grid)
const STUDENT_TABS = [
  "syllabus",
  "assignments",
  "announcements",
  "discussions",
  "study",
  "tournaments",
  "calendar",
  "grades",
  "trends",
];

function chunkArray<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function parseRowId(droppableId: string): number {
  const m = droppableId.match(/^tabs-row-(\d+)$/);
  return m ? Number(m[1]) : 0;
}

export const ClassroomTabsList = ({
  classroomId,
  isTeacher,
  parentRequests,
  currentTab,
  onTabChange,
}: ClassroomTabsListProps) => {
  const isMobile = useIsMobile();
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
  const getVisibleTeacherTabs = (): string[] => {
    return orderedTabs.filter((tabId: string) => {
      const config = TAB_CONFIG[tabId];
      if (!config) return false;
      if (config.isToolkit) {
        return isFeatureEnabled(tabId);
      }
      return true;
    });
  };

  const visibleTeacherTabs = getVisibleTeacherTabs();
  const visibleTabs = isTeacher ? visibleTeacherTabs : STUDENT_TABS;
  const pendingCount = parentRequests.filter((r) => r.status === "pending").length;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    // Only used for teacher organizing
    const cols = 5;
    const srcRow = parseRowId(result.source.droppableId);
    const dstRow = parseRowId(result.destination.droppableId);

    const sourceIndex = srcRow * cols + result.source.index;
    const destIndex = dstRow * cols + result.destination.index;

    const currentVisible = visibleTeacherTabs;
    if (sourceIndex < 0 || sourceIndex >= currentVisible.length) return;

    const nextVisible = Array.from(currentVisible);
    const [moved] = nextVisible.splice(sourceIndex, 1);

    const safeDest = Math.max(0, Math.min(destIndex, nextVisible.length));
    nextVisible.splice(safeDest, 0, moved);

    // Rebuild the full orderedTabs by only reordering the visible tabs in-place,
    // preserving the relative positions of any hidden/disabled tabs.
    const visibleSet = new Set(currentVisible);
    const visiblePositions: number[] = [];
    orderedTabs.forEach((id, idx) => {
      if (visibleSet.has(id)) visiblePositions.push(idx);
    });

    const nextOrdered = Array.from(orderedTabs);
    let v = 0;
    for (const pos of visiblePositions) {
      nextOrdered[pos] = nextVisible[v++];
    }

    reorderTabs(nextOrdered);
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
    return (
      <>
        <Icon className="mr-2 h-4 w-4" />
        {config.label}
      </>
    );
  };

  const renderTabTrigger = (tabId: string) => {
    const config = TAB_CONFIG[tabId];
    if (!config && tabId !== "trends") return null;

    return (
      <TabsTrigger key={tabId} value={tabId} className={cn("relative", triggerClass)}>
        {renderTabContent(tabId)}
      </TabsTrigger>
    );
  };

  const renderOrganizeTile = (tabId: string, index: number) => {
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
              snapshot.isDragging && "z-50"
            )}
          >
            {/* Plain div styled like TabsTrigger to avoid Radix RovingFocusGroup context crash */}
            <div
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium cursor-grab select-none",
                triggerClass
              )}
            >
              {renderTabContent(tabId)}
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  // Mobile dropdown for teacher
  const renderMobileDropdown = (tabs: string[]) => {
    const currentConfig = TAB_CONFIG[currentTab || tabs[0]];
    const CurrentIcon = currentConfig?.icon || Users;
    
    return (
      <div className="w-full">
        <Select value={currentTab || tabs[0]} onValueChange={(value) => onTabChange?.(value)}>
          <SelectTrigger className="w-full h-12 bg-muted/50 rounded-xl border-0">
            <SelectValue>
              <div className="flex items-center gap-2">
                <CurrentIcon className="h-4 w-4" />
                {currentConfig?.label || currentTab}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            {tabs.map((tabId) => {
              const config = TAB_CONFIG[tabId];
              if (!config && tabId !== "trends") return null;
              const Icon = config?.icon || BarChart3;
              return (
                <SelectItem key={tabId} value={tabId} className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {config?.label || "Trends"}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    );
  };

  if (isTeacher) {
    const cols = 5;
    const rows = chunkArray(visibleTeacherTabs, cols);

    // Mobile view - show dropdown
    if (isMobile) {
      return renderMobileDropdown(visibleTeacherTabs);
    }

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

        {isOrganizing ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="w-full rounded-xl bg-muted/50 p-2 overflow-x-hidden">
              <div className="grid gap-2">
                {rows.map((rowTabs, rowIndex) => (
                  <Droppable
                    key={rowIndex}
                    droppableId={`tabs-row-${rowIndex}`}
                    direction="horizontal"
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "grid grid-cols-5 gap-2",
                          snapshot.isDraggingOver && "rounded-lg"
                        )}
                      >
                        {rowTabs.map((tabId, colIndex) =>
                          renderOrganizeTile(tabId, colIndex)
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </div>
          </DragDropContext>
        ) : (
          <TabsList className="grid grid-cols-5 w-full h-auto p-2 bg-muted/50 rounded-xl gap-2">
            {visibleTeacherTabs.map((tabId) => renderTabTrigger(tabId))}
          </TabsList>
        )}
      </div>
    );
  }

  // Student view - show dropdown on mobile
  if (isMobile) {
    return renderMobileDropdown(STUDENT_TABS);
  }

  // Student view - no drag and drop
  return (
    <TabsList className="grid grid-cols-3 w-full h-auto p-2 bg-muted/50 rounded-xl gap-2">
      {STUDENT_TABS.map((tabId) => renderTabTrigger(tabId))}
    </TabsList>
  );
};
