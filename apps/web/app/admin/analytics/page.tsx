'use client';

/**
 * Analytics 대시보드 페이지
 * @description 사용자 행동 분석 대시보드
 */

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AnalyticsSummaryCard,
  PageViewsChart,
  TopPagesTable,
  TopFeaturesTable,
  DevicePieChart,
} from './_components';
import type {
  AnalyticsSummary,
  TopPage,
  TopFeature,
  DeviceBreakdown,
  AnalyticsPeriod,
} from '@/types/analytics';

interface DashboardData {
  summary: AnalyticsSummary;
  topPages: TopPage[];
  topFeatures: TopFeature[];
  deviceBreakdown: DeviceBreakdown[];
  dailyTrend: Array<{ date: string; pageViews: number; uniqueUsers: number; sessions: number }>;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('week');
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/stats?period=${period}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '데이터를 불러오는데 실패했습니다');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData();
  };

  return (
    <div data-testid="analytics-dashboard" className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">사용자 행동 분석</h1>
          <p className="text-muted-foreground text-sm mt-1">
            사용자가 어떤 기능을 많이 사용하고, 어디서 오래 머무는지 분석합니다
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">오늘</SelectItem>
              <SelectItem value="week">최근 7일</SelectItem>
              <SelectItem value="month">최근 30일</SelectItem>
              <SelectItem value="quarter">최근 90일</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          <p>{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={handleRefresh}>
            다시 시도
          </Button>
        </div>
      )}

      {/* Mock 데이터 알림 */}
      <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">
        현재 Mock 데이터로 표시됩니다. 실제 이벤트 트래킹 연동 후 실시간 데이터가 표시됩니다.
      </div>

      {/* 요약 카드 */}
      <AnalyticsSummaryCard summary={data?.summary ?? null} isLoading={isLoading} />

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PageViewsChart data={data?.dailyTrend ?? null} isLoading={isLoading} />
        </div>
        <div>
          <DevicePieChart data={data?.deviceBreakdown ?? null} isLoading={isLoading} />
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPagesTable pages={data?.topPages ?? null} isLoading={isLoading} />
        <TopFeaturesTable features={data?.topFeatures ?? null} isLoading={isLoading} />
      </div>
    </div>
  );
}
