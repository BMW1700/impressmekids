import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface ChatMessage {
  id: string;
  group_id: string;
  student_id: string;
  message: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export const useGroupChat = (groupId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [onlineMembers, setOnlineMembers] = useState<string[]>([]);

  // Fetch messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ['group-chat', groupId],
    queryFn: async () => {
      if (!groupId) return [];

      const { data, error } = await supabase
        .from('group_chat_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Fetch profile data separately
      const studentIds = data.map((m) => m.student_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);
      
      const messagesWithProfiles = data.map((msg) => ({
        ...msg,
        profiles: profiles?.find((p) => p.id === msg.student_id) || { full_name: 'Unknown' },
      }));
      
      return messagesWithProfiles as ChatMessage[];
    },
    enabled: !!groupId,
  });

  // Send message
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!groupId) throw new Error("No group ID");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('group_chat_messages')
        .insert({
          group_id: groupId,
          student_id: user.id,
          message,
        });

      if (error) throw error;
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to send message: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Set up realtime subscription for messages
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_chat_messages',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['group-chat', groupId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);

  // Set up presence tracking
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase.channel(`presence-${groupId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: string[] = [];
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.user_id) {
              users.push(presence.user_id);
            }
          });
        });
        setOnlineMembers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await channel.track({ user_id: user.id });
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  return {
    messages,
    isLoading,
    sendMessage: sendMessage.mutate,
    onlineMembers,
  };
};
