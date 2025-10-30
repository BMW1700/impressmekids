import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { SchoolEventManager } from "@/components/admin/SchoolEventManager";

export default function AdminCalendar() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (userRole?.role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/auth");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showAuthButtons={false} onSignOut={handleSignOut} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Admin Calendar Management</h1>
              <p className="text-muted-foreground">
                Manage school-wide events and calendar settings
              </p>
            </div>
          </div>

          <Tabs defaultValue="events" className="space-y-6">
            <TabsList>
              <TabsTrigger value="events">School Events</TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-4">
              <SchoolEventManager />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}