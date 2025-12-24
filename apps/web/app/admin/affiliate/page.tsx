'use client';

/**
 * 관리자 어필리에이트 대시보드
 * Sprint E Day 10: 수익화 준비
 */

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Users,
  Calendar,
  RefreshCw,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import type { AffiliateStats } from '@/types/affiliate';
import type { StatsPeriod, DashboardStats } from '@/lib/admin/affiliate-stats';

// 차트 동적 로딩
const AffiliateChartDynamic = dynamic(
  () => import('@/components/admin/AffiliateChart'),
  { ssr: false, loading: () => <div className="h-[380px] animate-pulse bg-muted rounded-lg" /> }
);

// 제품 타입 한글 이름
const PRODUCT_TYPE_NAMES: Record<string, string> = {
  cosmetic: '화장품',
  supplement: '영양제',
  equipment: '운동기구',
  healthfood: '건강식품',
};

export default function AdminAffiliatePage() {
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 통계 로드
  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    setIsLoading(true);

    // Mock 데이터 (실제로는 서버 액션 호출)
    await new Promise((r) => setTimeout(r, 500));

    // Mock 대시보드 통계
    setDashboardStats({
      todayClicks: 42,
      weekClicks: 287,
      monthClicks: 1234,
      weeklyGrowth: 15,
    });

    // Mock 상세 통계
    const mockByDate = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      mockByDate.push({
        date: date.toISOString().split('T')[0],
        clicks: Math.floor(Math.random() * 50) + 20,
      });
    }

    setStats({
      period: {
        startDate: mockByDate[0].date,
        endDate: mockByDate[mockByDate.length - 1].date,
      },
      totalClicks: mockByDate.reduce((sum, d) => sum + d.clicks, 0),
      uniqueUsers: Math.floor(mockByDate.reduce((sum, d) => sum + d.clicks, 0) * 0.7),
      byProduct: [
        { productType: 'cosmetic', productId: '1', productName: '피부 진정 세럼', totalClicks: 89, uniqueUsers: 62 },
        { productType: 'supplement', productId: '2', productName: '멀티비타민', totalClicks: 67, uniqueUsers: 45 },
        { productType: 'equipment', productId: '3', productName: '폼롤러', totalClicks: 54, uniqueUsers: 38 },
        { productType: 'healthfood', productId: '4', productName: '단백질 쉐이크', totalClicks: 43, uniqueUsers: 30 },
        { productType: 'cosmetic', productId: '5', productName: '선크림', totalClicks: 34, uniqueUsers: 25 },
      ],
      byDate: mockByDate,
    });

    setIsLoading(false);
  };

  return (
    <div className="container mx-auto py-8 px-4" data-testid="admin-affiliate-page">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <MousePointerClick className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">어필리에이트 대시보드</h1>
            <p className="text-muted-foreground">
              제품 클릭 통계를 확인합니다.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as StatsPeriod)}
          >
            <SelectTrigger className="w-[130px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">오늘</SelectItem>
              <SelectItem value="week">최근 7일</SelectItem>
              <SelectItem value="month">최근 30일</SelectItem>
              <SelectItem value="all">전체</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={loadStats}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              오늘 클릭
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats?.todayClicks ?? '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              주간 클릭
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {dashboardStats?.weekClicks ?? '-'}
              </span>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">
              월간 클릭
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats?.monthClicks ?? '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-4 w-4" />
              고유 사용자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.uniqueUsers ?? '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 차트 */}
      <div className="mb-8">
        <AffiliateChartDynamic
          data={stats?.byDate ?? []}
          title="일별 클릭 추이"
        />
      </div>

      {/* 제품별 순위 */}
      <Card data-testid="product-ranking">
        <CardHeader>
          <CardTitle>제품별 클릭 순위</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              불러오는 중...
            </div>
          ) : !stats?.byProduct?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              데이터가 없습니다.
            </div>
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
                    <TableCell className="font-medium">
                      {index + 1}
                    </TableCell>
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
