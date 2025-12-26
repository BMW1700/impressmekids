import { useState } from "react";
import { motion } from "framer-motion";
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
import { Settings, Upload, Image, Video, Check, X } from "lucide-react";

interface CampaignAssets {
  ellaAvatarUrl?: string;
  grogAvatarUrl?: string;
  campaignIntroVideoUrl?: string;
  worldIntroVideos?: Record<number, string>;
  storyIntroVideos?: Record<string, string>;
}

interface CampaignAssetUploaderProps {
  assets: CampaignAssets;
  onAssetsChange: (assets: CampaignAssets) => void;
  isAdmin?: boolean;
}

export const CampaignAssetUploader = ({
  assets,
  onAssetsChange,
  isAdmin = false,
}: CampaignAssetUploaderProps) => {
  const [open, setOpen] = useState(false);
  const [localAssets, setLocalAssets] = useState<CampaignAssets>(assets);

  if (!isAdmin) {
    return null;
  }

  const handleSave = () => {
    onAssetsChange(localAssets);
    setOpen(false);
  };

  const updateAsset = (key: keyof CampaignAssets, value: string) => {
    setLocalAssets(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateWorldVideo = (worldNumber: number, url: string) => {
    setLocalAssets(prev => ({
      ...prev,
      worldIntroVideos: {
        ...prev.worldIntroVideos,
        [worldNumber]: url,
      },
    }));
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
                <Label htmlFor="ella-avatar">Princess Ella Avatar URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="ella-avatar"
                    placeholder="https://example.com/ella.png"
                    value={localAssets.ellaAvatarUrl || ''}
                    onChange={(e) => updateAsset('ellaAvatarUrl', e.target.value)}
                  />
                </div>
                {localAssets.ellaAvatarUrl && (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-pink-400">
                    <img
                      src={localAssets.ellaAvatarUrl}
                      alt="Ella preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Grog */}
              <div className="space-y-2">
                <Label htmlFor="grog-avatar">Grog Avatar URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="grog-avatar"
                    placeholder="https://example.com/grog.png"
                    value={localAssets.grogAvatarUrl || ''}
                    onChange={(e) => updateAsset('grogAvatarUrl', e.target.value)}
                  />
                </div>
                {localAssets.grogAvatarUrl && (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-green-600">
                    <img
                      src={localAssets.grogAvatarUrl}
                      alt="Grog preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
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
              <Label htmlFor="campaign-intro">Campaign Intro Video URL</Label>
              <Input
                id="campaign-intro"
                placeholder="https://youtube.com/watch?v=... or direct MP4 URL"
                value={localAssets.campaignIntroVideoUrl || ''}
                onChange={(e) => updateAsset('campaignIntroVideoUrl', e.target.value)}
              />
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
                    value={localAssets.worldIntroVideos?.[worldNumber] || ''}
                    onChange={(e) => updateWorldVideo(worldNumber, e.target.value)}
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                These videos play before entering each world on the map.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
