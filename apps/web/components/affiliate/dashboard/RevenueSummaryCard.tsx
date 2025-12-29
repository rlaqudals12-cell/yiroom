/**
 * 수익 요약 카드
 * @description 총 클릭, 전환, 수익 표시
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, MousePointer, ShoppingCart, Wallet, Percent } from 'lucide-react';
import type { DashboardSummary } from '@/lib/affiliate/stats';

interface RevenueSummaryCardProps {
  summary: DashboardSummary;
  isLoading?: boolean;
}

export function RevenueSummaryCard({ summary, isLoading }: RevenueSummaryCardProps) {
  if (isLoading) {
    return (
      <div data-testid="revenue-summary-loading" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-20" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: '총 클릭',
      value: summary.totalClicks.toLocaleString(),
      change: summary.comparedToPrevious.clicksChange,
      icon: MousePointer,
      color: 'text-blue-500',
    },
    {
      title: '전환',
      value: summary.totalConversions.toLocaleString(),
      change: null,
      icon: ShoppingCart,
      color: 'text-green-500',
    },
    {
      title: '전환율',
      value: `${summary.conversionRate.toFixed(2)}%`,
      change: null,
      icon: Percent,
      color: 'text-purple-500',
    },
    {
      title: '총 수익',
      value: `₩${summary.totalCommissionKrw.toLocaleString()}`,
      change: summary.comparedToPrevious.commissionsChange,
      icon: Wallet,
      color: 'text-orange-500',
    },
  ];

  return (
    <div data-testid="revenue-summary-card" className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            {metric.change !== null && (
              <div className="flex items-center text-xs mt-1">
                {metric.change >= 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">+{metric.change.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-500">{metric.change.toFixed(1)}%</span>
                  </>
                )}
                <span className="text-muted-foreground ml-1">vs 이전 기간</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
