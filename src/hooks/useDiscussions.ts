import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DiscussionTopic {
  id: string;
  classroom_id: string;
  created_by: string;
  title: string;
  description: string | null;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  author?: { full_name: string };
  post_count?: number;
  last_post_at?: string;
}

interface DiscussionPost {
  id: string;
  topic_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  author?: { full_name: string };
  replies?: DiscussionPost[];
}

export const useDiscussionTopics = (classroomId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: topics, isLoading } = useQuery({
    queryKey: ['discussion-topics', classroomId],
    queryFn: async () => {
      if (!classroomId) return [];

      const { data, error } = await supabase
        .from('discussion_topics')
        .select(`
          *,
          author:profiles!discussion_topics_created_by_fkey(full_name)
        `)
        .eq('classroom_id', classroomId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get post counts for each topic
      const topicsWithCounts = await Promise.all((data || []).map(async (topic) => {
        const { count } = await supabase
          .from('discussion_posts')
          .select('*', { count: 'exact', head: true })
          .eq('topic_id', topic.id);

        const { data: lastPost } = await supabase
          .from('discussion_posts')
          .select('created_at')
          .eq('topic_id', topic.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...topic,
          post_count: count || 0,
          last_post_at: lastPost?.created_at
        };
      }));

      return topicsWithCounts as DiscussionTopic[];
    },
    enabled: !!classroomId,
  });

  const createTopic = useMutation({
    mutationFn: async ({ title, description }: { title: string; description?: string }) => {
      if (!classroomId) throw new Error('Missing classroom ID');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('discussion_topics')
        .insert({
          classroom_id: classroomId,
          created_by: user.id,
          title,
          description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-topics', classroomId] });
      toast({ title: "Topic Created", description: "Discussion topic created successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateTopic = useMutation({
    mutationFn: async ({ topicId, is_pinned, is_locked }: { topicId: string; is_pinned?: boolean; is_locked?: boolean }) => {
      const { error } = await supabase
        .from('discussion_topics')
        .update({ is_pinned, is_locked, updated_at: new Date().toISOString() })
        .eq('id', topicId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-topics', classroomId] });
    },
  });

  const deleteTopic = useMutation({
    mutationFn: async (topicId: string) => {
      const { error } = await supabase
        .from('discussion_topics')
        .delete()
        .eq('id', topicId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-topics', classroomId] });
      toast({ title: "Topic Deleted" });
    },
  });

  return {
    topics: topics || [],
    isLoading,
    createTopic: createTopic.mutate,
    updateTopic: updateTopic.mutate,
    deleteTopic: deleteTopic.mutate,
    isCreating: createTopic.isPending,
  };
};

export const useDiscussionPosts = (topicId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['discussion-posts', topicId],
    queryFn: async () => {
      if (!topicId) return [];

      const { data, error } = await supabase
        .from('discussion_posts')
        .select(`
          *,
          author:profiles!discussion_posts_author_id_fkey(full_name)
        `)
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize into threaded structure
      const postsMap = new Map<string, DiscussionPost>();
      const rootPosts: DiscussionPost[] = [];

      (data || []).forEach(post => {
        postsMap.set(post.id, { ...post, replies: [] });
      });

      postsMap.forEach(post => {
        if (post.parent_id && postsMap.has(post.parent_id)) {
          postsMap.get(post.parent_id)!.replies!.push(post);
        } else if (!post.parent_id) {
          rootPosts.push(post);
        }
      });

      return rootPosts;
    },
    enabled: !!topicId,
  });

  const createPost = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      if (!topicId) throw new Error('Missing topic ID');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('discussion_posts')
        .insert({
          topic_id: topicId,
          author_id: user.id,
          content,
          parent_id: parentId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-posts', topicId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('discussion_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-posts', topicId] });
    },
  });

  return {
    posts: posts || [],
    isLoading,
    createPost: createPost.mutate,
    deletePost: deletePost.mutate,
    isCreating: createPost.isPending,
  };
};
