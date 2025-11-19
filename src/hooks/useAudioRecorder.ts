import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderOptions {
  onRecordingComplete?: (audioUrl: string, duration: number) => void;
  uploadPath?: string; // e.g., 'teacher/assignment-123' or 'student/submission-456'
}

export const useAudioRecorder = (options: AudioRecorderOptions = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        const recordedDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(recordedDuration);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Capture in 100ms chunks
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const uploadAudio = useCallback(async () => {
    if (!audioUrl || !options.uploadPath) {
      toast({
        title: 'Error',
        description: 'No audio to upload',
        variant: 'destructive',
      });
      return null;
    }

    setIsUploading(true);
    try {
      // Fetch the blob from the object URL
      const response = await fetch(audioUrl);
      const audioBlob = await response.blob();

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${options.uploadPath}/${timestamp}.webm`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('assignment-audio')
        .upload(filename, audioBlob, {
          contentType: 'audio/webm',
          upsert: false,
        });

      if (error) throw error;

      // Get signed URL with 24-hour expiration for teacher review
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('assignment-audio')
        .createSignedUrl(data.path, 86400); // 24 hours

      if (urlError) throw urlError;

      const publicUrl = signedUrlData.signedUrl;

      if (options.onRecordingComplete) {
        options.onRecordingComplete(publicUrl, duration);
      }

      toast({
        title: 'Success',
        description: 'Audio uploaded successfully',
      });

      return publicUrl;
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to upload audio',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [audioUrl, duration, options, toast]);

  const resetRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setDuration(0);
    audioChunksRef.current = [];
  }, [audioUrl]);

  return {
    isRecording,
    audioUrl,
    duration,
    isUploading,
    startRecording,
    stopRecording,
    uploadAudio,
    resetRecording,
  };
};
