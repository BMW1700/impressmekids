import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StoryVotingButtonsProps {
  storyId: string;
  thumbsUpCount?: number;
  thumbsDownCount?: number;
  helpedYesCount?: number;
  helpedNoCount?: number;
  compact?: boolean;
  showCounts?: boolean;
}

export const StoryVotingButtons = ({
  storyId,
  thumbsUpCount = 0,
  thumbsDownCount = 0,
  helpedYesCount = 0,
  helpedNoCount = 0,
  compact = false,
  showCounts = true,
}: StoryVotingButtonsProps) => {
  const [thumbsUp, setThumbsUp] = useState<boolean | null>(null);
  const [helpedLearn, setHelpedLearn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [localThumbsUp, setLocalThumbsUp] = useState(thumbsUpCount);
  const [localThumbsDown, setLocalThumbsDown] = useState(thumbsDownCount);
  const [localHelpedYes, setLocalHelpedYes] = useState(helpedYesCount);
  const [localHelpedNo, setLocalHelpedNo] = useState(helpedNoCount);
  const { toast } = useToast();

  // Fetch existing vote on mount
  useEffect(() => {
    const fetchExistingVote = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('story_votes')
        .select('thumbs_up, helped_learn')
        .eq('story_id', storyId)
        .eq('student_id', user.id)
        .maybeSingle();

      if (data) {
        setThumbsUp(data.thumbs_up);
        setHelpedLearn(data.helped_learn);
      }
    };

    fetchExistingVote();
  }, [storyId]);

  const handleVote = async (voteType: 'thumbs_up' | 'helped_learn', value: boolean) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to vote on stories",
          variant: "destructive",
        });
        return;
      }

      // Update local state optimistically
      if (voteType === 'thumbs_up') {
        const previousValue = thumbsUp;
        setThumbsUp(value);
        
        // Update local counts
        if (previousValue === true && !value) {
          setLocalThumbsUp(prev => Math.max(0, prev - 1));
          setLocalThumbsDown(prev => prev + 1);
        } else if (previousValue === false && value) {
          setLocalThumbsDown(prev => Math.max(0, prev - 1));
          setLocalThumbsUp(prev => prev + 1);
        } else if (previousValue === null && value) {
          setLocalThumbsUp(prev => prev + 1);
        } else if (previousValue === null && !value) {
          setLocalThumbsDown(prev => prev + 1);
        }
      } else {
        const previousValue = helpedLearn;
        setHelpedLearn(value);
        
        if (previousValue === true && !value) {
          setLocalHelpedYes(prev => Math.max(0, prev - 1));
          setLocalHelpedNo(prev => prev + 1);
        } else if (previousValue === false && value) {
          setLocalHelpedNo(prev => Math.max(0, prev - 1));
          setLocalHelpedYes(prev => prev + 1);
        } else if (previousValue === null && value) {
          setLocalHelpedYes(prev => prev + 1);
        } else if (previousValue === null && !value) {
          setLocalHelpedNo(prev => prev + 1);
        }
      }

      // Upsert the vote
      const updateData = voteType === 'thumbs_up' 
        ? { thumbs_up: value }
        : { helped_learn: value };

      const { error } = await supabase
        .from('story_votes')
        .upsert({
          story_id: storyId,
          student_id: user.id,
          ...updateData,
        }, {
          onConflict: 'story_id,student_id',
        });

      if (error) throw error;

      toast({
        title: "Thanks for your feedback! 🙏",
        description: voteType === 'thumbs_up' 
          ? (value ? "You liked this story!" : "Thanks for letting us know")
          : (value ? "Great to hear it helped!" : "We'll work on improving"),
      });

    } catch (error) {
      console.error('Vote error:', error);
      // Revert optimistic update
      if (voteType === 'thumbs_up') {
        setThumbsUp(thumbsUp);
      } else {
        setHelpedLearn(helpedLearn);
      }
      toast({
        title: "Error",
        description: "Failed to submit vote",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); handleVote('thumbs_up', true); }}
          disabled={isLoading}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
            thumbsUp === true 
              ? 'bg-green-500/20 text-green-600' 
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          }`}
        >
          <ThumbsUp className="h-3 w-3" />
          {showCounts && <span>{localThumbsUp}</span>}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleVote('thumbs_up', false); }}
          disabled={isLoading}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
            thumbsUp === false 
              ? 'bg-red-500/20 text-red-600' 
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          }`}
        >
          <ThumbsDown className="h-3 w-3" />
          {showCounts && <span>{localThumbsDown}</span>}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
      {/* Thumbs up/down */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Did you like this story?</p>
        <div className="flex gap-2">
          <Button
            variant={thumbsUp === true ? "default" : "outline"}
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleVote('thumbs_up', true); }}
            disabled={isLoading}
            className={`flex-1 ${thumbsUp === true ? 'bg-green-500 hover:bg-green-600' : ''}`}
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Yes! {showCounts && `(${localThumbsUp})`}
          </Button>
          <Button
            variant={thumbsUp === false ? "default" : "outline"}
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleVote('thumbs_up', false); }}
            disabled={isLoading}
            className={`flex-1 ${thumbsUp === false ? 'bg-red-500 hover:bg-red-600' : ''}`}
          >
            <ThumbsDown className="h-4 w-4 mr-2" />
            Not really {showCounts && `(${localThumbsDown})`}
          </Button>
        </div>
      </div>

      {/* Did it help learn? */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <HelpCircle className="h-3 w-3" />
          Did this story help you learn to read better?
        </p>
        <div className="flex gap-2">
          <Button
            variant={helpedLearn === true ? "default" : "outline"}
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleVote('helped_learn', true); }}
            disabled={isLoading}
            className={`flex-1 ${helpedLearn === true ? 'bg-primary' : ''}`}
          >
            ✨ Yes! {showCounts && `(${localHelpedYes})`}
          </Button>
          <Button
            variant={helpedLearn === false ? "default" : "outline"}
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleVote('helped_learn', false); }}
            disabled={isLoading}
            className={`flex-1 ${helpedLearn === false ? 'bg-muted-foreground' : ''}`}
          >
            Not sure {showCounts && `(${localHelpedNo})`}
          </Button>
        </div>
      </div>
    </div>
  );
};