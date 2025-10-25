import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader2 } from "lucide-react";
import { ParentNotificationBell } from "@/components/parent/ParentNotificationBell";

const ParentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [parentId, setParentId] = useState<string | null>(null);
  const navigate = useNavigate();

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header>
        {parentId && <ParentNotificationBell parentId={parentId} />}
      </Header>
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Hey Parent C! 🎮</h1>
          <p className="text-muted-foreground">Ready to play and learn?</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ParentDashboard;
