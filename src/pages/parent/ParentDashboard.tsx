import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader2, UserPlus } from "lucide-react";
import { ParentNotificationBell } from "@/components/parent/ParentNotificationBell";
import { StudentLookupModal } from "@/components/parent/StudentLookupModal";
import { ParentOutgoingRequestsList } from "@/components/parent/ParentOutgoingRequestsList";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

const ParentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [parentId, setParentId] = useState<string | null>(null);
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Verify user is actually a parent
      const { data: profileData } = await supabase
        .rpc('get_user_profile', { _user_id: session.user.id });

      if (!profileData || profileData.length === 0) {
        console.error("Profile not found");
        navigate("/auth");
        return;
      }

      const userRole = profileData[0].role;
      
      // Redirect non-parents to their correct dashboard
      if (userRole !== 'parent') {
        if (userRole === 'teacher') {
          navigate('/teacher/dashboard');
        } else if (userRole === 'district_admin') {
          navigate('/district/dashboard');
        } else {
          navigate('/student/dashboard');
        }
        return;
      }

      // Use security definer function to get parent account
      const { data: parentAccount } = await supabase
        .rpc("get_parent_account", { _user_id: session.user.id });

      if (!parentAccount || parentAccount.length === 0) {
        // Create parent account if it doesn't exist
        const { data: newParent } = await supabase
          .from("parent_accounts")
          .insert({
            user_id: session.user.id,
            email: session.user.email || "",
            full_name: session.user.user_metadata?.full_name || "Parent"
          })
          .select()
          .single();

        if (newParent) {
          setParentId(newParent.id);
        }
      } else {
        setParentId(parentAccount[0].id);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error in checkAuth:", error);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLookupSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["parent-student-links"] });
    queryClient.invalidateQueries({ queryKey: ["parent-access-requests", parentId] });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showAuthButtons={false} onSignOut={handleSignOut}>
        {parentId && <ParentNotificationBell parentId={parentId} />}
      </Header>
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Hey Parent C! 🎮</h1>
            <p className="text-muted-foreground">Ready to play and learn?</p>
          </div>
          {parentId && (
            <Button onClick={() => setLookupModalOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Link Student
            </Button>
          )}
        </div>

        {parentId && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">My Student Access Requests</h2>
            <ParentOutgoingRequestsList parentId={parentId} />
          </div>
        )}
      </main>
      <Footer />

      {parentId && (
        <StudentLookupModal
          open={lookupModalOpen}
          onOpenChange={setLookupModalOpen}
          parentId={parentId}
          onSuccess={handleLookupSuccess}
        />
      )}
    </div>
  );
};

export default ParentDashboard;