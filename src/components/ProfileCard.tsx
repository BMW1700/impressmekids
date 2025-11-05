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

export const ProfileCard = ({ fullName, grade, avatarUrl, stats, assignmentStats }: ProfileCardProps) => {
  const initials = fullName
    ? fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    : '??';

  return (
    <Card className="shadow-card">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarUrl} alt={fullName} />
            <AvatarFallback className="text-2xl bg-gradient-hero text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-2xl">{fullName || 'Student'}</CardTitle>
        {grade && (
          <Badge variant="secondary" className="mt-2">
            Grade {grade}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">
              {assignmentStats?.total_assignments || 0}
            </div>
            <div className="text-xs text-muted-foreground">Assignments</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-secondary" />
            </div>
            <div className="text-2xl font-bold text-secondary">
              {assignmentStats?.completed_assignments || 0}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">
              {stats?.games_played || 0}
            </div>
            <div className="text-xs text-muted-foreground">Games Played</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-secondary" />
            </div>
            <div className="text-2xl font-bold text-secondary">
              {stats?.games_won || 0}
            </div>
            <div className="text-xs text-muted-foreground">Games Won</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
