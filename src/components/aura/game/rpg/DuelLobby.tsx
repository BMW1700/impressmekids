import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Swords, 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle,
  Users,
  Sparkles,
  Coins,
  TrendingUp,
  Send,
  Loader2
} from "lucide-react";
import { useReadingDuels, type ReadingDuel, type ClassmateInfo } from "@/hooks/useReadingDuels";
import { curatedStories } from "@/data/curatedStories";

interface DuelLobbyProps {
  studentId: string;
  classroomId: string;
  onBack: () => void;
  onStartDuel: (duel: ReadingDuel) => void;
}

export const DuelLobby = ({
  studentId,
  classroomId,
  onBack,
  onStartDuel,
}: DuelLobbyProps) => {
  const [selectedOpponent, setSelectedOpponent] = useState<ClassmateInfo | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);

  const {
    pendingChallenges,
    outgoingChallenges,
    activeDuels,
    duelHistory,
    duelStats,
    classmates,
    createChallenge,
    acceptChallenge,
    declineChallenge,
  } = useReadingDuels(studentId, classroomId);

  const stats = duelStats.data;
  const pending = pendingChallenges.data || [];
  const outgoing = outgoingChallenges.data || [];
  const active = activeDuels.data || [];
  const history = duelHistory.data || [];
  const classmatesList = classmates.data || [];

  const handleSendChallenge = async (opponent: ClassmateInfo) => {
    // Pick a random story for the duel
    const randomStory = curatedStories[Math.floor(Math.random() * curatedStories.length)];
    
    await createChallenge.mutateAsync({
      opponentId: opponent.id,
      passageText: randomStory.passage_text,
      passageTitle: randomStory.title,
      passageWordCount: randomStory.word_count,
      classroomId,
    });
    
    setShowChallengeModal(false);
    setSelectedOpponent(null);
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "< 1 hour";
    return `${hours} hours`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-purple-300 hover:text-white hover:bg-purple-500/20"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Map
        </Button>
        
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400">
          ⚔️ READING ARENA ⚔️
        </h1>
        
        <div className="w-20" />
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats & Classmates */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card className="bg-slate-800/50 border-purple-500/30 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-amber-400" />
              <h2 className="font-bold text-white">Your Record</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-green-500/20 rounded-lg p-2">
                <div className="text-2xl font-black text-green-400">{stats?.wins || 0}</div>
                <div className="text-xs text-green-300">Wins</div>
              </div>
              <div className="bg-red-500/20 rounded-lg p-2">
                <div className="text-2xl font-black text-red-400">{stats?.losses || 0}</div>
                <div className="text-xs text-red-300">Losses</div>
              </div>
              <div className="bg-slate-500/20 rounded-lg p-2">
                <div className="text-2xl font-black text-slate-400">{stats?.draws || 0}</div>
                <div className="text-xs text-slate-300">Draws</div>
              </div>
            </div>

            {stats?.current_win_streak && stats.current_win_streak > 0 && (
              <motion.div 
                className="mt-4 flex items-center justify-center gap-2 bg-amber-500/20 rounded-lg p-2"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrendingUp className="h-4 w-4 text-amber-400" />
                <span className="text-amber-300 font-bold">
                  {stats.current_win_streak} Win Streak! 🔥
                </span>
              </motion.div>
            )}

            <div className="mt-4 flex items-center justify-between text-sm text-purple-300">
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>{stats?.total_xp_from_duels || 0} XP earned</span>
              </div>
              <div className="flex items-center gap-1">
                <Coins className="h-4 w-4 text-amber-400" />
                <span>{stats?.total_gold_from_duels || 0} Gold earned</span>
              </div>
            </div>
          </Card>

          {/* Challenge Classmates */}
          <Card className="bg-slate-800/50 border-purple-500/30 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-purple-400" />
              <h2 className="font-bold text-white">Challenge a Classmate</h2>
            </div>

            <ScrollArea className="h-48">
              {classmatesList.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">
                  No classmates found
                </p>
              ) : (
                <div className="space-y-2">
                  {classmatesList.map((classmate) => (
                    <motion.div
                      key={classmate.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-700/50 hover:bg-purple-500/20 cursor-pointer transition-colors"
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        setSelectedOpponent(classmate);
                        setShowChallengeModal(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={classmate.avatar_url || undefined} />
                          <AvatarFallback className="bg-purple-600 text-white text-xs">
                            {classmate.display_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-white text-sm">{classmate.display_name}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300">
                        <Swords className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>

        {/* Middle Column - Active Duels */}
        <div className="space-y-6">
          {/* Pending Challenges */}
          {pending.length > 0 && (
            <Card className="bg-gradient-to-br from-red-900/30 to-orange-900/30 border-red-500/50 p-4">
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Swords className="h-5 w-5 text-red-400" />
                </motion.div>
                <h2 className="font-bold text-white">Incoming Challenges!</h2>
                <Badge className="bg-red-500 text-white">{pending.length}</Badge>
              </div>

              <div className="space-y-3">
                {pending.map((duel) => (
                  <motion.div
                    key={duel.id}
                    className="bg-slate-800/50 rounded-lg p-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{duel.passage_title}</span>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {formatTimeRemaining(duel.expires_at)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => acceptChallenge.mutate(duel.id)}
                        disabled={acceptChallenge.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/20"
                        onClick={() => declineChallenge.mutate(duel.id)}
                        disabled={declineChallenge.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}

          {/* Active Duels - Ready to Play */}
          {active.length > 0 && (
            <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/50 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-green-400" />
                <h2 className="font-bold text-white">Ready to Battle!</h2>
              </div>

              <div className="space-y-3">
                {active.map((duel) => (
                  <motion.div
                    key={duel.id}
                    className="bg-slate-800/50 rounded-lg p-3 cursor-pointer hover:bg-green-500/20 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onStartDuel(duel)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white font-medium">{duel.passage_title}</span>
                        <div className="text-xs text-slate-400">
                          {duel.passage_word_count} words
                        </div>
                      </div>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Start Battle
                        <Swords className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}

          {/* Outgoing Challenges */}
          {outgoing.length > 0 && (
            <Card className="bg-slate-800/50 border-purple-500/30 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Send className="h-5 w-5 text-purple-400" />
                <h2 className="font-bold text-white">Waiting for Response</h2>
              </div>

              <div className="space-y-2">
                {outgoing.map((duel) => (
                  <div
                    key={duel.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-700/50"
                  >
                    <span className="text-slate-300 text-sm">{duel.passage_title}</span>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {formatTimeRemaining(duel.expires_at)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Empty State */}
          {pending.length === 0 && active.length === 0 && outgoing.length === 0 && (
            <Card className="bg-slate-800/50 border-purple-500/30 p-8 text-center">
              <Swords className="h-12 w-12 mx-auto text-purple-400 mb-4" />
              <h3 className="text-white font-bold mb-2">No Active Duels</h3>
              <p className="text-slate-400 text-sm">
                Challenge a classmate to start your first duel!
              </p>
            </Card>
          )}
        </div>

        {/* Right Column - History */}
        <div>
          <Card className="bg-slate-800/50 border-purple-500/30 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-amber-400" />
              <h2 className="font-bold text-white">Recent Duels</h2>
            </div>

            <ScrollArea className="h-96">
              {history.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">
                  No completed duels yet
                </p>
              ) : (
                <div className="space-y-2">
                  {history.map((duel) => {
                    const isWinner = duel.winner_id === studentId;
                    const isDraw = !duel.winner_id;
                    const myScore = duel.challenger_id === studentId 
                      ? duel.challenger_score 
                      : duel.opponent_score;

                    return (
                      <div
                        key={duel.id}
                        className={`p-3 rounded-lg border ${
                          isDraw 
                            ? 'bg-slate-700/50 border-slate-500/30' 
                            : isWinner 
                              ? 'bg-green-900/30 border-green-500/30' 
                              : 'bg-red-900/30 border-red-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white text-sm font-medium">
                            {duel.passage_title}
                          </span>
                          <Badge className={
                            isDraw 
                              ? 'bg-slate-500' 
                              : isWinner 
                                ? 'bg-green-500' 
                                : 'bg-red-500'
                          }>
                            {isDraw ? 'Draw' : isWinner ? 'Won' : 'Lost'}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-400">
                          Score: {myScore} points
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </div>

      {/* Challenge Modal */}
      <AnimatePresence>
        {showChallengeModal && selectedOpponent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowChallengeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-purple-900 to-slate-900 rounded-2xl p-6 max-w-md w-full border border-purple-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4 text-center">
                Challenge {selectedOpponent.display_name}?
              </h3>
              
              <div className="text-center mb-6">
                <Avatar className="h-16 w-16 mx-auto mb-3">
                  <AvatarImage src={selectedOpponent.avatar_url || undefined} />
                  <AvatarFallback className="bg-purple-600 text-white text-xl">
                    {selectedOpponent.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-slate-300 text-sm">
                  A random story will be selected for both of you to read.
                  <br />
                  Your opponent has 24 hours to accept!
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-500 text-slate-300"
                  onClick={() => setShowChallengeModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={() => handleSendChallenge(selectedOpponent)}
                  disabled={createChallenge.isPending}
                >
                  {createChallenge.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Swords className="h-4 w-4 mr-2" />
                  )}
                  Send Challenge
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
