'use client';

import { Clock, Flame, Calendar, TrendingUp } from 'lucide-react';

interface PlanSummaryCardProps {
  workoutDays: number;
  restDays: number;
  totalMinutes: number;
  totalCalories: number;
  avgMinutesPerDay: number;
  avgCaloriesPerDay: number;
  bodyPartDistribution: Record<string, number>;
}

// 카테고리 한글 라벨 및 색상
const CATEGORY_INFO: Record<string, { label: string; color: string; bgColor: string }> = {
  upper: { label: '상체', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  lower: { label: '하체', color: 'text-green-600', bgColor: 'bg-green-100' },
  core: { label: '코어', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  cardio: { label: '유산소', color: 'text-orange-600', bgColor: 'bg-orange-100' },
};

export function PlanSummaryCard({
  workoutDays,
  restDays,
  totalMinutes,
  totalCalories,
  avgMinutesPerDay,
  avgCaloriesPerDay,
  bodyPartDistribution,
}: PlanSummaryCardProps) {
  return (
    <div
      className="bg-card rounded-2xl shadow-sm border border-border p-5"
      data-testid="plan-summary-card"
    >
      <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-indigo-500" />
        주간 플랜 요약
      </h3>

      {/* 주요 지표 */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* 운동일 */}
        <div className="bg-indigo-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className="text-sm text-muted-foreground">운동일</span>
          </div>
          <p className="text-2xl font-bold text-indigo-600">
            {workoutDays}<span className="text-sm font-normal text-muted-foreground">/7일</span>
          </p>
        </div>

        {/* 휴식일 */}
        <div className="bg-muted rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-muted-foreground">휴식일</span>
          </div>
          <p className="text-2xl font-bold text-muted-foreground">
            {restDays}<span className="text-sm font-normal text-muted-foreground">일</span>
          </p>
        </div>

        {/* 총 운동 시간 */}
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">주간 총 시간</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {totalMinutes}<span className="text-sm font-normal text-muted-foreground">분</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            하루 평균 {avgMinutesPerDay}분
          </p>
        </div>

        {/* 총 칼로리 */}
        <div className="bg-orange-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-muted-foreground">예상 소모</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {totalCalories.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">kcal</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            하루 평균 {avgCaloriesPerDay}kcal
          </p>
        </div>
      </div>

      {/* 부위 분포 */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">부위별 운동 비율</h4>
        <div className="space-y-2">
          {Object.entries(bodyPartDistribution)
            .filter((entry) => entry[1] > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([category, ratio]) => {
              const info = CATEGORY_INFO[category] || { label: category, color: 'text-muted-foreground', bgColor: 'bg-muted' };
              const percentage = Math.round(ratio * 100);

              return (
                <div key={category} className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${info.color} w-12`}>
                    {info.label}
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${info.bgColor} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {percentage}%
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
