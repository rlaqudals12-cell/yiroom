'use client';

/**
 * 기능별 사용 현황 카드
 * @description 분석 완료 수, 운동/영양 기록 수 표시
 */

import {
  Palette,
  Sparkles,
  User,
  Dumbbell,
  Utensils,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { FeatureUsageStats } from '@/lib/admin/user-activity-stats';

interface FeatureUsageCardProps {
  stats: FeatureUsageStats | null;
  isLoading?: boolean;
}

interface FeatureItemProps {
  label: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

function FeatureItem({ label, value, change, icon, color }: FeatureItemProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold">{value.toLocaleString()}</span>
        {change !== 0 && (
          <span
            className={`flex items-center text-xs ${
              isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'
            }`}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          </span>
        )}
      </div>
    </div>
  );
}

export function FeatureUsageCard({ stats, isLoading }: FeatureUsageCardProps) {
  if (isLoading) {
    return (
      <Card data-testid="feature-usage-loading">
        <CardContent className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-12" />
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

  const features = [
    {
      label: '퍼스널 컬러 분석',
      value: stats.personalColorAnalyses,
      change: stats.changes.personalColor,
      icon: <Palette className="h-4 w-4 text-pink-600" />,
      color: 'bg-pink-100',
    },
    {
      label: '피부 분석',
      value: stats.skinAnalyses,
      change: stats.changes.skin,
      icon: <Sparkles className="h-4 w-4 text-purple-600" />,
      color: 'bg-purple-100',
    },
    {
      label: '체형 분석',
      value: stats.bodyAnalyses,
      change: stats.changes.body,
      icon: <User className="h-4 w-4 text-blue-600" />,
      color: 'bg-blue-100',
    },
    {
      label: '운동 기록',
      value: stats.workoutLogs,
      change: stats.changes.workout,
      icon: <Dumbbell className="h-4 w-4 text-green-600" />,
      color: 'bg-green-100',
    },
    {
      label: '식사 기록',
      value: stats.mealRecords,
      change: stats.changes.meal,
      icon: <Utensils className="h-4 w-4 text-orange-600" />,
      color: 'bg-orange-100',
    },
  ];

  return (
    <Card data-testid="feature-usage-card">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">기능별 사용 현황</h3>
        <p className="text-sm text-muted-foreground mb-4">전체 누적 및 오늘 변화</p>
        <div className="space-y-1">
          {features.map((feature) => (
            <FeatureItem key={feature.label} {...feature} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
