/**
 * 축별 Mock Fallback 정직 고지
 *
 * 개별 결과 페이지(피부·퍼컬 등)는 AI 실패 시 MockDataNotice로 "샘플 결과"를
 * 노출하지만, 통합 리포트는 축별 Mock 여부를 숨기고 있었다(감사 확정 B7).
 * 세션의 used_fallback을 읽어, 샘플(예시) 데이터로 대체된 축을 사용자에게
 * 정직하게 명시한다. (design-contracts §3 · ADR-007)
 *
 * @see docs/adr/ADR-007-mock-fallback-strategy.md
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §4.3
 */

import { AlertTriangle } from 'lucide-react';
import type { AxisCode } from '@/lib/analysis/integrated';

const AXIS_LABELS: Record<AxisCode, string> = {
  personal_color: '퍼스널컬러',
  skin: '피부',
  body: '체형',
  hair: '헤어',
  makeup: '메이크업',
};

export interface AxisFallbackNoticeProps {
  /** Mock Fallback이 적용된 축 코드 배열 (세션 used_fallback) */
  usedFallback: AxisCode[];
}

/**
 * Mock Fallback 축이 하나라도 있으면 샘플 고지 배너를 표시한다.
 * (없으면 null — 정상 분석만 있으면 배너 미노출)
 */
export function AxisFallbackNotice({
  usedFallback,
}: AxisFallbackNoticeProps): React.JSX.Element | null {
  // 왜: 알 수 없는 축 코드는 라벨이 없어 걸러낸다 ("undefined" 노출 방지)
  const labels = usedFallback
    .map((axis) => AXIS_LABELS[axis])
    .filter((label): label is string => Boolean(label));
  if (labels.length === 0) return null;

  return (
    <div
      className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"
      data-testid="axis-fallback-notice"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div className="flex-1 space-y-1.5">
          <p className="text-sm font-semibold text-amber-100">일부 축은 샘플 결과예요</p>
          <p className="text-xs text-amber-200/80">
            <span className="text-amber-300">{labels.join(', ')}</span> 축은 AI 분석 서비스를
            일시적으로 이용할 수 없어 샘플(예시) 결과를 표시하고 있어요. 실제 분석 결과가 아니므로
            참고용으로만 봐주세요.
          </p>
          <p className="pt-1 text-xs text-amber-200/80">
            잠시 후 해당 축을 다시 분석하시면 정확한 결과를 받으실 수 있어요.
          </p>
        </div>
      </div>
    </div>
  );
}
