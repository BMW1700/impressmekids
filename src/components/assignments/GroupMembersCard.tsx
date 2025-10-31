import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { AssignmentGroup } from "@/hooks/useAssignmentGroups";

interface GroupMembersCardProps {
  group: AssignmentGroup;
  currentUserId: string;
  onlineMembers: string[];
}

export const GroupMembersCard = ({
  group,
  currentUserId,
  onlineMembers,
}: GroupMembersCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          {group.group_name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {group.assignment_group_members.map((member) => {
            const isCurrentUser = member.student_id === currentUserId;
            const isOnline = onlineMembers.includes(member.student_id);
            
            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 rounded-md bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-sm font-medium">
                    {member.profiles?.full_name}
                    {isCurrentUser && " (You)"}
                  </span>
                </div>
                {isOnline && (
                  <Badge variant="outline" className="text-xs">
                    Online
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
