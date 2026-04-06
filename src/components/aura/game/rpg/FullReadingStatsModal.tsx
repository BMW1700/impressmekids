import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { 
  X, 
  BookOpen, 
  TrendingUp, 
  Target, 
  Zap,
  Trophy,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coins,
  Swords,
  Sparkles,
  Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ImprovementTracker } from "@/components/shared/ImprovementTracker";
import { 
  calculateBenchmarkStatus, 
  getBenchmarkStatusLabel, 
  getBenchmarkStatusColor,
  calculateFluencyLevel,
  getFluencyLevelLabel,
  getFluencyLevelColor,
  getCurrentScreeningPeriod
} from "@/lib/fluencyBenchmarks";

interface FullReadingStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName?: string;
  gradeMode?: string;
}

import { ipaToEnglish, ipaToFriendlyLabel } from '@/lib/phonemeDisplayUtils';

// Aliases for backward compat within this file
const getPhonemeDisplay = ipaToEnglish;
const getPhonemeLabel = ipaToFriendlyLabel;

// Phoneme mastery type from error patterns table
interface PhonemePattern {
  error_type: string;
  frequency: number;
  mastered: boolean;
}

export const FullReadingStatsModal = ({ 
  isOpen, 
  onClose, 
  studentId,
  studentName = "Reader",
  gradeMode
}: FullReadingStatsModalProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch weekly progress data
  const { data: progress, isLoading: progressLoading } = useWeeklyProgress(studentId, 8, gradeMode);

  // Fetch campaign progress for RPG stats
  const { data: campaignProgress } = useQuery({
    queryKey: ['campaign-progress-modal', studentId, gradeMode],
    queryFn: async () => {
      let query = supabase
        .from('campaign_progress')
        .select('*')
        .eq('student_id', studentId);
      if (gradeMode) query = query.eq('grade_mode', gradeMode);
      const { data } = await query.maybeSingle();
      return data;
    },
    enabled: !!studentId && isOpen,
  });

  // Fetch reading stats
  const { data: readingStats } = useQuery({
    queryKey: ['reading-stats-modal', studentId, gradeMode],
    queryFn: async () => {
      let query = supabase
        .from('student_reading_stats')
        .select('*')
        .eq('student_id', studentId);
      if (gradeMode) query = query.eq('grade_mode', gradeMode);
      const { data } = await query.maybeSingle();
      return data;
    },
    enabled: !!studentId && isOpen,
  });

  // Fetch phoneme patterns from error_patterns table
  const { data: phonemePatterns } = useQuery({
    queryKey: ['phoneme-patterns-modal', studentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('student_error_patterns')
        .select('error_type, frequency, mastered')
        .eq('student_id', studentId)
        .order('frequency', { ascending: false })
        .limit(20);
      return (data || []) as PhonemePattern[];
    },
    enabled: !!studentId && isOpen,
  });

  // Fetch recent sessions
  const { data: recentSessions } = useQuery({
    queryKey: ['recent-sessions-modal', studentId, gradeMode],
    queryFn: async () => {
      let query = supabase
        .from('reading_sessions')
        .select('id, created_at, wpm, wcpm, accuracy_percent, fluency_score, words_read, reading_mode, fluency_level')
        .eq('student_id', studentId);
      if (gradeMode) query = query.eq('grade_mode', gradeMode);
      const { data } = await query
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!studentId && isOpen,
  });

  // Calculate grade level from WPM using DIBELS benchmarks
  const getGradeLevel = (wpm: number): { grade: string; level: number; nextGoal: number } => {
    // DIBELS/Hasbrouck-Tindal end-of-year 50th percentile benchmarks
    if (wpm < 23) return { grade: 'Pre-K', level: 0, nextGoal: 23 };
    if (wpm < 53) return { grade: 'K', level: 1, nextGoal: 53 };
    if (wpm < 82) return { grade: '1st', level: 2, nextGoal: 82 };
    if (wpm < 104) return { grade: '2nd', level: 3, nextGoal: 104 };
    if (wpm < 123) return { grade: '3rd', level: 4, nextGoal: 123 };
    if (wpm < 139) return { grade: '4th', level: 5, nextGoal: 139 };
    if (wpm < 150) return { grade: '5th', level: 6, nextGoal: 150 };
    if (wpm < 162) return { grade: '6th', level: 7, nextGoal: 162 };
    if (wpm < 177) return { grade: '7th', level: 8, nextGoal: 177 };
    return { grade: '8th+', level: 9, nextGoal: 200 };
  };

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const currentWpm = progress?.currentWeek?.avgWcpm || 0;
  const currentAccuracy = progress?.currentWeek?.avgAccuracy || 0;
  const gradeInfo = getGradeLevel(currentWpm);
  const progressToNext = gradeInfo.nextGoal > 0 
    ? Math.min(100, (currentWpm / gradeInfo.nextGoal) * 100) 
    : 100;

  // Calculate benchmark status
  const period = getCurrentScreeningPeriod();
  const benchmarkStatus = calculateBenchmarkStatus(currentWpm, gradeInfo.level + 1, period);
  const benchmarkColors = getBenchmarkStatusColor(benchmarkStatus);
  
  // Calculate fluency level from accuracy
  const fluencyLevel = calculateFluencyLevel(currentAccuracy);
  const fluencyColors = getFluencyLevelColor(fluencyLevel);

  // Separate mastered vs struggling phonemes based on the actual schema
  const masteredPhonemes = phonemePatterns?.filter(p => p.mastered) || [];
  const strugglingPhonemes = phonemePatterns?.filter(p => !p.mastered && p.frequency >= 2) || [];

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-slate-900 via-indigo-900/30 to-slate-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.3)] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">
                  {studentName}'s Reading Journey
                </h2>
                <p className="text-sm text-indigo-300">Complete AURA Progress Report</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="bg-slate-800/50 border border-slate-700 p-1 mb-4 grid grid-cols-4">
              <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-600">
                <Star className="w-4 h-4 mr-1" /> Overview
              </TabsTrigger>
              <TabsTrigger value="sounds" className="data-[state=active]:bg-indigo-600">
                <Volume2 className="w-4 h-4 mr-1" /> Sounds
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-indigo-600">
                <Clock className="w-4 h-4 mr-1" /> History
              </TabsTrigger>
              <TabsTrigger value="rpg" className="data-[state=active]:bg-indigo-600">
                <Swords className="w-4 h-4 mr-1" /> Quest
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto pr-2">
              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="mt-0 space-y-4">
                {/* Reading Level Hero Card */}
                <Card className="p-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border-indigo-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-indigo-300 mb-1">Current Reading Level</p>
                      <div className="flex items-center gap-3">
                        <span className="text-4xl font-black text-white">{gradeInfo.grade}</span>
                        <div className="flex">
                          {[...Array(Math.min(gradeInfo.level + 1, 5))].map((_, i) => (
                            <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${benchmarkColors.bg} ${benchmarkColors.text} ${benchmarkColors.border} border`}>
                        {getBenchmarkStatusLabel(benchmarkStatus)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Progress to next level</span>
                      <span className="text-indigo-300">{currentWpm} / {gradeInfo.nextGoal} WPM</span>
                    </div>
                    <Progress value={progressToNext} className="h-3 bg-slate-700" />
                  </div>
                </Card>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="p-4 bg-slate-800/50 border-slate-700 text-center">
                    <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{currentWpm}</p>
                    <p className="text-xs text-slate-400">Words/Min</p>
                    {progress?.wcpmChange !== undefined && progress.wcpmChange !== 0 && (
                      <div className={`flex items-center justify-center gap-1 mt-1 text-xs ${progress.wcpmChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <TrendingUp className="w-3 h-3" />
                        {progress.wcpmChange > 0 ? '+' : ''}{progress.wcpmChange}
                      </div>
                    )}
                  </Card>
                  
                  <Card className="p-4 bg-slate-800/50 border-slate-700 text-center">
                    <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{currentAccuracy}%</p>
                    <p className="text-xs text-slate-400">Accuracy</p>
                    <Badge className={`${fluencyColors.bg} ${fluencyColors.text} mt-1 text-xs`}>
                      {getFluencyLevelLabel(fluencyLevel)}
                    </Badge>
                  </Card>
                  
                  <Card className="p-4 bg-slate-800/50 border-slate-700 text-center">
                    <BookOpen className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{readingStats?.total_words_read?.toLocaleString() || 0}</p>
                    <p className="text-xs text-slate-400">Words Read</p>
                  </Card>
                  
                  <Card className="p-4 bg-slate-800/50 border-slate-700 text-center">
                    <Trophy className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{readingStats?.total_sessions || recentSessions?.length || 0}</p>
                    <p className="text-xs text-slate-400">Sessions</p>
                  </Card>
                </div>

                {/* Progress Chart */}
                {studentId && (
                  <Card className="p-4 bg-slate-800/50 border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      Progress Over Time
                    </h3>
                    <ImprovementTracker 
                      studentId={studentId} 
                      studentName={studentName}
                      variant="detailed"
                    />
                  </Card>
                )}

                {/* Strengths & Areas for Practice */}
                {progress && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {progress.topStrengths && progress.topStrengths.length > 0 && (
                      <Card className="p-4 bg-green-500/10 border-green-500/30">
                        <h4 className="font-bold text-green-400 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Strengths
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {progress.topStrengths.map((strength, i) => (
                            <Badge key={i} variant="secondary" className="bg-green-500/20 text-green-300">
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    )}
                    
                    {progress.areasForPractice && progress.areasForPractice.length > 0 && (
                      <Card className="p-4 bg-amber-500/10 border-amber-500/30">
                        <h4 className="font-bold text-amber-400 mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Focus Areas
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {progress.areasForPractice.map((area, i) => (
                            <Badge key={i} variant="secondary" className="bg-amber-500/20 text-amber-300">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* SOUNDS TAB */}
              <TabsContent value="sounds" className="mt-0 space-y-4">
                <Card className="p-4 bg-slate-800/50 border-slate-700">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    Mastered Sounds ({masteredPhonemes.length})
                  </h3>
                  {masteredPhonemes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {masteredPhonemes.map((p, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="group relative"
                        >
                          <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1 text-sm font-bold cursor-help">
                            {getPhonemeDisplay(p.error_type)}
                          </Badge>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {getPhonemeLabel(p.error_type)}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">Keep practicing to master sounds!</p>
                  )}
                </Card>

                <Card className="p-4 bg-slate-800/50 border-slate-700">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-400" />
                    Sounds to Practice ({strugglingPhonemes.length})
                  </h3>
                  {strugglingPhonemes.length > 0 ? (
                    <div className="space-y-3">
                      {strugglingPhonemes.slice(0, 5).map((p, i) => {
                        // Higher frequency = more errors = lower mastery progress
                        const masteryProgress = Math.max(0, 100 - (p.frequency * 10));
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 text-sm font-bold min-w-[50px] text-center">
                              {getPhonemeDisplay(p.error_type)}
                            </Badge>
                            <div className="flex-1">
                              <Progress value={masteryProgress} className="h-2 bg-slate-700" />
                            </div>
                            <span className="text-sm text-slate-400 w-12 text-right">{p.frequency}x</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-green-400 text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Amazing! No struggling sounds detected!
                    </p>
                  )}
                </Card>

                {/* Phoneme substitutions */}
                {progress?.phonemeSubstitutions && progress.phonemeSubstitutions.length > 0 && (
                  <Card className="p-4 bg-slate-800/50 border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                      Common Mix-ups
                    </h3>
                    <div className="space-y-2">
                      {progress.phonemeSubstitutions.slice(0, 5).map((sub, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Badge className="bg-red-500/20 text-red-300">{getPhonemeDisplay(sub.expected)}</Badge>
                          <span className="text-slate-400">→</span>
                          <Badge className="bg-orange-500/20 text-orange-300">{getPhonemeDisplay(sub.actual)}</Badge>
                          <span className="text-slate-500 text-xs">({sub.count}x)</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* HISTORY TAB */}
              <TabsContent value="history" className="mt-0 space-y-4">
                <Card className="p-4 bg-slate-800/50 border-slate-700">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    Recent Reading Sessions
                  </h3>
                  {recentSessions && recentSessions.length > 0 ? (
                    <div className="space-y-3">
                      {recentSessions.map((session, i) => (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {session.reading_mode?.replace(/_/g, ' ') || 'Reading Practice'}
                              </p>
                              <p className="text-xs text-slate-400">
                                {new Date(session.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-bold text-amber-400">{session.wpm || session.wcpm || 0} WPM</p>
                              <p className="text-xs text-slate-400">{session.accuracy_percent || 0}% acc</p>
                            </div>
                            {(session.fluency_score || 0) > 0 && (
                              <Badge className="bg-purple-500/20 text-purple-300">
                                {session.fluency_score}/4
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-8">No reading sessions yet. Start reading to see your history!</p>
                  )}
                </Card>
              </TabsContent>

              {/* RPG TAB */}
              <TabsContent value="rpg" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30 text-center">
                    <Coins className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{campaignProgress?.total_gold?.toLocaleString() || 0}</p>
                    <p className="text-xs text-amber-300">Total Gold</p>
                  </Card>
                  
                  <Card className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500/30 text-center">
                    <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{campaignProgress?.total_xp_earned?.toLocaleString() || 0}</p>
                    <p className="text-xs text-purple-300">Total XP</p>
                  </Card>
                  
                  <Card className="p-4 bg-gradient-to-br from-red-500/20 to-orange-500/10 border-red-500/30 text-center">
                    <Swords className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{campaignProgress?.grog_battles_won || 0}</p>
                    <p className="text-xs text-red-300">Battles Won</p>
                  </Card>
                  
                  <Card className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-center">
                    <BookOpen className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{campaignProgress?.books_rescued || 0}</p>
                    <p className="text-xs text-blue-300">Books Rescued</p>
                  </Card>
                </div>

                <Card className="p-4 bg-slate-800/50 border-slate-700">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    World Progress
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Current World</span>
                      <Badge className="bg-indigo-500/20 text-indigo-300">World {campaignProgress?.current_world || 1}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Longest Streak</span>
                      <span className="text-amber-400 font-bold">{campaignProgress?.longest_streak || 0} words</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Login Streak</span>
                      <span className="text-green-400 font-bold">{campaignProgress?.login_streak || 0} days 🔥</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Achievements</span>
                      <span className="text-purple-400 font-bold">{campaignProgress?.total_achievements || 0}</span>
                    </div>
                  </div>
                </Card>

                {/* Reading ➜ Gold explanation */}
                <Card className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-green-300 mb-1">Reading = Rewards!</h4>
                      <p className="text-sm text-slate-300">
                        Every word read correctly earns gold and XP. Higher accuracy means bonus rewards!
                        Keep reading to unlock new skins, powers, and climb the leaderboard.
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
