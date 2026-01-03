'use client';

/**
 * 활성 사용자 통계 카드
 * @description DAU/WAU/MAU 표시
 */

import { Users, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ActiveUserStats } from '@/lib/admin/user-activity-stats';

interface ActiveUserStatsCardProps {
  stats: ActiveUserStats | null;
  isLoading?: boolean;
}

interface MetricItemProps {
  label: string;
  value: number;
  change: number;
  icon: React.ReactNode;
}

function MetricItem({ label, value, change, icon }: MetricItemProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
      <div className="p-3 bg-primary/10 rounded-lg">{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value.toLocaleString()}</span>
          {change !== 0 && (
            <span
              className={`flex items-center text-sm ${
                isPositive
                  ? 'text-green-600'
                  : isNegative
                    ? 'text-red-600'
                    : 'text-muted-foreground'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3 mr-0.5" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-0.5" />
              )}
              {isPositive ? '+' : ''}
              {change}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ActiveUserStatsCard({ stats, isLoading }: ActiveUserStatsCardProps) {
  if (isLoading) {
    return (
      <Card data-testid="active-user-stats-loading">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-muted/30 rounded-lg">
                <Skeleton className="h-5 w-16 mb-2" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card data-testid="active-user-stats-card">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">활성 사용자</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricItem
            label="오늘 (DAU)"
            value={stats.dau}
            change={stats.dauChange}
            icon={<Users className="h-5 w-5 text-primary" />}
          />
          <MetricItem
            label="주간 (WAU)"
            value={stats.wau}
            change={stats.wauChange}
            icon={<Calendar className="h-5 w-5 text-primary" />}
          />
          <MetricItem
            label="월간 (MAU)"
            value={stats.mau}
            change={stats.mauChange}
            icon={<Calendar className="h-5 w-5 text-primary" />}
          />
        </div>
      </CardContent>
    </Card>
  );
}
