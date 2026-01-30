/**
 * 잇몸 건강 인디케이터 컴포넌트
 *
 * @module components/analysis/oral-health/GumHealthIndicator
 * @description 잇몸 건강 상태 시각화
 */

'use client';

import { AlertTriangle, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import type { GumHealthResult, GumHealthStatus } from '@/types/oral-health';

interface GumHealthIndicatorProps {
  /** 잇몸 건강 분석 결과 */
  result: GumHealthResult;
  /** 컴팩트 모드 */
  compact?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

// 상태별 설정
const STATUS_CONFIG: Record<
  GumHealthStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: typeof CheckCircle;
    description: string;
  }
> = {
  healthy: {
    label: '양호',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
    description: '잇몸 건강 상태가 양호합니다.',
  },
  mild_gingivitis: {
    label: '경미한 염증',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: AlertCircle,
    description: '경미한 잇몸 염증이 관찰됩니다.',
  },
  moderate_gingivitis: {
    label: '중등도 염증',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: AlertTriangle,
    description: '중등도 잇몸 염증이 있습니다. 관리가 필요합니다.',
  },
  severe_inflammation: {
    label: '심한 염증',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: XCircle,
    description: '심한 잇몸 염증입니다. 치과 방문을 권장합니다.',
  },
};

export function GumHealthIndicator({
  result,
  compact = false,
  className,
}: GumHealthIndicatorProps) {
  const config = STATUS_CONFIG[result.healthStatus];
  const Icon = config.icon;

  return (
    <div
      className={cn('rounded-lg border bg-card p-4', className)}
      data-testid="gum-health-indicator"
    >
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">잇몸 건강</h3>
        {result.needsDentalVisit && (
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
            치과 방문 권장
          </span>
        )}
      </div>

      {/* 상태 표시 */}
      <div className={cn('mb-4 flex items-center gap-3 rounded-lg p-3', config.bgColor)}>
        <Icon className={cn('h-8 w-8', config.color)} />
        <div>
          <p className={cn('text-lg font-bold', config.color)}>{config.label}</p>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>

      {/* 염증 점수 */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">염증 지수</span>
          <span className="font-medium">{result.inflammationScore}/100</span>
        </div>
        <Progress
          value={result.inflammationScore}
          className="h-2"
          indicatorClassName={getProgressColor(result.inflammationScore)}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {result.inflammationScore < 30
            ? '정상 범위'
            : result.inflammationScore < 60
              ? '주의 필요'
              : '관리 필요'}
        </p>
      </div>

      {/* 상세 지표 (컴팩트 모드가 아닐 때) */}
      {!compact && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          <MetricItem
            label="붉은 영역"
            value={`${result.metrics.rednessPercentage.toFixed(1)}%`}
            status={result.metrics.rednessPercentage > 20 ? 'warning' : 'normal'}
          />
          <MetricItem
            label="a* 평균"
            value={result.metrics.aStarMean.toFixed(1)}
            status={result.metrics.aStarMean > 15 ? 'warning' : 'normal'}
          />
        </div>
      )}

      {/* 영향 받은 영역 */}
      {result.affectedAreas && result.affectedAreas.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium">주의가 필요한 영역</p>
          <div className="flex flex-wrap gap-2">
            {result.affectedAreas.map((area, index) => (
              <span
                key={index}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium',
                  area.severity === 'severe'
                    ? 'bg-red-100 text-red-700'
                    : area.severity === 'moderate'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-yellow-100 text-yellow-700'
                )}
              >
                {getAreaLabel(area.region)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 추천 사항 */}
      <div>
        <p className="mb-2 text-sm font-medium">관리 방법</p>
        <ul className="space-y-1">
          {result.recommendations.slice(0, compact ? 2 : 4).map((rec, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
              <span className="text-muted-foreground">{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * 개별 지표 아이템
 */
function MetricItem({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: 'normal' | 'warning';
}) {
  return (
    <div className="rounded bg-muted/50 p-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <p
        className={cn(
          'text-sm font-medium',
          status === 'warning' ? 'text-orange-600' : ''
        )}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Progress 색상 반환
 */
function getProgressColor(score: number): string {
  if (score < 30) return 'bg-green-500';
  if (score < 60) return 'bg-yellow-500';
  if (score < 80) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * 영역 레이블 반환
 */
function getAreaLabel(region: string): string {
  const labels: Record<string, string> = {
    'upper_front': '상악 앞니',
    'upper_back': '상악 어금니',
    'lower_front': '하악 앞니',
    'lower_back': '하악 어금니',
  };
  return labels[region] || region;
}

export default GumHealthIndicator;
