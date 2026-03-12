'use client';

import { TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { TrendAnalysis, TrendDirection } from '@/lib/skin-diary';

interface TrendSummaryProps {
  trend: TrendAnalysis;
}

const TREND_CONFIG: Record<
  TrendDirection,
  { icon: typeof TrendingUp; label: string; color: string }
> = {
  improving: { icon: TrendingUp, label: '개선 중', color: 'text-emerald-600' },
  stable: { icon: Minus, label: '안정', color: 'text-blue-600' },
  declining: { icon: TrendingDown, label: '하락 중', color: 'text-red-600' },
};

export function TrendSummary({ trend }: TrendSummaryProps) {
  const config = TREND_CONFIG[trend.trend];
  const Icon = config.icon;

  return (
    <div className="grid grid-cols-2 gap-3" data-testid="trend-summary">
      {/* 바이탈리티 트렌드 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
          </div>
          <p className="text-2xl font-bold">{trend.shortTermAvg}</p>
          <p className="text-xs text-muted-foreground">
            최근 평균 ({trend.changeRate > 0 ? '+' : ''}
            {trend.changeRate}%)
          </p>
        </CardContent>
      </Card>

      {/* 분석 스트릭 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium text-orange-600">연속 분석</span>
          </div>
          <p className="text-2xl font-bold">
            {trend.analysisStreak}
            <span className="text-base font-normal">주</span>
          </p>
          <p className="text-xs text-muted-foreground">총 {trend.entryCount}회 분석</p>
        </CardContent>
      </Card>
    </div>
  );
}
