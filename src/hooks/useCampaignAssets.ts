import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CampaignAssets {
  ellaAvatarUrl?: string;
  grogAvatarUrl?: string;
  campaignIntroVideoUrl?: string;
  worldIntroVideos?: Record<number, string>;
  storyIntroVideos?: Record<string, string>;
}

// Asset key constants
const ASSET_KEYS = {
  ELLA_AVATAR: 'ella_avatar',
  GROG_AVATAR: 'grog_avatar',
  CAMPAIGN_INTRO: 'campaign_intro_video',
  WORLD_INTRO_PREFIX: 'world_intro_video_',
  STORY_INTRO_PREFIX: 'story_intro_video_',
};

export const useCampaignAssets = () => {
  const queryClient = useQueryClient();

  // Fetch all campaign assets
  const { data: assets, isLoading } = useQuery({
    queryKey: ['campaign-assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_assets')
        .select('*');

      if (error) {
        console.error('Error fetching campaign assets:', error);
        return {} as CampaignAssets;
      }

      // Transform DB rows to CampaignAssets shape
      const result: CampaignAssets = {
        worldIntroVideos: {},
        storyIntroVideos: {},
      };

      data?.forEach((row: { asset_key: string; asset_url: string | null }) => {
        if (row.asset_key === ASSET_KEYS.ELLA_AVATAR) {
          result.ellaAvatarUrl = row.asset_url || undefined;
        } else if (row.asset_key === ASSET_KEYS.GROG_AVATAR) {
          result.grogAvatarUrl = row.asset_url || undefined;
        } else if (row.asset_key === ASSET_KEYS.CAMPAIGN_INTRO) {
          result.campaignIntroVideoUrl = row.asset_url || undefined;
        } else if (row.asset_key.startsWith(ASSET_KEYS.WORLD_INTRO_PREFIX)) {
          const worldNum = parseInt(row.asset_key.replace(ASSET_KEYS.WORLD_INTRO_PREFIX, ''), 10);
          if (!isNaN(worldNum) && row.asset_url) {
            result.worldIntroVideos![worldNum] = row.asset_url;
          }
        } else if (row.asset_key.startsWith(ASSET_KEYS.STORY_INTRO_PREFIX)) {
          const storyTitle = row.asset_key.replace(ASSET_KEYS.STORY_INTRO_PREFIX, '');
          if (row.asset_url) {
            result.storyIntroVideos![storyTitle] = row.asset_url;
          }
        }
      });

      return result;
    },
  });

  // Update a single asset
  const updateAsset = useMutation({
    mutationFn: async ({ key, url, type }: { key: string; url: string; type: 'image' | 'video' }) => {
      const { error } = await supabase
        .from('campaign_assets')
        .upsert({
          asset_key: key,
          asset_url: url,
          asset_type: type,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'asset_key',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-assets'] });
    },
  });

  // Helper functions to update specific assets
  const updateEllaAvatar = (url: string) => 
    updateAsset.mutate({ key: ASSET_KEYS.ELLA_AVATAR, url, type: 'image' });

  const updateGrogAvatar = (url: string) => 
    updateAsset.mutate({ key: ASSET_KEYS.GROG_AVATAR, url, type: 'image' });

  const updateCampaignIntroVideo = (url: string) => 
    updateAsset.mutate({ key: ASSET_KEYS.CAMPAIGN_INTRO, url, type: 'video' });

  const updateWorldIntroVideo = (worldNumber: number, url: string) => 
    updateAsset.mutate({ key: `${ASSET_KEYS.WORLD_INTRO_PREFIX}${worldNumber}`, url, type: 'video' });

  const updateStoryIntroVideo = (storyTitle: string, url: string) => 
    updateAsset.mutate({ key: `${ASSET_KEYS.STORY_INTRO_PREFIX}${storyTitle}`, url, type: 'video' });

  return {
    assets: assets || {} as CampaignAssets,
    isLoading,
    updateEllaAvatar,
    updateGrogAvatar,
    updateCampaignIntroVideo,
    updateWorldIntroVideo,
    updateStoryIntroVideo,
    updateAsset: updateAsset.mutate,
  };
};
