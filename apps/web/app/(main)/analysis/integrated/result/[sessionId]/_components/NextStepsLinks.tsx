'use client';

/**
 * 결과 페이지 하단 "다음 단계" 링크
 *
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §4.4
 */

import Link from 'next/link';
import { ChevronRight, Palette, Sparkles, Shirt, Scissors, Brush } from 'lucide-react';
import type { AxisCode } from '@/lib/analysis/integrated';
import { useAnalysisStatus, type AnalysisType } from '@/hooks/useAnalysisStatus';

interface NextStepItem {
  axis: AxisCode;
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  /** 최신 결과가 있으면 분석 시작 대신 결과 페이지로 보낼 축 (재분석 유도 방지) */
  resultType?: AnalysisType;
}

const ALL_STEPS: NextStepItem[] = [
  {
    axis: 'personal_color',
    href: '/beauty?filter=personal-color',
    label: '내 색 기반 화장품 보기',
    description: '어울리는 립·아이섀도 추천',
    icon: Palette,
    iconColor: 'text-pink-400',
  },
  {
    axis: 'skin',
    href: '/beauty?filter=skin',
    label: '피부 타입 맞춤 추천',
    description: '스킨케어 루틴',
    icon: Sparkles,
    iconColor: 'text-amber-400',
  },
  {
    axis: 'body',
    href: '/closet',
    label: '체형별 코디 가이드',
    description: '옷장 조합',
    icon: Shirt,
    iconColor: 'text-blue-400',
  },
  {
    axis: 'hair',
    href: '/analysis/hair',
    label: '헤어스타일 추천 자세히',
    description: '얼굴형 기반 컷',
    icon: Scissors,
    iconColor: 'text-violet-400',
    resultType: 'hair',
  },
  {
    axis: 'makeup',
    href: '/analysis/makeup',
    label: '메이크업 튜토리얼',
    description: '단계별 가이드',
    icon: Brush,
    iconColor: 'text-rose-400',
    resultType: 'makeup',
  },
];

export interface NextStepsLinksProps {
  axesCompleted: AxisCode[];
}

export function NextStepsLinks({ axesCompleted }: NextStepsLinksProps): React.JSX.Element | null {
  const completedSet = new Set(axesCompleted);
  const steps = ALL_STEPS.filter((s) => completedSet.has(s.axis));

  // 최신 개별 결과가 있으면 "분석 시작" 대신 결과 페이지로 — "왜 또 분석해야 하지" 해소
  const { analyses } = useAnalysisStatus();
  const latestByType = new Map(analyses.map((a) => [a.type, a]));

  if (steps.length === 0) return null;

  return (
    <section className="space-y-3" data-testid="next-steps-links">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">다음 단계</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {steps.map((step) => {
          const Icon = step.icon;
          // resultType이 있고 최신 결과가 존재하면 결과 페이지로 목적지 변경
          const latest = step.resultType ? latestByType.get(step.resultType) : undefined;
          const href = latest ? `/analysis/${latest.type}/result/${latest.id}` : step.href;
          return (
            <li key={step.axis}>
              <Link
                href={href}
                className="group flex items-center gap-3 rounded-2xl border border-zinc-800 bg-neutral-900 p-4 transition-colors hover:border-pink-500/40 hover:bg-neutral-900/60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                  <Icon className={`h-5 w-5 ${step.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{step.label}</p>
                  <p className="text-xs text-zinc-400">{step.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-pink-400" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
