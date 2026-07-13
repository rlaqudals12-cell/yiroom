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

import { getTranslations } from 'next-intl/server';
import { AlertTriangle } from 'lucide-react';
import type { AxisCode } from '@/lib/analysis/integrated';

// AxisCode → i18n 축 라벨 키 (axes.*). 알 수 없는 코드는 키가 없어 걸러진다.
const AXIS_LABEL_KEY: Record<AxisCode, string> = {
  personal_color: 'axes.personalColor',
  skin: 'axes.skin',
  body: 'axes.body',
  hair: 'axes.hair',
  makeup: 'axes.makeup',
};

export interface AxisFallbackNoticeProps {
  /** Mock Fallback이 적용된 축 코드 배열 (세션 used_fallback) */
  usedFallback: AxisCode[];
}

/**
 * Mock Fallback 축이 하나라도 있으면 샘플 고지 배너를 표시한다.
 * (없으면 null — 정상 분석만 있으면 배너 미노출)
 */
export async function AxisFallbackNotice({
  usedFallback,
}: AxisFallbackNoticeProps): Promise<React.JSX.Element | null> {
  const t = await getTranslations('analysis.integratedResult');
  // 왜: 알 수 없는 축 코드는 라벨 키가 없어 걸러낸다 ("undefined" 노출 방지)
  const labels = usedFallback
    .map((axis) => AXIS_LABEL_KEY[axis])
    .filter((key): key is string => Boolean(key))
    .map((key) => t(key));
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
          <p className="text-sm font-semibold text-amber-100">{t('fallback.title')}</p>
          {/* 축 라벨은 색상 강조 span으로 분리하고, 나머지 본문만 번역 (t.rich 미사용) */}
          <p className="text-xs text-amber-200/80">
            <span className="text-amber-300">{labels.join(', ')}</span>{' '}
            {t('fallback.bodyAfterLabels')}
          </p>
          <p className="pt-1 text-xs text-amber-200/80">{t('fallback.retryHint')}</p>
        </div>
      </div>
    </div>
  );
}
