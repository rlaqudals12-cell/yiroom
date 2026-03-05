'use client';

/**
 * 시스템 모니터링 탭 컴포넌트
 * - 서비스 상태 카드
 * - API 응답 시간 테이블
 */

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  SystemHealthSnapshot,
  ServiceHealth,
  ServiceStatus,
  ApiTimingStats,
} from '@/lib/monitoring';

interface SystemMonitoringTabProps {
  isLoading?: boolean;
}

export function SystemMonitoringTab({ isLoading: parentLoading }: SystemMonitoringTabProps) {
  const [health, setHealth] = useState<SystemHealthSnapshot | null>(null);
  const [timingStats, setTimingStats] = useState<ApiTimingStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 헬스체크
      const healthRes = await fetch('/api/health');
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth({
          services: parseHealthServices(healthData),
          overallStatus: healthData.status === 'healthy' ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
        });
      }

      // 타이밍 통계
      const timingRes = await fetch('/api/admin/monitoring/timings');
      if (timingRes.ok) {
        const timingData = await timingRes.json();
        if (timingData.success) {
          setTimingStats(timingData.data ?? []);
        }
      }
    } catch (err) {
      console.error('[SystemMonitoring] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loading = parentLoading || isLoading;

  return (
    <div className="space-y-6" data-testid="system-monitoring-tab">
      {/* 서비스 상태 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">서비스 상태</h3>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} />
          새로고침
        </Button>
      </div>

      {health ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {health.services.map((service) => (
            <ServiceStatusCard key={service.name} service={service} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-6 bg-muted rounded w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* API 응답 시간 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">API 응답 시간</CardTitle>
        </CardHeader>
        <CardContent>
          {timingStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">라우트</th>
                    <th className="pb-2 pr-4 text-right">요청 수</th>
                    <th className="pb-2 pr-4 text-right">p50</th>
                    <th className="pb-2 pr-4 text-right">p95</th>
                    <th className="pb-2 pr-4 text-right">p99</th>
                    <th className="pb-2 text-right">에러율</th>
                  </tr>
                </thead>
                <tbody>
                  {timingStats.map((stat) => (
                    <tr key={stat.route} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{stat.route}</td>
                      <td className="py-2 pr-4 text-right">{stat.count}</td>
                      <td className="py-2 pr-4 text-right">{stat.p50}ms</td>
                      <td
                        className={cn(
                          'py-2 pr-4 text-right',
                          stat.p95 > 3000 && 'text-destructive font-medium'
                        )}
                      >
                        {stat.p95}ms
                      </td>
                      <td className="py-2 pr-4 text-right">{stat.p99}ms</td>
                      <td
                        className={cn(
                          'py-2 text-right',
                          stat.errorRate > 0.05 && 'text-destructive font-medium'
                        )}
                      >
                        {(stat.errorRate * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {loading ? '데이터를 불러오는 중...' : '아직 수집된 API 타이밍 데이터가 없어요'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ServiceStatusCard({ service }: { service: ServiceHealth }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{service.name}</span>
          <StatusIcon status={service.status} />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <StatusBadge status={service.status} />
          {service.responseTimeMs > 0 && (
            <span className="text-xs text-muted-foreground">{service.responseTimeMs}ms</span>
          )}
        </div>
        {service.details && <p className="text-xs text-muted-foreground mt-1">{service.details}</p>}
      </CardContent>
    </Card>
  );
}

function StatusIcon({ status }: { status: ServiceStatus }) {
  switch (status) {
    case 'healthy':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'degraded':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case 'down':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
  }
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  const styles: Record<ServiceStatus, string> = {
    healthy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    degraded: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    down: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };

  const labels: Record<ServiceStatus, string> = {
    healthy: '정상',
    degraded: '느림',
    down: '중단',
    unknown: '확인 중',
  };

  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', styles[status])}>
      {labels[status]}
    </span>
  );
}

/**
 * /api/health 응답에서 서비스 목록 파싱
 */
function parseHealthServices(data: Record<string, unknown>): ServiceHealth[] {
  const services: ServiceHealth[] = [];
  const timestamp = new Date().toISOString();

  // 메인 API 서버
  services.push({
    name: 'API 서버',
    status: data.status === 'healthy' ? 'healthy' : 'degraded',
    responseTimeMs: 0,
    lastChecked: timestamp,
  });

  // Supabase
  if (data.database !== undefined) {
    services.push({
      name: 'Supabase',
      status: data.database === 'connected' ? 'healthy' : 'down',
      responseTimeMs: 0,
      lastChecked: timestamp,
    });
  }

  // Clerk
  if (data.auth !== undefined) {
    services.push({
      name: 'Clerk 인증',
      status: data.auth === 'ok' ? 'healthy' : 'degraded',
      responseTimeMs: 0,
      lastChecked: timestamp,
    });
  }

  return services;
}
