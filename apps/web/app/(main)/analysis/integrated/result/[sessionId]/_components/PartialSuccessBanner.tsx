/**
 * 부분 실패 안내 배너
 *
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §4.3
 */

import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { AxisCode } from '@/lib/analysis/integrated';

// AxisCode → i18n 축 라벨 키 (axes.*)
const AXIS_LABEL_KEY: Record<AxisCode, string> = {
  personal_color: 'axes.personalColor',
  skin: 'axes.skin',
  body: 'axes.body',
  hair: 'axes.hair',
  makeup: 'axes.makeup',
};

// 축별 개별 분석 시작 경로 — 실패한 축을 각각 다시 시도할 수 있게 딥링크한다.
// (forceNew=true: 기존 결과가 있어도 자동 진입하지 않고 새로 촬영)
const AXIS_ANALYSIS_HREF: Record<AxisCode, string> = {
  personal_color: '/analysis/personal-color?forceNew=true',
  skin: '/analysis/skin?forceNew=true',
  body: '/analysis/body?forceNew=true',
  hair: '/analysis/hair?forceNew=true',
  makeup: '/analysis/makeup?forceNew=true',
};

export interface PartialSuccessBannerProps {
  axesCompleted: AxisCode[];
  axesFailed: AxisCode[];
}

export async function PartialSuccessBanner({
  axesCompleted,
  axesFailed,
}: PartialSuccessBannerProps): Promise<React.JSX.Element | null> {
  if (axesFailed.length === 0) return null;

  const t = await getTranslations('analysis.integratedResult');
  const completedLabels = axesCompleted.map((c) => t(AXIS_LABEL_KEY[c])).join(', ');
  const failedLabels = axesFailed.map((c) => t(AXIS_LABEL_KEY[c])).join(', ');

  return (
    <div
      className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"
      data-testid="partial-success-banner"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div className="flex-1 space-y-1.5">
          <p className="text-sm font-semibold text-amber-100">{t('partialSuccess.title')}</p>
          {completedLabels && (
            <p className="text-xs text-amber-200/80">
              <span className="text-amber-300">{t('partialSuccess.successLabel')}</span>{' '}
              {completedLabels}
            </p>
          )}
          <p className="text-xs text-amber-200/80">
            <span className="text-amber-300">{t('partialSuccess.failedLabel')}</span> {failedLabels}
          </p>
          {/* 정직한 대체: 통합 재실행(사진 재업로드)이 아니라, 실패한 축만 개별 분석으로
              다시 시도하도록 각 축을 딥링크한다. 세션 단위 부분 재시도 API는 없다. */}
          <p className="pt-1 text-xs text-amber-200/80">{t('partialSuccess.retryHint')}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {axesFailed.map((axis) => (
          <Link
            key={axis}
            href={AXIS_ANALYSIS_HREF[axis]}
            data-testid={`partial-retry-${axis}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-500/40 px-3 text-xs font-medium text-amber-200 transition-colors hover:border-amber-400 hover:bg-amber-500/10"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t('partialSuccess.reanalyzeAxis', { axis: t(AXIS_LABEL_KEY[axis]) })}
          </Link>
        ))}
      </div>
    </div>
  );
}
