import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Type, ChevronRight } from "lucide-react";

export type ReadingMode = 'full-passage' | 'word-by-word';

interface ReadingModeSelectorProps {
  onSelectMode: (mode: ReadingMode) => void;
  storyTitle: string;
}

export const ReadingModeSelector = ({ onSelectMode, storyTitle }: ReadingModeSelectorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="p-8">
        <div className="text-center space-y-6">
          <h2 className="font-heading text-2xl font-bold">How would you like to read?</h2>
          <p className="text-muted-foreground">
            Choose how you want to practice reading "{storyTitle}"
          </p>

          <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
            {/* Full Passage Mode */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectMode('full-passage')}
              className="group relative p-6 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                    Full Passage
                    <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Read the whole story at your own pace while AURA follows along
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  Natural reading
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  Fluency practice
                </span>
              </div>
            </motion.button>

            {/* Word by Word Mode */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectMode('word-by-word')}
              className="group relative p-6 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                  <Type className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                    Word by Word
                    <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Practice each word one at a time with instant feedback
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Focused practice
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Word accuracy
                </span>
              </div>
            </motion.button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
