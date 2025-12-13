import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MessageSquare, Plus, Pin, Lock, MoreVertical, Trash2, MessageCircle, Clock } from "lucide-react";
import { useDiscussionTopics } from "@/hooks/useDiscussions";
import { DiscussionThread } from "./DiscussionThread";
import { formatDistanceToNow } from "date-fns";

interface DiscussionBoardProps {
  classroomId: string;
  isTeacher?: boolean;
}

export const DiscussionBoard = ({ classroomId, isTeacher = false }: DiscussionBoardProps) => {
  const { topics, isLoading, createTopic, updateTopic, deleteTopic, isCreating } = useDiscussionTopics(classroomId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const handleCreateTopic = () => {
    if (!newTitle.trim()) return;
    createTopic({ title: newTitle, description: newDescription || undefined });
    setNewTitle("");
    setNewDescription("");
    setShowCreateDialog(false);
  };

  if (selectedTopicId) {
    const topic = topics.find(t => t.id === selectedTopicId);
    return (
      <DiscussionThread 
        topicId={selectedTopicId} 
        topicTitle={topic?.title || "Discussion"}
        isLocked={topic?.is_locked || false}
        isTeacher={isTeacher}
        onBack={() => setSelectedTopicId(null)} 
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Discussion Board</h2>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Topic
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Discussion Topic</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Topic Title</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What would you like to discuss?"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide more context..."
                  rows={3}
                />
              </div>
              <Button 
                onClick={handleCreateTopic} 
                disabled={!newTitle.trim() || isCreating}
                className="w-full"
              >
                Create Topic
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading discussions...</div>
      ) : topics.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-2">No discussions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start a new discussion topic to engage with your class
            </p>
            <Button onClick={() => setShowCreateDialog(true)} variant="outline" size="sm">
              Create First Topic
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {topics.map((topic) => (
            <Card 
              key={topic.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedTopicId(topic.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {topic.is_pinned && (
                        <Pin className="w-3 h-3 text-primary" />
                      )}
                      {topic.is_locked && (
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      )}
                      <h3 className="font-medium truncate">{topic.title}</h3>
                    </div>
                    {topic.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {topic.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>by {topic.author?.full_name || "Unknown"}</span>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {topic.post_count} {topic.post_count === 1 ? 'reply' : 'replies'}
                      </div>
                      {topic.last_post_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(topic.last_post_at), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </div>
                  {isTeacher && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          updateTopic({ topicId: topic.id, is_pinned: !topic.is_pinned });
                        }}>
                          <Pin className="w-4 h-4 mr-2" />
                          {topic.is_pinned ? 'Unpin' : 'Pin'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          updateTopic({ topicId: topic.id, is_locked: !topic.is_locked });
                        }}>
                          <Lock className="w-4 h-4 mr-2" />
                          {topic.is_locked ? 'Unlock' : 'Lock'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTopic(topic.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
