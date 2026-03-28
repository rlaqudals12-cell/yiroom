/**
 * R-1 스트릭 배지 컴포넌트
 * 영양/운동 연속 기록 표시
 */

'use client';

import { Flame, Award, Utensils, Dumbbell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ReportStreakStatus } from '@/types/report';
import { useTranslations } from 'next-intl';

interface StreakBadgeProps {
  nutritionStreak: ReportStreakStatus;
  workoutStreak: ReportStreakStatus;
}

export function StreakBadge({ nutritionStreak, workoutStreak }: StreakBadgeProps) {
  const t = useTranslations('reportsUI');
  return (
    <Card data-testid="streak-badge">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-orange-500" />
          <h3 className="font-medium text-sm">{t('streakBadge0')}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 영양 스트릭 */}
          <StreakItem
            icon={<Utensils className="h-4 w-4" />}
            label="식단 기록"
            current={nutritionStreak.current}
            longest={nutritionStreak.longest}
            milestone={nutritionStreak.milestone}
          />

          {/* 운동 스트릭 */}
          <StreakItem
            icon={<Dumbbell className="h-4 w-4" />}
            label="운동 기록"
            current={workoutStreak.current}
            longest={workoutStreak.longest}
            milestone={workoutStreak.milestone}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function StreakItem({
  icon,
  label,
  current,
  longest,
  milestone,
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  longest: number;
  milestone: number | null;
}) {
  const streakEmoji = getStreakEmoji(current);
  const hasMilestone = milestone !== null;

  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{current}</span>
        <span className="text-sm text-muted-foreground">일</span>
        {streakEmoji && <span className="text-lg">{streakEmoji}</span>}
      </div>

      {hasMilestone && (
        <div className="flex items-center gap-1 mt-2">
          <Award className="h-3 w-3 text-amber-500" />
          <span className="text-xs text-amber-600 dark:text-amber-400">{milestone}일 달성!</span>
        </div>
      )}

      {longest > current && (
        <div className="text-xs text-muted-foreground mt-1">최고 기록: {longest}일</div>
      )}
    </div>
  );
}

function getStreakEmoji(_streak: number): string {
  return '';
}
