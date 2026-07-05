import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sword, BookOpen, Trophy, Flame, Star, ChevronRight, Crown, CheckCircle, RotateCcw, Pencil, Upload, X, Brain } from "lucide-react";
import { useCampaignProgress } from "@/hooks/useCampaignProgress";
import { useCampaignAssets } from "@/hooks/useCampaignAssets";
import { CampaignWorldMap } from "./CampaignWorldMap";
import { BattleReader } from "./BattleReader";
import { CampaignVideoGate } from "./CampaignVideoGate";
import { CampaignAssetUploader } from "./CampaignAssetUploader";
import { campaignWorlds, princessElla, grogTheGoblinKing, categoryToWorld } from "@/lib/campaignData";
import { CuratedStory } from "@/data/curatedStories";
import { getCdnUrl } from "@/lib/cdn";
import { mirrorToR2Async } from "@/lib/r2Mirror";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { EnemyType } from "@/lib/battleMechanics";
import { useMLContextSafe } from "@/components/ml/MLStatusProvider";
import { rankStoriesByPhonemeNeed, extractStrugglingPhonemes } from "@/lib/adaptiveStoryRanking";

interface CampaignModeEntryProps {
  studentId: string;
  onBack: () => void;
  stories: CuratedStory[];
  isAdmin?: boolean;
}

type CampaignView = 'intro' | 'intro-video' | 'world-map' | 'world-video' | 'story-select' | 'story-video' | 'battle';

export const CampaignModeEntry = ({ studentId, onBack, stories, isAdmin = false }: CampaignModeEntryProps) => {
  const { progress, progressLoading } = useCampaignProgress(studentId);
  const { assets, updateCampaignIntroVideo, updateCampaignIntroVideos, updateWorldIntroVideo, updateWorldIntroVideos, updateEllaAvatar, updateGrogAvatar, updateStoryIntroVideo, updateStoryIntroVideos } = useCampaignAssets();
  const { toast } = useToast();
  const mlContext = useMLContextSafe();
  
  const strugglingPhonemes = useMemo(() => extractStrugglingPhonemes(mlContext), [mlContext]);
  const recommendedTitles = useMemo(() => {
    const ranked = rankStoriesByPhonemeNeed(stories, strugglingPhonemes);
    return new Set(ranked.filter(r => r.isRecommended).map(r => r.story.title));
  }, [stories, strugglingPhonemes]);
  
  const [currentView, setCurrentView] = useState<CampaignView>('intro');
  const [selectedWorld, setSelectedWorld] = useState<number>(1);
  const [selectedStory, setSelectedStory] = useState<CuratedStory | null>(null);
  const [enemyType, setEnemyType] = useState<EnemyType>('minion');
  
  // Edit states for character avatars
  const [editingCharacter, setEditingCharacter] = useState<'ella' | 'grog' | null>(null);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [ellaAvatarError, setEllaAvatarError] = useState(false);
  const [grogAvatarError, setGrogAvatarError] = useState(false);
  const ellaFileInputRef = useRef<HTMLInputElement>(null);
  const grogFileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle avatar file upload
  const handleAvatarUpload = async (file: File, character: 'ella' | 'grog') => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please upload an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be under 5MB", variant: "destructive" });
      return;
    }
    
    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${character}-avatar-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('campaign-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });
      
      if (error) throw error;
      mirrorToR2Async('campaign-assets', data.path, file.type, file.size);
      
      
      const { data: urlData } = supabase.storage.from('campaign-assets').getPublicUrl(data.path);
      const finalUrl = getCdnUrl('campaign-assets', data.path) ?? urlData.publicUrl;

      if (character === 'ella') {
        updateEllaAvatar(finalUrl);
      } else {
        updateGrogAvatar(finalUrl);
      }
      
      toast({ title: "Avatar updated!", description: `${character === 'ella' ? 'Princess Ella' : 'Grog'}'s avatar has been updated.` });
      setEditingCharacter(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Upload failed", description: "Failed to upload avatar", variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  
  const handleSaveAvatarUrl = (character: 'ella' | 'grog') => {
    if (avatarUrlInput.trim()) {
      if (character === 'ella') {
        updateEllaAvatar(avatarUrlInput.trim());
      } else {
        updateGrogAvatar(avatarUrlInput.trim());
      }
      toast({ title: "Avatar updated!", description: `${character === 'ella' ? 'Princess Ella' : 'Grog'}'s avatar has been updated.` });
    }
    setEditingCharacter(null);
    setAvatarUrlInput('');
  };

  // Get stories for selected world based on category mapping
  const getWorldStories = (worldNumber: number) => {
    const worldCategories = Object.entries(categoryToWorld)
      .filter(([_, world]) => world === worldNumber)
      .map(([category]) => category);
    
    return stories.filter(story => worldCategories.includes(story.category));
  };

  // Handle entering campaign - ALWAYS show video gate
  const handleEnterCampaign = () => {
    setCurrentView('intro-video');
  };

  // Handle intro video complete
  const handleIntroVideoComplete = () => {
    setCurrentView('world-map');
  };

  // Handle world selection - ALWAYS show video gate
  const handleWorldSelect = (worldNumber: number) => {
    setSelectedWorld(worldNumber);
    setCurrentView('world-video');
  };

  // Handle world video complete
  const handleWorldVideoComplete = () => {
    setCurrentView('story-select');
  };

  // Handle story selection
  const handleStorySelect = (story: CuratedStory) => {
    setSelectedStory(story);
    
    // Determine enemy type based on story difficulty and progress
    const worldStories = getWorldStories(selectedWorld);
    const storyIndex = worldStories.findIndex(s => s.title === story.title);
    const totalStories = worldStories.length;
    
    if (storyIndex >= totalStories * 0.75) {
      setEnemyType('boss');
    } else if (storyIndex >= totalStories * 0.5) {
      setEnemyType('elite');
    } else if (storyIndex >= totalStories * 0.25) {
      setEnemyType('guard');
    } else {
      setEnemyType('minion');
    }
    
    // Check for story-specific video
    const storyVideoUrl = assets.storyIntroVideos?.[story.title];
    if (storyVideoUrl) {
      setCurrentView('story-video');
    } else {
      setCurrentView('battle');
    }
  };

  // Handle story video complete
  const handleStoryVideoComplete = () => {
    setCurrentView('battle');
  };

  // Handle battle completion
  const handleBattleComplete = () => {
    setCurrentView('world-map');
    setSelectedStory(null);
  };

  // Handle next story after victory
  const handleNextStory = () => {
    const worldStories = getWorldStories(selectedWorld);
    const currentIndex = worldStories.findIndex(s => s.title === selectedStory?.title);
    if (currentIndex < worldStories.length - 1) {
      handleStorySelect(worldStories[currentIndex + 1]);
    } else {
      setCurrentView('world-map');
    }
  };

  if (progressLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const booksRescued = progress?.books_rescued || 0;

  // Render video gates - ALWAYS show (even without video configured)
  if (currentView === 'intro-video') {
    return (
      <CampaignVideoGate
        videoUrl={assets.campaignIntroVideoUrl}
        videoUrls={assets.campaignIntroVideoUrls || []}
        title="Story Campaign Introduction"
        onComplete={handleIntroVideoComplete}
        isAdmin={isAdmin}
        onVideoUrlChange={(url) => updateCampaignIntroVideo(url)}
        onVideoUrlsChange={(urls) => updateCampaignIntroVideos(urls)}
        assetKey="campaign-intro"
      />
    );
  }

  if (currentView === 'world-video') {
    return (
      <CampaignVideoGate
        videoUrl={assets.worldIntroVideos?.[selectedWorld]}
        videoUrls={assets.worldIntroVideoArrays?.[selectedWorld] || []}
        title={`World ${selectedWorld}: ${campaignWorlds[selectedWorld - 1]?.name || 'Unknown'}`}
        onComplete={handleWorldVideoComplete}
        isAdmin={isAdmin}
        onVideoUrlChange={(url) => updateWorldIntroVideo(selectedWorld, url)}
        onVideoUrlsChange={(urls) => updateWorldIntroVideos(selectedWorld, urls)}
        assetKey={`world-${selectedWorld}-intro`}
      />
    );
  }

  if (currentView === 'story-video' && selectedStory) {
    return (
      <CampaignVideoGate
        videoUrl={assets.storyIntroVideos?.[selectedStory.title]}
        videoUrls={assets.storyIntroVideoArrays?.[selectedStory.title] || []}
        title={selectedStory.title}
        onComplete={handleStoryVideoComplete}
        isAdmin={isAdmin}
        onVideoUrlChange={(url) => updateStoryIntroVideo(selectedStory.title, url)}
        onVideoUrlsChange={(urls) => updateStoryIntroVideos(selectedStory.title, urls)}
        assetKey={`story-${selectedStory.title}-intro`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {/* Intro Screen */}
        {currentView === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="overflow-hidden">
              {/* Hero Banner */}
              <div className="relative h-48 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="text-center"
                  >
                    <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
                      ⚔️ Story Campaign ⚔️
                    </h1>
                    <p className="text-white/80 mt-2 text-lg">
                      Defeat Grog the Goblin King & Rescue the Books!
                    </p>
                  </motion.div>
                </div>
                
                {/* Admin Settings Button */}
                {/* TODO: TEMPORARY - Remove true || to restore admin-only edit controls */}
                {(true || isAdmin) && (
                  <div className="absolute top-4 right-4">
                    <CampaignAssetUploader isAdmin={true} />
                  </div>
                )}
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Hidden file inputs for avatar uploads */}
                <input
                  ref={ellaFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0], 'ella')}
                />
                <input
                  ref={grogFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0], 'grog')}
                />
                
                {/* Story Setup */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Princess Ella */}
                  <div className="text-center space-y-3">
                    <div className="relative w-24 h-24 mx-auto group">
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-5xl shadow-lg overflow-hidden">
                        {assets.ellaAvatarUrl && !ellaAvatarError ? (
                          <img
                            src={assets.ellaAvatarUrl}
                            alt="Princess Ella"
                            className="w-full h-full object-cover"
                            onError={() => setEllaAvatarError(true)}
                          />
                        ) : (
                          '👸'
                        )}
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => { setEditingCharacter('ella'); setAvatarUrlInput(assets.ellaAvatarUrl || ''); }}
                          className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Ella Edit Panel */}
                    {editingCharacter === 'ella' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-muted/50 rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Edit Ella's Avatar</span>
                          <button onClick={() => setEditingCharacter(null)} className="p-1 hover:bg-muted rounded">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => ellaFileInputRef.current?.click()}
                            disabled={isUploadingAvatar}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            {isUploadingAvatar ? 'Uploading...' : 'Upload'}
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Or paste image URL..."
                            value={avatarUrlInput}
                            onChange={(e) => setAvatarUrlInput(e.target.value)}
                            className="text-xs h-8"
                          />
                          <Button size="sm" onClick={() => handleSaveAvatarUrl('ella')} disabled={!avatarUrlInput.trim()}>
                            Save
                          </Button>
                        </div>
                      </motion.div>
                    )}
                    
                    <div>
                      <h3 className="font-bold text-lg">{princessElla.name}</h3>
                      <p className="text-sm text-muted-foreground">{princessElla.description}</p>
                    </div>
                  </div>

                  {/* Grog */}
                  <div className="text-center space-y-3">
                    <div className="relative w-24 h-24 mx-auto group">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-full h-full rounded-full bg-gradient-to-br from-green-600 to-emerald-800 flex items-center justify-center text-5xl shadow-lg overflow-hidden"
                      >
                        {assets.grogAvatarUrl && !grogAvatarError ? (
                          <img
                            src={assets.grogAvatarUrl}
                            alt="Grog the Goblin King"
                            className="w-full h-full object-cover"
                            onError={() => setGrogAvatarError(true)}
                          />
                        ) : (
                          '👹'
                        )}
                      </motion.div>
                      {isAdmin && (
                        <button
                          onClick={() => { setEditingCharacter('grog'); setAvatarUrlInput(assets.grogAvatarUrl || ''); }}
                          className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Grog Edit Panel */}
                    {editingCharacter === 'grog' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-muted/50 rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Edit Grog's Avatar</span>
                          <button onClick={() => setEditingCharacter(null)} className="p-1 hover:bg-muted rounded">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => grogFileInputRef.current?.click()}
                            disabled={isUploadingAvatar}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            {isUploadingAvatar ? 'Uploading...' : 'Upload'}
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Or paste image URL..."
                            value={avatarUrlInput}
                            onChange={(e) => setAvatarUrlInput(e.target.value)}
                            className="text-xs h-8"
                          />
                          <Button size="sm" onClick={() => handleSaveAvatarUrl('grog')} disabled={!avatarUrlInput.trim()}>
                            Save
                          </Button>
                        </div>
                      </motion.div>
                    )}
                    
                    <div>
                      <h3 className="font-bold text-lg text-red-500">{grogTheGoblinKing.name}</h3>
                      <p className="text-sm text-muted-foreground">{grogTheGoblinKing.description}</p>
                    </div>
                  </div>
                </div>

                {/* The Quest */}
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-lg">
                    <span className="font-bold">Your Mission:</span> Read stories aloud to deal damage to Grog's minions. 
                    Every correct word is an attack! Build streaks for bonus damage!
                  </p>
                </div>

                {/* Player Stats */}
                {progress && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-primary/10 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <span className="text-2xl font-bold">{progress.books_rescued || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Books Rescued</p>
                    </div>
                    <div className="bg-orange-500/10 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <span className="text-2xl font-bold">{progress.longest_streak || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Best Streak</p>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <span className="text-2xl font-bold">{progress.total_xp_earned || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Total XP</p>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Sword className="h-5 w-5 text-red-500" />
                        <span className="text-2xl font-bold">{progress.grog_battles_won || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Battles Won</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    onClick={handleEnterCampaign}
                  >
                    <Sword className="h-5 w-5 mr-2" />
                    Enter the Campaign
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                  <Button variant="outline" onClick={onBack}>
                    Back to Library
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* World Map */}
        {currentView === 'world-map' && (
          <motion.div
            key="world-map"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView('intro')}
              className="mb-4"
            >
              ← Back
            </Button>
            <CampaignWorldMap
              currentWorld={progress?.current_world || 1}
              worldProgress={(progress?.world_progress as Record<string, string[]>) || {}}
              booksRescued={booksRescued}
              onSelectWorld={handleWorldSelect}
            />
          </motion.div>
        )}

        {/* Story Selection */}
        {currentView === 'story-select' && (
          <motion.div
            key="story-select"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('world-map')}
              >
                ← Back to Map
              </Button>
              <div>
                <h2 className="text-2xl font-bold">
                  {campaignWorlds[selectedWorld - 1]?.name || `World ${selectedWorld}`}
                </h2>
                <p className="text-muted-foreground">
                  Choose a story to begin your battle!
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getWorldStories(selectedWorld).map((story, index) => {
                const totalStories = getWorldStories(selectedWorld).length;
                const isBoss = index >= totalStories * 0.75;
                const isElite = !isBoss && index >= totalStories * 0.5;
                
                // Check if this story is completed - check ALL worlds for reshuffled stories
                const worldProgress = (progress?.world_progress as Record<string, string[]>) || {};
                const allCompleted = new Set(Object.values(worldProgress).flat());
                const isCompleted = allCompleted.has(story.title);
                
                return (
                  <Card
                    key={story.title}
                    className={`cursor-pointer hover:border-primary transition-colors ${isCompleted ? 'ring-2 ring-green-500/50' : ''}`}
                    onClick={() => handleStorySelect(story)}
                  >
                    <div className={`h-24 bg-gradient-to-br ${story.cover_gradient} rounded-t-lg flex items-center justify-center relative`}>
                      {/* Completed Overlay */}
                      {isCompleted && (
                        <div className="absolute inset-0 bg-black/30 rounded-t-lg flex items-center justify-center">
                          <CheckCircle className="h-12 w-12 text-green-400 drop-shadow-lg" />
                        </div>
                      )}
                      <span className={`text-4xl ${isCompleted ? 'opacity-50' : ''}`}>
                        {story.category === 'animals' && '🐾'}
                        {story.category === 'space' && '🚀'}
                        {story.category === 'sports' && '⚽'}
                        {story.category === 'fairy_tales' && '✨'}
                        {story.category === 'science' && '🔬'}
                        {story.category === 'adventure' && '🗺️'}
                        {story.category === 'history' && '📜'}
                      </span>
                      {isBoss && (
                        <Badge className="absolute top-2 right-2 bg-red-500">
                          <Crown className="h-3 w-3 mr-1" /> BOSS
                        </Badge>
                      )}
                      {isElite && !isBoss && (
                        <Badge className="absolute top-2 right-2 bg-purple-500">
                          ELITE
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge className="absolute top-2 left-2 bg-green-500">
                          ✓ Complete
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold truncate">{story.title}</h3>
                        {recommendedTitles.has(story.title) && !isCompleted && (
                          <Badge variant="secondary" className="text-[10px] shrink-0 flex items-center gap-1">
                            <Brain className="h-3 w-3" /> For You
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{story.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{story.word_count} words</span>
                          <span>•</span>
                          <span>Grade {story.grade_level}</span>
                        </div>
                        {isCompleted && (
                          <Badge variant="outline" className="text-xs">
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Play Again
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {getWorldStories(selectedWorld).length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  No stories available for this world yet. Check back soon!
                </p>
              </Card>
            )}
          </motion.div>
        )}

        {/* Battle Mode */}
        {currentView === 'battle' && selectedStory && (
          <motion.div
            key="battle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <BattleReader
              story={selectedStory}
              worldNumber={selectedWorld}
              enemyType={enemyType}
              studentId={studentId}
              onBack={() => setCurrentView('story-select')}
              onComplete={handleBattleComplete}
              onNextStory={handleNextStory}
              ellaAvatarUrl={assets.ellaAvatarUrl}
              grogAvatarUrl={assets.grogAvatarUrl}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
