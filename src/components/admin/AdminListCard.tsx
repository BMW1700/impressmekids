import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { format } from "date-fns";

interface AdminListCardProps {
  admin: {
    id: string;
    full_name: string;
    email: string;
    created_at: string;
  };
}

export const AdminListCard = ({ admin }: AdminListCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{admin.full_name}</CardTitle>
            <CardDescription>{admin.email}</CardDescription>
          </div>
          <Badge variant="default" className="gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Created: {format(new Date(admin.created_at), "MMM d, yyyy")}
        </p>
      </CardContent>
    </Card>
  );
};
