import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Mail, CreditCard, Lock } from "lucide-react";

interface AccountSectionProps {
  userProfile: any;
  studentProfile: any;
}

export const AccountSection = ({ userProfile, studentProfile }: AccountSectionProps) => {
  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={studentProfile?.avatar_url} />
              <AvatarFallback className="text-2xl">
                {getInitials(userProfile?.full_name || "")}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">
              Change Photo
            </Button>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name
            </Label>
            <div className="p-3 border border-border rounded-lg bg-muted/50">
              <p className="text-foreground">{userProfile?.full_name || "N/A"}</p>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <div className="p-3 border border-border rounded-lg bg-muted/50">
              <p className="text-foreground">{userProfile?.email || "N/A"}</p>
            </div>
          </div>

          {/* Student ID */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Student ID
            </Label>
            <div className="p-3 border border-border rounded-lg bg-muted/50 font-mono">
              <p className="text-foreground">{userProfile?.id || "N/A"}</p>
            </div>
          </div>

          {/* Grade */}
          {studentProfile?.grade !== undefined && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Grade
              </Label>
              <div className="p-3 border border-border rounded-lg bg-muted/50">
                <p className="text-foreground">
                  {studentProfile.grade === 0 ? "Kindergarten" : `Grade ${studentProfile.grade}`}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">
            <Lock className="h-4 w-4 mr-2" />
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
