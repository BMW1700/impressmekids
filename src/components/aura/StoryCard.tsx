import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Star, Bookmark, BookmarkCheck, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StoryVotingButtons } from "./StoryVotingButtons";

interface StoryCardProps {
  title: string;
  description: string;
  grade_level: number;
  category: string;
  word_count: number;
  reading_time_minutes: number;
  difficulty_level: number;
  cover_gradient: string;
  completed?: boolean;
  best_wpm?: number;
  times_read?: number;
  inBookshelf?: boolean;
  storyId?: string;
  thumbsUpCount?: number;
  thumbsDownCount?: number;
  helpedYesCount?: number;
  helpedNoCount?: number;
  isFeatured?: boolean;
  showVoting?: boolean;
  gradeMode?: string;
  onStartReading: () => void;
  onBookshelfChange?: () => void;
}

const categoryIcons: Record<string, string> = {
  animals: "🐾",
  space: "🚀",
  sports: "⚽",
  fairy_tales: "✨",
  science: "🔬",
  adventure: "🗺️",
  history: "📜"
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    animals: "from-amber-400/20 to-orange-500/20",
    space: "from-indigo-400/20 to-purple-500/20",
    sports: "from-green-400/20 to-emerald-500/20",
    fairy_tales: "from-pink-400/20 to-rose-500/20",
    science: "from-cyan-400/20 to-blue-500/20",
    adventure: "from-yellow-400/20 to-amber-500/20",
    history: "from-stone-400/20 to-neutral-500/20"
  };
  return colors[category] || "from-gray-400/20 to-slate-500/20";
};

export const StoryCard = ({
  title,
  description,
  grade_level,
  category,
  word_count,
  reading_time_minutes,
  difficulty_level,
  cover_gradient,
  completed = false,
  best_wpm,
  times_read = 0,
  inBookshelf = false,
  storyId,
  thumbsUpCount = 0,
  thumbsDownCount = 0,
  helpedYesCount = 0,
  helpedNoCount = 0,
  isFeatured = false,
  showVoting = true,
  gradeMode,
  onStartReading,
  onBookshelfChange
}: StoryCardProps) => {
  const [isInBookshelf, setIsInBookshelf] = useState(inBookshelf);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddToBookshelf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save stories",
          variant: "destructive",
        });
        return;
      }

      // First ensure story exists in reading_library
      const { data: existingStory } = await supabase
        .from('reading_library')
        .select('id')
        .eq('title', title)
        .single();
      
      let libraryStoryId = existingStory?.id || storyId;
      
      if (!libraryStoryId) {
        // Story doesn't exist in library, we can't add it to bookshelf
        // This is a curated story not yet in DB
        toast({
          title: "Start reading first",
          description: "Read this story to add it to your bookshelf!",
        });
        setIsLoading(false);
        return;
      }

      if (isInBookshelf) {
        // Remove from bookshelf (scoped by grade_mode)
        const deleteQuery = supabase
          .from('student_reading_progress')
          .delete()
          .eq('student_id', user.id)
          .eq('story_id', libraryStoryId);
        if (gradeMode) deleteQuery.eq('grade_mode', gradeMode);
        await deleteQuery;
        
        setIsInBookshelf(false);
        toast({
          title: "Removed from Bookshelf",
          description: "Story removed from your reading list",
        });
      } else {
        // Add to bookshelf (want to read) with grade_mode
        await supabase
          .from('student_reading_progress')
          .insert({
            student_id: user.id,
            story_id: libraryStoryId,
            completed: false,
            times_read: 0,
            grade_mode: gradeMode || 'k5',
          });
        
        setIsInBookshelf(true);
        toast({
          title: "Added to Bookshelf! 📚",
          description: "Story saved to your reading list",
        });
      }
      
      onBookshelfChange?.();
    } catch (error) {
      console.error('Bookshelf error:', error);
      toast({
        title: "Error",
        description: "Failed to update bookshelf",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`overflow-hidden cursor-pointer transition-all ${completed ? 'ring-2 ring-yellow-500' : ''} ${isFeatured ? 'ring-2 ring-primary' : ''}`}>
        {/* Cover Art */}
        <div className={`h-40 bg-gradient-to-br ${cover_gradient} relative`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(category)} backdrop-blur-sm`} />
          
          {/* Top right badges */}
          <div className="absolute top-3 right-3 flex gap-2">
            {isFeatured && (
              <Badge className="bg-primary text-primary-foreground text-xs">
                <Award className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            <Badge variant="secondary" className="bg-white/90 text-xs">
              Grade {grade_level === 0 ? 'K' : grade_level}
            </Badge>
          </div>
          
          {/* Bookmark button */}
          <button
            onClick={handleAddToBookshelf}
            className={`absolute top-3 left-3 p-2 rounded-full transition-all ${
              isInBookshelf || completed
                ? 'bg-yellow-500 text-white' 
                : 'bg-white/80 text-gray-600 hover:bg-white'
            }`}
            disabled={isLoading}
          >
            {isInBookshelf || completed ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </button>
          
          {/* Completion star */}
          {completed && (
            <div className="absolute bottom-3 right-3">
              <div className="bg-yellow-500 text-white rounded-full p-2">
                <Star className="h-4 w-4 fill-current" />
              </div>
            </div>
          )}
          
          <div className="absolute bottom-3 left-3 text-4xl">
            {categoryIcons[category]}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-heading text-lg font-bold mb-1 line-clamp-1">{title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {word_count} words
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {reading_time_minutes} min
            </div>
          </div>
          {/* Progress Info */}
          {times_read > 0 && (
            <div className="text-xs text-muted-foreground">
              Read {times_read} {times_read === 1 ? 'time' : 'times'}
              {best_wpm && ` • Best: ${best_wpm} WPM`}
            </div>
          )}

          {/* Voting Buttons */}
          {showVoting && storyId && (
            <StoryVotingButtons
              storyId={storyId}
              thumbsUpCount={thumbsUpCount}
              thumbsDownCount={thumbsDownCount}
              helpedYesCount={helpedYesCount}
              helpedNoCount={helpedNoCount}
              compact
            />
          )}

          {/* Action Button */}
          <Button
            onClick={onStartReading}
            className="w-full"
            variant={completed ? "outline" : "default"}
          >
            {completed ? 'Read Again' : 'Start Reading'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};