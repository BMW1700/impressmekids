import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mic, StopCircle, Loader2, Presentation, Timer, AlertTriangle, AlertCircle, Chrome } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { extractAudioFeatures, analyzePauses, type AudioFeatures } from "@/lib/audioAnalysis";
import { RealtimeAudioAnalyzer, type LiveMetrics } from "@/lib/realtimeAudioAnalysis";
import { detectFillerWords, type FillerWordMatch } from "@/lib/presentationAnalysis";
import AudioWaveform from "./AudioWaveform";

interface PresentationRecorderProps {
  onRecordingComplete: (data: {
    transcript: string;
    audioUrl: string;
    durationSeconds: number;
    audioFeatures?: AudioFeatures;
    fillerWords: FillerWordMatch[];
    targetDuration?: number;
    topic?: string;
  }) => void;
  isAnalyzing?: boolean;
  targetDuration?: number;
  topic?: string;
}

export const PresentationRecorder = ({
  onRecordingComplete,
  isAnalyzing = false,
  targetDuration = 60,
  topic,
}: PresentationRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
  const [liveFillerCount, setLiveFillerCount] = useState(0);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [browserSupported, setBrowserSupported] = useState<boolean | null>(null);
  const [liveTranscriptLength, setLiveTranscriptLength] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const realtimeAnalyzerRef = useRef<RealtimeAudioAnalyzer | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Check browser compatibility on mount
  useEffect(() => {
    const hasBrowserAPI = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setBrowserSupported(hasBrowserAPI);
  }, []);

  const startRecording = async () => {
    if (!browserSupported) {
      toast({
        title: "Browser Not Supported",
        description: "Please use Chrome or Edge for presentation recording.",
        variant: "destructive",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setCurrentStream(stream);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      // Reset state
      audioChunksRef.current = [];
      startTimeRef.current = Date.now();
      transcriptRef.current = "";
      setLiveFillerCount(0);
      setRecordingDuration(0);
      setLiveTranscriptLength(0);

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);

      // Start browser SpeechRecognition - 100% FREE
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      let finalTranscript = '';
      let interimTranscript = '';
      
      recognition.onresult = (event: any) => {
        interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        transcriptRef.current = (finalTranscript + interimTranscript).trim();
        setLiveTranscriptLength(transcriptRef.current.length);
        
        // Live filler word detection
        const duration = (Date.now() - startTimeRef.current) / 1000;
        const fillers = detectFillerWords(transcriptRef.current, Math.max(1, duration));
        setLiveFillerCount(fillers.reduce((sum, f) => sum + f.count, 0));
      };
      
      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        // Auto-restart on recoverable errors
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
          try {
            recognition.start();
          } catch (e) {
            // Already started, ignore
          }
        }
      };
      
      recognition.onend = () => {
        // Auto-restart if still recording (browser API can timeout)
        if (isRecording && mediaRecorderRef.current?.state === 'recording') {
          try {
            recognition.start();
          } catch (e) {
            // Already started, ignore
          }
        }
      };
      
      recognition.start();
      recognitionRef.current = recognition;

      // Start real-time audio analyzer
      const analyzer = new RealtimeAudioAnalyzer(
        (metrics) => setLiveMetrics(metrics),
        () => {}
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
        
        // Stop speech recognition
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
        
        // Stop analyzer
        if (realtimeAnalyzerRef.current) {
          realtimeAnalyzerRef.current.stop();
          realtimeAnalyzerRef.current = null;
        }
        
        await processRecording(audioBlob, durationSeconds);
        stream.getTracks().forEach(track => track.stop());
        setCurrentStream(null);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: topic ? `Topic: ${topic}` : "Present your topic clearly and confidently!",
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
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processRecording = async (audioBlob: Blob, durationSeconds: number) => {
    setIsProcessing(true);
    try {
      const finalTranscript = transcriptRef.current;
      
      // Check if we got enough transcript (100% browser-based, no cloud fallback)
      if (!finalTranscript || finalTranscript.split(' ').length < 5) {
        toast({
          title: "Speech Not Captured",
          description: "We couldn't capture your speech clearly. Please try again in a quieter environment, speak louder, or check your microphone.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      // Extract audio features
      let audioFeatures: AudioFeatures | undefined;
      try {
        const rawFeatures = await extractAudioFeatures(audioBlob);
        const pauseAnalysis = analyzePauses(rawFeatures, durationSeconds);
        audioFeatures = { ...rawFeatures, ...pauseAnalysis };
      } catch (e) {
        console.error('Audio feature extraction failed:', e);
      }
      
      // Final filler word analysis
      const fillerWords = detectFillerWords(finalTranscript, durationSeconds);
      
      const audioUrl = URL.createObjectURL(audioBlob);
      
      onRecordingComplete({
        transcript: finalTranscript,
        audioUrl,
        durationSeconds,
        audioFeatures,
        fillerWords,
        targetDuration,
        topic,
      });
      
      toast({
        title: "Recording Complete!",
        description: "Analyzing your presentation...",
      });
    } catch (error) {
      console.error('Error processing recording:', error);
      toast({
        title: "Processing Failed",
        description: "Could not process recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getTimeStatus = () => {
    if (!isRecording) return null;
    const remaining = targetDuration - recordingDuration;
    
    if (remaining > 15) return { color: 'text-green-500', status: 'On track' };
    if (remaining > 0) return { color: 'text-amber-500', status: 'Wrap up soon' };
    if (remaining > -10) return { color: 'text-amber-600', status: 'Over time' };
    return { color: 'text-red-500', status: 'Way over!' };
  };

  const timeStatus = getTimeStatus();
  const progressPercent = Math.min(100, (recordingDuration / targetDuration) * 100);

  // Browser compatibility warning
  if (browserSupported === false) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="font-semibold text-lg">Browser Not Supported</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your browser doesn't support free speech recognition.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Please use <span className="font-medium">Chrome</span> or <span className="font-medium">Edge</span> for the best experience.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Chrome className="h-4 w-4" />
              <span>Recommended: Google Chrome</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Topic Display */}
      {topic && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Presentation className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Your Topic</p>
                <p className="font-medium">{topic}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recording Interface */}
      <div className="flex flex-col items-center gap-4 p-6">
        {/* Live Stats During Recording */}
        {isRecording && (
          <div className="w-full max-w-md space-y-4">
            {/* Timer */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Timer className="h-5 w-5" />
                <span className="text-3xl font-mono font-bold">
                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-lg text-muted-foreground">
                  / {Math.floor(targetDuration / 60)}:{(targetDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
              {timeStatus && (
                <p className={`text-sm mt-1 ${timeStatus.color}`}>
                  {timeStatus.status}
                </p>
              )}
              <Progress value={progressPercent} className="mt-2 h-2" />
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{liveFillerCount}</div>
                <div className="text-xs text-muted-foreground">Filler Words</div>
                {liveFillerCount > 5 && (
                  <AlertTriangle className="h-3 w-3 text-amber-500 mx-auto mt-1" />
                )}
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{liveMetrics?.currentVolume || 0}%</div>
                <div className="text-xs text-muted-foreground">Volume</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{liveMetrics?.speechRate || 0}</div>
                <div className="text-xs text-muted-foreground">WPM</div>
              </div>
            </div>

            {/* Transcript Quality Indicator */}
            {liveTranscriptLength < 10 && recordingDuration > 5 && (
              <div className="flex items-center justify-center gap-2 text-amber-500 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Speak louder or closer to mic</span>
              </div>
            )}

            {/* Waveform */}
            {currentStream && (
              <AudioWaveform stream={currentStream} isRecording={isRecording} />
            )}
          </div>
        )}

        {/* Recording Button */}
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || isAnalyzing || browserSupported === null}
          size="lg"
          className={`h-20 w-20 rounded-full ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70'
          }`}
        >
          {isProcessing || isAnalyzing ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : isRecording ? (
            <StopCircle className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>

        {/* Instructions */}
        {!isRecording && !isProcessing && !isAnalyzing && (
          <div className="text-center text-muted-foreground">
            <p className="text-sm">
              Tap to start your presentation
            </p>
            <p className="text-xs mt-1">
              Aim for {Math.floor(targetDuration / 60)}:{(targetDuration % 60).toString().padStart(2, '0')} • Speak clearly • Avoid filler words
            </p>
          </div>
        )}

        {isProcessing && (
          <p className="text-sm text-muted-foreground">
            Processing your presentation...
          </p>
        )}
      </div>
    </div>
  );
};
