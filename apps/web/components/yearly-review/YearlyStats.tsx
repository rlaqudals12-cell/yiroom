'use client';

import { Activity, Utensils, Droplets, Trophy, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { YearlyStats as YearlyStatsType } from '@/lib/reports/yearlyTypes';
import { getMonthName } from '@/lib/reports/yearlyTypes';

interface YearlyStatsProps {
  stats: YearlyStatsType;
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
}

function StatItem({ icon, label, value, subtext }: StatItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
      </div>
    </div>
  );
}

export function YearlyStats({ stats }: YearlyStatsProps) {
  const formatNumber = (num: number) => num.toLocaleString('ko-KR');
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분`;
  };

  return (
    <div className="space-y-4" data-testid="yearly-stats">
      {/* 운동 통계 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-5 h-5 text-orange-500" />
            운동 기록
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <StatItem
              icon={<Activity className="w-5 h-5" />}
              label="총 운동 횟수"
              value={`${formatNumber(stats.workout.totalWorkouts)}회`}
            />
            <StatItem
              icon={<TrendingUp className="w-5 h-5" />}
              label="총 운동 시간"
              value={formatMinutes(stats.workout.totalMinutes)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StatItem
              icon={<Trophy className="w-5 h-5" />}
              label="최장 연속 기록"
              value={`${stats.workout.longestStreak}일`}
            />
            <StatItem
              icon={<Activity className="w-5 h-5" />}
              label="소모 칼로리"
              value={`${formatNumber(stats.workout.totalCaloriesBurned)}kcal`}
            />
          </div>
          {stats.workout.favoriteExercise && (
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <p className="text-sm text-muted-foreground">가장 많이 한 운동</p>
              <p className="font-semibold text-orange-600 dark:text-orange-400">
                {stats.workout.favoriteExercise}
              </p>
            </div>
          )}
          {stats.workout.mostActiveMonth && (
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <p className="text-sm text-muted-foreground">가장 열심히 운동한 달</p>
              <p className="font-semibold text-orange-600 dark:text-orange-400">
                {getMonthName(stats.workout.mostActiveMonth)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 영양 통계 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Utensils className="w-5 h-5 text-green-500" />
            식단 기록
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <StatItem
              icon={<Utensils className="w-5 h-5" />}
              label="총 식사 기록"
              value={`${formatNumber(stats.nutrition.totalMeals)}회`}
            />
            <StatItem
              icon={<TrendingUp className="w-5 h-5" />}
              label="일 평균 칼로리"
              value={`${formatNumber(stats.nutrition.averageCaloriesPerDay)}kcal`}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StatItem
              icon={<Trophy className="w-5 h-5" />}
              label="최장 연속 기록"
              value={`${stats.nutrition.longestStreak}일`}
            />
            <StatItem
              icon={<Droplets className="w-5 h-5" />}
              label="총 수분 섭취"
              value={`${(stats.nutrition.totalWaterMl / 1000).toFixed(1)}L`}
            />
          </div>
          {stats.nutrition.mostRecordedMonth && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <p className="text-sm text-muted-foreground">가장 꾸준히 기록한 달</p>
              <p className="font-semibold text-green-600 dark:text-green-400">
                {getMonthName(stats.nutrition.mostRecordedMonth)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
