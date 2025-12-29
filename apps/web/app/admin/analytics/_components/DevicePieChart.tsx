'use client';

/**
 * 디바이스 분포 파이 차트 컴포넌트
 * @description 모바일/데스크톱/태블릿 비율 표시
 */

import { Smartphone, Monitor, Tablet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DeviceBreakdown } from '@/types/analytics';

interface DevicePieChartProps {
  data: DeviceBreakdown[] | null;
  isLoading?: boolean;
}

const DEVICE_COLORS: Record<string, string> = {
  mobile: '#3b82f6', // blue
  desktop: '#10b981', // green
  tablet: '#f59e0b', // amber
};

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  mobile: <Smartphone className="h-4 w-4" />,
  desktop: <Monitor className="h-4 w-4" />,
  tablet: <Tablet className="h-4 w-4" />,
};

const DEVICE_LABELS: Record<string, string> = {
  mobile: '모바일',
  desktop: '데스크톱',
  tablet: '태블릿',
};

export function DevicePieChart({ data, isLoading }: DevicePieChartProps) {
  if (isLoading) {
    return (
      <Card data-testid="device-chart-loading">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <Skeleton className="h-[150px] w-[150px] rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card data-testid="device-chart-empty">
        <CardHeader>
          <CardTitle className="text-base">디바이스 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  // 파이 차트 계산
  const total = data.reduce((sum, d) => sum + d.sessions, 0);
  const size = 150;
  const radius = 60;
  const center = size / 2;

  // 각 세그먼트의 각도 계산
  let currentAngle = -90; // 12시 방향에서 시작
  const segments = data.map((d) => {
    const angle = (d.sessions / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    // 호의 좌표 계산
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + angle) * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    return {
      deviceType: d.deviceType,
      percentage: d.percentage,
      sessions: d.sessions,
      path: `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
    };
  });

  return (
    <Card data-testid="device-pie-chart">
      <CardHeader>
        <CardTitle className="text-base">디바이스 분포</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* 파이 차트 */}
          <svg viewBox={`0 0 ${size} ${size}`} className="w-[150px] h-[150px]">
            {segments.map((seg) => (
              <path
                key={seg.deviceType}
                d={seg.path}
                fill={DEVICE_COLORS[seg.deviceType] || '#94a3b8'}
              />
            ))}
            {/* 중앙 원 (도넛 효과) */}
            <circle cx={center} cy={center} r={30} fill="white" />
          </svg>

          {/* 범례 */}
          <div className="flex-1 space-y-3">
            {data.map((d) => (
              <div key={d.deviceType} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: DEVICE_COLORS[d.deviceType] || '#94a3b8' }}
                />
                <div className="flex items-center gap-2 text-sm">
                  {DEVICE_ICONS[d.deviceType]}
                  <span>{DEVICE_LABELS[d.deviceType] || d.deviceType}</span>
                </div>
                <div className="ml-auto text-sm font-medium">{d.percentage.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
