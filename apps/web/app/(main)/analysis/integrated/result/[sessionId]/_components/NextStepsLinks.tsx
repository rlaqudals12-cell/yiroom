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
import { ChevronRight, Palette, Sparkles, Shirt, Scissors, Brush } from 'lucide-react';
import type { AxisCode } from '@/lib/analysis/integrated';
import { useAnalysisStatus, type AnalysisType } from '@/hooks/useAnalysisStatus';

interface NextStepItem {
  axis: AxisCode;
  /** 축 이름 (행 제목) */
  axisName: string;
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
    axisName: '퍼스널컬러',
    analysisType: 'personal-color',
    fallbackHref: '/analysis/personal-color',
    icon: Palette,
    iconColor: 'text-pink-400',
  },
  {
    axis: 'skin',
    axisName: '피부',
    analysisType: 'skin',
    fallbackHref: '/analysis/skin',
    icon: Sparkles,
    iconColor: 'text-amber-400',
  },
  {
    axis: 'body',
    axisName: '체형',
    analysisType: 'body',
    fallbackHref: '/analysis/body',
    icon: Shirt,
    iconColor: 'text-blue-400',
  },
  {
    axis: 'hair',
    axisName: '헤어',
    analysisType: 'hair',
    fallbackHref: '/analysis/hair',
    icon: Scissors,
    iconColor: 'text-violet-400',
  },
  {
    axis: 'makeup',
    axisName: '메이크업',
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
  const completedSet = new Set(axesCompleted);
  const steps = ALL_STEPS.filter((s) => completedSet.has(s.axis));

  // 최신 개별 결과가 있으면 개별 결과 페이지(축 상세의 정본)로 딥링크 — 재분석 유도 방지
  const { analyses } = useAnalysisStatus();
  const latestByType = new Map(analyses.map((a) => [a.type, a]));

  if (steps.length === 0) return null;

  return (
    <section className="space-y-3" data-testid="next-steps-links">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
        각 축 더 깊이 보기
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const summary = axisSummaries?.[step.axis];
          // 최신 개별 결과가 있으면 결과 페이지로, 없으면 분석 시작 경로로 폴백
          const latest = latestByType.get(step.analysisType);
          const href = latest ? `/analysis/${latest.type}/result/${latest.id}` : step.fallbackHref;
          return (
            <li key={step.axis}>
              <Link
                href={href}
                className="group flex items-center gap-3 rounded-2xl border border-zinc-800 bg-neutral-900 p-4 transition-colors hover:border-pink-500/40 hover:bg-neutral-900/60"
                data-testid={`next-step-${step.axis}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                  <Icon className={`h-5 w-5 ${step.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{step.axisName}</p>
                  <p className="truncate text-xs text-zinc-400">{summary ?? '결과 자세히 보기'}</p>
                </div>
                <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-zinc-500 transition-colors group-hover:text-pink-400">
                  심화 보기
                  <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
