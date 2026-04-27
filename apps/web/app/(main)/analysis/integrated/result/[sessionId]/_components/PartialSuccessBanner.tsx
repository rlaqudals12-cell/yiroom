/**
 * 부분 실패 안내 배너
 *
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §4.3
 */

import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AxisCode } from '@/lib/analysis/integrated';

const AXIS_LABELS: Record<AxisCode, string> = {
  personal_color: '퍼스널컬러',
  skin: '피부',
  body: '체형',
  hair: '헤어',
  makeup: '메이크업',
};

export interface PartialSuccessBannerProps {
  axesCompleted: AxisCode[];
  axesFailed: AxisCode[];
}

export function PartialSuccessBanner({
  axesCompleted,
  axesFailed,
}: PartialSuccessBannerProps): React.JSX.Element | null {
  if (axesFailed.length === 0) return null;

  const completedLabels = axesCompleted.map((c) => AXIS_LABELS[c]).join(', ');
  const failedLabels = axesFailed.map((c) => AXIS_LABELS[c]).join(', ');

  return (
    <div
      className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"
      data-testid="partial-success-banner"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div className="flex-1 space-y-1.5">
          <p className="text-sm font-semibold text-amber-100">일부 분석이 완료되지 않았어요</p>
          {completedLabels && (
            <p className="text-xs text-amber-200/80">
              <span className="text-amber-300">성공:</span> {completedLabels}
            </p>
          )}
          <p className="text-xs text-amber-200/80">
            <span className="text-amber-300">미완료:</span> {failedLabels}
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Link href="/analysis/integrated">
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-lg border-amber-500/40 text-amber-200 hover:border-amber-400 hover:bg-amber-500/10"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            다시 시도
          </Button>
        </Link>
      </div>
    </div>
  );
}
