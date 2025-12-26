import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Upload, Image, Video, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCampaignAssets } from "@/hooks/useCampaignAssets";

interface CampaignAssetUploaderProps {
  isAdmin?: boolean;
}

export const CampaignAssetUploader = ({
  isAdmin = false,
}: CampaignAssetUploaderProps) => {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const ellaInputRef = useRef<HTMLInputElement>(null);
  const grogInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { 
    assets, 
    updateEllaAvatar, 
    updateGrogAvatar, 
    updateCampaignIntroVideo,
    updateWorldIntroVideo,
  } = useCampaignAssets();

  // Local state for URL inputs
  const [localUrls, setLocalUrls] = useState({
    ellaAvatarUrl: '',
    grogAvatarUrl: '',
    campaignIntroVideoUrl: '',
    worldIntroVideos: {} as Record<number, string>,
  });

  // Sync local state when assets load
  useState(() => {
    if (assets) {
      setLocalUrls({
        ellaAvatarUrl: assets.ellaAvatarUrl || '',
        grogAvatarUrl: assets.grogAvatarUrl || '',
        campaignIntroVideoUrl: assets.campaignIntroVideoUrl || '',
        worldIntroVideos: assets.worldIntroVideos || {},
      });
    }
  });

  if (!isAdmin) {
    return null;
  }

  // Handle image file upload
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    assetType: 'ella' | 'grog'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB for images)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be under 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(assetType);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${assetType}-avatar-${Date.now()}.${fileExt}`;

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

      if (assetType === 'ella') {
        updateEllaAvatar(publicUrl);
        setLocalUrls(prev => ({ ...prev, ellaAvatarUrl: publicUrl }));
      } else {
        updateGrogAvatar(publicUrl);
        setLocalUrls(prev => ({ ...prev, grogAvatarUrl: publicUrl }));
      }

      toast({
        title: "Avatar uploaded!",
        description: `${assetType === 'ella' ? 'Princess Ella' : 'Grog'} avatar has been updated.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(null);
    }
  };

  // Handle URL saves
  const handleSaveUrl = (type: 'ella' | 'grog' | 'campaign' | 'world', worldNum?: number) => {
    if (type === 'ella' && localUrls.ellaAvatarUrl) {
      updateEllaAvatar(localUrls.ellaAvatarUrl);
      toast({ title: "Saved!", description: "Princess Ella avatar URL saved." });
    } else if (type === 'grog' && localUrls.grogAvatarUrl) {
      updateGrogAvatar(localUrls.grogAvatarUrl);
      toast({ title: "Saved!", description: "Grog avatar URL saved." });
    } else if (type === 'campaign' && localUrls.campaignIntroVideoUrl) {
      updateCampaignIntroVideo(localUrls.campaignIntroVideoUrl);
      toast({ title: "Saved!", description: "Campaign intro video URL saved." });
    } else if (type === 'world' && worldNum && localUrls.worldIntroVideos[worldNum]) {
      updateWorldIntroVideo(worldNum, localUrls.worldIntroVideos[worldNum]);
      toast({ title: "Saved!", description: `World ${worldNum} intro video URL saved.` });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Customize Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Campaign Assets</DialogTitle>
          <DialogDescription>
            Upload custom images and videos for the story campaign.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Character Avatars */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Image className="h-4 w-4" />
              Character Images
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Princess Ella */}
              <div className="space-y-2">
                <Label>Princess Ella Avatar</Label>
                
                {/* Upload Button */}
                <div className="flex gap-2">
                  <input
                    ref={ellaInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'ella')}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => ellaInputRef.current?.click()}
                    disabled={isUploading === 'ella'}
                  >
                    {isUploading === 'ella' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload
                  </Button>
                </div>

                {/* URL Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Or paste image URL"
                    value={localUrls.ellaAvatarUrl}
                    onChange={(e) => setLocalUrls(prev => ({ ...prev, ellaAvatarUrl: e.target.value }))}
                  />
                  <Button size="icon" onClick={() => handleSaveUrl('ella')} disabled={!localUrls.ellaAvatarUrl}>
                    <Check className="h-4 w-4" />
                  </Button>
                </div>

                {/* Preview */}
                {(localUrls.ellaAvatarUrl || assets.ellaAvatarUrl) && (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-pink-400">
                    <img
                      src={localUrls.ellaAvatarUrl || assets.ellaAvatarUrl}
                      alt="Ella preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Grog */}
              <div className="space-y-2">
                <Label>Grog Avatar</Label>
                
                {/* Upload Button */}
                <div className="flex gap-2">
                  <input
                    ref={grogInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'grog')}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => grogInputRef.current?.click()}
                    disabled={isUploading === 'grog'}
                  >
                    {isUploading === 'grog' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload
                  </Button>
                </div>

                {/* URL Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Or paste image URL"
                    value={localUrls.grogAvatarUrl}
                    onChange={(e) => setLocalUrls(prev => ({ ...prev, grogAvatarUrl: e.target.value }))}
                  />
                  <Button size="icon" onClick={() => handleSaveUrl('grog')} disabled={!localUrls.grogAvatarUrl}>
                    <Check className="h-4 w-4" />
                  </Button>
                </div>

                {/* Preview */}
                {(localUrls.grogAvatarUrl || assets.grogAvatarUrl) && (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-green-600">
                    <img
                      src={localUrls.grogAvatarUrl || assets.grogAvatarUrl}
                      alt="Grog preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Video Slots */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Video className="h-4 w-4" />
              Campaign Videos
            </h3>

            {/* Campaign Intro */}
            <div className="space-y-2">
              <Label>Campaign Intro Video URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://youtube.com/watch?v=... or direct MP4 URL"
                  value={localUrls.campaignIntroVideoUrl}
                  onChange={(e) => setLocalUrls(prev => ({ ...prev, campaignIntroVideoUrl: e.target.value }))}
                />
                <Button size="icon" onClick={() => handleSaveUrl('campaign')} disabled={!localUrls.campaignIntroVideoUrl}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This video plays when entering Story Mode for the first time.
              </p>
            </div>

            {/* World Intro Videos */}
            <div className="space-y-3">
              <Label>World Intro Videos</Label>
              {[1, 2, 3, 4].map((worldNumber) => (
                <div key={worldNumber} className="flex items-center gap-2">
                  <span className="text-sm w-20">World {worldNumber}:</span>
                  <Input
                    placeholder={`World ${worldNumber} intro video URL`}
                    value={localUrls.worldIntroVideos[worldNumber] || assets.worldIntroVideos?.[worldNumber] || ''}
                    onChange={(e) => setLocalUrls(prev => ({
                      ...prev,
                      worldIntroVideos: { ...prev.worldIntroVideos, [worldNumber]: e.target.value }
                    }))}
                  />
                  <Button 
                    size="icon" 
                    onClick={() => handleSaveUrl('world', worldNumber)}
                    disabled={!localUrls.worldIntroVideos[worldNumber]}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                These videos play before entering each world on the map.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
