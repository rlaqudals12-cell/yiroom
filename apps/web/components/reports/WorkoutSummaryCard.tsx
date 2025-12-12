/**
 * R-1 운동 요약 카드 컴포넌트
 * 주간/월간 운동 통계 표시
 */

'use client';

import { Dumbbell, Flame, Clock, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { WorkoutSummaryStats, WorkoutTrend } from '@/types/report';

interface WorkoutSummaryCardProps {
  summary: WorkoutSummaryStats;
  trend: WorkoutTrend;
  hasData: boolean;
}

export function WorkoutSummaryCard({
  summary,
  trend,
  hasData,
}: WorkoutSummaryCardProps) {
  if (!hasData) {
    return (
      <Card data-testid="workout-summary-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            운동 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Activity className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              이번 주 운동 기록이 없어요
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              운동을 기록하면 여기에 표시됩니다
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="workout-summary-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Dumbbell className="h-4 w-4" />
          운동 요약
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 주요 통계 */}
        <div className="grid grid-cols-2 gap-4">
          <StatItem
            icon={<Activity className="h-4 w-4 text-green-500" />}
            label="운동 횟수"
            value={`${summary.totalSessions}회`}
          />
          <StatItem
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            label="총 운동 시간"
            value={formatDuration(summary.totalDuration)}
          />
          <StatItem
            icon={<Flame className="h-4 w-4 text-orange-500" />}
            label="소모 칼로리"
            value={`${summary.totalCaloriesBurned.toLocaleString()}kcal`}
          />
          <StatItem
            icon={<Dumbbell className="h-4 w-4 text-purple-500" />}
            label="운동한 날"
            value={`${summary.daysWithWorkout}일`}
          />
        </div>

        {/* 일관성 점수 */}
        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">운동 일관성</span>
            <span className="text-lg font-bold text-green-600">
              {trend.consistencyScore}%
            </span>
          </div>
          <div className="mt-2 h-2 bg-green-100 dark:bg-green-900/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${Math.min(trend.consistencyScore, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {getConsistencyMessage(trend.consistencyScore)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
      {icon}
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
}

function getConsistencyMessage(score: number): string {
  if (score >= 80) return '훌륭해요! 꾸준히 운동하고 있어요';
  if (score >= 60) return '좋아요! 조금만 더 자주 운동해보세요';
  if (score >= 40) return '운동 빈도를 조금 늘려보세요';
  if (score > 0) return '운동 습관을 만들어가는 중이에요';
  return '이번 주에 운동을 시작해보세요!';
}
