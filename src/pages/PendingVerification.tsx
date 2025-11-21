import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VerificationRequest {
  id: string;
  district_name: string;
  requested_role: string;
  created_at: string;
  status: string;
}

export default function PendingVerification() {
  const navigate = useNavigate();
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        // Check if user is verified
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_verified, role, district_name')
          .eq('id', user.id)
          .single();

        if (profile?.is_verified) {
          // User is now verified, redirect to appropriate dashboard
          const role = profile.role;
          if (role === 'teacher') navigate('/teacher/dashboard');
          else if (role === 'parent') navigate('/parent/dashboard');
          else if (role === 'admin') navigate('/admin/dashboard');
          else navigate('/student/dashboard');
          return;
        }

        // Fetch verification request details
        const { data: requestData } = await supabase
          .from('account_verification_requests')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .single();

        if (requestData) {
          setRequest(requestData as VerificationRequest);
        }
      } catch (error) {
        console.error('Error checking verification:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkVerificationStatus();

    // Poll every 30 seconds to check if verification status changed
    const interval = setInterval(checkVerificationStatus, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <Clock className="h-12 w-12 text-primary animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <div className="mx-auto mb-4">
            <Clock className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-2xl text-center">Account Pending Verification</CardTitle>
          <CardDescription className="text-center">
            Your account is awaiting approval from your district administrator
          </CardDescription>
        </CardHeader>
        <CardContent>
          {request && (
            <div className="space-y-4 bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">District:</span>
                <Badge variant="outline">{request.district_name}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Role:</span>
                <Badge>{request.requested_role}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Requested:</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
          
          <div className="mt-6 space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Your district administrator has been notified of your request
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary">•</span>
              You'll be able to access your dashboard once approved
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary">•</span>
              This page will automatically refresh when your status changes
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Having issues? Contact your district administrator
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
