import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Pencil, Trash2, Link, Save, X, ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface SchoolResource {
  id: string;
  school_id: string;
  name: string;
  url: string;
  created_at: string;
}

interface SchoolResourcesModalProps {
  open: boolean;
  onClose: () => void;
  schoolId: string;
  schoolName?: string;
}

export const SchoolResourcesModal = ({ open, onClose, schoolId, schoolName }: SchoolResourcesModalProps) => {
  const queryClient = useQueryClient();
  const [showNewForm, setShowNewForm] = useState(false);
  const [newResourceName, setNewResourceName] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");

  const { data: resources, isLoading } = useQuery({
    queryKey: ["school-resources", schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_resources")
        .select("*")
        .eq("school_id", schoolId)
        .order("name");
      
      if (error) throw error;
      return data as SchoolResource[];
    },
    enabled: open && !!schoolId,
  });

  const createResource = useMutation({
    mutationFn: async ({ name, url }: { name: string; url: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("school_resources")
        .insert({
          school_id: schoolId,
          name,
          url,
          created_by: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-resources", schoolId] });
      toast.success("Resource added successfully");
      setNewResourceName("");
      setNewResourceUrl("");
      setShowNewForm(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to add resource: ${error.message}`);
    },
  });

  const updateResource = useMutation({
    mutationFn: async ({ id, name, url }: { id: string; name: string; url: string }) => {
      const { data, error } = await supabase
        .from("school_resources")
        .update({ name, url })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-resources", schoolId] });
      toast.success("Resource updated successfully");
      setEditingId(null);
      setEditName("");
      setEditUrl("");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update resource: ${error.message}`);
    },
  });

  const deleteResource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("school_resources")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-resources", schoolId] });
      toast.success("Resource deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete resource: ${error.message}`);
    },
  });

  const handleCreateResource = async () => {
    if (!newResourceName.trim() || !newResourceUrl.trim()) return;
    
    let url = newResourceUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    
    await createResource.mutateAsync({ name: newResourceName.trim(), url });
  };

  const handleUpdateResource = async (id: string) => {
    if (!editName.trim() || !editUrl.trim()) return;
    
    let url = editUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    
    await updateResource.mutateAsync({ id, name: editName.trim(), url });
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    await deleteResource.mutateAsync(id);
  };

  const startEditing = (resource: SchoolResource) => {
    setEditingId(resource.id);
    setEditName(resource.name);
    setEditUrl(resource.url);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            School Resources
          </DialogTitle>
          <DialogDescription>
            Manage external links and resources for {schoolName || "this school"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* New Resource Button/Form */}
          {!showNewForm ? (
            <Button 
              onClick={() => setShowNewForm(true)} 
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Resource
            </Button>
          ) : (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="newResourceName">Resource Name</Label>
                  <Input
                    id="newResourceName"
                    value={newResourceName}
                    onChange={(e) => setNewResourceName(e.target.value)}
                    placeholder="e.g., Student Handbook"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newResourceUrl">URL</Label>
                  <Input
                    id="newResourceUrl"
                    value={newResourceUrl}
                    onChange={(e) => setNewResourceUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateResource}
                    disabled={!newResourceName.trim() || !newResourceUrl.trim() || createResource.isPending}
                    className="flex-1"
                  >
                    {createResource.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Add
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewForm(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resources List */}
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !resources || resources.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Link className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No resources added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {resources.map((resource) => (
                  <Card key={resource.id}>
                    <CardContent className="py-3 px-4">
                      {editingId === resource.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Resource name"
                          />
                          <Input
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            placeholder="URL"
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => handleUpdateResource(resource.id)}
                              disabled={updateResource.isPending}
                              className="flex-1"
                            >
                              {updateResource.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline" 
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="font-medium block truncate">{resource.name}</span>
                              <a 
                                href={resource.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                <span className="truncate max-w-[200px]">{resource.url}</span>
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </a>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => startEditing(resource)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteResource(resource.id)}
                              disabled={deleteResource.isPending}
                            >
                              {deleteResource.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
