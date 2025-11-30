import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { StoryCard } from "./StoryCard";
import { curatedStories, CuratedStory } from "@/data/curatedStories";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StoryLibraryProps {
  onSelectStory: (story: CuratedStory) => void;
}

const categories = ['all', 'animals', 'space', 'sports', 'fairy_tales', 'science', 'adventure', 'history'];
const grades = ['all', 'K', '1', '2', '3', '4', '5'];

export const StoryLibrary = ({ onSelectStory }: StoryLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");

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

  // Create a map of story progress by title
  const progressMap = useMemo(() => {
    const map = new Map();
    progressData?.forEach(progress => {
      // We'll need to match by story_id once stories are in DB
      // For now, this is a placeholder
      map.set(progress.story_id, progress);
    });
    return map;
  }, [progressData]);

  // Filter stories
  const filteredStories = useMemo(() => {
    return curatedStories.filter(story => {
      const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || story.category === selectedCategory;
      const matchesGrade = selectedGrade === 'all' || 
        (selectedGrade === 'K' && story.grade_level === 0) ||
        story.grade_level.toString() === selectedGrade;
      
      return matchesSearch && matchesCategory && matchesGrade;
    });
  }, [searchQuery, selectedCategory, selectedGrade]);

  // Recommended stories (based on target phonemes - placeholder logic)
  const recommendedStories = useMemo(() => {
    return curatedStories.slice(0, 3);
  }, []);

  return (
    <div className="space-y-6">
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

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          
          {/* Grade Filters */}
          <div className="flex gap-2">
            {grades.map(grade => (
              <Badge
                key={grade}
                variant={selectedGrade === grade ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedGrade(grade)}
              >
                {grade === 'all' ? 'All Grades' : `Grade ${grade}`}
              </Badge>
            ))}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Category Filters */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => setSelectedCategory(category)}
              >
                {category.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Section */}
      {recommendedStories.length > 0 && selectedCategory === 'all' && !searchQuery && (
        <div>
          <h3 className="font-heading text-xl font-bold mb-4">✨ Recommended for You</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedStories.map((story, index) => (
              <StoryCard
                key={`rec-${index}`}
                {...story}
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
