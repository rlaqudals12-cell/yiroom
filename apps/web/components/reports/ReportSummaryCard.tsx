/**
 * 리포트 요약 내러티브 카드
 * Phase 3: 데이터 기반 자연어 요약 생성
 */

'use client';

import { MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type {
  NutritionAchievement,
  NutritionTrend,
  WorkoutSummaryStats,
  CalorieBalanceStatus,
} from '@/types/report';

interface ReportSummaryCardProps {
  /** 리포트 기간 라벨 (예: "이번 주", "이번 달") */
  periodLabel: string;
  achievement: NutritionAchievement;
  trend: NutritionTrend;
  workoutSummary: WorkoutSummaryStats;
  calorieBalanceStatus: CalorieBalanceStatus;
  hasWorkoutData: boolean;
}

// 데이터에서 자연어 요약 문장을 생성
function generateNarrative({
  periodLabel,
  achievement,
  trend,
  workoutSummary,
  calorieBalanceStatus,
  hasWorkoutData,
}: ReportSummaryCardProps): string {
  const parts: string[] = [];

  // 칼로리 달성률 요약
  const calPercent = achievement.caloriesPercent;
  if (calPercent >= 90 && calPercent <= 110) {
    parts.push(`${periodLabel} 칼로리 목표를 잘 지켰어요`);
  } else if (calPercent > 110) {
    parts.push(`${periodLabel} 칼로리 섭취가 목표보다 조금 많았어요`);
  } else if (calPercent >= 70) {
    parts.push(`${periodLabel} 칼로리 섭취가 목표에 가까웠어요`);
  } else {
    parts.push(`${periodLabel} 식단 기록이 아직 충분하지 않아요`);
  }

  // 단백질 강조 (90% 이상이면)
  if (achievement.proteinPercent >= 90) {
    parts.push('단백질 섭취도 꾸준했어요');
  }

  // 수분 섭취
  if (achievement.waterPercent < 70) {
    parts.push('수분 섭취를 조금 더 늘려보세요');
  } else if (achievement.waterPercent >= 100) {
    parts.push('수분 섭취도 충분했어요');
  }

  // 식품 품질
  if (trend.foodQualityScore >= 60) {
    parts.push('건강한 식재료 선택이 좋았어요');
  }

  // 운동 요약
  if (hasWorkoutData && workoutSummary.totalSessions > 0) {
    parts.push(`운동 ${workoutSummary.daysWithWorkout}일 기록했어요`);
  }

  // 칼로리 밸런스
  if (calorieBalanceStatus === 'balanced') {
    parts.push('전반적으로 균형 잡힌 한 주였어요');
  }

  // 2~3문장으로 조합
  if (parts.length <= 2) {
    return parts.join('. ') + '.';
  }
  // 앞 2개 + 마지막 1개로 조합
  const main = parts.slice(0, 2).join(', ');
  const suffix = parts[parts.length - 1];
  return `${main}. ${suffix}.`;
}

export function ReportSummaryCard(props: ReportSummaryCardProps): React.ReactElement {
  const narrative = generateNarrative(props);

  return (
    <Card
      data-testid="report-summary-card"
      className="border-primary/20 bg-primary/5 dark:bg-primary/10"
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-primary mb-1">맞춤 요약</p>
            <p className="text-sm leading-relaxed text-foreground">{narrative}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
