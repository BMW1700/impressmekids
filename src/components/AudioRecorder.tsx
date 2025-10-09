import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Play, RotateCcw, Upload } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface AudioRecorderProps {
  onAudioReady: (audioUrl: string, duration: number) => void;
  uploadPath: string;
  showUploadButton?: boolean;
}

export const AudioRecorder = ({ onAudioReady, uploadPath, showUploadButton = true }: AudioRecorderProps) => {
  const {
    isRecording,
    audioUrl,
    duration,
    isUploading,
    startRecording,
    stopRecording,
    uploadAudio,
    resetRecording,
  } = useAudioRecorder({
    onRecordingComplete: onAudioReady,
    uploadPath,
  });

  const handleUseAudio = async () => {
    const url = await uploadAudio();
    if (url) {
      onAudioReady(url, duration);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center gap-4">
          {!audioUrl && !isRecording && (
            <Button onClick={startRecording} size="lg">
              <Mic className="mr-2 h-5 w-5" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <Button onClick={stopRecording} variant="destructive" size="lg">
              <Square className="mr-2 h-5 w-5" />
              Stop Recording
            </Button>
          )}

          {audioUrl && (
            <div className="flex flex-col items-center gap-3 w-full">
              <audio controls src={audioUrl} className="w-full max-w-md" />
              
              <div className="flex gap-2">
                <Button onClick={resetRecording} variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Record New
                </Button>
                
                {showUploadButton && (
                  <Button onClick={handleUseAudio} disabled={isUploading}>
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? 'Uploading...' : 'Use Audio'}
                  </Button>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground">
                Duration: {duration}s
              </p>
            </div>
          )}
        </div>

        {isRecording && (
          <div className="flex items-center justify-center">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Recording...</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
