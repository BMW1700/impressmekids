import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { SchoolEventManager } from "@/components/admin/SchoolEventManager";

export default function AdminCalendar() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

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
        <div className="space-y-8">
          <div className="flex items-center gap-3 justify-center">
            <CalendarIcon className="h-12 w-12 text-primary" />
            <div className="text-center">
              <h1 className="text-5xl font-luxury font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
                Admin Calendar Management
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Manage school-wide events and calendar settings
              </p>
            </div>
          </div>

          <div className="relative p-8 rounded-3xl backdrop-blur-xl bg-gradient-mesh-light border-2 border-white/30 shadow-glass-lg">
            <Tabs defaultValue="events" className="space-y-6">
              <TabsList className="bg-white/60 dark:bg-black/40 backdrop-blur-sm border border-white/20">
                <TabsTrigger value="events" className="data-[state=active]:bg-white dark:data-[state=active]:bg-black">School Events</TabsTrigger>
              </TabsList>

              <TabsContent value="events" className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                    className="rounded-full hover:bg-white/20 hover:scale-110 transition-all backdrop-blur-sm border border-white/20"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <h2 className="text-4xl font-luxury font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                    className="rounded-full hover:bg-white/20 hover:scale-110 transition-all backdrop-blur-sm border border-white/20"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
                <SchoolEventManager />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}