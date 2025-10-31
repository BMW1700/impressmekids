import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Plus, Trash2 } from "lucide-react";
import { useAssignmentGroups } from "@/hooks/useAssignmentGroups";

interface GroupManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  students: Array<{ id: string; full_name: string }>;
}

interface GroupDraft {
  name: string;
  memberIds: string[];
}

export const GroupManagementModal = ({
  open,
  onOpenChange,
  assignmentId,
  students,
}: GroupManagementModalProps) => {
  const [groups, setGroups] = useState<GroupDraft[]>([
    { name: "Group 1", memberIds: [] },
  ]);
  const { createGroups } = useAssignmentGroups(assignmentId);

  const addGroup = () => {
    setGroups([...groups, { name: `Group ${groups.length + 1}`, memberIds: [] }]);
  };

  const removeGroup = (index: number) => {
    setGroups(groups.filter((_, i) => i !== index));
  };

  const updateGroupName = (index: number, name: string) => {
    const updated = [...groups];
    updated[index].name = name;
    setGroups(updated);
  };

  const toggleStudent = (groupIndex: number, studentId: string) => {
    const updated = [...groups];
    const memberIds = updated[groupIndex].memberIds;
    
    if (memberIds.includes(studentId)) {
      updated[groupIndex].memberIds = memberIds.filter(id => id !== studentId);
    } else {
      updated[groupIndex].memberIds = [...memberIds, studentId];
    }
    
    setGroups(updated);
  };

  const handleSave = () => {
    const validGroups = groups.filter(g => g.memberIds.length > 0);
    
    if (validGroups.length === 0) {
      return;
    }

    createGroups(
      { assignmentId, groups: validGroups },
      {
        onSuccess: () => {
          onOpenChange(false);
          setGroups([{ name: "Group 1", memberIds: [] }]);
        },
      }
    );
  };

  const getStudentGroupCount = (studentId: string) => {
    return groups.filter(g => g.memberIds.includes(studentId)).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Groups
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {groups.map((group, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={group.name}
                    onChange={(e) => updateGroupName(index, e.target.value)}
                    placeholder="Group name"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeGroup(index)}
                    disabled={groups.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Select Students ({group.memberIds.length} selected)
                  </Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {students.map((student) => {
                      const inOtherGroups = getStudentGroupCount(student.id) - 
                        (group.memberIds.includes(student.id) ? 1 : 0);
                      
                      return (
                        <div key={student.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={group.memberIds.includes(student.id)}
                            onCheckedChange={() => toggleStudent(index, student.id)}
                          />
                          <span className="text-sm">
                            {student.full_name}
                            {inOtherGroups > 0 && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (in {inOtherGroups} other group{inOtherGroups > 1 ? 's' : ''})
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            <Button onClick={addGroup} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Another Group
            </Button>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Groups</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
