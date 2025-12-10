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
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-sm opacity-60" />
        <Avatar className="relative h-16 w-16 ring-2 ring-white/50 ring-offset-2 ring-offset-background">
          <AvatarImage src={avatarUrl} alt={fullName} />
          <AvatarFallback className="text-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">
          {fullName || "Student"}
        </h2>
        {grade && (
          <Badge variant="purple" className="mt-1">
            Grade {grade}
          </Badge>
        )}
      </div>
    </div>
  );
};
