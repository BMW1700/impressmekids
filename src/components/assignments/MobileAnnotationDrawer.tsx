import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, Save, X } from "lucide-react";
import { useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface Highlight {
  id: string;
  highlighted_text: string;
  annotation: string | null;
  color: string;
}

interface MobileAnnotationDrawerProps {
  highlights: Highlight[];
  onUpdateAnnotation: (id: string, annotation: string) => void;
  onDeleteHighlight: (id: string) => void;
  onHighlightClick: (highlight: Highlight) => void;
  hoveredHighlightId: string | null;
  isReadOnly: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileAnnotationDrawer({
  highlights,
  onUpdateAnnotation,
  onDeleteHighlight,
  onHighlightClick,
  hoveredHighlightId,
  isReadOnly,
  open,
  onOpenChange,
}: MobileAnnotationDrawerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const startEditing = (highlight: Highlight) => {
    setEditingId(highlight.id);
    setEditText(highlight.annotation || "");
  };

  const saveEdit = (id: string) => {
    onUpdateAnnotation(id, editText);
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Your Annotations ({highlights.length})</DrawerTitle>
          <DrawerDescription>
            {isReadOnly
              ? "View your submitted annotations"
              : "Tap to edit or delete highlights"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
          {highlights.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No highlights yet. Select text in the passage to add annotations.
            </p>
          ) : (
            <div className="space-y-3">
              {highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  id={`annotation-${highlight.id}`}
                  className={`p-3 border rounded-lg transition-all ${
                    hoveredHighlightId === highlight.id
                      ? "ring-2 ring-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => onHighlightClick(highlight)}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded mt-1 flex-shrink-0"
                      style={{ backgroundColor: highlight.color }}
                    />
                    <p className="text-sm font-medium flex-1 line-clamp-2">
                      "{highlight.highlighted_text}"
                    </p>
                  </div>

                  {editingId === highlight.id ? (
                    <div className="space-y-2 mt-2">
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder="Edit your note..."
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveEdit(highlight.id)}
                          disabled={!editText.trim()}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {highlight.annotation && (
                        <p className="text-sm text-muted-foreground ml-6 mb-2">
                          {highlight.annotation}
                        </p>
                      )}

                      {!isReadOnly && (
                        <div className="flex gap-2 ml-6">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(highlight);
                            }}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteHighlight(highlight.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
