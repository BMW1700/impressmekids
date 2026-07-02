import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { rewriteToCdn } from "@/lib/cdn";

const cdn = (v: string | null | undefined) => (v ? rewriteToCdn(v) ?? undefined : undefined);
const cdnArr = (raw: string | null | undefined): string[] => {
  if (!raw) return [];
  try { return (JSON.parse(raw) as string[]).map((u) => rewriteToCdn(u) ?? u); } catch { return []; }
};

export interface CampaignAssets {
  ellaAvatarUrl?: string;
  grogAvatarUrl?: string;
  campaignIntroVideoUrl?: string;
  campaignIntroVideoUrls?: string[]; // Array for multi-video campaign intro
  worldIntroVideos?: Record<number, string>;
  worldIntroVideoArrays?: Record<number, string[]>; // Multi-video per world
  storyIntroVideos?: Record<string, string>;
  storyIntroVideoArrays?: Record<string, string[]>; // Multi-video per story
}

// Asset key constants
const ASSET_KEYS = {
  ELLA_AVATAR: 'ella_avatar',
  GROG_AVATAR: 'grog_avatar',
  CAMPAIGN_INTRO: 'campaign_intro_video',
  CAMPAIGN_INTRO_ARRAY: 'campaign_intro_videos', // JSON array
  WORLD_INTRO_PREFIX: 'world_intro_video_',
  WORLD_INTRO_ARRAY_PREFIX: 'world_intro_videos_', // JSON array
  STORY_INTRO_PREFIX: 'story_intro_video_',
  STORY_INTRO_ARRAY_PREFIX: 'story_intro_videos_', // JSON array
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
        worldIntroVideoArrays: {},
        storyIntroVideos: {},
        storyIntroVideoArrays: {},
      };

      data?.forEach((row: { asset_key: string; asset_url: string | null }) => {
        if (row.asset_key === ASSET_KEYS.ELLA_AVATAR) {
          result.ellaAvatarUrl = cdn(row.asset_url);
        } else if (row.asset_key === ASSET_KEYS.GROG_AVATAR) {
          result.grogAvatarUrl = cdn(row.asset_url);
        } else if (row.asset_key === ASSET_KEYS.CAMPAIGN_INTRO) {
          result.campaignIntroVideoUrl = cdn(row.asset_url);
        } else if (row.asset_key === ASSET_KEYS.CAMPAIGN_INTRO_ARRAY) {
          result.campaignIntroVideoUrls = cdnArr(row.asset_url);
        } else if (row.asset_key.startsWith(ASSET_KEYS.WORLD_INTRO_ARRAY_PREFIX)) {
          const worldNum = parseInt(row.asset_key.replace(ASSET_KEYS.WORLD_INTRO_ARRAY_PREFIX, ''), 10);
          if (!isNaN(worldNum) && row.asset_url) {
            result.worldIntroVideoArrays![worldNum] = cdnArr(row.asset_url);
          }
        } else if (row.asset_key.startsWith(ASSET_KEYS.WORLD_INTRO_PREFIX)) {
          const worldNum = parseInt(row.asset_key.replace(ASSET_KEYS.WORLD_INTRO_PREFIX, ''), 10);
          if (!isNaN(worldNum) && row.asset_url) {
            result.worldIntroVideos![worldNum] = cdn(row.asset_url) ?? row.asset_url;
          }
        } else if (row.asset_key.startsWith(ASSET_KEYS.STORY_INTRO_ARRAY_PREFIX)) {
          const storyTitle = row.asset_key.replace(ASSET_KEYS.STORY_INTRO_ARRAY_PREFIX, '');
          if (row.asset_url) {
            result.storyIntroVideoArrays![storyTitle] = cdnArr(row.asset_url);
          }
        } else if (row.asset_key.startsWith(ASSET_KEYS.STORY_INTRO_PREFIX)) {
          const storyTitle = row.asset_key.replace(ASSET_KEYS.STORY_INTRO_PREFIX, '');
          if (row.asset_url) {
            result.storyIntroVideos![storyTitle] = cdn(row.asset_url) ?? row.asset_url;
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

  const updateWorldIntroVideos = (worldNumber: number, urls: string[]) => 
    updateAsset.mutate({ key: `${ASSET_KEYS.WORLD_INTRO_ARRAY_PREFIX}${worldNumber}`, url: JSON.stringify(urls), type: 'video' });

  const updateStoryIntroVideo = (storyTitle: string, url: string) => 
    updateAsset.mutate({ key: `${ASSET_KEYS.STORY_INTRO_PREFIX}${storyTitle}`, url, type: 'video' });

  const updateStoryIntroVideos = (storyTitle: string, urls: string[]) => 
    updateAsset.mutate({ key: `${ASSET_KEYS.STORY_INTRO_ARRAY_PREFIX}${storyTitle}`, url: JSON.stringify(urls), type: 'video' });

  const updateCampaignIntroVideos = (urls: string[]) => 
    updateAsset.mutate({ key: ASSET_KEYS.CAMPAIGN_INTRO_ARRAY, url: JSON.stringify(urls), type: 'video' });

  return {
    assets: assets || {} as CampaignAssets,
    isLoading,
    updateEllaAvatar,
    updateGrogAvatar,
    updateCampaignIntroVideo,
    updateCampaignIntroVideos,
    updateWorldIntroVideo,
    updateWorldIntroVideos,
    updateStoryIntroVideo,
    updateStoryIntroVideos,
    updateAsset: updateAsset.mutate,
  };
};
