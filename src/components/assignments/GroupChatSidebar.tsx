import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle } from "lucide-react";
import { useGroupChat } from "@/hooks/useGroupChat";
import { format } from "date-fns";

interface GroupChatSidebarProps {
  groupId: string;
  currentUserId: string;
  groupMembers: Array<{ student_id: string; profiles?: { full_name: string } }>;
}

export const GroupChatSidebar = ({
  groupId,
  currentUserId,
  groupMembers,
}: GroupChatSidebarProps) => {
  const [message, setMessage] = useState("");
  const { messages, sendMessage, onlineMembers } = useGroupChat(groupId);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage(message);
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          Group Chat
        </CardTitle>
        <div className="flex flex-wrap gap-1 mt-2">
          {groupMembers.map((member) => {
            const isOnline = onlineMembers.includes(member.student_id);
            return (
              <Badge
                key={member.student_id}
                variant={isOnline ? "default" : "secondary"}
                className="text-xs"
              >
                <span className={`w-2 h-2 rounded-full mr-1 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                {member.profiles?.full_name?.split(' ')[0] || 'Member'}
              </Badge>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 p-4 pt-0">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            {messages?.map((msg) => {
              const isCurrentUser = msg.student_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 max-w-[80%] ${
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {!isCurrentUser && (
                      <p className="text-xs font-semibold mb-1">
                        {msg.profiles?.full_name}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    <p className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
