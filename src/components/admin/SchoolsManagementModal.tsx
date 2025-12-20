import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSchools } from "@/hooks/useSchools";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Pencil, Trash2, School, Save, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SchoolsManagementModalProps {
  open: boolean;
  onClose: () => void;
}

export const SchoolsManagementModal = ({ open, onClose }: SchoolsManagementModalProps) => {
  const { schools, isLoading, createSchool, updateSchool, deleteSchool } = useSchools();
  const [showNewForm, setShowNewForm] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [districtId, setDistrictId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserDistrict = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("district_id")
        .eq("id", session.user.id)
        .single();

      if (profile?.district_id) {
        setDistrictId(profile.district_id);
      }
    };
    fetchUserDistrict();
  }, []);

  const handleCreateSchool = async () => {
    if (!newSchoolName.trim() || !districtId) return;
    
    await createSchool.mutateAsync({ name: newSchoolName.trim(), districtId });
    setNewSchoolName("");
    setShowNewForm(false);
  };

  const handleUpdateSchool = async (id: string) => {
    if (!editName.trim()) return;
    
    await updateSchool.mutateAsync({ id, name: editName.trim() });
    setEditingId(null);
    setEditName("");
  };

  const handleDeleteSchool = async (id: string) => {
    if (!confirm("Are you sure you want to delete this school? Users connected to it will be disconnected.")) return;
    await deleteSchool.mutateAsync(id);
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            Manage Schools
          </DialogTitle>
          <DialogDescription>
            Create and manage schools within your district
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* New School Button/Form */}
          {!showNewForm ? (
            <Button 
              onClick={() => setShowNewForm(true)} 
              className="w-full"
              disabled={!districtId}
            >
              <Plus className="h-4 w-4 mr-2" />
              New School
            </Button>
          ) : (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="newSchoolName">School Name</Label>
                  <Input
                    id="newSchoolName"
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    placeholder="Enter school name"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateSchool()}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateSchool}
                    disabled={!newSchoolName.trim() || createSchool.isPending}
                    className="flex-1"
                  >
                    {createSchool.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create
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

          {/* Schools List */}
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !schools || schools.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <School className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No schools created yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {schools.map((school) => (
                  <Card key={school.id}>
                    <CardContent className="py-3 px-4">
                      {editingId === school.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleUpdateSchool(school.id)}
                            className="flex-1"
                          />
                          <Button 
                            size="icon" 
                            onClick={() => handleUpdateSchool(school.id)}
                            disabled={updateSchool.isPending}
                          >
                            {updateSchool.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <School className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{school.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => startEditing(school.id, school.name)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteSchool(school.id)}
                              disabled={deleteSchool.isPending}
                            >
                              {deleteSchool.isPending ? (
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
