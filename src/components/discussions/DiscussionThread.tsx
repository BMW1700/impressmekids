import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Lock, Reply, Trash2 } from "lucide-react";
import { useDiscussionPosts } from "@/hooks/useDiscussions";
import { formatDistanceToNow } from "date-fns";

interface DiscussionThreadProps {
  topicId: string;
  topicTitle: string;
  isLocked: boolean;
  isTeacher: boolean;
  onBack: () => void;
}

interface PostProps {
  post: any;
  isTeacher: boolean;
  onReply: (postId: string) => void;
  onDelete: (postId: string) => void;
  depth?: number;
}

const PostCard = ({ post, isTeacher, onReply, onDelete, depth = 0 }: PostProps) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getInitials(post.author?.full_name || 'U')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{post.author?.full_name || 'Unknown'}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{post.content}</p>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onReply(post.id)}
                >
                  <Reply className="w-3 h-3 mr-1" />
                  Reply
                </Button>
                {isTeacher && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => onDelete(post.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {post.replies && post.replies.length > 0 && (
        <div className="space-y-2">
          {post.replies.map((reply: any) => (
            <PostCard 
              key={reply.id} 
              post={reply} 
              isTeacher={isTeacher}
              onReply={onReply}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const DiscussionThread = ({ topicId, topicTitle, isLocked, isTeacher, onBack }: DiscussionThreadProps) => {
  const { posts, isLoading, createPost, deletePost, isCreating } = useDiscussionPosts(topicId);
  const [newContent, setNewContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!newContent.trim()) return;
    createPost({ content: newContent, parentId: replyingTo || undefined });
    setNewContent("");
    setReplyingTo(null);
  };

  const handleReply = (postId: string) => {
    setReplyingTo(postId);
    // Focus on textarea
    const textarea = document.querySelector('textarea');
    textarea?.focus();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{topicTitle}</h2>
          {isLocked && (
            <Badge variant="secondary" className="gap-1 mt-1">
              <Lock className="w-3 h-3" />
              Locked
            </Badge>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
      ) : posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No posts yet. Be the first to reply!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              isTeacher={isTeacher}
              onReply={handleReply}
              onDelete={deletePost}
            />
          ))}
        </div>
      )}

      {!isLocked && (
        <Card>
          <CardContent className="p-4">
            {replyingTo && (
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <Reply className="w-4 h-4" />
                <span>Replying to a post</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Write your reply..."
                rows={2}
                className="flex-1"
              />
              <Button 
                onClick={handleSubmit} 
                disabled={!newContent.trim() || isCreating}
                size="icon"
                className="h-auto"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLocked && (
        <Card className="bg-muted/50">
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            <Lock className="w-4 h-4 inline mr-2" />
            This discussion has been locked by the teacher
          </CardContent>
        </Card>
      )}
    </div>
  );
};
