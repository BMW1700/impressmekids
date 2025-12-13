import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, GripVertical, Edit2, Check, X } from "lucide-react";
import { useRubricDetail } from "@/hooks/useRubrics";

interface RubricBuilderProps {
  rubricId: string;
  onBack: () => void;
}

export const RubricBuilder = ({ rubricId, onBack }: RubricBuilderProps) => {
  const { rubric, isLoading, addCriteria, updateCriteria, deleteCriteria, updateLevel } = useRubricDetail(rubricId);
  const [showAddCriteria, setShowAddCriteria] = useState(false);
  const [newCriteriaName, setNewCriteriaName] = useState("");
  const [newCriteriaDescription, setNewCriteriaDescription] = useState("");
  const [newCriteriaMaxPoints, setNewCriteriaMaxPoints] = useState(10);
  const [editingLevel, setEditingLevel] = useState<string | null>(null);
  const [editingLevelData, setEditingLevelData] = useState({ name: "", description: "", points: 0 });

  const handleAddCriteria = () => {
    if (!newCriteriaName.trim()) return;
    addCriteria({ 
      name: newCriteriaName, 
      description: newCriteriaDescription || undefined, 
      maxPoints: newCriteriaMaxPoints 
    });
    setNewCriteriaName("");
    setNewCriteriaDescription("");
    setNewCriteriaMaxPoints(10);
    setShowAddCriteria(false);
  };

  const startEditingLevel = (level: any) => {
    setEditingLevel(level.id);
    setEditingLevelData({ 
      name: level.name, 
      description: level.description || "", 
      points: level.points 
    });
  };

  const saveLevel = (levelId: string) => {
    updateLevel({ 
      levelId, 
      name: editingLevelData.name, 
      description: editingLevelData.description || undefined, 
      points: editingLevelData.points 
    });
    setEditingLevel(null);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading rubric...</div>;
  }

  if (!rubric) {
    return <div className="text-center py-8 text-muted-foreground">Rubric not found</div>;
  }

  // Get all unique levels across criteria (use first criteria as template)
  const levelColumns = rubric.criteria?.[0]?.levels || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-2">
            ← Back to Rubrics
          </Button>
          <h2 className="text-xl font-semibold">{rubric.title}</h2>
          {rubric.description && (
            <p className="text-muted-foreground">{rubric.description}</p>
          )}
        </div>
        <Dialog open={showAddCriteria} onOpenChange={setShowAddCriteria}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Criteria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Criteria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Criteria Name</label>
                <Input
                  value={newCriteriaName}
                  onChange={(e) => setNewCriteriaName(e.target.value)}
                  placeholder="e.g., Content Quality"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Textarea
                  value={newCriteriaDescription}
                  onChange={(e) => setNewCriteriaDescription(e.target.value)}
                  placeholder="What does this criteria measure?"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Points</label>
                <Input
                  type="number"
                  value={newCriteriaMaxPoints}
                  onChange={(e) => setNewCriteriaMaxPoints(parseInt(e.target.value) || 10)}
                  min={1}
                  max={100}
                />
              </div>
              <Button onClick={handleAddCriteria} disabled={!newCriteriaName.trim()} className="w-full">
                Add Criteria
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(!rubric.criteria || rubric.criteria.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <h3 className="font-medium mb-2">No criteria yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add criteria to define what you're assessing
            </p>
            <Button onClick={() => setShowAddCriteria(true)} variant="outline" size="sm">
              Add First Criteria
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Criteria</TableHead>
                  {levelColumns.map((level: any) => (
                    <TableHead key={level.id} className="text-center min-w-32">
                      {level.name}
                    </TableHead>
                  ))}
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rubric.criteria?.map((criteria: any) => (
                  <TableRow key={criteria.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{criteria.name}</p>
                        {criteria.description && (
                          <p className="text-xs text-muted-foreground">{criteria.description}</p>
                        )}
                        <p className="text-xs text-primary">Max: {criteria.max_points} pts</p>
                      </div>
                    </TableCell>
                    {criteria.levels?.map((level: any) => (
                      <TableCell key={level.id} className="text-center">
                        {editingLevel === level.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editingLevelData.name}
                              onChange={(e) => setEditingLevelData({ ...editingLevelData, name: e.target.value })}
                              className="text-xs h-7"
                            />
                            <Input
                              type="number"
                              value={editingLevelData.points}
                              onChange={(e) => setEditingLevelData({ ...editingLevelData, points: parseInt(e.target.value) || 0 })}
                              className="text-xs h-7"
                            />
                            <Textarea
                              value={editingLevelData.description}
                              onChange={(e) => setEditingLevelData({ ...editingLevelData, description: e.target.value })}
                              placeholder="Description..."
                              rows={2}
                              className="text-xs"
                            />
                            <div className="flex gap-1 justify-center">
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => saveLevel(level.id)}>
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingLevel(null)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-muted/50 p-2 rounded"
                            onClick={() => startEditingLevel(level)}
                          >
                            <p className="font-medium text-sm">{level.points} pts</p>
                            {level.description && (
                              <p className="text-xs text-muted-foreground mt-1">{level.description}</p>
                            )}
                            <Edit2 className="w-3 h-3 mx-auto mt-1 text-muted-foreground/50" />
                          </div>
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteCriteria(criteria.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Click on any level cell to edit the points and description. 
            Default levels (Excellent, Good, Fair, Poor) are created automatically when you add criteria.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
