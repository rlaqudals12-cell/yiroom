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
import { AlertTriangle, CircleHelp } from 'lucide-react';
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
  /** 출처 표식이 없어 AI/샘플 여부를 확인할 수 없는 축. */
  unknownAxes?: AxisCode[];
}

/**
 * Mock Fallback 축이 하나라도 있으면 샘플 고지 배너를 표시한다.
 * (없으면 null — 정상 분석만 있으면 배너 미노출)
 */
export async function AxisFallbackNotice({
  usedFallback,
  unknownAxes = [],
}: AxisFallbackNoticeProps): Promise<React.JSX.Element | null> {
  const t = await getTranslations('analysis.integratedResult');
  // 왜: 알 수 없는 축 코드는 라벨 키가 없어 걸러낸다 ("undefined" 노출 방지)
  const labels = usedFallback
    .map((axis) => AXIS_LABEL_KEY[axis])
    .filter((key): key is string => Boolean(key))
    .map((key) => t(key));
  const unknownLabels = unknownAxes
    .map((axis) => AXIS_LABEL_KEY[axis])
    .filter((key): key is string => Boolean(key))
    .map((key) => t(key));
  if (labels.length === 0 && unknownLabels.length === 0) return null;

  return (
    <div className="space-y-3">
      {labels.length > 0 && (
        // 톤 절제(2026-08 배치 D): amber 벽면 대신 bg-card + amber 아이콘만 상태색으로 유지
        <div
          className="rounded-2xl border bg-card p-4"
          data-testid="axis-fallback-notice"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
            />
            <div className="flex-1 space-y-1.5">
              <p className="text-sm font-semibold text-foreground">{t('fallback.title')}</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">{labels.join(', ')}</span>{' '}
                {t('fallback.bodyAfterLabels')}
              </p>
              <p className="pt-1 text-xs text-muted-foreground">{t('fallback.retryHint')}</p>
            </div>
          </div>
        </div>
      )}
      {unknownLabels.length > 0 && (
        <div
          className="rounded-2xl border bg-card p-4"
          data-testid="axis-unknown-provenance-notice"
          role="note"
        >
          <div className="flex items-start gap-3">
            <CircleHelp
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
            />
            <div className="flex-1 space-y-1.5">
              <p className="text-sm font-semibold text-foreground">
                {t('unknownProvenance.title')}
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">{unknownLabels.join(', ')}</span>{' '}
                {t('unknownProvenance.bodyAfterLabels')}
              </p>
              <p className="pt-1 text-xs text-muted-foreground">
                {t('unknownProvenance.retryHint')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
