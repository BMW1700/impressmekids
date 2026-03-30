import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

interface TeacherResource {
  id: string;
  teacher_id: string;
  name: string;
  url: string;
  created_at: string;
}

const TeacherPersonalResources = () => {
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newResourceName, setNewResourceName] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");

  // Fetch teacher's personal resources
  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ["teacher-personal-resources", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("teacher_resources")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching resources:", error);
        return [];
      }
      return data as TeacherResource[];
    },
    enabled: !!user?.id,
  });

  // Add resource mutation
  const addResourceMutation = useMutation({
    mutationFn: async ({ name, url }: { name: string; url: string }) => {
      const { error } = await supabase.from("teacher_resources").insert({
        teacher_id: user?.id,
        name,
        url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-personal-resources"] });
      toast({
        title: "Resource added",
        description: "Your personal resource has been saved.",
      });
      setIsAddDialogOpen(false);
      setNewResourceName("");
      setNewResourceUrl("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add resource. Please try again.",
        variant: "destructive",
      });
      console.error("Add resource error:", error);
    },
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const { error } = await supabase
        .from("teacher_resources")
        .delete()
        .eq("id", resourceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-personal-resources"] });
      toast({
        title: "Resource deleted",
        description: "The resource has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete resource. Please try again.",
        variant: "destructive",
      });
      console.error("Delete resource error:", error);
    },
  });

  const handleAddResource = () => {
    if (!newResourceName.trim() || !newResourceUrl.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter both a title and URL.",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    let formattedUrl = newResourceUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    addResourceMutation.mutate({ name: newResourceName.trim(), url: formattedUrl });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile || profile.role !== "teacher") {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/20">
      <Header />

      <main className="flex-1 container py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/teacher/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                My Resources
              </h1>
              <p className="text-muted-foreground">
                Your personal collection of links and resources
              </p>
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Resource</DialogTitle>
                <DialogDescription>
                  Save a link for easy access later. Only you can see your personal resources.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="resource-name">Title</Label>
                  <Input
                    id="resource-name"
                    placeholder="e.g., Lesson Planning Template"
                    value={newResourceName}
                    onChange={(e) => setNewResourceName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resource-url">URL</Label>
                  <Input
                    id="resource-url"
                    placeholder="e.g., https://example.com/resource"
                    value={newResourceUrl}
                    onChange={(e) => setNewResourceUrl(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddResource}
                  disabled={addResourceMutation.isPending}
                >
                  {addResourceMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Add Resource
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {resourcesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !resources || resources.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <LinkIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No Resources Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start adding your favorite links and resources for quick access.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Resource
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <Card
                key={resource.id}
                className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/50 group"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2 flex-1 min-w-0">
                      <LinkIcon className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="truncate">{resource.name}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-accent rounded"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteResourceMutation.mutate(resource.id)}
                        disabled={deleteResourceMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground truncate block hover:text-primary transition-colors"
                  >
                    {resource.url}
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TeacherPersonalResources;
