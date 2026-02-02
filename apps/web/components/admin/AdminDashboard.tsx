'use client';

/**
 * 관리자 대시보드
 * @description 전체 통계, 사용자 현황, 최근 활동 표시
 * @module K-5: 관리자/프로필 페이지
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Palette,
  Sparkles,
  User,
  Dumbbell,
  Utensils,
  Package,
  Activity,
  RefreshCw,
  Clock,
  ShoppingBag,
  Heart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { DashboardStats, RecentActivity } from '@/lib/admin/stats';

interface AdminDashboardProps {
  /** 초기 통계 데이터 (서버에서 fetch한 경우) */
  initialStats?: DashboardStats | null;
  /** 초기 최근 활동 데이터 */
  initialActivities?: RecentActivity[] | null;
  /** 통계 데이터를 가져오는 함수 */
  fetchStats?: () => Promise<DashboardStats>;
  /** 최근 활동을 가져오는 함수 */
  fetchActivities?: (limit?: number) => Promise<RecentActivity[]>;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
  trend?: number;
  color?: string;
}

// 개별 통계 카드 컴포넌트
function StatCard({ title, value, icon, description, color = 'bg-primary/10' }: StatCardProps) {
  return (
    <Card data-testid={`stat-card-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 사용자 통계 섹션
function UserStatsSection({
  users,
  isLoading,
}: {
  users: DashboardStats['users'] | null;
  isLoading: boolean;
}) {
  if (isLoading || !users) {
    return (
      <Card data-testid="user-stats-loading">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-3 bg-muted/30 rounded-lg">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const userMetrics = [
    { label: '전체', value: users.total, color: 'text-primary' },
    { label: '오늘', value: users.today, color: 'text-green-600' },
    { label: '이번 주', value: users.thisWeek, color: 'text-blue-600' },
    { label: '이번 달', value: users.thisMonth, color: 'text-purple-600' },
  ];

  return (
    <Card data-testid="user-stats-section">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          사용자 현황
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {userMetrics.map((metric) => (
            <div
              key={metric.label}
              className="p-4 bg-muted/30 rounded-lg text-center"
              data-testid={`user-metric-${metric.label}`}
            >
              <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
              <p className={`text-2xl font-bold ${metric.color}`}>{metric.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 분석 통계 섹션
function AnalysisStatsSection({
  analyses,
  isLoading,
}: {
  analyses: DashboardStats['analyses'] | null;
  isLoading: boolean;
}) {
  if (isLoading || !analyses) {
    return (
      <Card data-testid="analysis-stats-loading">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const analysisItems = [
    {
      label: '퍼스널컬러',
      value: analyses.personalColor,
      icon: <Palette className="h-5 w-5 text-pink-600" />,
      color: 'bg-pink-100',
    },
    {
      label: '피부',
      value: analyses.skin,
      icon: <Sparkles className="h-5 w-5 text-purple-600" />,
      color: 'bg-purple-100',
    },
    {
      label: '체형',
      value: analyses.body,
      icon: <User className="h-5 w-5 text-blue-600" />,
      color: 'bg-blue-100',
    },
    {
      label: '운동',
      value: analyses.workout,
      icon: <Dumbbell className="h-5 w-5 text-green-600" />,
      color: 'bg-green-100',
    },
    {
      label: '영양',
      value: analyses.nutrition,
      icon: <Utensils className="h-5 w-5 text-orange-600" />,
      color: 'bg-orange-100',
    },
  ];

  return (
    <Card data-testid="analysis-stats-section">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          분석 현황
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {analysisItems.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center p-4 bg-muted/30 rounded-lg"
              data-testid={`analysis-stat-${item.label}`}
            >
              <div className={`p-2 rounded-lg mb-2 ${item.color}`}>{item.icon}</div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-xl font-bold">{item.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 제품 통계 섹션
function ProductStatsSection({
  products,
  isLoading,
}: {
  products: DashboardStats['products'] | null;
  isLoading: boolean;
}) {
  if (isLoading || !products) {
    return (
      <Card data-testid="product-stats-loading">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const productItems = [
    { label: '화장품', value: products.cosmetics },
    { label: '영양제', value: products.supplements },
    { label: '운동기구', value: products.equipment },
    { label: '건강식품', value: products.healthFoods },
  ];

  return (
    <Card data-testid="product-stats-section">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />
          제품 DB 현황
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {productItems.map((item) => (
            <div
              key={item.label}
              className="p-4 bg-muted/30 rounded-lg text-center"
              data-testid={`product-stat-${item.label}`}
            >
              <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
              <p className="text-xl font-bold">{item.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 최근 활동 섹션
function RecentActivitiesSection({
  activities,
  isLoading,
}: {
  activities: RecentActivity[] | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card data-testid="recent-activities-loading">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card data-testid="recent-activities-empty">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            최근 활동
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            최근 활동이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  // 활동 타입별 아이콘/배지 색상
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'workout':
        return <Dumbbell className="h-4 w-4 text-green-600" />;
      case 'meal':
        return <Utensils className="h-4 w-4 text-orange-600" />;
      case 'wishlist':
        return <Heart className="h-4 w-4 text-red-600" />;
      case 'analysis':
        return <Sparkles className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-primary" />;
    }
  };

  const getActivityBadge = (type: RecentActivity['type']) => {
    const variants: Record<RecentActivity['type'], { label: string; className: string }> = {
      workout: { label: '운동', className: 'bg-green-100 text-green-700' },
      meal: { label: '식사', className: 'bg-orange-100 text-orange-700' },
      wishlist: { label: '위시리스트', className: 'bg-red-100 text-red-700' },
      analysis: { label: '분석', className: 'bg-purple-100 text-purple-700' },
    };
    const variant = variants[type];
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  return (
    <Card data-testid="recent-activities-section">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          최근 활동
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={`${activity.userId}-${activity.createdAt.getTime()}-${index}`}
              className="flex items-start gap-4 p-3 hover:bg-muted/30 rounded-lg transition-colors"
              data-testid={`activity-item-${index}`}
            >
              <div className="p-2 bg-muted rounded-full">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getActivityBadge(activity.type)}
                  <span className="text-xs text-muted-foreground">
                    {formatTime(activity.createdAt)}
                  </span>
                </div>
                <p className="text-sm truncate">{activity.description}</p>
                <p className="text-xs text-muted-foreground truncate">
                  사용자: {activity.userId.slice(0, 12)}...
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 메인 AdminDashboard 컴포넌트
export function AdminDashboard({
  initialStats = null,
  initialActivities = null,
  fetchStats,
  fetchActivities,
}: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(initialStats);
  const [activities, setActivities] = useState<RecentActivity[] | null>(initialActivities);
  const [isLoading, setIsLoading] = useState(!initialStats);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    if (!fetchStats || !fetchActivities) return;

    try {
      const [statsData, activitiesData] = await Promise.all([
        fetchStats(),
        fetchActivities(10),
      ]);
      setStats(statsData);
      setActivities(activitiesData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('[AdminDashboard] 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fetchStats, fetchActivities]);

  useEffect(() => {
    if (!initialStats && fetchStats && fetchActivities) {
      loadData();
    }
  }, [initialStats, fetchStats, fetchActivities, loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };

  // 활동 데이터 요약 통계
  const activitySummary = stats?.activity;

  return (
    <div data-testid="admin-dashboard" className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">관리자 대시보드</h1>
          <p className="text-sm text-muted-foreground">서비스 현황 및 사용자 활동</p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              마지막 업데이트: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          {fetchStats && fetchActivities && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              data-testid="refresh-button"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          )}
        </div>
      </div>

      {/* 빠른 요약 카드 (활동) */}
      {activitySummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="운동 기록"
            value={activitySummary.workoutLogs}
            icon={<Dumbbell className="h-5 w-5 text-green-600" />}
            color="bg-green-100"
          />
          <StatCard
            title="식사 기록"
            value={activitySummary.mealRecords}
            icon={<Utensils className="h-5 w-5 text-orange-600" />}
            color="bg-orange-100"
          />
          <StatCard
            title="위시리스트"
            value={activitySummary.wishlists}
            icon={<ShoppingBag className="h-5 w-5 text-purple-600" />}
            color="bg-purple-100"
          />
        </div>
      )}

      {/* 사용자 통계 */}
      <UserStatsSection users={stats?.users ?? null} isLoading={isLoading} />

      {/* 분석 통계 */}
      <AnalysisStatsSection analyses={stats?.analyses ?? null} isLoading={isLoading} />

      {/* 제품 통계 */}
      <ProductStatsSection products={stats?.products ?? null} isLoading={isLoading} />

      {/* 최근 활동 */}
      <RecentActivitiesSection activities={activities} isLoading={isLoading} />
    </div>
  );
}

export default AdminDashboard;
