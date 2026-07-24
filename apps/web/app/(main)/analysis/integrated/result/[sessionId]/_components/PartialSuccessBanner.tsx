/**
 * 부분 실패 안내 배너
 *
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §4.3
 */

import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { AxisCode } from '@/lib/analysis/integrated';
import { AXIS_ANALYSIS_HREF } from './axis-retry-links';

// AxisCode → i18n 축 라벨 키 (axes.*)
const AXIS_LABEL_KEY: Record<AxisCode, string> = {
  personal_color: 'axes.personalColor',
  skin: 'axes.skin',
  body: 'axes.body',
  hair: 'axes.hair',
  makeup: 'axes.makeup',
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
      className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
      data-testid="partial-success-banner"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="flex-1 space-y-1.5">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            {t('partialSuccess.title')}
          </p>
          {completedLabels && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <span className="font-medium">{t('partialSuccess.successLabel')}</span>{' '}
              {completedLabels}
            </p>
          )}
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <span className="font-medium">{t('partialSuccess.failedLabel')}</span> {failedLabels}
          </p>
          {/* 정직한 대체: 세션 단위 부분 재시도 API는 없다 — 실패한 축만 각각 재시도 경로로
              딥링크한다. 퍼컬은 통합 입력(/analysis/integrated)으로 보낸다: 복귀 유저의
              축 선택 UI가 mode:'update' 재분석을 지원해 이 축만 다시 돌릴 수 있다.
              나머지 축은 개별 분석(forceNew) 시작 경로. (맵 정본 = axis-retry-links.ts) */}
          <p className="pt-1 text-xs text-amber-700 dark:text-amber-300">
            {t('partialSuccess.retryHint')}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {axesFailed.map((axis) => (
          <Link
            key={axis}
            href={AXIS_ANALYSIS_HREF[axis]}
            data-testid={`partial-retry-${axis}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-300 px-3 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t('partialSuccess.reanalyzeAxis', { axis: t(AXIS_LABEL_KEY[axis]) })}
          </Link>
        ))}
      </div>
    </div>
  );
}
