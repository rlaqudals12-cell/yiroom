/**
 * R-1 영양 요약 카드 컴포넌트
 * 주간/월간 영양 통계 표시
 */

'use client';

import { Utensils, Droplets, Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { NutritionSummaryStats, NutritionAchievement } from '@/types/report';

interface NutritionSummaryCardProps {
  summary: NutritionSummaryStats;
  achievement: NutritionAchievement;
}

export function NutritionSummaryCard({
  summary,
  achievement,
}: NutritionSummaryCardProps) {
  return (
    <Card data-testid="nutrition-summary-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Utensils className="h-4 w-4" />
          영양 요약
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 주요 통계 */}
        <div className="grid grid-cols-2 gap-4">
          <StatItem
            label="총 섭취 칼로리"
            value={`${summary.totalCalories.toLocaleString()}kcal`}
          />
          <StatItem
            label="일 평균"
            value={`${summary.avgCaloriesPerDay.toLocaleString()}kcal`}
          />
          <StatItem
            label="기록한 식사"
            value={`${summary.mealCount}회`}
          />
          <StatItem
            label="기록 일수"
            value={`${summary.daysWithRecords}일`}
          />
        </div>

        {/* 수분 섭취 */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <Droplets className="h-5 w-5 text-blue-500" />
          <div className="flex-1">
            <div className="text-sm font-medium">수분 섭취</div>
            <div className="text-xs text-muted-foreground">
              총 {(summary.totalWater / 1000).toFixed(1)}L (일 평균 {Math.round(summary.avgWaterPerDay)}ml)
            </div>
          </div>
          <span className="text-sm font-semibold text-blue-600">
            {achievement.waterPercent}%
          </span>
        </div>

        {/* 목표 달성률 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4" />
            목표 달성률
          </div>

          <ProgressItem
            label="칼로리"
            percent={achievement.caloriesPercent}
            color="bg-orange-500"
          />
          <ProgressItem
            label="단백질"
            percent={achievement.proteinPercent}
            color="bg-red-500"
          />
          <ProgressItem
            label="탄수화물"
            percent={achievement.carbsPercent}
            color="bg-amber-500"
          />
          <ProgressItem
            label="지방"
            percent={achievement.fatPercent}
            color="bg-yellow-500"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 bg-muted/50 rounded-lg">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function ProgressItem({
  label,
  percent,
  color,
}: {
  label: string;
  percent: number;
  color: string;
}) {
  const displayPercent = Math.min(percent, 150); // 최대 150%까지 표시
  const isOver = percent > 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className={isOver ? 'text-amber-600' : ''}>
          {percent}%
        </span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${color}`}
          style={{ width: `${Math.min(displayPercent, 100)}%` }}
        />
        {isOver && (
          <div
            className="absolute top-0 h-full bg-amber-400/50"
            style={{
              left: '100%',
              width: `${Math.min(displayPercent - 100, 50)}%`,
              transform: 'translateX(-100%)',
            }}
          />
        )}
      </div>
    </div>
  );
}
