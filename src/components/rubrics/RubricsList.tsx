import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Grid3X3, MoreVertical, Trash2, Edit } from "lucide-react";
import { useRubrics } from "@/hooks/useRubrics";
import { RubricBuilder } from "./RubricBuilder";
import { formatDistanceToNow } from "date-fns";

interface RubricsListProps {
  classroomId: string;
}

export const RubricsList = ({ classroomId }: RubricsListProps) => {
  const { rubrics, isLoading, createRubric, deleteRubric, isCreating } = useRubrics(classroomId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRubricId, setSelectedRubricId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const handleCreateRubric = () => {
    if (!newTitle.trim()) return;
    createRubric({ title: newTitle, description: newDescription || undefined });
    setNewTitle("");
    setNewDescription("");
    setShowCreateDialog(false);
  };

  if (selectedRubricId) {
    return (
      <RubricBuilder 
        rubricId={selectedRubricId} 
        onBack={() => setSelectedRubricId(null)} 
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Rubrics</h2>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Rubric
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Rubric</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Rubric Title</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Essay Writing Rubric"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="What is this rubric for?"
                  rows={3}
                />
              </div>
              <Button 
                onClick={handleCreateRubric} 
                disabled={!newTitle.trim() || isCreating}
                className="w-full"
              >
                Create Rubric
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading rubrics...</div>
      ) : rubrics.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Grid3X3 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-2">No rubrics yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create rubrics to grade assignments consistently
            </p>
            <Button onClick={() => setShowCreateDialog(true)} variant="outline" size="sm">
              Create First Rubric
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rubrics.map((rubric) => (
            <Card 
              key={rubric.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedRubricId(rubric.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Grid3X3 className="w-4 h-4 text-primary" />
                      <h3 className="font-medium truncate">{rubric.title}</h3>
                    </div>
                    {rubric.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {rubric.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Created {formatDistanceToNow(new Date(rubric.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRubricId(rubric.id);
                      }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRubric(rubric.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
