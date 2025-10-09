import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractAudioFeatures, analyzePauses, calculateProsodyScore, type AudioFeatures } from "@/lib/audioAnalysis";
import { detectPhonemes, analyzePhonemeAccuracy, initPhonemeRecognizer, type PhonemeResult } from "@/lib/phonemeDetection";
import { RealtimeAudioAnalyzer, type LiveMetrics, type RealtimeFeedbackEvent } from "@/lib/realtimeAudioAnalysis";
import LiveFeedbackDisplay from "./LiveFeedbackDisplay";
import FeedbackTimeline from "./FeedbackTimeline";
import AudioWaveform from "./AudioWaveform";

interface VoiceRecorderProps {
  onTranscriptionComplete: (
    text: string, 
    audioUrl: string, 
    durationSeconds: number,
    audioFeatures?: AudioFeatures,
    phonemes?: PhonemeResult[]
  ) => void;
  isAnalyzing?: boolean;
}

export const VoiceRecorder = ({ onTranscriptionComplete, isAnalyzing = false }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
  const [feedbackEvents, setFeedbackEvents] = useState<RealtimeFeedbackEvent[]>([]);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const realtimeAnalyzerRef = useRef<RealtimeAudioAnalyzer | null>(null);
  const { toast } = useToast();

  // Preload the phoneme recognition model
  useEffect(() => {
    const loadModel = async () => {
      setIsModelLoading(true);
      try {
        await initPhonemeRecognizer();
        setModelReady(true);
        console.log('✅ AURA AI models ready');
      } catch (error) {
        console.error('Failed to load phoneme model:', error);
        toast({
          title: "Model Loading",
          description: "AI models will load when you start recording.",
        });
      } finally {
        setIsModelLoading(false);
      }
    };
    
    loadModel();
  }, [toast]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setCurrentStream(stream);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      audioChunksRef.current = [];
      startTimeRef.current = Date.now();
      setFeedbackEvents([]); // Reset feedback

      // Start real-time analyzer
      const analyzer = new RealtimeAudioAnalyzer(
        (metrics) => setLiveMetrics(metrics),
        (event) => setFeedbackEvents(prev => [...prev, event])
      );
      await analyzer.start(stream);
      realtimeAnalyzerRef.current = analyzer;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const durationSeconds = (Date.now() - startTimeRef.current) / 1000;
        
        // Stop real-time analyzer
        if (realtimeAnalyzerRef.current) {
          realtimeAnalyzerRef.current.stop();
          realtimeAnalyzerRef.current = null;
        }
        
        await processAudio(audioBlob, durationSeconds);
        stream.getTracks().forEach(track => track.stop());
        setCurrentStream(null);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: "Real-time feedback is active",
      });
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
      console.log('🎤 Processing audio with AURA AI...');
      
      // Step 1: Extract audio features (pitch, energy, prosody)
      toast({
        title: "Analyzing Audio Features",
        description: "Extracting pitch, energy, and prosody...",
      });
      
      const rawAudioFeatures = await extractAudioFeatures(audioBlob);
      const pauseAnalysis = analyzePauses(rawAudioFeatures, durationSeconds);
      const prosodyScore = calculateProsodyScore(rawAudioFeatures);
      
      const audioFeatures = {
        ...rawAudioFeatures,
        ...pauseAnalysis,
        prosodyScore
      };
      
      console.log('✅ Audio features extracted:', audioFeatures);
      
      // Step 2: Detect phonemes using Transformers.js
      toast({
        title: "Detecting Phonemes",
        description: "Analyzing pronunciation patterns...",
      });
      
      const phonemes = await detectPhonemes(audioBlob);
      console.log('✅ Phonemes detected:', phonemes.length);
      
      // Step 3: Transcribe with Whisper
      toast({
        title: "Transcribing Speech",
        description: "Converting speech to text...",
      });
      
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
          
          console.log('✅ Transcription complete:', data.text);
          
          toast({
            title: "Analysis Complete",
            description: "Generating personalized feedback...",
          });

          // Pass all data to backend for comprehensive analysis
          onTranscriptionComplete(data.text, audioUrl, durationSeconds, audioFeatures, phonemes);
        }
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Error",
        description: "Failed to analyze audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 p-6">
        {isModelLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading AI models...</span>
          </div>
        )}
        
        {modelReady && !isRecording && !isProcessing && (
          <div className="flex items-center gap-2 text-sm text-primary mb-2">
            <Sparkles className="h-4 w-4" />
            <span>AURA AI ready</span>
          </div>
        )}
        
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || isAnalyzing || isModelLoading}
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
              Processing with AI...
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
          <p className="text-sm text-muted-foreground animate-pulse">
            🎤 Recording... Speak clearly and naturally
          </p>
        )}
        
        {isProcessing && (
          <div className="text-xs text-muted-foreground space-y-1 text-center">
            <p>✨ Extracting audio features</p>
            <p>🔬 Detecting phoneme patterns</p>
            <p>📝 Transcribing speech</p>
          </div>
        )}
      </div>

      {/* Real-time visualizations */}
      {isRecording && (
        <div className="grid gap-4 md:grid-cols-2">
          <AudioWaveform stream={currentStream} isRecording={isRecording} />
          <LiveFeedbackDisplay metrics={liveMetrics} isRecording={isRecording} />
        </div>
      )}

      {/* Feedback timeline */}
      {(isRecording || feedbackEvents.length > 0) && (
        <FeedbackTimeline events={feedbackEvents} isRecording={isRecording} />
      )}
    </div>
  );
};
