import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string, audioUrl: string, durationSeconds: number) => void;
  isAnalyzing?: boolean;
}

export const VoiceRecorder = ({ onTranscriptionComplete, isAnalyzing = false }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      audioChunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const durationSeconds = (Date.now() - startTimeRef.current) / 1000;
        await processAudio(audioBlob, durationSeconds);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Failed to start recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob, durationSeconds: number) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio },
        });

        if (error) throw error;

        if (data?.text) {
          const audioUrl = URL.createObjectURL(audioBlob);
          
          toast({
            title: "Transcription Complete",
            description: "Analyzing your speech...",
          });

          onTranscriptionComplete(data.text, audioUrl, durationSeconds);
        }
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Error",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing || isAnalyzing}
        size="lg"
        variant={isRecording ? "destructive" : "default"}
        className="w-full max-w-xs"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing Speech...
          </>
        ) : isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Transcribing...
          </>
        ) : isRecording ? (
          <>
            <StopCircle className="mr-2 h-4 w-4" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="mr-2 h-4 w-4" />
            Start Recording
          </>
        )}
      </Button>
      {isRecording && (
        <p className="text-sm text-muted-foreground animate-pulse">Recording in progress...</p>
      )}
    </div>
  );
};
