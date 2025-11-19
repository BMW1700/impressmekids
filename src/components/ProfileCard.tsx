import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, BookOpen, CheckCircle } from "lucide-react";
interface ProfileCardProps {
  fullName?: string;
  grade?: number;
  avatarUrl?: string;
  stats?: {
    games_played?: number;
    games_won?: number;
  };
  assignmentStats?: {
    total_assignments?: number;
    completed_assignments?: number;
  };
}
export const ProfileCard = ({
  fullName,
  grade,
  avatarUrl,
  stats,
  assignmentStats
}: ProfileCardProps) => {
  const initials = fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase() : '??';
  return <Card className="shadow-lg border-border/50 overflow-hidden">
      <CardHeader className="text-center relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 pb-8">
        <div className="flex justify-center mb-4">
          <Avatar className="h-28 w-28 ring-4 ring-primary/20 ring-offset-2 ring-offset-background transition-transform hover:scale-105">
            <AvatarImage src={avatarUrl} alt={fullName} />
            <AvatarFallback className="text-3xl bg-gradient-primary text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {fullName || 'Student'}
        </CardTitle>
        {grade && <Badge variant="secondary" className="mt-3 text-sm px-4 py-1">
            Grade {grade}
          </Badge>}
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="group relative text-center p-5 rounded-xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:scale-105 hover:border-purple-500/40">
            <div className="flex items-center justify-center gap-2 mb-3">
              <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400 transition-transform group-hover:scale-110" />
            </div>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300 mb-1">
              {assignmentStats?.total_assignments || 0}
            </div>
            <div className="text-xs font-medium text-muted-foreground">Assignments</div>
          </div>
          <div className="group relative text-center p-5 rounded-xl bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 hover:scale-105 hover:border-green-500/40">
            <div className="flex items-center justify-center gap-2 mb-3">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 transition-transform group-hover:scale-110" />
            </div>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300 mb-1">
              {assignmentStats?.completed_assignments || 0}
            </div>
            <div className="text-xs font-medium text-muted-foreground">Completed</div>
          </div>
          <div className="group relative text-center p-5 rounded-xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105 hover:border-blue-500/40">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Target className="h-6 w-6 text-blue-600 dark:text-blue-400 transition-transform group-hover:scale-110" />
            </div>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-1">
              {stats?.games_played || 0}
            </div>
            <div className="text-xs font-medium text-muted-foreground">Games Played</div>
          </div>
          <div className="group relative text-center p-5 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 hover:scale-105 hover:border-amber-500/40">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400 transition-transform group-hover:scale-110" />
            </div>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-300 mb-1">
              {stats?.games_won || 0}
            </div>
            <div className="text-xs font-medium text-muted-foreground">Games Won</div>
          </div>
        </div>
      </CardContent>
    </Card>;
};