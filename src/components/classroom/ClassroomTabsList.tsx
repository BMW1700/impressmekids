import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useClassroomFeatures } from "@/hooks/useClassroomFeatures";
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
} from "lucide-react";

interface ClassroomTabsListProps {
  classroomId: string;
  isTeacher: boolean;
  parentRequests: any[];
}

export const ClassroomTabsList = ({
  classroomId,
  isTeacher,
  parentRequests,
}: ClassroomTabsListProps) => {
  const { isFeatureEnabled } = useClassroomFeatures(classroomId);

  const triggerClass = liquidGlassTabClass;

  // Count enabled toolkit features to adjust grid columns
  const enabledToolkitCount = ["leaderboard", "rubrics", "ai-insights", "behavior", "journal"].filter(
    (id) => isFeatureEnabled(id)
  ).length;

  // Calculate grid columns for teacher: 10 default tabs + enabled toolkit tabs
  const teacherCols = 10 + enabledToolkitCount;

  return (
    <TabsList
      className={cn(
        "grid w-full h-auto p-2 bg-muted/50 rounded-xl gap-2",
        isTeacher ? "grid-cols-5" : "grid-cols-3"
      )}
    >
      {/* Teacher Tabs */}
      {isTeacher && (
        <>
          {/* Default Features - Always visible */}
          <TabsTrigger value="syllabus" className={triggerClass}>
            <FileText className="mr-2 h-4 w-4" />
            Syllabus
          </TabsTrigger>
          <TabsTrigger value="attendance" className={triggerClass}>
            <UserCheck className="mr-2 h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="students" className={triggerClass}>
            <Users className="mr-2 h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="safety" className={triggerClass}>
            <Shield className="mr-2 h-4 w-4" />
            Safety
          </TabsTrigger>
          <TabsTrigger
            value="parent-requests"
            className={cn("relative", triggerClass)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Parent Requests
            {parentRequests.filter((r) => r.status === "pending").length > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
              >
                {parentRequests.filter((r) => r.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>

          {/* Row 2: More default features */}
          <TabsTrigger value="announcements" className={triggerClass}>
            <Megaphone className="mr-2 h-4 w-4" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="assignments" className={triggerClass}>
            <FileText className="mr-2 h-4 w-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="discussions" className={triggerClass}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Discussions
          </TabsTrigger>
          <TabsTrigger value="study" className={triggerClass}>
            <BookOpen className="mr-2 h-4 w-4" />
            Study Materials
          </TabsTrigger>
          <TabsTrigger value="tournaments" className={triggerClass}>
            <Play className="mr-2 h-4 w-4" />
            Study Games
          </TabsTrigger>

          {/* Toolkit Features - Only visible if enabled */}
          {isFeatureEnabled("leaderboard") && (
            <TabsTrigger value="leaderboard" className={triggerClass}>
              <Trophy className="mr-2 h-4 w-4" />
              Leaderboard
            </TabsTrigger>
          )}
          {isFeatureEnabled("rubrics") && (
            <TabsTrigger value="rubrics" className={triggerClass}>
              <Grid3X3 className="mr-2 h-4 w-4" />
              Rubrics
            </TabsTrigger>
          )}
          {isFeatureEnabled("ai-insights") && (
            <TabsTrigger value="ai-insights" className={triggerClass}>
              <BarChart3 className="mr-2 h-4 w-4" />
              AI Insights
            </TabsTrigger>
          )}
          {isFeatureEnabled("behavior") && (
            <TabsTrigger value="behavior" className={triggerClass}>
              <Trophy className="mr-2 h-4 w-4" />
              Behavior
            </TabsTrigger>
          )}
          {isFeatureEnabled("journal") && (
            <TabsTrigger value="journal" className={triggerClass}>
              <BookHeart className="mr-2 h-4 w-4" />
              Journal
            </TabsTrigger>
          )}
        </>
      )}

      {/* Student Tabs */}
      {!isTeacher && (
        <>
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
        </>
      )}
    </TabsList>
  );
};
