/**
 * 칼로리 밸런스 카드
 * Phase 3: 섭취 vs 소모 시각화
 */

'use client';

import { Scale, Utensils, Flame } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { CalorieBalanceStatus } from '@/types/report';

interface CalorieBalanceCardProps {
  totalIntake: number;
  totalBurned: number;
  netCalories: number;
  status: CalorieBalanceStatus;
  avgNetPerDay: number;
}

const statusConfig: Record<
  CalorieBalanceStatus,
  { label: string; color: string; bgColor: string }
> = {
  balanced: {
    label: '균형',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
  },
  deficit: {
    label: '부족',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
  },
  surplus: {
    label: '초과',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
  },
};

function getBalanceMessage(status: CalorieBalanceStatus, avgNet: number): string {
  switch (status) {
    case 'balanced':
      return '섭취와 소모가 잘 균형을 이루고 있어요';
    case 'deficit':
      return `하루 평균 ${Math.abs(Math.round(avgNet)).toLocaleString()} kcal 부족해요`;
    case 'surplus':
      return `하루 평균 ${Math.round(avgNet).toLocaleString()} kcal 초과했어요`;
  }
}

export function CalorieBalanceCard({
  totalIntake,
  totalBurned,
  netCalories,
  status,
  avgNetPerDay,
}: CalorieBalanceCardProps): React.ReactElement {
  const config = statusConfig[status];
  const maxValue = Math.max(totalIntake, totalBurned, 1);
  const intakePercent = (totalIntake / maxValue) * 100;
  const burnedPercent = (totalBurned / maxValue) * 100;

  return (
    <Card data-testid="calorie-balance-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-4 w-4" />
          칼로리 밸런스
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 섭취 vs 소모 바 */}
        <div className="space-y-3">
          {/* 섭취 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Utensils className="h-3 w-3 text-orange-500" />
                섭취
              </span>
              <span className="font-medium">{totalIntake.toLocaleString()} kcal</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-400 dark:bg-orange-500 rounded-full transition-all"
                style={{ width: `${intakePercent}%` }}
              />
            </div>
          </div>

          {/* 소모 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Flame className="h-3 w-3 text-red-500" />
                소모
              </span>
              <span className="font-medium">{totalBurned.toLocaleString()} kcal</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-red-400 dark:bg-red-500 rounded-full transition-all"
                style={{ width: `${burnedPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 밸런스 상태 */}
        <div className={`p-3 rounded-lg ${config.bgColor}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">순 칼로리</span>
            <span className={`text-lg font-bold ${config.color}`}>
              {netCalories > 0 ? '+' : ''}
              {netCalories.toLocaleString()} kcal
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {getBalanceMessage(status, avgNetPerDay)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
