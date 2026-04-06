import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, Sparkles, Sword, BookOpen, Crown, Brain } from "lucide-react";
import { StoryCard } from "./StoryCard";
import { curatedStories, CuratedStory } from "@/data/curatedStories";
import { agentStories } from "@/data/agentStories";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCampaignProgress } from "@/hooks/useCampaignProgress";
import { motion } from "framer-motion";
import { useMLContextSafe } from "@/components/ml/MLStatusProvider";
import { rankStoriesByPhonemeNeed, extractStrugglingPhonemes } from "@/lib/adaptiveStoryRanking";
import type { GradeMode } from "@/lib/gameTheme";

interface StoryLibraryProps {
  onSelectStory: (story: CuratedStory) => void;
  onStartCampaign?: () => void;
  onStartRpgMode?: () => void;
  categoryFilter?: string | null;
  gradeMode?: GradeMode;
}

const categories = ['all', 'animals', 'space', 'sports', 'fairy_tales', 'science', 'adventure', 'history'];
const k5Grades = ['all', 'K', '1', '2', '3', '4', '5'];
const middleHighGrades = ['all', '6', '7', '8', '9', '10', '11', '12'];

export const StoryLibrary = ({ onSelectStory, onStartCampaign, onStartRpgMode, categoryFilter, gradeMode = 'k5' }: StoryLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || "all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const mlContext = useMLContextSafe();

  // Use grade-appropriate stories and grade chips
  const baseStories = gradeMode === '6to12' ? agentStories : curatedStories;
  const grades = gradeMode === '6to12' ? middleHighGrades : k5Grades;

  // Fetch student's reading progress
  const { data: progressData } = useQuery({
    queryKey: ['student-reading-progress'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('student_reading_progress')
        .select('*')
        .eq('student_id', user.id);

      if (error) throw error;
      return data;
    }
  });

  // Fetch published community stories
  const { data: communityStories } = useQuery({
    queryKey: ['community-stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_library')
        .select('*')
        .eq('is_published', true)
        .gte('grade_level', gradeMode === '6to12' ? 6 : 0)
        .lte('grade_level', gradeMode === '6to12' ? 12 : 5)
        .order('is_featured', { ascending: false })
        .order('thumbs_up_count', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Create a map of story progress by story_id
  const progressMap = useMemo(() => {
    const map = new Map();
    progressData?.forEach(progress => {
      map.set(progress.story_id, progress);
    });
    return map;
  }, [progressData]);

  // Combine curated stories with community stories
  const allStories = useMemo(() => {
    const stories: (CuratedStory & { 
      storyId?: string; 
      thumbsUpCount?: number;
      thumbsDownCount?: number;
      helpedYesCount?: number;
      helpedNoCount?: number;
      isFeatured?: boolean;
      isFromCommunity?: boolean;
    })[] = [];

    // Add grade-appropriate curated/agent stories first
    baseStories.forEach(story => {
      stories.push({ ...story, isFromCommunity: false });
    });

    // Add community stories (avoid duplicates by title)
    const baseTitles = new Set(baseStories.map(s => s.title.toLowerCase()));
    communityStories?.forEach(story => {
      if (!baseTitles.has(story.title.toLowerCase())) {
        stories.push({
          title: story.title,
          description: story.description || '',
          passage_text: story.passage_text,
          grade_level: story.grade_level,
          category: story.category as CuratedStory['category'],
          word_count: story.word_count || 0,
          reading_time_minutes: story.reading_time_minutes || 1,
          difficulty_level: story.difficulty_level || 1,
          cover_gradient: story.cover_gradient || 'from-blue-400 to-cyan-500',
          target_phonemes: story.target_phonemes || [],
          storyId: story.id,
          thumbsUpCount: story.thumbs_up_count || 0,
          thumbsDownCount: story.thumbs_down_count || 0,
          helpedYesCount: story.helped_yes_count || 0,
          helpedNoCount: story.helped_no_count || 0,
          isFeatured: story.is_featured || false,
          isFromCommunity: true,
        });
      }
    });

    return stories;
  }, [communityStories, baseStories]);

  // Filter stories
  const filteredStories = useMemo(() => {
    return allStories.filter(story => {
      const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || story.category === selectedCategory;
      const matchesGrade = selectedGrade === 'all' || 
        (selectedGrade === 'K' && story.grade_level === 0) ||
        story.grade_level.toString() === selectedGrade;
      
      return matchesSearch && matchesCategory && matchesGrade;
    });
  }, [searchQuery, selectedCategory, selectedGrade, allStories]);

  // Get struggling phonemes from ML context
  const strugglingPhonemes = useMemo(() => {
    return extractStrugglingPhonemes(mlContext);
  }, [mlContext]);

  // Rank stories by phoneme need
  const rankedStories = useMemo(() => {
    return rankStoriesByPhonemeNeed(filteredStories, strugglingPhonemes);
  }, [filteredStories, strugglingPhonemes]);

  // Build a set of recommended story titles for badge display
  const recommendedTitles = useMemo(() => {
    return new Set(rankedStories.filter(r => r.isRecommended).map(r => r.story.title));
  }, [rankedStories]);

  // Featured stories (community stories that got promoted)
  const featuredStories = useMemo(() => {
    return allStories.filter(story => story.isFeatured).slice(0, 3);
  }, [allStories]);

  // Recommended stories - now ML-powered when available
  const recommendedStories = useMemo(() => {
    // If we have ML recommendations, use them
    if (strugglingPhonemes.length > 0) {
      const mlRecommended = rankedStories
        .filter(r => r.isRecommended)
        .map(r => r.story)
        .slice(0, 3);
      if (mlRecommended.length > 0) return mlRecommended;
    }
    // Fallback: prioritize featured, then high-voted community stories
    const sorted = [...allStories].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (b.thumbsUpCount || 0) - (a.thumbsUpCount || 0);
    });
    return sorted.slice(0, 3);
  }, [allStories, strugglingPhonemes, rankedStories]);

  // Get current user for campaign progress
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { progress: campaignProgress } = useCampaignProgress(user?.id || '');

  return (
    <div className="space-y-6">
      {/* Campaign Mode Banner */}
      {onStartCampaign && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Story Campaign Mode */}
          <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-3xl shadow-lg">
                    ⚔️
                  </div>
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      Story Campaign Mode
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Battle Grog the Goblin King! Read aloud to defeat enemies and rescue stolen books.
                    </p>
                    {campaignProgress && (
                      <div className="flex items-center gap-4 mt-1 text-xs">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> {campaignProgress.books_rescued} books rescued
                        </span>
                        <span className="flex items-center gap-1">
                          <Sword className="h-3 w-3" /> {campaignProgress.grog_battles_won} battles won
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={onStartCampaign}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Sword className="h-4 w-4 mr-2" />
                  Enter Campaign
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* RPG Battle Mode (Beta) */}
          {onStartRpgMode && (
            <Card className="overflow-hidden border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-3xl shadow-lg">
                      🎮
                    </div>
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        RPG Mode
                        <Badge variant="secondary" className="text-xs">BETA</Badge>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Epic reading adventure! Explore the World Map, battle goblins, rescue books!
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={onStartRpgMode}
                    className="bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700"
                  >
                    <Sword className="h-4 w-4 mr-2" />
                    Enter World Map
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-3 md:space-y-0 md:flex md:items-center md:gap-2 md:flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground hidden md:block" />
          
          {/* Grade Filters */}
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-2 min-w-max pb-2 md:pb-0">
              {grades.map(grade => (
                <Badge
                  key={grade}
                  variant={selectedGrade === grade ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap text-xs md:text-sm shrink-0"
                  onClick={() => setSelectedGrade(grade)}
                >
                  {grade === 'all' ? 'All Grades' : `Grade ${grade}`}
                </Badge>
              ))}
            </div>
          </div>

          <div className="hidden md:block w-px h-6 bg-border" />

          {/* Category Filters */}
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-2 min-w-max md:flex-wrap">
              {categories.map(category => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer capitalize whitespace-nowrap text-xs md:text-sm shrink-0"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      {featuredStories.length > 0 && selectedCategory === 'all' && !searchQuery && (
        <div>
          <h3 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Featured by the Community
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredStories.map((story, index) => (
              <StoryCard
                key={`featured-${index}`}
                {...story}
                storyId={story.storyId}
                thumbsUpCount={story.thumbsUpCount}
                thumbsDownCount={story.thumbsDownCount}
                helpedYesCount={story.helpedYesCount}
                helpedNoCount={story.helpedNoCount}
                isFeatured={story.isFeatured}
                showVoting={!!story.storyId}
                onStartReading={() => onSelectStory(story)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommended Section */}
      {recommendedStories.length > 0 && selectedCategory === 'all' && !searchQuery && featuredStories.length === 0 && (
        <div>
          <h3 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
            {strugglingPhonemes.length > 0 ? (
              <>
                <Brain className="h-5 w-5 text-primary" />
                Recommended for You
                <Badge variant="secondary" className="text-xs">ML-Powered</Badge>
              </>
            ) : (
              '✨ Recommended for You'
            )}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedStories.map((story, index) => (
              <StoryCard
                key={`rec-${index}`}
                {...story}
                storyId={story.storyId}
                thumbsUpCount={story.thumbsUpCount}
                thumbsDownCount={story.thumbsDownCount}
                helpedYesCount={story.helpedYesCount}
                helpedNoCount={story.helpedNoCount}
                isFeatured={story.isFeatured}
                showVoting={!!story.storyId}
                onStartReading={() => onSelectStory(story)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Stories */}
      <div>
        <h3 className="font-heading text-xl font-bold mb-4">
          {searchQuery || selectedCategory !== 'all' || selectedGrade !== 'all'
            ? `${filteredStories.length} Stories Found`
            : 'All Stories'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStories.map((story, index) => (
            <StoryCard
              key={index}
              {...story}
              storyId={story.storyId}
              thumbsUpCount={story.thumbsUpCount}
              thumbsDownCount={story.thumbsDownCount}
              helpedYesCount={story.helpedYesCount}
              helpedNoCount={story.helpedNoCount}
              isFeatured={story.isFeatured}
              showVoting={!!story.storyId}
              onStartReading={() => onSelectStory(story)}
            />
          ))}
        </div>

        {filteredStories.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No stories found matching your filters.</p>
            <p className="text-sm mt-2">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};