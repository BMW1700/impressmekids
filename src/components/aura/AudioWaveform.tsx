import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface AudioWaveformProps {
  stream: MediaStream | null;
  isRecording: boolean;
}

const AudioWaveform = ({ stream, isRecording }: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !isRecording) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Create audio context
    audioContextRef.current = new AudioContext();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    const analyser = audioContextRef.current.createAnalyser();
    
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyser || !ctx || !canvas) return;

      animationRef.current = requestAnimationFrame(draw);
      
      analyser.getByteTimeDomainData(dataArray);

      // Get computed CSS variables
      const styles = getComputedStyle(document.documentElement);
      const bgColor = styles.getPropertyValue('--background').trim();
      const mutedColor = styles.getPropertyValue('--muted').trim();
      const primaryColor = styles.getPropertyValue('--primary').trim();

      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight);
      gradient.addColorStop(0, `hsl(${bgColor})`);
      gradient.addColorStop(1, `hsl(${mutedColor})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Draw waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = `hsl(${primaryColor})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `hsl(${primaryColor} / 0.5)`;
      ctx.beginPath();

      const sliceWidth = canvas.offsetWidth / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.offsetHeight) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.offsetWidth, canvas.offsetHeight / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream, isRecording]);

  if (!isRecording) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[120px] flex items-center justify-center bg-muted/30">
            <p className="text-sm text-muted-foreground">Waveform will appear when recording</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-2 border-primary/20">
      <CardContent className="p-0">
        <canvas
          ref={canvasRef}
          className="w-full h-[120px]"
          style={{ display: 'block' }}
        />
      </CardContent>
    </Card>
  );
};

export default AudioWaveform;