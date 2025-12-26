import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sword, BookOpen, Trophy, Flame, Star, ChevronRight, Crown, Settings } from "lucide-react";
import { useCampaignProgress } from "@/hooks/useCampaignProgress";
import { CampaignWorldMap } from "./CampaignWorldMap";
import { BattleReader } from "./BattleReader";
import { CampaignVideoGate } from "./CampaignVideoGate";
import { CampaignAssetUploader } from "./CampaignAssetUploader";
import { campaignWorlds, princessElla, grogTheGoblinKing, categoryToWorld } from "@/lib/campaignData";
import { CuratedStory } from "@/data/curatedStories";
import type { EnemyType } from "@/lib/battleMechanics";

interface CampaignModeEntryProps {
  studentId: string;
  onBack: () => void;
  stories: CuratedStory[];
  isAdmin?: boolean;
}

interface CampaignAssets {
  ellaAvatarUrl?: string;
  grogAvatarUrl?: string;
  campaignIntroVideoUrl?: string;
  worldIntroVideos?: Record<number, string>;
  storyIntroVideos?: Record<string, string>;
}

type CampaignView = 'intro' | 'intro-video' | 'world-map' | 'world-video' | 'story-select' | 'story-video' | 'battle';

export const CampaignModeEntry = ({ studentId, onBack, stories, isAdmin = false }: CampaignModeEntryProps) => {
  const { progress, progressLoading } = useCampaignProgress(studentId);
  const [currentView, setCurrentView] = useState<CampaignView>('intro');
  const [selectedWorld, setSelectedWorld] = useState<number>(1);
  const [selectedStory, setSelectedStory] = useState<CuratedStory | null>(null);
  const [enemyType, setEnemyType] = useState<EnemyType>('minion');
  const [hasSeenIntroVideo, setHasSeenIntroVideo] = useState(false);
  const [seenWorldVideos, setSeenWorldVideos] = useState<Set<number>>(new Set());
  
  // Campaign assets - stored in localStorage for now (could be moved to DB)
  const [campaignAssets, setCampaignAssets] = useState<CampaignAssets>(() => {
    try {
      const saved = localStorage.getItem('campaign_assets');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save assets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('campaign_assets', JSON.stringify(campaignAssets));
  }, [campaignAssets]);

  // Get stories for selected world based on category mapping
  const getWorldStories = (worldNumber: number) => {
    const worldCategories = Object.entries(categoryToWorld)
      .filter(([_, world]) => world === worldNumber)
      .map(([category]) => category);
    
    return stories.filter(story => worldCategories.includes(story.category));
  };

  // Handle entering campaign (with optional intro video)
  const handleEnterCampaign = () => {
    if (campaignAssets.campaignIntroVideoUrl && !hasSeenIntroVideo) {
      setCurrentView('intro-video');
    } else {
      setCurrentView('world-map');
    }
  };

  // Handle intro video complete
  const handleIntroVideoComplete = () => {
    setHasSeenIntroVideo(true);
    setCurrentView('world-map');
  };

  // Handle world selection (with optional world video)
  const handleWorldSelect = (worldNumber: number) => {
    setSelectedWorld(worldNumber);
    
    const worldVideoUrl = campaignAssets.worldIntroVideos?.[worldNumber];
    if (worldVideoUrl && !seenWorldVideos.has(worldNumber)) {
      setCurrentView('world-video');
    } else {
      setCurrentView('story-select');
    }
  };

  // Handle world video complete
  const handleWorldVideoComplete = () => {
    setSeenWorldVideos(prev => new Set([...prev, selectedWorld]));
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
    const storyVideoUrl = campaignAssets.storyIntroVideos?.[story.title];
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

  // Render video gates
  if (currentView === 'intro-video') {
    return (
      <CampaignVideoGate
        videoUrl={campaignAssets.campaignIntroVideoUrl}
        title="Story Campaign Introduction"
        onComplete={handleIntroVideoComplete}
      />
    );
  }

  if (currentView === 'world-video') {
    return (
      <CampaignVideoGate
        videoUrl={campaignAssets.worldIntroVideos?.[selectedWorld]}
        title={`World ${selectedWorld}: ${campaignWorlds[selectedWorld - 1]?.name || 'Unknown'}`}
        onComplete={handleWorldVideoComplete}
      />
    );
  }

  if (currentView === 'story-video' && selectedStory) {
    return (
      <CampaignVideoGate
        videoUrl={campaignAssets.storyIntroVideos?.[selectedStory.title]}
        title={selectedStory.title}
        onComplete={handleStoryVideoComplete}
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
                {isAdmin && (
                  <div className="absolute top-4 right-4">
                    <CampaignAssetUploader
                      assets={campaignAssets}
                      onAssetsChange={setCampaignAssets}
                      isAdmin={isAdmin}
                    />
                  </div>
                )}
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Story Setup */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Princess Ella */}
                  <div className="text-center space-y-3">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-5xl shadow-lg overflow-hidden">
                      {campaignAssets.ellaAvatarUrl ? (
                        <img
                          src={campaignAssets.ellaAvatarUrl}
                          alt="Princess Ella"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '👸';
                          }}
                        />
                      ) : (
                        '👸'
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{princessElla.name}</h3>
                      <p className="text-sm text-muted-foreground">{princessElla.description}</p>
                    </div>
                  </div>

                  {/* Grog */}
                  <div className="text-center space-y-3">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-600 to-emerald-800 flex items-center justify-center text-5xl shadow-lg overflow-hidden"
                    >
                      {campaignAssets.grogAvatarUrl ? (
                        <img
                          src={campaignAssets.grogAvatarUrl}
                          alt="Grog the Goblin King"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '👹';
                          }}
                        />
                      ) : (
                        '👹'
                      )}
                    </motion.div>
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
                
                return (
                  <Card
                    key={story.title}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleStorySelect(story)}
                  >
                    <div className={`h-24 bg-gradient-to-br ${story.cover_gradient} rounded-t-lg flex items-center justify-center relative`}>
                      <span className="text-4xl">
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
                      {isElite && (
                        <Badge className="absolute top-2 right-2 bg-purple-500">
                          ELITE
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold truncate">{story.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{story.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{story.word_count} words</span>
                        <span>•</span>
                        <span>Grade {story.grade_level}</span>
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
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
