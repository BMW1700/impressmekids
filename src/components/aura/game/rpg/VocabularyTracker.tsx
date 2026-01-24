import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  Star, 
  Sparkles, 
  X,
  ChevronRight,
  Volume2,
  Trophy,
  Target
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface VocabularyWord {
  id: string;
  word: string;
  definition: string | null;
  times_seen: number;
  times_correct: number;
  mastered: boolean;
  collected_at: string;
}

interface VocabularyTrackerProps {
  studentId: string;
  isOpen?: boolean;
  onClose?: () => void;
  variant?: 'full' | 'mini' | 'inline';
  newWords?: string[];
  onNewWordsSaved?: () => void;
}

// Common words to filter out (articles, prepositions, etc.)
const COMMON_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'shall', 'can', 'to', 'of', 'in', 'for', 'on', 'with',
  'at', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'beneath', 'under',
  'above', 'it', 'its', 'this', 'that', 'these', 'those', 'he', 'she', 'they',
  'we', 'you', 'i', 'my', 'your', 'his', 'her', 'their', 'our', 'what', 'which',
  'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there',
  'then', 'once', 'upon', 'time', 'said', 'went', 'came', 'got', 'get', 'put',
  'see', 'saw', 'seen', 'look', 'looked', 'make', 'made', 'know', 'knew', 'take',
  'took', 'come', 'came', 'think', 'thought', 'give', 'gave', 'tell', 'told'
]);

// Simple definitions for common vocabulary words
const WORD_DEFINITIONS: Record<string, string> = {
  adventure: 'an exciting experience or journey',
  mysterious: 'hard to understand or explain',
  beautiful: 'very pretty or pleasing to look at',
  incredible: 'hard to believe, amazing',
  enormous: 'very large, huge',
  delicious: 'tasting very good',
  brilliant: 'very smart or very bright',
  careful: 'paying close attention to avoid danger',
  dangerous: 'likely to cause harm',
  excited: 'feeling very happy and eager',
  frightened: 'feeling scared or afraid',
  generous: 'willing to give and share',
  horrible: 'very bad or unpleasant',
  important: 'having great value or meaning',
  jealous: 'wanting what someone else has',
  wonderful: 'extremely good, excellent',
  terrible: 'very bad or unpleasant',
  strange: 'unusual or surprising',
  special: 'better or different from usual',
  quickly: 'in a fast way',
  suddenly: 'happening without warning',
  quietly: 'without making noise',
  carefully: 'with great attention',
  happily: 'in a happy way',
  bravely: 'in a brave way, without fear',
};

// Check if a word is a power word (longer, not common)
export const isPowerWord = (word: string): boolean => {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  return cleaned.length >= 6 && !COMMON_WORDS.has(cleaned);
};

// Get definition for a word
export const getWordDefinition = (word: string): string | null => {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  return WORD_DEFINITIONS[cleaned] || null;
};

export const VocabularyTracker = ({
  studentId,
  isOpen = true,
  onClose,
  variant = 'full',
  newWords = [],
  onNewWordsSaved
}: VocabularyTrackerProps) => {
  const queryClient = useQueryClient();
  const [showNewWords, setShowNewWords] = useState(false);

  // Fetch vocabulary
  const { data: vocabulary, isLoading } = useQuery({
    queryKey: ['student-vocabulary', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_vocabulary')
        .select('*')
        .eq('student_id', studentId)
        .order('collected_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as VocabularyWord[];
    },
    enabled: !!studentId,
  });

  // Add new words mutation
  const addWordsMutation = useMutation({
    mutationFn: async (words: string[]) => {
      const powerWords = words.filter(isPowerWord);
      if (powerWords.length === 0) return [];

      const wordsToInsert = powerWords.map(word => ({
        student_id: studentId,
        word: word.toLowerCase(),
        definition: getWordDefinition(word),
        times_seen: 1,
        times_correct: 0,
        mastered: false,
      }));

      // Use upsert to handle duplicates
      const { data, error } = await supabase
        .from('student_vocabulary')
        .upsert(wordsToInsert, { 
          onConflict: 'student_id,word',
          ignoreDuplicates: false 
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-vocabulary', studentId] });
      onNewWordsSaved?.();
    },
  });

  // Save new words when they come in
  useEffect(() => {
    if (newWords.length > 0) {
      const powerWords = newWords.filter(isPowerWord);
      if (powerWords.length > 0) {
        setShowNewWords(true);
        addWordsMutation.mutate(newWords);
      }
    }
  }, [newWords]);

  const masteredWords = vocabulary?.filter(w => w.mastered) || [];
  const practicingWords = vocabulary?.filter(w => !w.mastered) || [];
  const totalWords = vocabulary?.length || 0;

  // Mini variant - just shows count
  if (variant === 'mini') {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-lg px-3 py-2 flex items-center gap-2"
      >
        <BookOpen className="w-4 h-4 text-purple-400" />
        <span className="text-white font-bold">{totalWords}</span>
        <span className="text-purple-300 text-xs">Words</span>
      </motion.div>
    );
  }

  // Inline variant - compact inline display
  if (variant === 'inline') {
    return (
      <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white">Word Collection</h3>
          </div>
          <Badge className="bg-purple-500/20 text-purple-300">{totalWords} Words</Badge>
        </div>
        
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-300">{masteredWords.length} Mastered</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300">{practicingWords.length} Practicing</span>
          </div>
        </div>

        {/* Recent words preview */}
        {vocabulary && vocabulary.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {vocabulary.slice(0, 5).map((word, i) => (
              <Badge key={i} variant="secondary" className="bg-slate-800/50 text-slate-300 text-xs">
                {word.word}
              </Badge>
            ))}
            {vocabulary.length > 5 && (
              <Badge variant="secondary" className="bg-slate-800/50 text-slate-400 text-xs">
                +{vocabulary.length - 5} more
              </Badge>
            )}
          </div>
        )}
      </Card>
    );
  }

  // Full modal variant
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-hidden border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.3)] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Word Collection</h2>
                <p className="text-sm text-purple-300">Power Words from your adventures</p>
              </div>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="p-3 bg-slate-800/50 border-slate-700 text-center">
              <p className="text-2xl font-bold text-white">{totalWords}</p>
              <p className="text-xs text-slate-400">Total Words</p>
            </Card>
            <Card className="p-3 bg-green-500/10 border-green-500/30 text-center">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <p className="text-2xl font-bold text-white">{masteredWords.length}</p>
              </div>
              <p className="text-xs text-green-400">Mastered</p>
            </Card>
            <Card className="p-3 bg-blue-500/10 border-blue-500/30 text-center">
              <div className="flex items-center justify-center gap-1">
                <Target className="w-4 h-4 text-blue-400" />
                <p className="text-2xl font-bold text-white">{practicingWords.length}</p>
              </div>
              <p className="text-xs text-blue-400">Practicing</p>
            </Card>
          </div>

          {/* New Words Popup */}
          <AnimatePresence>
            {showNewWords && newWords.filter(isPowerWord).length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-4 overflow-hidden"
              >
                <Card className="p-4 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-amber-300">New Words Collected!</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newWords.filter(isPowerWord).map((word, i) => (
                      <Badge key={i} className="bg-amber-500/30 text-amber-200 border border-amber-500/50">
                        ⭐ {word}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewWords(false)}
                    className="mt-2 text-amber-400 hover:text-amber-300"
                  >
                    Dismiss
                  </Button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Word List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="text-center py-8 text-slate-400">Loading your words...</div>
            ) : vocabulary && vocabulary.length > 0 ? (
              <div className="space-y-2 pr-4">
                {vocabulary.map((word, index) => (
                  <motion.div
                    key={word.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`p-3 rounded-lg border flex items-center justify-between
                      ${word.mastered 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-slate-800/50 border-slate-700'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {word.mastered && (
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      )}
                      <div>
                        <p className="font-bold text-white">{word.word}</p>
                        {word.definition && (
                          <p className="text-xs text-slate-400">{word.definition}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">
                        Seen {word.times_seen}x
                      </span>
                      {word.times_correct > 0 && (
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                          {word.times_correct} correct
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No words collected yet!</p>
                <p className="text-sm text-slate-500">Read stories to collect Power Words</p>
              </div>
            )}
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
