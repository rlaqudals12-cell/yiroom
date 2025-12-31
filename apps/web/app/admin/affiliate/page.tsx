'use client';

/**
 * 관리자 어필리에이트 대시보드
 * Sprint E Day 10: 수익화 준비
 * Phase 5: 수익 분석 탭 추가
 */

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Users,
  Calendar,
  RefreshCw,
  BarChart3,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RevenueSummaryCard,
  PartnerRevenueChart,
  DailyRevenueChart,
  TopProductsTable,
} from '@/components/affiliate/dashboard';
import type { AffiliateStats } from '@/types/affiliate';
import {
  fetchDashboardStats,
  fetchAffiliateStats,
  type StatsPeriod,
  type DashboardStats,
} from '@/lib/admin/affiliate-stats';
import {
  getDashboardSummary,
  getPartnerRevenues,
  getDailyRevenueTrend,
  getTopProducts,
  getDateRange,
} from '@/lib/affiliate/stats';
import type {
  DashboardSummary,
  PartnerRevenue,
  DailyRevenueTrend,
  TopProduct,
} from '@/lib/affiliate/stats';

// 차트 동적 로딩
const AffiliateChartDynamic = dynamic(() => import('@/components/admin/AffiliateChart'), {
  ssr: false,
  loading: () => <div className="bg-muted h-[380px] animate-pulse rounded-lg" />,
});

// 제품 타입 한글 이름
const PRODUCT_TYPE_NAMES: Record<string, string> = {
  cosmetic: '화장품',
  supplement: '영양제',
  equipment: '운동기구',
  healthfood: '건강식품',
};

export default function AdminAffiliatePage() {
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const [activeTab, setActiveTab] = useState<'clicks' | 'revenue'>('clicks');
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Phase 5 수익 분석 데이터
  const [revenueSummary, setRevenueSummary] = useState<DashboardSummary | null>(null);
  const [partnerRevenues, setPartnerRevenues] = useState<PartnerRevenue[]>([]);
  const [dailyTrend, setDailyTrend] = useState<DailyRevenueTrend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  // 기간을 Phase 5 형식으로 변환
  const getPeriodForStats = useCallback(() => {
    switch (period) {
      case 'today':
        return 'today';
      case 'week':
        return 'week';
      case 'month':
        return 'month';
      default:
        return 'quarter';
    }
  }, [period]);

  // 통계 로드 함수
  const loadStats = useCallback(async () => {
    setIsLoading(true);

    try {
      // 클릭 통계 데이터 로드 (서버 액션)
      const [dashboardData, affiliateData] = await Promise.all([
        fetchDashboardStats(),
        fetchAffiliateStats(period),
      ]);

      setDashboardStats(dashboardData);
      setStats(affiliateData);

      // Phase 5 수익 분석 데이터 로드
      const statsPeriod = getPeriodForStats();
      const dateRange = getDateRange(statsPeriod);

      const [summary, partners, trend, products] = await Promise.all([
        getDashboardSummary(dateRange.start, dateRange.end),
        getPartnerRevenues(dateRange.start, dateRange.end),
        getDailyRevenueTrend(dateRange.start, dateRange.end),
        getTopProducts(10),
      ]);

      setRevenueSummary(summary);
      setPartnerRevenues(partners);
      setDailyTrend(trend);
      setTopProducts(products);
    } catch (error) {
      console.error('[Admin Affiliate] 통계 로드 에러:', error);
    } finally {
      setIsLoading(false);
    }
  }, [period, getPeriodForStats]);

  // 통계 로드
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="admin-affiliate-page">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MousePointerClick className="text-primary h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">어필리에이트 대시보드</h1>
            <p className="text-muted-foreground">제품 클릭 통계를 확인합니다.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as StatsPeriod)}>
            <SelectTrigger className="w-[130px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">오늘</SelectItem>
              <SelectItem value="week">최근 7일</SelectItem>
              <SelectItem value="month">최근 30일</SelectItem>
              <SelectItem value="all">전체</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadStats} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 탭 */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'clicks' | 'revenue')}
        className="mb-8"
      >
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="clicks" className="flex items-center gap-2">
            <MousePointerClick className="h-4 w-4" />
            클릭 통계
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            수익 분석
          </TabsTrigger>
        </TabsList>

        {/* 클릭 통계 탭 */}
        <TabsContent value="clicks" className="mt-6 space-y-8">
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  오늘 클릭
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.todayClicks ?? '-'}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  주간 클릭
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{dashboardStats?.weekClicks ?? '-'}</span>
                  {dashboardStats && (
                    <Badge
                      variant={dashboardStats.weeklyGrowth >= 0 ? 'default' : 'destructive'}
                      className="flex items-center gap-1"
                    >
                      {dashboardStats.weeklyGrowth >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(dashboardStats.weeklyGrowth)}%
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  월간 클릭
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.monthClicks ?? '-'}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  고유 사용자
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.uniqueUsers ?? '-'}</div>
              </CardContent>
            </Card>
          </div>

          {/* 차트 */}
          <AffiliateChartDynamic data={stats?.byDate ?? []} title="일별 클릭 추이" />
        </TabsContent>

        {/* 수익 분석 탭 (Phase 5) */}
        <TabsContent value="revenue" className="mt-6 space-y-8">
          {/* 수익 요약 */}
          {revenueSummary && <RevenueSummaryCard summary={revenueSummary} isLoading={isLoading} />}

          {/* 차트 영역 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DailyRevenueChart trend={dailyTrend} isLoading={isLoading} />
            <PartnerRevenueChart partners={partnerRevenues} isLoading={isLoading} />
          </div>

          {/* 인기 제품 */}
          <TopProductsTable products={topProducts} isLoading={isLoading} />
        </TabsContent>
      </Tabs>

      {/* 제품별 순위 */}
      <Card data-testid="product-ranking">
        <CardHeader>
          <CardTitle>제품별 클릭 순위</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground py-8 text-center">불러오는 중...</div>
          ) : !stats?.byProduct?.length ? (
            <div className="text-muted-foreground py-8 text-center">데이터가 없습니다.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">순위</TableHead>
                  <TableHead>제품명</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead className="text-right">클릭</TableHead>
                  <TableHead className="text-right">사용자</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.byProduct.map((product, index) => (
                  <TableRow key={`${product.productType}-${product.productId}`}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{product.productName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PRODUCT_TYPE_NAMES[product.productType] || product.productType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {product.totalClicks.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.uniqueUsers.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
