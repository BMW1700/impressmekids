import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, SkipForward, Upload, Video, Link as LinkIcon, X, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CampaignVideoGateProps {
  videoUrl?: string;
  videoUrls?: string[]; // Array of up to 5 video URLs for multi-video support
  title: string;
  onComplete: () => void;
  allowSkip?: boolean;
  isAdmin?: boolean;
  onVideoUrlChange?: (url: string) => void;
  onVideoUrlsChange?: (urls: string[]) => void; // Callback for multi-video updates
  assetKey?: string;
  maxVideos?: number; // Max number of video slots (default 5)
}

export const CampaignVideoGate = ({
  videoUrl,
  videoUrls = [],
  title,
  onComplete,
  allowSkip = true,
  isAdmin = false,
  onVideoUrlChange,
  onVideoUrlsChange,
  assetKey,
  maxVideos = 5,
}: CampaignVideoGateProps) => {
  // Combine single videoUrl with array for backward compatibility
  const allVideos = videoUrls.length > 0 ? videoUrls : (videoUrl ? [videoUrl] : []);
  
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const currentVideoUrl = allVideos[currentVideoIndex] || "";
  const hasMultipleVideos = allVideos.filter(v => v).length > 1;

  const handlePlay = () => {
    if (!currentVideoUrl) return;
    setIsPlaying(true);
    setHasStarted(true);
  };

  const handleSkip = () => {
    setIsPlaying(false);
    onComplete();
  };

  const handleVideoEnd = () => {
    // If there are more videos, go to next
    if (currentVideoIndex < allVideos.filter(v => v).length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
      setHasStarted(false);
      setIsPlaying(false);
    } else {
      setIsPlaying(false);
      onComplete();
    }
  };
  
  const handlePrevVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1);
      setHasStarted(false);
      setIsPlaying(false);
    }
  };
  
  const handleNextVideo = () => {
    const validVideos = allVideos.filter(v => v);
    if (currentVideoIndex < validVideos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
      setHasStarted(false);
      setIsPlaying(false);
    }
  };

  // Determine if current video is a YouTube URL
  const isYouTube = currentVideoUrl?.includes('youtube.com') || currentVideoUrl?.includes('youtu.be');
  
  // Convert YouTube URL to embed format
  const getYouTubeEmbedUrl = (url: string) => {
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
    if (videoIdMatch) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1&rel=0`;
    }
    return url;
  };
  
  // Update a specific video slot
  const updateVideoSlot = (index: number, url: string) => {
    const newUrls = [...allVideos];
    // Ensure array is long enough
    while (newUrls.length <= index) {
      newUrls.push('');
    }
    newUrls[index] = url;
    
    if (onVideoUrlsChange) {
      onVideoUrlsChange(newUrls.filter(v => v)); // Remove empty strings
    } else if (onVideoUrlChange && index === 0) {
      onVideoUrlChange(url);
    }
  };
  
  const removeVideoSlot = (index: number) => {
    const newUrls = allVideos.filter((_, i) => i !== index);
    if (onVideoUrlsChange) {
      onVideoUrlsChange(newUrls);
    }
    if (currentVideoIndex >= newUrls.length) {
      setCurrentVideoIndex(Math.max(0, newUrls.length - 1));
    }
  };

  // Handle file upload for a specific slot
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, slotIndex?: number) => {
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
      const targetSlot = slotIndex ?? editingSlot ?? 0;
      const fileName = `${assetKey || 'video'}-slot${targetSlot}-${Date.now()}.${fileExt}`;

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
      updateVideoSlot(targetSlot, publicUrl);

      toast({
        title: "Video uploaded!",
        description: `Video ${targetSlot + 1} has been uploaded successfully.`,
      });
      setEditingSlot(null);
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

  // Handle URL save for a specific slot
  const handleSaveUrl = (slotIndex?: number) => {
    if (urlInput.trim()) {
      const targetSlot = slotIndex ?? editingSlot ?? 0;
      updateVideoSlot(targetSlot, urlInput.trim());
      toast({
        title: "Video URL saved!",
        description: `Video ${targetSlot + 1} URL has been saved.`,
      });
    }
    setEditingSlot(null);
    setUrlInput("");
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
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">{title}</h2>
              {hasMultipleVideos && (
                <span className="text-sm text-muted-foreground">
                  ({currentVideoIndex + 1} of {allVideos.filter(v => v).length})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadPanel(!showUploadPanel)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Manage Videos
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
                  {currentVideoUrl ? "Skip All" : "Continue"}
                </Button>
              )}
            </div>
          </div>

          {/* Admin Upload Panel - Multi-Video Management */}
          {showUploadPanel && isAdmin && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b bg-muted/30 p-4 space-y-4 max-h-80 overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Manage Video Slots (up to {maxVideos})</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowUploadPanel(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Video Slots Grid */}
              <div className="space-y-3">
                {Array.from({ length: maxVideos }).map((_, index) => {
                  const slotUrl = allVideos[index] || '';
                  const isEditing = editingSlot === index;
                  
                  return (
                    <div key={index} className="p-3 border rounded-lg bg-background/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Video {index + 1}</span>
                        <div className="flex items-center gap-2">
                          {slotUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => removeVideoSlot(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSlot(isEditing ? null : index);
                              setUrlInput(slotUrl);
                            }}
                          >
                            {slotUrl ? 'Edit' : 'Add'}
                          </Button>
                        </div>
                      </div>
                      
                      {slotUrl && !isEditing && (
                        <p className="text-xs text-muted-foreground truncate">
                          {slotUrl.includes('youtube') ? '🎬 YouTube: ' : '📹 Video: '}
                          {slotUrl.substring(0, 50)}...
                        </p>
                      )}
                      
                      {isEditing && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-2 mt-2"
                        >
                          <div className="flex gap-2">
                            <input
                              ref={index === editingSlot ? fileInputRef : undefined}
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, index)}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                            >
                              <Video className="h-3 w-3 mr-1" />
                              {isUploading ? "..." : "Upload"}
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="YouTube or video URL..."
                              value={urlInput}
                              onChange={(e) => setUrlInput(e.target.value)}
                              className="text-xs h-8"
                            />
                            <Button 
                              size="sm" 
                              onClick={() => handleSaveUrl(index)}
                              disabled={!urlInput.trim()}
                            >
                              <LinkIcon className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Video Container */}
          <div className="relative aspect-video bg-black">
            {!currentVideoUrl ? (
              // No video configured - show placeholder
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="text-6xl opacity-30">🎬</div>
                <p className="text-white/60 text-center px-8">
                  {isAdmin 
                    ? "No cutscene videos configured. Click 'Manage Videos' above to add up to 5."
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
                  Click to watch {hasMultipleVideos ? `(${currentVideoIndex + 1}/${allVideos.filter(v => v).length})` : ''}
                </p>
              </motion.div>
            ) : isYouTube ? (
              // YouTube embed
              <iframe
                src={getYouTubeEmbedUrl(currentVideoUrl)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsPlaying(true)}
              />
            ) : (
              // Direct video file
              <video
                src={currentVideoUrl}
                className="w-full h-full"
                controls
                autoPlay
                onEnded={handleVideoEnd}
                onPlay={() => setIsPlaying(true)}
              />
            )}
            
            {/* Navigation Arrows for Multiple Videos */}
            {hasMultipleVideos && hasStarted && (
              <>
                {currentVideoIndex > 0 && (
                  <button
                    onClick={handlePrevVideo}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors z-20"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}
                {currentVideoIndex < allVideos.filter(v => v).length - 1 && (
                  <button
                    onClick={handleNextVideo}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors z-20"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
              </>
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
