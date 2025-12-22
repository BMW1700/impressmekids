import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Lock, Check } from 'lucide-react';

export type PracticeMode = 'free' | 'premium';

interface PracticeModeSelectorProps {
  selectedMode: PracticeMode;
  onModeSelect: (mode: PracticeMode) => void;
  isPremiumUnlocked?: boolean;
}

export const PracticeModeSelector = ({ 
  selectedMode, 
  onModeSelect,
  isPremiumUnlocked = false 
}: PracticeModeSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Free Mode */}
      <Card 
        className={`cursor-pointer transition-all hover:scale-[1.02] ${
          selectedMode === 'free' 
            ? 'ring-2 ring-primary border-primary' 
            : 'hover:border-muted-foreground/50'
        }`}
        onClick={() => onModeSelect('free')}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-green-500/10">
                <Zap className="h-5 w-5 text-green-500" />
              </div>
              <CardTitle className="text-lg">Quick Practice</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
              Free
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-3">
            Practice speaking with basic metrics. No AI cost.
          </CardDescription>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              Words per minute tracking
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              Phoneme accuracy detection
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              Basic pronunciation feedback
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              Progress tracking
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Premium Mode */}
      <Card 
        className={`cursor-pointer transition-all hover:scale-[1.02] ${
          selectedMode === 'premium' 
            ? 'ring-2 ring-primary border-primary' 
            : 'hover:border-muted-foreground/50'
        } ${!isPremiumUnlocked ? 'opacity-90' : ''}`}
        onClick={() => onModeSelect('premium')}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <CardTitle className="text-lg">AI Coaching</CardTitle>
            </div>
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              Premium
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-3">
            Get detailed AI feedback on your speaking skills.
          </CardDescription>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-purple-500" />
              Everything in Quick Practice
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-purple-500" />
              AI-powered pronunciation coaching
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-purple-500" />
              Personalized feedback & exercises
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-purple-500" />
              Confidence & clarity analysis
            </li>
          </ul>
          {!isPremiumUnlocked && (
            <div className="mt-3 p-2 bg-amber-500/10 rounded-lg flex items-center gap-2 text-amber-600 text-xs">
              <Lock className="h-3 w-3" />
              <span>Premium subscription required</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
