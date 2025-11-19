import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface CompactProfileHeaderProps {
  fullName?: string;
  grade?: number;
  avatarUrl?: string;
}

export const CompactProfileHeader = ({
  fullName,
  grade,
  avatarUrl,
}: CompactProfileHeaderProps) => {
  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "??";

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
        <AvatarImage src={avatarUrl} alt={fullName} />
        <AvatarFallback className="text-xl bg-gradient-primary text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div>
        <h2 className="text-xl font-bold text-foreground">
          {fullName || "Student"}
        </h2>
        {grade && (
          <Badge variant="secondary" className="mt-1">
            Grade {grade}
          </Badge>
        )}
      </div>
    </div>
  );
};
