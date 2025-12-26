import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, SkipForward, X } from "lucide-react";

interface CampaignVideoGateProps {
  videoUrl?: string;
  title: string;
  onComplete: () => void;
  allowSkip?: boolean;
}

export const CampaignVideoGate = ({
  videoUrl,
  title,
  onComplete,
  allowSkip = true,
}: CampaignVideoGateProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // If no video URL, skip automatically
  if (!videoUrl) {
    return null;
  }

  const handlePlay = () => {
    setIsPlaying(true);
    setHasStarted(true);
  };

  const handleSkip = () => {
    setIsPlaying(false);
    onComplete();
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    onComplete();
  };

  // Determine if it's a YouTube URL
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  
  // Convert YouTube URL to embed format
  const getYouTubeEmbedUrl = (url: string) => {
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
    if (videoIdMatch) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1&rel=0`;
    }
    return url;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      >
        <Card className="w-full max-w-4xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-bold">{title}</h2>
            {allowSkip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="flex items-center gap-2"
              >
                <SkipForward className="h-4 w-4" />
                Skip
              </Button>
            )}
          </div>

          {/* Video Container */}
          <div className="relative aspect-video bg-black">
            {!hasStarted ? (
              // Play button overlay
              <motion.div
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                onClick={handlePlay}
                whileHover={{ scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-indigo-600/30" />
                <motion.div
                  className="z-10 w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="h-8 w-8 text-primary ml-1" fill="currentColor" />
                </motion.div>
                <p className="absolute bottom-8 text-white text-lg font-medium">
                  Click to watch
                </p>
              </motion.div>
            ) : isYouTube ? (
              // YouTube embed
              <iframe
                src={getYouTubeEmbedUrl(videoUrl)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsPlaying(true)}
              />
            ) : (
              // Direct video file
              <video
                src={videoUrl}
                className="w-full h-full"
                controls
                autoPlay
                onEnded={handleVideoEnd}
                onPlay={() => setIsPlaying(true)}
              />
            )}
          </div>

          {/* Footer with continue button (shows after video plays for YouTube) */}
          {hasStarted && isYouTube && (
            <div className="p-4 border-t flex justify-end">
              <Button onClick={handleSkip} className="flex items-center gap-2">
                Continue
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
