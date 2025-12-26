import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const isWorldUnlocked = (world: CampaignWorld): boolean => {
    if (world.id === 1) return true;
    return booksRescued >= world.unlockRequirement;
  };

  const getWorldCompletedCount = (worldId: number): number => {
    return worldProgress[worldId.toString()]?.length || 0;
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
                } ${isCurrentWorld ? 'ring-2 ring-primary ring-offset-2' : ''}`}
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
                        {world.id}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{world.name}</h3>
                        <p className="text-xs text-muted-foreground">{world.description}</p>
                      </div>
                    </div>
                    
                    {!unlocked && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Lock className="w-4 h-4" />
                        <span className="text-xs">{world.unlockRequirement} books</span>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  {unlocked && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {completed}/{world.storyCount} stories
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: world.storyCount }).map((_, i) => (
                          <motion.div
                            key={i}
                            className={`h-2 flex-1 rounded-full ${
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
                      {completed === world.storyCount ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Completed!
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4 mr-2" />
                          {completed > 0 ? 'Continue' : 'Start Adventure'}
                        </>
                      )}
                    </Button>
                  )}

                  {/* Locked Overlay */}
                  {!unlocked && (
                    <div className="text-center py-2">
                      <p className="text-sm text-muted-foreground">
                        Rescue {world.unlockRequirement - booksRescued} more books to unlock
                      </p>
                    </div>
                  )}
                </div>

                {/* Current World Indicator */}
                {isCurrentWorld && (
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
              them out loud. Each correct word deals damage to the goblins guarding the books!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
