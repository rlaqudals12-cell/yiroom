/**
 * R-2 목표 진행률 카드 컴포넌트
 * 영양 목표 달성률 표시
 */

'use client';

import { Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { GoalProgress } from '@/types/report';
import type { NutritionGoal } from '@/types/nutrition';

interface GoalProgressCardProps {
  goalProgress: GoalProgress;
}

const goalLabels: Record<NutritionGoal, string> = {
  weight_loss: '체중 감량',
  maintain: '체중 유지',
  muscle: '근육 증가',
  skin: '피부 개선',
  health: '건강 관리',
};

const goalColors: Record<NutritionGoal, string> = {
  weight_loss: 'text-blue-500',
  maintain: 'text-green-500',
  muscle: 'text-orange-500',
  skin: 'text-pink-500',
  health: 'text-emerald-500',
};

export function GoalProgressCard({ goalProgress }: GoalProgressCardProps) {
  const { goal, achievementRate, message, isOnTrack } = goalProgress;

  const progressColor =
    achievementRate >= 80
      ? 'bg-green-500'
      : achievementRate >= 50
      ? 'bg-yellow-500'
      : 'bg-orange-500';

  return (
    <Card data-testid="goal-progress-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          목표 진행률
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 목표 타입 */}
          <div className="flex items-center justify-between">
            <span className={`font-medium ${goalColors[goal]}`}>
              {goalLabels[goal]}
            </span>
            <span className="text-sm text-muted-foreground">
              {isOnTrack ? (
                <span className="flex items-center gap-1 text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  목표 달성 중
                </span>
              ) : (
                <span className="flex items-center gap-1 text-orange-500">
                  <AlertCircle className="h-4 w-4" />
                  개선 필요
                </span>
              )}
            </span>
          </div>

          {/* 진행률 바 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">달성률</span>
              <span className="font-bold">{achievementRate}%</span>
            </div>
            <Progress
              value={achievementRate}
              className="h-3"
              indicatorClassName={progressColor}
            />
          </div>

          {/* 메시지 */}
          <p className="text-sm text-center text-muted-foreground bg-muted/50 rounded-lg p-3">
            {message}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
