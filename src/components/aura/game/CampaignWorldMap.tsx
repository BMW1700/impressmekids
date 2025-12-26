import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, Star, BookOpen, Crown, CheckCircle } from "lucide-react";
import { campaignWorlds, type CampaignWorld } from "@/lib/campaignData";

interface CampaignWorldMapProps {
  currentWorld: number;
  worldProgress: Record<string, string[]>;
  booksRescued: number;
  onSelectWorld: (worldId: number) => void;
}

export const CampaignWorldMap = ({
  currentWorld,
  worldProgress,
  booksRescued,
  onSelectWorld,
}: CampaignWorldMapProps) => {
  // Check if a world is unlocked based on completing stories in PREVIOUS world
  const isWorldUnlocked = (world: CampaignWorld): boolean => {
    if (world.id === 1) return true;
    
    // Get previous world
    const prevWorld = campaignWorlds.find(w => w.id === world.id - 1);
    if (!prevWorld) return false;
    
    // Count completed stories in previous world
    const prevWorldCompleted = worldProgress[(world.id - 1).toString()]?.length || 0;
    
    // Need to complete at least N stories in previous world (unlockRequirement)
    return prevWorldCompleted >= world.unlockRequirement;
  };

  const getWorldCompletedCount = (worldId: number): number => {
    return worldProgress[worldId.toString()]?.length || 0;
  };

  // Get unlock progress for a locked world
  const getUnlockProgress = (world: CampaignWorld): { current: number; required: number; percent: number } => {
    if (world.id === 1) return { current: 0, required: 0, percent: 100 };
    
    const prevWorldCompleted = worldProgress[(world.id - 1).toString()]?.length || 0;
    const required = world.unlockRequirement;
    const percent = Math.min(100, (prevWorldCompleted / required) * 100);
    
    return { current: prevWorldCompleted, required, percent };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-foreground flex items-center justify-center gap-2">
          <Crown className="w-6 h-6 text-yellow-500" />
          Story Campaign
        </h2>
        <p className="text-muted-foreground">
          Rescue books from Grog the Goblin King!
        </p>
        <Badge variant="secondary" className="text-lg px-4 py-1">
          📚 {booksRescued} Books Rescued
        </Badge>
      </div>

      {/* World Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaignWorlds.map((world, index) => {
          const unlocked = isWorldUnlocked(world);
          const completed = getWorldCompletedCount(world.id);
          const isCurrentWorld = world.id === currentWorld;
          const isWorldComplete = completed >= world.storyCount;
          const unlockProgress = getUnlockProgress(world);

          return (
            <motion.div
              key={world.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`relative overflow-hidden transition-all duration-300 ${
                  unlocked
                    ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg'
                    : 'opacity-60 cursor-not-allowed'
                } ${isCurrentWorld ? 'ring-2 ring-primary ring-offset-2' : ''} ${isWorldComplete ? 'ring-2 ring-green-500' : ''}`}
                onClick={() => unlocked && onSelectWorld(world.id)}
              >
                {/* Background Gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${world.gradient} opacity-20`}
                />

                {/* Content */}
                <div className="relative p-4 space-y-3">
                  {/* World Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${world.gradient} flex items-center justify-center text-white font-black text-lg`}
                      >
                        {isWorldComplete ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          world.id
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{world.name}</h3>
                        <p className="text-xs text-muted-foreground">{world.description}</p>
                      </div>
                    </div>
                    
                    {!unlocked && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                    
                    {isWorldComplete && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                  </div>

                  {/* Progress for unlocked worlds */}
                  {unlocked && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Stories Completed</span>
                        <span className="font-medium">
                          {completed}/{world.storyCount}
                        </span>
                      </div>
                      <Progress 
                        value={(completed / world.storyCount) * 100} 
                        className="h-2"
                      />
                      <div className="flex gap-1">
                        {Array.from({ length: world.storyCount }).map((_, i) => (
                          <motion.div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full ${
                              i < completed
                                ? `bg-gradient-to-r ${world.gradient}`
                                : 'bg-muted'
                            }`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unlock progress for locked worlds */}
                  {!unlocked && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Complete stories in World {world.id - 1} to unlock
                        </span>
                        <span className="font-medium text-amber-500">
                          {unlockProgress.current}/{unlockProgress.required}
                        </span>
                      </div>
                      <Progress 
                        value={unlockProgress.percent} 
                        className="h-2"
                      />
                      <p className="text-xs text-center text-muted-foreground">
                        {unlockProgress.required - unlockProgress.current} more {unlockProgress.required - unlockProgress.current === 1 ? 'story' : 'stories'} to unlock
                      </p>
                    </div>
                  )}

                  {/* Stars for completion */}
                  {unlocked && completed > 0 && (
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(3, Math.floor(completed / 2) + 1) }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-yellow-500 fill-yellow-500"
                        />
                      ))}
                    </div>
                  )}

                  {/* Action Button */}
                  {unlocked && (
                    <Button
                      variant={isCurrentWorld ? "default" : "secondary"}
                      size="sm"
                      className="w-full"
                    >
                      {isWorldComplete ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Completed - Play Again
                        </>
                      ) : completed > 0 ? (
                        <>
                          <BookOpen className="w-4 h-4 mr-2" />
                          Continue ({completed}/{world.storyCount})
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4 mr-2" />
                          Start Adventure
                        </>
                      )}
                    </Button>
                  )}

                  {/* Locked state */}
                  {!unlocked && (
                    <div className="text-center py-2">
                      <Lock className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                      <p className="text-xs text-muted-foreground">
                        Complete more stories in World {world.id - 1}
                      </p>
                    </div>
                  )}
                </div>

                {/* Current World Indicator */}
                {isCurrentWorld && !isWorldComplete && (
                  <motion.div
                    className="absolute top-2 right-2"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <Badge className="bg-primary text-primary-foreground">
                      Current
                    </Badge>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Story Lore */}
      <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">The Quest Begins!</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Princess Ella's library was full of magical books until Grog the Goblin King 
              stole them all! Only brave readers like you can rescue the books by reading 
              them out loud. Complete stories in each world to unlock the next one!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
