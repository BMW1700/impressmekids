import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

// Get signed URL for audio with consent verification
const getSecureAudioUrl = async (
  studentId: string,
  audioUrl: string,
  expiresIn: number = 3600
): Promise<string> => {
  const path = extractStoragePath(audioUrl);
  if (!path) {
    // If we can't extract path, return empty to hide the audio
    console.warn('[SECURITY] Could not extract audio path, denying access');
    return '';
  }
  
  try {
    const { data, error } = await supabase.rpc('get_signed_audio_url', {
      p_student_id: studentId,
      p_audio_path: path,
      p_expires_in: expiresIn
    });
    
    if (error) {
      console.warn('[SECURITY] Audio access denied:', error.message);
      return ''; // Return empty if access denied
    }
    
    return data || '';
  } catch (err) {
    console.warn('[SECURITY] Failed to get signed URL:', err);
    return '';
  }
};

export const useAuraRecordings = (studentId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recordings, isLoading } = useQuery({
    queryKey: ['aura-records', studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from('aura_records')
        .select('*')
        .eq('profile_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // SECURITY: Process audio URLs through consent-checked signed URL function
      const recordsWithSecureUrls = await Promise.all(
        (data || []).map(async (record) => {
          if (record.audio_url) {
            const secureUrl = await getSecureAudioUrl(studentId, record.audio_url);
            return { ...record, audio_url: secureUrl };
          }
          return record;
        })
      );

      // SECURITY: Log AURA record access for COPPA compliance
      if (recordsWithSecureUrls.length > 0) {
        console.log('[AUDIT] AURA records accessed with secure URLs:', {
          student_id: studentId,
          record_count: recordsWithSecureUrls.length,
          timestamp: new Date().toISOString(),
        });
        
        // Also log to database for audit trail
        try {
          await supabase.rpc('log_aura_access', {
            p_student_id: studentId,
            p_record_id: recordsWithSecureUrls[0].id,
            p_access_type: 'VIEW_RECORDS',
            p_access_context: 'useAuraRecordings hook'
          });
        } catch {
          // Don't fail if logging fails
        }
      }

      return recordsWithSecureUrls;
    },
    enabled: !!studentId,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aura-records'] });
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
