'use client';

/**
 * 결과 페이지 "더 깊이" — 축별 심화 링크
 *
 * One Canon(ADR-111): 축 상세의 정본은 개별 결과 페이지다. 통합 리포트는
 * 세션 고유물(Persona/ActionPlan/CrossInsights/Curation)만 담고, 축 요약은
 * 여기서 "핵심 결과 1줄 + 심화 보기 →"로 개별 결과 페이지에 연결한다.
 * (구 AxesSummaryCard/AxisDetailAccordion 흡수)
 *
 * @see docs/adr/ADR-111-one-canon-ia.md
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §4.4
 */

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight, RefreshCw, Palette, Sparkles, Shirt, Scissors, Brush } from 'lucide-react';
import type { AxisCode } from '@/lib/analysis/integrated';
import { useAnalysisStatus, type AnalysisType } from '@/hooks/useAnalysisStatus';

interface NextStepItem {
  axis: AxisCode;
  /** 축 이름 i18n 키 (axes.*) */
  axisNameKey: string;
  /** 개별 분석 타입 — 최신 결과 딥링크 + 폴백 시작 라우팅 */
  analysisType: AnalysisType;
  /** 최신 개별 결과가 없을 때 이동할 분석 시작 경로 */
  fallbackHref: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

const ALL_STEPS: NextStepItem[] = [
  {
    axis: 'personal_color',
    axisNameKey: 'axes.personalColor',
    analysisType: 'personal-color',
    fallbackHref: '/analysis/personal-color',
    icon: Palette,
    iconColor: 'text-pink-400',
  },
  {
    axis: 'skin',
    axisNameKey: 'axes.skin',
    analysisType: 'skin',
    fallbackHref: '/analysis/skin',
    icon: Sparkles,
    iconColor: 'text-amber-400',
  },
  {
    axis: 'body',
    axisNameKey: 'axes.body',
    analysisType: 'body',
    fallbackHref: '/analysis/body',
    icon: Shirt,
    iconColor: 'text-blue-400',
  },
  {
    axis: 'hair',
    axisNameKey: 'axes.hair',
    analysisType: 'hair',
    fallbackHref: '/analysis/hair',
    icon: Scissors,
    iconColor: 'text-violet-400',
  },
  {
    axis: 'makeup',
    axisNameKey: 'axes.makeup',
    analysisType: 'makeup',
    fallbackHref: '/analysis/makeup',
    icon: Brush,
    iconColor: 'text-rose-400',
  },
];

export interface NextStepsLinksProps {
  axesCompleted: AxisCode[];
  /**
   * 축별 핵심 결과 1줄 요약 (서버에서 공용 라벨 헬퍼로 생성 — 원시 영문값 노출 금지).
   * 예: personal_color → "가을 웜톤 · 웜톤", skin → "복합성 · 컨디션 72점"
   */
  axisSummaries?: Partial<Record<AxisCode, string>>;
}

export function NextStepsLinks({
  axesCompleted,
  axisSummaries,
}: NextStepsLinksProps): React.JSX.Element | null {
  const t = useTranslations('analysis.integratedResult');
  const completedSet = new Set(axesCompleted);
  const steps = ALL_STEPS.filter((s) => completedSet.has(s.axis));

  // 최신 개별 결과가 있으면 개별 결과 페이지(축 상세의 정본)로 딥링크 — 재분석 유도 방지
  const { analyses } = useAnalysisStatus();
  const latestByType = new Map(analyses.map((a) => [a.type, a]));

  if (steps.length === 0) return null;

  return (
    <section className="space-y-3" data-testid="next-steps-links">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
        {t('nextSteps.heading')}
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const summary = axisSummaries?.[step.axis];
          // 최신 개별 결과가 있으면 결과 페이지로, 없으면 분석 시작 경로로 폴백
          const latest = latestByType.get(step.analysisType);
          const href = latest ? `/analysis/${latest.type}/result/${latest.id}` : step.fallbackHref;
          return (
            // 링크 중첩(a > a) 방지: 카드 링크(심화 보기)와 재분석 링크를 li 안의 형제로 둔다
            <li
              key={step.axis}
              className="overflow-hidden rounded-2xl border border-zinc-800 bg-neutral-900 transition-colors hover:border-pink-500/40"
            >
              <Link
                href={href}
                className="group flex items-center gap-3 p-4 transition-colors hover:bg-neutral-900/60"
                data-testid={`next-step-${step.axis}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                  <Icon className={`h-5 w-5 ${step.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{t(step.axisNameKey)}</p>
                  <p className="truncate text-xs text-zinc-400">
                    {summary ?? t('nextSteps.summaryFallback')}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-zinc-500 transition-colors group-hover:text-pink-400">
                  {t('nextSteps.deepDive')}
                  <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
              {/* 선택 재분석 진입 — 이 축만 새로 촬영해 다시 분석 (forceNew=기존 결과 자동진입 방지) */}
              <Link
                href={`${step.fallbackHref}?forceNew=true`}
                className="flex items-center justify-center gap-1 border-t border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-500 transition-colors hover:bg-neutral-900/60 hover:text-pink-400"
                data-testid={`next-step-reanalyze-${step.axis}`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t('nextSteps.reanalyze')}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
