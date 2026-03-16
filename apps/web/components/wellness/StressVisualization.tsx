'use client';

/**
 * 스트레스 시각화 컴포넌트
 *
 * @description 스트레스 레벨을 게이지 차트, 피부 영향, 주간 트렌드, 권장사항으로 시각화
 * @see lib/wellness/stress-visualization.ts
 */

import { TrendingDown, TrendingUp, Minus, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type {
  StressVisualizationData,
  StressTrendAnalysis,
  SkinImpactItem,
} from '@/lib/wellness/stress-visualization';

// ============================================
// SVG 게이지 차트
// ============================================

interface StressGaugeProps {
  /** 게이지 퍼센트 (0-100, 높을수록 좋음) */
  percent: number;
  /** 게이지 색상 */
  color: string;
  /** 등급 라벨 */
  gradeLabel: string;
  /** 스트레스 레벨 (1-10) */
  stressLevel: number;
}

function StressGauge({ percent, color, gradeLabel, stressLevel }: StressGaugeProps) {
  // 반원 게이지 SVG 계산
  const size = 180;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // 반원

  // 게이지 값 (0-100 → 반원 비율)
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clampedPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center" data-testid="stress-gauge">
      <svg
        width={size}
        height={size / 2 + 20}
        viewBox={`0 0 ${size} ${size / 2 + 20}`}
        aria-label={`스트레스 게이지: ${gradeLabel} (${clampedPercent}%)`}
        role="img"
      >
        {/* 배경 트랙 */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
          strokeLinecap="round"
        />
        {/* 활성 트랙 */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease-in-out' }}
        />
        {/* 중앙 텍스트 */}
        <text
          x={size / 2}
          y={size / 2 - 10}
          textAnchor="middle"
          className="fill-foreground text-3xl font-bold"
          style={{ fontSize: '2rem' }}
        >
          {stressLevel}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 14}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: '0.8rem' }}
        >
          / 10
        </text>
      </svg>
      <Badge variant="secondary" className="mt-1" style={{ backgroundColor: `${color}20`, color }}>
        {gradeLabel}
      </Badge>
    </div>
  );
}

// ============================================
// 피부 영향 카드
// ============================================

// severity → 스타일 매핑
const SEVERITY_STYLES: Record<number, { color: string; label: string; badge: string }> = {
  3: {
    color: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30',
    label: '심각',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
  2: {
    color: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30',
    label: '주의',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  },
  1: {
    color: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30',
    label: '경미',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  },
};

function SkinImpactCard({ impact }: { impact: SkinImpactItem }) {
  const style = SEVERITY_STYLES[impact.severity] ?? SEVERITY_STYLES[1];
  const severityColor = style.color;
  const severityLabel = style.label;
  const severityBadgeColor = style.badge;

  return (
    <div className={cn('rounded-xl border p-4', severityColor)} data-testid="skin-impact-card">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">{impact.area}</span>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', severityBadgeColor)}>
          {severityLabel}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{impact.impact}</p>
    </div>
  );
}

// ============================================
// 주간 트렌드 표시
// ============================================

function WeeklyTrend({ trend }: { trend: StressTrendAnalysis }) {
  const trendConfig = {
    improving: {
      icon: TrendingDown,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    worsening: {
      icon: TrendingUp,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    stable: {
      icon: Minus,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
  };

  const config = trendConfig[trend.trend];
  const Icon = config.icon;

  return (
    <div
      className={cn('flex items-center gap-3 p-4 rounded-xl', config.bg)}
      data-testid="weekly-trend"
    >
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', config.bg)}>
        <Icon className={cn('w-5 h-5', config.color)} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-semibold', config.color)}>
            주간 평균 {trend.averageLevel}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{trend.trendMessage}</p>
      </div>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

interface StressVisualizationProps {
  /** 스트레스 시각화 데이터 */
  data: StressVisualizationData;
  /** 주간 트렌드 분석 (선택적) */
  trend?: StressTrendAnalysis;
  /** 클래스명 */
  className?: string;
  /** 컴팩트 모드 */
  compact?: boolean;
}

export function StressVisualization({
  data,
  trend,
  className,
  compact = false,
}: StressVisualizationProps) {
  const hasImpacts = data.skinImpacts.length > 0;
  const hasRecommendations = data.recommendations.length > 0;

  return (
    <div className={cn('space-y-4', className)} data-testid="stress-visualization">
      {/* 게이지 카드 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            스트레스 수준
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <StressGauge
            percent={data.gaugePercent}
            color={data.color}
            gradeLabel={data.gradeLabel}
            stressLevel={data.stressLevel}
          />
        </CardContent>
      </Card>

      {/* 주간 트렌드 */}
      {trend && <WeeklyTrend trend={trend} />}

      {/* 피부 영향 */}
      {hasImpacts && !compact && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              피부에 미치는 영향
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.skinImpacts.map((impact, i) => (
              <SkinImpactCard key={i} impact={impact} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* 권장사항 */}
      {hasRecommendations && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              이렇게 해보세요
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(compact ? data.recommendations.slice(0, 2) : data.recommendations).map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default StressVisualization;
