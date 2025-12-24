'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LeaderboardPeriod, LeaderboardCategory } from '@/types/leaderboard';
import { getPeriodLabel, getCategoryLabel, getCategoryIcon } from '@/types/leaderboard';
import { Calendar, Trophy, TrendingUp, Dumbbell, Utensils, Sparkles, Star } from 'lucide-react';

interface LeaderboardTabsProps {
  period: LeaderboardPeriod;
  category: LeaderboardCategory;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  onCategoryChange: (category: LeaderboardCategory) => void;
  availablePeriods?: LeaderboardPeriod[];
  availableCategories?: LeaderboardCategory[];
}

const PERIOD_CONFIG: Record<LeaderboardPeriod, { icon: typeof Calendar }> = {
  weekly: { icon: Calendar },
  monthly: { icon: Calendar },
  all_time: { icon: Trophy },
};

const CATEGORY_CONFIG: Record<LeaderboardCategory, { icon: typeof Dumbbell }> = {
  workout: { icon: Dumbbell },
  nutrition: { icon: Utensils },
  wellness: { icon: Sparkles },
  xp: { icon: Star },
  level: { icon: TrendingUp },
};

export function LeaderboardTabs({
  period,
  category,
  onPeriodChange,
  onCategoryChange,
  availablePeriods = ['weekly', 'monthly', 'all_time'],
  availableCategories = ['xp', 'level', 'workout', 'nutrition'],
}: LeaderboardTabsProps) {
  return (
    <div className="space-y-3" data-testid="leaderboard-tabs">
      {/* 기간 탭 */}
      <Tabs value={period} onValueChange={(v) => onPeriodChange(v as LeaderboardPeriod)}>
        <TabsList className="w-full" data-testid="leaderboard-period-tabs">
          {availablePeriods.map((p) => {
            const config = PERIOD_CONFIG[p];
            const Icon = config.icon;
            return (
              <TabsTrigger key={p} value={p} className="flex-1 gap-1">
                <Icon className="h-4 w-4" />
                <span>{getPeriodLabel(p)}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* 카테고리 탭 */}
      <Tabs value={category} onValueChange={(v) => onCategoryChange(v as LeaderboardCategory)}>
        <TabsList className="w-full" data-testid="leaderboard-category-tabs">
          {availableCategories.map((c) => {
            const config = CATEGORY_CONFIG[c];
            const Icon = config.icon;
            return (
              <TabsTrigger key={c} value={c} className="flex-1 gap-1">
                <Icon className="h-4 w-4" />
                <span>{getCategoryLabel(c)}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
