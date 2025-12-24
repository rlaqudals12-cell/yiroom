'use client';

import { Dumbbell, UtensilsCrossed, Droplets, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// 개별 목표 타입
export interface DailyGoal {
  id: string;
  type: 'workout' | 'nutrition' | 'water';
  label: string;
  current: number;
  target: number;
  unit: string;
  href?: string;
}

interface DailyGoalWidgetProps {
  goals: DailyGoal[];
  className?: string;
  showHeader?: boolean;
  'data-testid'?: string;
}

// 목표 타입별 설정
const goalConfig = {
  workout: {
    icon: Dumbbell,
    color: 'text-module-workout-dark',
    bgColor: 'bg-module-workout-light dark:bg-module-workout-light/30',
    progressColor: 'bg-module-workout-dark',
  },
  nutrition: {
    icon: UtensilsCrossed,
    color: 'text-module-nutrition-dark',
    bgColor: 'bg-module-nutrition-light dark:bg-module-nutrition-light/30',
    progressColor: 'bg-module-nutrition-dark',
  },
  water: {
    icon: Droplets,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    progressColor: 'bg-blue-500',
  },
};

/**
 * 개별 목표 아이템 컴포넌트
 */
function GoalItem({ goal }: { goal: DailyGoal }) {
  const config = goalConfig[goal.type];
  const Icon = config.icon;
  const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const isComplete = percentage >= 100;

  const content = (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-colors',
        config.bgColor,
        goal.href && 'hover:opacity-90 cursor-pointer'
      )}
      data-testid={`daily-goal-item-${goal.id}`}
    >
      {/* 아이콘 */}
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
          'bg-background/50'
        )}
      >
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium truncate">{goal.label}</span>
          <span className="text-xs text-muted-foreground">
            {goal.current}/{goal.target}{goal.unit}
          </span>
        </div>

        {/* Progress 바 */}
        <div className="relative">
          <Progress
            value={percentage}
            className="h-2"
            data-testid={`daily-goal-progress-${goal.id}`}
          />
        </div>

        {/* 상태 텍스트 */}
        <div className="flex items-center justify-between mt-1">
          <span
            className={cn(
              'text-xs',
              isComplete ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'
            )}
          >
            {isComplete ? '완료!' : `${percentage}% 달성`}
          </span>
          {goal.href && (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );

  if (goal.href) {
    return <Link href={goal.href}>{content}</Link>;
  }

  return content;
}

/**
 * 일일 목표 위젯
 * - 운동/영양/수분 목표 표시
 * - 각 목표별 달성률 Progress 바
 * - 목표 클릭 시 해당 페이지로 이동
 */
export function DailyGoalWidget({
  goals,
  className,
  showHeader = true,
  'data-testid': testId,
}: DailyGoalWidgetProps) {
  // 전체 달성률 계산
  const totalPercentage = goals.length > 0
    ? Math.round(
        goals.reduce((sum, goal) => {
          const pct = Math.min(100, (goal.current / goal.target) * 100);
          return sum + pct;
        }, 0) / goals.length
      )
    : 0;

  const completedCount = goals.filter(
    (g) => (g.current / g.target) * 100 >= 100
  ).length;

  return (
    <Card className={className} data-testid={testId || 'daily-goal-widget'}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">오늘의 목표</CardTitle>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{completedCount}</span>
              /{goals.length} 완료
            </div>
          </div>

          {/* 전체 Progress */}
          {goals.length > 0 && (
            <div className="mt-2">
              <Progress
                value={totalPercentage}
                className="h-1.5"
                data-testid="daily-goal-total-progress"
              />
              <p className="text-xs text-muted-foreground mt-1">
                전체 {totalPercentage}% 달성
              </p>
            </div>
          )}
        </CardHeader>
      )}

      <CardContent className={cn(!showHeader && 'pt-6')}>
        {goals.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            설정된 목표가 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <GoalItem key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 기본 일일 목표 생성 헬퍼
 */
export function createDefaultDailyGoals(
  workoutMinutes: number = 0,
  caloriesConsumed: number = 0,
  waterMl: number = 0,
  targets: { workout?: number; calories?: number; water?: number } = {}
): DailyGoal[] {
  return [
    {
      id: 'workout',
      type: 'workout',
      label: '운동',
      current: workoutMinutes,
      target: targets.workout || 30,
      unit: '분',
      href: '/workout',
    },
    {
      id: 'nutrition',
      type: 'nutrition',
      label: '칼로리',
      current: caloriesConsumed,
      target: targets.calories || 2000,
      unit: 'kcal',
      href: '/nutrition',
    },
    {
      id: 'water',
      type: 'water',
      label: '수분',
      current: waterMl,
      target: targets.water || 2000,
      unit: 'ml',
      href: '/nutrition',
    },
  ];
}
