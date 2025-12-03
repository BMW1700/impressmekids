import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trophy, TrendingUp, Clock } from "lucide-react";
import { motion } from "framer-motion";

const categoryLabels: Record<string, string> = {
  animals: "Animals 🐾",
  space: "Space 🚀",
  sports: "Sports ⚽",
  fairy_tales: "Fairy Tales ✨",
  science: "Science 🔬",
  adventure: "Adventure 🗺️",
  history: "History 📜"
};

export const ReadingBookshelf = () => {
  // Fetch student's reading progress
  const { data: progressData, isLoading } = useQuery({
    queryKey: ['reading-bookshelf'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // ONLY show books that are FULLY completed AND student passed (best_accuracy >= 70%)
      const { data, error } = await supabase
        .from('student_reading_progress')
        .select('*, reading_library(*)')
        .eq('student_id', user.id)
        .eq('completed', true)
        .gte('best_accuracy', 70) // Must have passed with 70%+ accuracy
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Calculate stats
  const totalBooksRead = progressData?.length || 0;
  const totalWordsRead = progressData?.reduce((sum, p) => sum + (p.reading_library?.word_count || 0), 0) || 0;
  const averageWpm = progressData?.length 
    ? Math.round(progressData.reduce((sum, p) => sum + (p.best_wpm || 0), 0) / progressData.length)
    : 0;
  const totalTimeMinutes = progressData?.reduce((sum, p) => sum + (p.reading_library?.reading_time_minutes || 0) * (p.times_read || 1), 0) || 0;

  // Group by category
  const booksByCategory = progressData?.reduce((acc, progress) => {
    const category = progress.reading_library?.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(progress);
    return acc;
  }, {} as Record<string, any[]>) || {};

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-32 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{totalBooksRead}</div>
            <div className="text-sm text-muted-foreground">Books Read</div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{totalWordsRead.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Words Conquered</div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 text-center">
            <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold">{averageWpm}</div>
            <div className="text-sm text-muted-foreground">Avg WPM</div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{Math.round(totalTimeMinutes / 60)}</div>
            <div className="text-sm text-muted-foreground">Hours Practiced</div>
          </Card>
        </motion.div>
      </div>

      {/* Bookshelves by Category */}
      {Object.entries(booksByCategory).map(([category, books], categoryIndex) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + categoryIndex * 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-xl font-bold">
              {categoryLabels[category] || category}
            </h3>
            <Badge variant="secondary">
              {books.length} {books.length === 1 ? 'book' : 'books'}
            </Badge>
          </div>

          {/* Bookshelf */}
          <Card className="p-6">
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {books.map((progress, bookIndex) => (
                <motion.div
                  key={progress.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + categoryIndex * 0.1 + bookIndex * 0.05 }}
                  className="relative group cursor-pointer"
                >
                  {/* Book Spine */}
                  <div className={`h-32 bg-gradient-to-b ${progress.reading_library?.cover_gradient} rounded-sm shadow-md hover:shadow-lg transition-shadow`}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
                    
                    {/* Book Title (Vertical) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white transform -rotate-90 whitespace-nowrap px-2 truncate w-32 text-center">
                        {progress.reading_library?.title}
                      </span>
                    </div>

                    {/* Completion Star */}
                    <div className="absolute top-1 right-1 text-yellow-400">
                      ⭐
                    </div>
                  </div>

                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-background border rounded-lg shadow-lg p-3 whitespace-nowrap text-xs">
                      <div className="font-bold">{progress.reading_library?.title}</div>
                      <div className="text-muted-foreground">
                        Read {progress.times_read}x • Best: {progress.best_wpm} WPM
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      ))}

      {/* Empty State */}
      {totalBooksRead === 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-heading text-xl font-bold mb-2">Your bookshelf is empty</h3>
          <p className="text-muted-foreground">
            Complete stories to see them appear here!
          </p>
        </Card>
      )}
    </div>
  );
};
