'use client';

import { memo } from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeteriorationAlert } from '@/lib/analysis/skin-v2/skin-diary-zone';

// 심각도별 스타일
const SEVERITY_CONFIG = {
  severe: {
    icon: AlertTriangle,
    bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    label: '심각',
  },
  moderate: {
    icon: AlertCircle,
    bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    label: '주의',
  },
  mild: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    label: '참고',
  },
} as const;

export interface DeteriorationAlertCardProps {
  alerts: DeteriorationAlert[];
  className?: string;
}

/**
 * 존 악화 알림 카드
 * - 점수가 하락한 존을 심각도별로 표시
 * - 권장 조치 포함
 */
const DeteriorationAlertCard = memo(function DeteriorationAlertCard({
  alerts,
  className,
}: DeteriorationAlertCardProps) {
  if (alerts.length === 0) return null;

  // 심각도 순 정렬
  const sorted = [...alerts].sort((a, b) => {
    const order = { severe: 0, moderate: 1, mild: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <Card className={className} data-testid="deterioration-alert-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          피부 변화 알림
          <span className="text-xs font-normal text-muted-foreground">{alerts.length}건</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sorted.map((alert) => {
          const config = SEVERITY_CONFIG[alert.severity];
          const Icon = config.icon;

          return (
            <div
              key={alert.zoneId}
              className={`rounded-lg border p-3 ${config.bg}`}
              data-testid={`alert-${alert.zoneId}`}
            >
              <div className="flex items-start gap-2">
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.text}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{alert.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.badge}`}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {alert.currentScore}점 (평균 대비 -{alert.drop.toFixed(0)}점 하락)
                  </p>
                  <p className="text-xs">{alert.suggestion}</p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
});

export default DeteriorationAlertCard;
