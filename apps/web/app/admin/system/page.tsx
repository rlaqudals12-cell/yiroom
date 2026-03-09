'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// /api/health 응답 타입
type StatusLevel = 'ok' | 'warning' | 'error';
type SimpleStatus = 'ok' | 'error';

interface HealthCheckResult {
  status: StatusLevel;
  checks: {
    supabase: {
      status: SimpleStatus;
      latencyMs: number;
      message: string;
    };
    dbSchema: {
      status: StatusLevel;
      message: string;
    };
    clerk: {
      status: StatusLevel;
      message: string;
    };
  };
  checkedAt: string;
}

// 상태별 아이콘/색상 매핑
function getStatusDisplay(status: StatusLevel | undefined): {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  label: string;
} {
  if (!status || status === 'error') {
    return {
      icon: <XCircle className="h-4 w-4" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      label: '오류',
    };
  }
  if (status === 'warning') {
    return {
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      label: '경고',
    };
  }
  return {
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: '정상',
  };
}

// DB 상태 도출: supabase + dbSchema 합산
function deriveDbStatus(health: HealthCheckResult | null): StatusLevel | undefined {
  if (!health) return undefined;
  const { supabase, dbSchema } = health.checks;
  if (supabase.status === 'error' || dbSchema.status === 'error') return 'error';
  if (dbSchema.status === 'warning') return 'warning';
  return supabase.status;
}

// DB 라벨 포맷: 지연시간 포함
function formatDbLabel(label: string, latencyMs: number | undefined): string {
  if (label !== '정상') return label;
  if (latencyMs !== undefined) return `연결됨 (${latencyMs}ms)`;
  return '연결됨';
}

// 시스템 상태 카드 컴포넌트
function StatusCard({
  icon: Icon,
  iconColor,
  bgColor,
  label,
  statusDisplay,
  isLoading,
}: {
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  label: string;
  statusDisplay: ReturnType<typeof getStatusDisplay>;
  isLoading: boolean;
}): React.ReactElement {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${isLoading ? 'bg-gray-100' : bgColor}`}>
            <Icon className={`h-6 w-6 ${isLoading ? 'text-gray-400' : iconColor}`} />
          </div>
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400 mt-1" />
            ) : (
              <p className={`text-lg font-semibold ${statusDisplay.color} flex items-center gap-1`}>
                {statusDisplay.icon} {statusDisplay.label}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminSystemPage(): React.ReactElement {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data: HealthCheckResult = await res.json();
        setHealth(data);
      } else {
        setHealth(null);
      }
    } catch {
      setHealth(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // 서버 상태: 전체 status 기반
  const serverStatus = getStatusDisplay(health?.status);

  // DB 상태: supabase + dbSchema 합산
  const dbRawStatus = deriveDbStatus(health);
  const dbStatus = getStatusDisplay(dbRawStatus);

  // AI 서비스: clerk 상태로 대체 (인증 서비스 — AI 전용 헬스체크 없음)
  const clerkStatus = getStatusDisplay(health?.checks.clerk.status);
  // 스토리지: supabase 연결 기반
  const storageStatus = getStatusDisplay(health?.checks.supabase.status);

  // DB 지연시간 표시
  const dbLabel = formatDbLabel(dbStatus.label, health?.checks.supabase.latencyMs);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">시스템 관리</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">시스템 상태 및 설정을 관리하세요.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHealth} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 시스템 상태 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          icon={Server}
          iconColor={serverStatus.color}
          bgColor={serverStatus.bgColor}
          label="서버 상태"
          statusDisplay={serverStatus}
          isLoading={isLoading}
        />
        <StatusCard
          icon={Database}
          iconColor="text-blue-600"
          bgColor="bg-blue-100"
          label="데이터베이스"
          statusDisplay={{ ...dbStatus, label: dbLabel }}
          isLoading={isLoading}
        />
        <StatusCard
          icon={Cpu}
          iconColor="text-purple-600"
          bgColor="bg-purple-100"
          label="AI 서비스"
          statusDisplay={{
            ...clerkStatus,
            label: clerkStatus.label === '정상' ? '활성' : clerkStatus.label,
          }}
          isLoading={isLoading}
        />
        <StatusCard
          icon={HardDrive}
          iconColor="text-amber-600"
          bgColor="bg-amber-100"
          label="스토리지"
          statusDisplay={storageStatus}
          isLoading={isLoading}
        />
      </div>

      {/* 마지막 확인 시간 */}
      {health?.checkedAt && (
        <p className="text-xs text-gray-400 text-right">
          마지막 확인: {new Date(health.checkedAt).toLocaleString('ko-KR')}
        </p>
      )}

      {/* 관리 메뉴 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/system/features">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-lg">Feature Flags</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">
                기능을 켜고 끌 수 있습니다. 문제가 발생한 기능을 빠르게 비활성화하거나, 새 기능을
                점진적으로 배포할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/system/crawler">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-lg">크롤러 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">
                가격 크롤러 상태를 확인하고 수동으로 실행할 수 있습니다. 제품 가격을 최신 상태로
                유지합니다.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 환경 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">환경 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Runtime</p>
              <p className="font-medium">Edge/Node</p>
            </div>
            <div>
              <p className="text-gray-500">Next.js</p>
              <p className="font-medium">16.0.7</p>
            </div>
            <div>
              <p className="text-gray-500">환경</p>
              <p className="font-medium">
                {process.env.NODE_ENV === 'production' ? '프로덕션' : '개발'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">빌드</p>
              <p className="font-medium">{new Date().toLocaleDateString('ko-KR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
