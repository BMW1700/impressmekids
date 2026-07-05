import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback } from "react";
import { USE_R2_AURA } from "@/lib/cdn";

// Helper function to extract storage path from URL
const extractStoragePath = (audioUrl: string): string | null => {
  if (!audioUrl) return null;
  
  // Handle Supabase storage URLs - extract path after /object/
  const storageMatch = audioUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/aura-audio\/(.+)/);
  if (storageMatch) {
    return storageMatch[1].split('?')[0]; // Remove query params
  }
  
  // Handle direct paths
  if (!audioUrl.startsWith('http')) {
    return audioUrl;
  }
  
  return null;
};

// Sign a single audio URL on demand (not at list load time)
export const useSignedAudioUrl = (studentId: string | undefined) => {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const getSignedUrl = useCallback(async (recordId: string, audioUrl: string): Promise<string> => {
    // Return cached URL if available and not expired (we cache for 50 mins, URLs expire in 60)
    if (signedUrls[recordId]) {
      return signedUrls[recordId];
    }

    if (!studentId || !audioUrl) return '';

    const path = extractStoragePath(audioUrl);
    if (!path) {
      console.warn('[SECURITY] Could not extract audio path, denying access');
      return '';
    }

    setLoading(prev => ({ ...prev, [recordId]: true }));

    try {
      // R2 path: presigned URL via edge function. Zero backend egress.
      if (USE_R2_AURA) {
        const { data, error } = await supabase.functions.invoke("sign-r2-audio-url", {
          body: { studentId, path, ttl: 900 },
        });
        if (error || !(data as any)?.url) {
          console.warn('[SECURITY] R2 audio access denied:', error?.message);
          return '';
        }
        const url = (data as any).url as string;
        setSignedUrls(prev => ({ ...prev, [recordId]: url }));
        return url;
      }

      // Legacy path: Supabase Storage signed URL (still works during rollout).
      const { data, error } = await supabase.rpc('get_signed_audio_url', {
        p_student_id: studentId,
        p_audio_path: path,
        p_expires_in: 3600
      });

      if (error) {
        console.warn('[SECURITY] Audio access denied:', error.message);
        return '';
      }

      const url = data || '';
      setSignedUrls(prev => ({ ...prev, [recordId]: url }));
      return url;
    } catch (err) {
      console.warn('[SECURITY] Failed to get signed URL:', err);
      return '';
    } finally {
      setLoading(prev => ({ ...prev, [recordId]: false }));
    }
  }, [studentId, signedUrls]);

  return { getSignedUrl, signedUrls, loading };
};

export const useAuraRecordings = (studentId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recordings, isLoading } = useQuery({
    queryKey: ['aura-records', studentId],
    queryFn: async () => {
      if (!studentId) return [];

      // PERFORMANCE: Fetch only essential columns, NOT audio_url for signing
      // Audio URLs will be signed on-demand when user clicks play
      const { data, error } = await supabase
        .from('aura_records')
        .select(`
          id,
          created_at,
          transcript,
          wpm,
          words,
          duration_s,
          clarity,
          confidence,
          pace,
          feedback,
          pronunciation_flags,
          suggested_exercises,
          audio_url
        `)
        .eq('profile_id', studentId)
        .order('created_at', { ascending: false })
        .limit(30); // Limit to last 30 records for performance

      if (error) throw error;

      // SECURITY: Log AURA record access for COPPA compliance (but don't sign URLs)
      if (data && data.length > 0) {
        console.log('[AUDIT] AURA records accessed (unsigned):', {
          student_id: studentId,
          record_count: data.length,
          timestamp: new Date().toISOString(),
        });
        
        // Log to database for audit trail (fire and forget)
        try {
          await supabase.rpc('log_aura_access', {
            p_student_id: studentId,
            p_record_id: data[0].id,
            p_access_type: 'VIEW_RECORDS',
            p_access_context: 'useAuraRecordings hook'
          });
        } catch {
          // Don't fail if logging fails
        }
      }

      return data || [];
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const createRecording = useMutation({
    mutationFn: async ({
      studentId,
      transcriptionText,
      audioUrl,
    }: {
      studentId: string;
      transcriptionText: string;
      audioUrl?: string;
    }) => {
      const { data, error } = await supabase
        .from('aura_records')
        .insert({
          profile_id: studentId,
          transcript: transcriptionText,
          audio_url: audioUrl || '',
          language: 'en',
          duration_s: 0,
          words: 0,
          wpm: 0,
          pace: 3,
          clarity: 3,
          confidence: 3,
          pronunciation_flags: [],
          feedback: [],
          evidence: {},
          suggested_exercises: [],
          pause_count: 0,
          avg_silence_ms: 0,
          asr_confidence: 0.95,
          request_id: crypto.randomUUID(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aura-records', variables.studentId] });
      toast({
        title: "Success",
        description: "Recording saved successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save recording.",
        variant: "destructive",
      });
      console.error('Create recording error:', error);
    },
  });

  return {
    recordings,
    isLoading,
    createRecording: createRecording.mutate,
  };
};
