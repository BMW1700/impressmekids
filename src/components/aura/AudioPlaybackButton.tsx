import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AudioPlaybackButtonProps {
  audioUrl: string | null;
  audioPath?: string; // Path in storage bucket (if using signed URLs)
  compact?: boolean;
  showProgress?: boolean;
}

export function AudioPlaybackButton({ 
  audioUrl, 
  audioPath,
  compact = false,
  showProgress = true 
}: AudioPlaybackButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(audioUrl);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Resolve signed URL if audioPath is provided
  useEffect(() => {
    async function getSignedUrl() {
      if (audioPath && !audioUrl) {
        setIsLoading(true);
        try {
          const { data, error } = await supabase.storage
            .from('aura-audio')
            .createSignedUrl(audioPath, 3600); // 1 hour expiry

          if (error) throw error;
          setResolvedUrl(data.signedUrl);
        } catch (err) {
          console.error('Error getting signed URL:', err);
          toast({
            title: 'Audio Error',
            description: 'Could not load audio recording',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setResolvedUrl(audioUrl);
      }
    }

    getSignedUrl();
  }, [audioPath, audioUrl, toast]);

  // Initialize audio element
  useEffect(() => {
    if (resolvedUrl) {
      const audio = new Audio(resolvedUrl);
      audio.preload = 'metadata';
      
      audio.onloadedmetadata = () => {
        // Handle NaN or Infinity duration
        if (audio.duration && isFinite(audio.duration) && !isNaN(audio.duration)) {
          setDuration(audio.duration);
        }
      };
      
      // Also try to get duration when audio can play
      audio.oncanplaythrough = () => {
        if (audio.duration && isFinite(audio.duration) && !isNaN(audio.duration) && duration === 0) {
          setDuration(audio.duration);
        }
      };
      
      audio.ontimeupdate = () => {
        if (audio.duration && isFinite(audio.duration) && !isNaN(audio.duration)) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      
      audio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
      };
      
      audio.onerror = () => {
        console.error('Audio playback error for URL:', resolvedUrl);
        toast({
          title: 'Playback Error',
          description: 'Could not play audio recording',
          variant: 'destructive',
        });
        setIsPlaying(false);
      };
      
      audioRef.current = audio;
      
      return () => {
        audio.pause();
        audio.src = '';
      };
    }
  }, [resolvedUrl, toast, duration]);

  const togglePlayback = () => {
    if (!audioRef.current || !resolvedUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.error('Playback error:', err);
        toast({
          title: 'Playback Error',
          description: 'Could not start playback',
          variant: 'destructive',
        });
      });
      setIsPlaying(true);
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = (value[0] / 100) * duration;
    audioRef.current.currentTime = newTime;
    setProgress(value[0]);
  };

  const formatTime = (seconds: number) => {
    // Handle NaN, Infinity, and undefined values
    if (!seconds || !isFinite(seconds) || isNaN(seconds)) {
      return '--:--';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!resolvedUrl && !isLoading && !audioPath) {
    return null;
  }

  if (compact) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={togglePlayback}
        disabled={isLoading || !resolvedUrl}
        className="gap-1"
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
        {isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayback}
        disabled={isLoading || !resolvedUrl}
        className="h-10 w-10 shrink-0"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </Button>
      
      {showProgress && (
        <>
          <div className="flex-1 space-y-1">
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime((progress / 100) * duration)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
        </>
      )}
    </div>
  );
}
