import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Loader2, Sparkles, Zap, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractAudioFeatures, analyzePauses, calculateProsodyScore, type AudioFeatures } from "@/lib/audioAnalysis";
import { detectPhonemes, analyzePhonemeAccuracy, initPhonemeRecognizer, type PhonemeResult } from "@/lib/phonemeDetection";
import { RealtimeAudioAnalyzer, type LiveMetrics, type RealtimeFeedbackEvent } from "@/lib/realtimeAudioAnalysis";
import { cognitiveLoadEstimator, detectHesitationMarkers, calculatePauseDurations, type CognitiveLoadResult } from "@/lib/cognitiveLoadEstimator";
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
  freeMode?: boolean; // If true, use only browser APIs (no cloud calls)
}

// Max recording duration in seconds (55s to stay under Google's 60s limit)
const MAX_RECORDING_DURATION = 55;

export const VoiceRecorder = ({ onTranscriptionComplete, isAnalyzing = false, freeMode = false }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
  const [feedbackEvents, setFeedbackEvents] = useState<RealtimeFeedbackEvent[]>([]);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [cognitiveLoad, setCognitiveLoad] = useState<CognitiveLoadResult | null>(null);
  const [useBrowserAPI, setUseBrowserAPI] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const realtimeAnalyzerRef = useRef<RealtimeAudioAnalyzer | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");
  const confidenceRef = useRef<number[]>([]);
  const volumeHistoryRef = useRef<number[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Check browser SpeechRecognition API support and preload models
  useEffect(() => {
    const loadModel = async () => {
      setIsModelLoading(true);
      try {
        // Check for browser SpeechRecognition API
        const hasBrowserAPI = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        setUseBrowserAPI(hasBrowserAPI);
        
        if (hasBrowserAPI) {
          console.log('✅ Browser SpeechRecognition API available (Whisper fallback ready)');
        } else {
          console.log('⚠️ Browser API not supported, using Whisper');
        }
        
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

      // Reset state
      audioChunksRef.current = [];
      startTimeRef.current = Date.now();
      setFeedbackEvents([]);
      transcriptRef.current = "";
      confidenceRef.current = [];
      volumeHistoryRef.current = [];
      cognitiveLoadEstimator.reset();
      setRecordingDuration(0);

      // Start duration timer with auto-stop at max duration
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingDuration(elapsed);
        
        // Auto-stop if reaching max duration
        if (elapsed >= MAX_RECORDING_DURATION) {
          toast({
            title: "Max Duration Reached",
            description: "Recording stopped at 55 seconds (API limit).",
          });
          stopRecording();
        }
      }, 1000);

      // Start browser SpeechRecognition if available
      if (useBrowserAPI) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        
        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const confidence = event.results[i][0].confidence;
            
            if (event.results[i].isFinal) {
              final += transcript;
              transcriptRef.current += transcript + ' ';
              confidenceRef.current.push(confidence);
              
              // Calculate cognitive load in real-time
              const hesitations = detectHesitationMarkers(transcriptRef.current);
              const pauses = calculatePauseDurations(volumeHistoryRef.current);
              const avgConfidence = confidenceRef.current.length > 0
                ? confidenceRef.current.reduce((a, b) => a + b, 0) / confidenceRef.current.length
                : 0.5;
              
              const loadResult = cognitiveLoadEstimator.estimateLoad({
                speechPauses: pauses,
                speechConfidence: avgConfidence,
                hesitationMarkers: hesitations,
                responseDelay: Date.now() - startTimeRef.current,
              });
              
              setCognitiveLoad(loadResult);
              
              console.log('🧠 Cognitive Load:', Math.round(loadResult.loadScore * 100) + '%', 
                          loadResult.shouldThrottle ? '(THROTTLED)' : '(ACTIVE)');
            } else {
              interim += transcript;
            }
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'no-speech' || event.error === 'audio-capture') {
            // Non-critical errors, continue
            return;
          }
          toast({
            title: "Speech Recognition",
            description: "Browser API failed, will use Whisper fallback",
            variant: "default",
          });
        };
        
        recognition.start();
        recognitionRef.current = recognition;
        
        console.log('✅ Browser SpeechRecognition started (FREE transcription)');
      }

      // Start real-time analyzer (for volume tracking and cognitive load)
      const analyzer = new RealtimeAudioAnalyzer(
        (metrics) => {
          setLiveMetrics(metrics);
          volumeHistoryRef.current.push(metrics.currentVolume);
          if (volumeHistoryRef.current.length > 100) {
            volumeHistoryRef.current.shift();
          }
        },
        (event) => {
          // Apply cognitive load throttling to feedback
          if (!cognitiveLoad?.shouldThrottle || event.severity === 'warning') {
            setFeedbackEvents(prev => [...prev, event]);
          }
        }
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
        
        // Stop browser recognition
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
        
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
        title: useBrowserAPI ? "Recording Started (Browser API)" : "Recording Started (Whisper)",
        description: useBrowserAPI ? "FREE real-time transcription + cognitive load monitoring" : "Real-time feedback is active",
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
      // Clear duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob, durationSeconds: number) => {
    setIsProcessing(true);
    try {
      console.log('🎤 Processing audio with AURA AI...');
      
      // Use browser transcript if available
      let finalTranscript = transcriptRef.current.trim();
      const usedBrowserAPI = useBrowserAPI && finalTranscript.length > 0;
      
      // Step 1: Extract audio features (pitch, energy, prosody)
      console.log('📊 Step 1: Extracting audio features...');
      toast({
        title: "Analyzing Audio Features",
        description: "Extracting pitch, energy, and prosody...",
      });
      
      let audioFeatures: AudioFeatures | undefined;
      try {
        const rawAudioFeatures = await extractAudioFeatures(audioBlob);
        const pauseAnalysis = analyzePauses(rawAudioFeatures, durationSeconds);
        const prosodyScore = calculateProsodyScore(rawAudioFeatures);
        
        audioFeatures = {
          ...rawAudioFeatures,
          ...pauseAnalysis,
          prosodyScore
        };
        
        console.log('✅ Audio features extracted:', audioFeatures);
      } catch (featureError) {
        console.error('⚠️ Audio feature extraction failed (non-fatal):', featureError);
        audioFeatures = undefined;
      }
      
      // Step 2: Detect phonemes using Transformers.js
      console.log('🔬 Step 2: Detecting phonemes...');
      toast({
        title: "Detecting Phonemes",
        description: "Analyzing pronunciation patterns...",
      });
      
      let phonemes: PhonemeResult[] | undefined;
      try {
        phonemes = await detectPhonemes(audioBlob);
        console.log('✅ Phonemes detected:', phonemes.length);
      } catch (phonemeError) {
        console.error('⚠️ Phoneme detection failed (non-fatal):', phonemeError);
        phonemes = undefined;
      }
      
      // Step 3: Transcribe
      console.log('📝 Step 3: Transcription...');
      
      // In FREE mode: only use browser API, no cloud fallback
      if (freeMode) {
        if (!usedBrowserAPI || finalTranscript.length === 0) {
          // Free mode but browser didn't capture - show helpful message
          console.warn('⚠️ Free mode: Browser API failed to capture speech');
          toast({
            title: "Could not capture speech",
            description: "Try speaking louder or closer to your microphone. Free mode uses browser transcription only.",
            variant: "destructive",
          });
          throw new Error('Browser transcription failed - please try again speaking clearly');
        }
        console.log('✅ Free mode transcription complete:', finalTranscript);
      } else {
        // Premium mode: use cloud fallback if browser failed
        if (!usedBrowserAPI || finalTranscript.length === 0) {
          console.log('🔄 Using cloud transcription fallback...');
          toast({
            title: "Transcribing Speech",
            description: "Converting speech to text...",
          });
          
          try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            
            await new Promise<void>((resolve, reject) => {
              reader.onloadend = async () => {
                try {
                  const base64Audio = (reader.result as string).split(',')[1];

                  const { data, error } = await supabase.functions.invoke('transcribe-audio', {
                    body: { audio: base64Audio },
                  });

                  if (error) {
                    // Check for specific error codes
                    if (error.message?.includes('AUDIO_TOO_LONG')) {
                      throw new Error('Recording too long. Please keep recordings under 1 minute.');
                    }
                    throw error;
                  }

                  if (data?.error) {
                    if (data.code === 'AUDIO_TOO_LONG') {
                      throw new Error('Recording too long. Please keep recordings under 1 minute.');
                    }
                    throw new Error(data.error);
                  }

                  if (data?.text) {
                    finalTranscript = data.text;
                    console.log('✅ Cloud transcription complete:', data.text);
                    resolve();
                  } else {
                    reject(new Error('No transcript returned'));
                  }
                } catch (err) {
                  reject(err);
                }
              };
            });
          } catch (transcriptError: any) {
            console.error('❌ Transcription failed:', transcriptError);
            toast({
              title: "Transcription Failed",
              description: transcriptError.message || "Please try again with a shorter recording.",
              variant: "destructive",
            });
            throw transcriptError;
          }
        } else {
          console.log('✅ Browser API transcription complete:', finalTranscript);
        }
      }
      
      if (!finalTranscript || finalTranscript.length === 0) {
        throw new Error('No transcript available - please speak during recording');
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      
      toast({
        title: "Analysis Complete",
        description: `Processed with ${usedBrowserAPI ? 'Browser API (FREE)' : 'Cloud transcription'}`,
      });
      
      console.log('💰 Cost saved:', usedBrowserAPI ? '$0.006' : '$0');
      console.log('🧠 Final cognitive load:', cognitiveLoad ? Math.round(cognitiveLoad.loadScore * 100) + '%' : 'N/A');

      // Pass all data to backend for comprehensive analysis
      onTranscriptionComplete(finalTranscript, audioUrl, durationSeconds, audioFeatures, phonemes);
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
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              <span>AURA AI ready</span>
            </div>
            {useBrowserAPI && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3 w-3 text-green-500" />
                <span>Browser API enabled (FREE transcription)</span>
              </div>
            )}
          </div>
        )}
        
        {cognitiveLoad && isRecording && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span>🧠 Cognitive Load: {Math.round(cognitiveLoad.loadScore * 100)}%</span>
            {cognitiveLoad.shouldThrottle && (
              <span className="text-orange-500">(Throttling active)</span>
            )}
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
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className={`font-mono ${recordingDuration >= MAX_RECORDING_DURATION - 10 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')} / 0:55
              </span>
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">
              🎤 Recording... Speak clearly and naturally
            </p>
            {recordingDuration >= MAX_RECORDING_DURATION - 10 && (
              <p className="text-xs text-orange-500">Recording will stop in {MAX_RECORDING_DURATION - recordingDuration}s</p>
            )}
          </div>
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
