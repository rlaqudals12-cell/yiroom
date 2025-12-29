'use client';

/**
 * Analytics 요약 카드 컴포넌트
 * @description 총 페이지뷰, 사용자, 세션, 이탈률 표시
 */

import { Eye, Users, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { AnalyticsSummary } from '@/types/analytics';

interface AnalyticsSummaryCardProps {
  summary: AnalyticsSummary | null;
  isLoading?: boolean;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
}

function MetricCard({ label, value, change, icon }: MetricCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">{icon}</div>
          {change !== undefined && (
            <div
              className={`flex items-center text-sm ${
                isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : isNegative ? (
                <TrendingDown className="h-3 w-3 mr-1" />
              ) : null}
              {isPositive ? '+' : ''}
              {change.toFixed(1)}%
            </div>
          )}
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsSummaryCard({ summary, isLoading }: AnalyticsSummaryCardProps) {
  if (isLoading) {
    return (
      <div data-testid="analytics-summary-loading" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-8 mb-2" />
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  // 세션 지속 시간 포맷 (초 → 분:초)
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  return (
    <div data-testid="analytics-summary-card" className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard
        label="총 페이지뷰"
        value={summary.totalPageViews.toLocaleString()}
        change={summary.comparedToPrevious.pageViewsChange}
        icon={<Eye className="h-5 w-5" />}
      />
      <MetricCard
        label="순 방문자"
        value={summary.uniqueUsers.toLocaleString()}
        change={summary.comparedToPrevious.usersChange}
        icon={<Users className="h-5 w-5" />}
      />
      <MetricCard
        label="총 세션"
        value={summary.totalSessions.toLocaleString()}
        change={summary.comparedToPrevious.sessionsChange}
        icon={<Clock className="h-5 w-5" />}
      />
      <MetricCard
        label="평균 체류시간"
        value={formatDuration(summary.avgSessionDuration)}
        icon={<Clock className="h-5 w-5" />}
      />
    </div>
  );
}
