import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit2, Trash2, X, Check } from "lucide-react";

interface Highlight {
  id: string;
  highlighted_text: string;
  annotation: string | null;
  color: string;
  start_offset: number;
}

interface AnnotationSidebarProps {
  highlights: Highlight[];
  onUpdateAnnotation: (id: string, annotation: string) => void;
  onDeleteHighlight: (id: string) => void;
  onHighlightClick: (highlight: Highlight) => void;
  hoveredHighlightId: string | null;
  isReadOnly?: boolean;
}

export const AnnotationSidebar = ({
  highlights,
  onUpdateAnnotation,
  onDeleteHighlight,
  onHighlightClick,
  hoveredHighlightId,
  isReadOnly = false,
}: AnnotationSidebarProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const startEdit = (highlight: Highlight) => {
    setEditingId(highlight.id);
    setEditText(highlight.annotation || "");
  };

  const saveEdit = (id: string) => {
    if (editText.trim()) {
      onUpdateAnnotation(id, editText.trim());
    }
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          Your Annotations ({highlights.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4 pb-4">
          {highlights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p className="mb-2">No highlights yet</p>
              <p className="text-xs">
                Select text in the passage to create a highlight
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {highlights.map((highlight, index) => (
                <Card
                  key={highlight.id}
                  id={`annotation-${highlight.id}`}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    hoveredHighlightId === highlight.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => onHighlightClick(highlight)}
                  style={{
                    borderLeft: `4px solid ${highlight.color}`,
                  }}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant="outline"
                        style={{ backgroundColor: `${highlight.color}20`, borderColor: highlight.color }}
                      >
                        #{index + 1}
                      </Badge>
                      {!isReadOnly && (
                        <div className="flex gap-1">
                          {editingId !== highlight.id && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEdit(highlight);
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteHighlight(highlight.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      "{highlight.highlighted_text}"
                    </p>

                    {editingId === highlight.id ? (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          placeholder="Add your note..."
                          rows={3}
                          className="text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveEdit(highlight.id)}
                            disabled={!editText.trim()}
                          >
                            <Check className="h-3 w-3 mr-1" />
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
                      <p className="text-sm text-muted-foreground italic">
                        {highlight.annotation || "No annotation"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
