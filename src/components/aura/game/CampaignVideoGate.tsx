import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, SkipForward, Upload, Video, Link as LinkIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CampaignVideoGateProps {
  videoUrl?: string;
  title: string;
  onComplete: () => void;
  allowSkip?: boolean;
  isAdmin?: boolean;
  onVideoUrlChange?: (url: string) => void;
  assetKey?: string;
}

export const CampaignVideoGate = ({
  videoUrl,
  title,
  onComplete,
  allowSkip = true,
  isAdmin = false,
  onVideoUrlChange,
  assetKey,
}: CampaignVideoGateProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [urlInput, setUrlInput] = useState(videoUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handlePlay = () => {
    if (!videoUrl) return;
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
  const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be');
  
  // Convert YouTube URL to embed format
  const getYouTubeEmbedUrl = (url: string) => {
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
    if (videoIdMatch) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1&rel=0`;
    }
    return url;
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file (MP4, WebM, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be under 100MB. Consider using a YouTube link instead.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${assetKey || 'video'}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('campaign-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('campaign-assets')
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;
      setUrlInput(publicUrl);
      
      if (onVideoUrlChange) {
        onVideoUrlChange(publicUrl);
      }

      toast({
        title: "Video uploaded!",
        description: "Your cutscene video has been uploaded successfully.",
      });
      setShowUploadPanel(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload video. Please try again or use a URL.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle URL save
  const handleSaveUrl = () => {
    if (onVideoUrlChange && urlInput.trim()) {
      onVideoUrlChange(urlInput.trim());
      toast({
        title: "Video URL saved!",
        description: "Your cutscene video URL has been saved.",
      });
    }
    setShowUploadPanel(false);
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
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadPanel(!showUploadPanel)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {videoUrl ? "Change Video" : "Add Video"}
                </Button>
              )}
              {allowSkip && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="flex items-center gap-2"
                >
                  <SkipForward className="h-4 w-4" />
                  {videoUrl ? "Skip" : "Continue"}
                </Button>
              )}
            </div>
          </div>

          {/* Admin Upload Panel */}
          {showUploadPanel && isAdmin && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b bg-muted/30 p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Upload Cutscene Video</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowUploadPanel(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Upload Video File</Label>
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-2"
                    >
                      <Video className="h-4 w-4" />
                      {isUploading ? "Uploading..." : "Choose Video File"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    MP4, WebM (max 100MB)
                  </p>
                </div>

                {/* OR divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">OR</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* URL Input */}
                <div className="space-y-2">
                  <Label>Paste Video URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://youtube.com/watch?v=... or direct MP4 URL"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                    />
                    <Button onClick={handleSaveUrl} disabled={!urlInput.trim()}>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    YouTube links or direct video URLs work
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Video Container */}
          <div className="relative aspect-video bg-black">
            {!videoUrl ? (
              // No video configured - show placeholder
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="text-6xl opacity-30">🎬</div>
                <p className="text-white/60 text-center px-8">
                  {isAdmin 
                    ? "No cutscene video configured. Click 'Add Video' above to add one."
                    : "No cutscene configured for this section."
                  }
                </p>
                {!isAdmin && (
                  <Button onClick={handleSkip} variant="secondary">
                    Continue
                  </Button>
                )}
              </div>
            ) : !hasStarted ? (
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
