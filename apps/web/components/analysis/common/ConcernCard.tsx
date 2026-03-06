'use client';

import { CheckCircle, Minus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConcernCardProps, ConcernSeverity } from '@/types/analysis-concern';

// 심각도별 스타일 매핑 — V3 Triple Encoding (색상 + 아이콘 + 텍스트)
const SEVERITY_CONFIG: Record<
  ConcernSeverity,
  { bg: string; text: string; badge: string; Icon: typeof CheckCircle }
> = {
  good: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    Icon: CheckCircle,
  },
  normal: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    Icon: Minus,
  },
  warning: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-400',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    Icon: AlertCircle,
  },
};

/** 분석 메트릭 시각적 개요 카드 — V4 Concern Card 패턴 */
export default function ConcernCard({
  id,
  icon,
  label,
  score,
  severity,
  severityLabel,
  tip,
  onExpand,
  className,
}: ConcernCardProps): React.JSX.Element {
  const config = SEVERITY_CONFIG[severity];
  const SeverityIcon = config.Icon;

  return (
    <button
      type="button"
      onClick={onExpand}
      data-testid={`concern-card-${id}`}
      className={cn(
        'flex flex-col items-start gap-2 rounded-2xl p-3.5 text-left transition-all',
        'active:scale-[0.98]',
        config.bg,
        onExpand && 'cursor-pointer hover:shadow-sm',
        !onExpand && 'cursor-default',
        className
      )}
      aria-label={`${label} ${score}점 ${severityLabel}`}
    >
      {/* 아이콘 + 점수 행 */}
      <div className="flex w-full items-center justify-between">
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
        <span className="text-lg font-bold tabular-nums text-foreground">{score}</span>
      </div>

      {/* 라벨 */}
      <span className="text-sm font-medium text-foreground">{label}</span>

      {/* 심각도 배지 — Triple Encoding */}
      <span
        data-testid="concern-severity-badge"
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
          config.badge
        )}
      >
        <SeverityIcon className="h-3 w-3" aria-hidden="true" />
        {severityLabel}
      </span>

      {/* 한 줄 팁 */}
      <span className={cn('line-clamp-2 text-xs', config.text)}>{tip}</span>
    </button>
  );
}
