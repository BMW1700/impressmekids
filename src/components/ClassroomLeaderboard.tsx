import { Crown, Trophy, Medal, Gamepad2, BookOpen, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useClassroomLeaderboard, LeaderboardEntry } from "@/hooks/useClassroomLeaderboard";

interface ClassroomLeaderboardProps {
  classroomId: string;
  limit?: number;
  currentStudentId?: string;
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return null;
};

const getRankStyles = (rank: number, isCurrentStudent: boolean) => {
  const baseStyles = "transition-all hover:scale-[1.01]";
  
  if (isCurrentStudent) {
    return `${baseStyles} bg-primary/10 border-2 border-primary`;
  }
  
  if (rank === 1) {
    return `${baseStyles} bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-2 border-yellow-400`;
  }
  if (rank === 2) {
    return `${baseStyles} bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20`;
  }
  if (rank === 3) {
    return `${baseStyles} bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20`;
  }
  return baseStyles;
};

const LeaderboardRow = ({
  entry,
  rank,
  isCurrentStudent,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentStudent: boolean;
}) => {
  const initials = entry.student_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-3 p-3 rounded-lg ${getRankStyles(
              rank,
              isCurrentStudent
            )}`}
          >
            {/* Rank & Icon */}
            <div className="flex items-center justify-center w-8 flex-shrink-0">
              {getRankIcon(rank) || (
                <span className="text-sm font-semibold text-muted-foreground">
                  {rank}
                </span>
              )}
            </div>

            {/* Avatar & Name */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={entry.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">
                  {entry.student_name}
                  {isCurrentStudent && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      You
                    </Badge>
                  )}
                </span>
                {entry.grade && (
                  <span className="text-xs text-muted-foreground">
                    Grade {entry.grade}
                  </span>
                )}
              </div>
            </div>

            {/* Stats - Desktop */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm">
                <Gamepad2 className="w-4 h-4 text-purple-500" />
                <span className="font-semibold">{entry.games_won}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span className="font-semibold">{entry.assignments_completed}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Brain className="w-4 h-4 text-green-500" />
                <span className="font-semibold">
                  {Math.round(entry.aura_avg_score)}
                </span>
              </div>
            </div>

            {/* Total Score */}
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-600" />
              <span className="font-bold text-lg">
                {Math.round(entry.total_score)}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">
              Total Score: {Math.round(entry.total_score)} pts
            </p>
            <div className="space-y-1 text-sm">
              <p>🎮 Games: {entry.games_won} × 10 = {entry.games_won * 10} pts</p>
              <p>
                📚 Assignments: {entry.assignments_completed} × 5 ={" "}
                {entry.assignments_completed * 5} pts
              </p>
              <p>
                🧠 AURA: {Math.round(entry.aura_avg_score)} ÷ 10 ={" "}
                {Math.round(entry.aura_avg_score / 10)} pts
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const ClassroomLeaderboard = ({
  classroomId,
  limit,
  currentStudentId,
}: ClassroomLeaderboardProps) => {
  const { data: leaderboard, isLoading } = useClassroomLeaderboard(classroomId);

  const displayedLeaderboard = limit
    ? leaderboard?.slice(0, limit)
    : leaderboard;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No students in this classroom yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Class Leaderboard
        </CardTitle>
        <div className="flex gap-4 text-xs text-muted-foreground pt-2">
          <div className="flex items-center gap-1">
            <Gamepad2 className="w-3 h-3" />
            Games
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            Assignments
          </div>
          <div className="flex items-center gap-1">
            <Brain className="w-3 h-3" />
            AURA
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayedLeaderboard?.map((entry, index) => (
          <LeaderboardRow
            key={entry.student_id}
            entry={entry}
            rank={index + 1}
            isCurrentStudent={entry.student_id === currentStudentId}
          />
        ))}
      </CardContent>
    </Card>
  );
};
