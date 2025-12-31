import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Building } from "lucide-react";
import { format } from "date-fns";

interface AdminListCardProps {
  admin: {
    id: string;
    full_name: string;
    email: string;
    created_at: string;
    school_id?: string | null;
    school_name?: string | null;
  };
  onConnectToSchool?: (userId: string, userName: string, currentSchoolId?: string | null) => void;
}

export const AdminListCard = ({ admin, onConnectToSchool }: AdminListCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{admin.full_name}</CardTitle>
            <CardDescription>{admin.email}</CardDescription>
            {admin.school_name && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Building className="h-3 w-3" />
                {admin.school_name}
              </div>
            )}
          </div>
          <Badge variant={admin.school_id ? "secondary" : "default"} className="gap-1">
            <Shield className="h-3 w-3" />
            {admin.school_id ? "School Admin" : "District Admin"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Created: {format(new Date(admin.created_at), "MMM d, yyyy")}
        </p>
        {onConnectToSchool && (
          <Button 
            size="sm" 
            variant="outline"
            className="w-full"
            onClick={() => onConnectToSchool(admin.id, admin.full_name, admin.school_id)}
          >
            <Building className="h-3 w-3 mr-1" />
            {admin.school_id ? "Change School" : "Connect to School"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
