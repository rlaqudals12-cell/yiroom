'use client';

import { useRouter } from 'next/navigation';
import { Palette, Sparkles, User, Scissors, Heart, ChevronRight } from 'lucide-react';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';
import { AnalysisProgressBar } from '@/components/home/AnalysisProgressBar';
import { NextLevelCard } from '@/components/home/NextLevelCard';

// 분석 타입별 메타 정보
const ANALYSIS_META = {
  'personal-color': {
    icon: Palette,
    label: '퍼스널 컬러',
    gradient: 'from-violet-400 to-purple-500',
    shadow: 'shadow-violet-500/30',
    href: '/analysis/personal-color/result',
  },
  skin: {
    icon: Sparkles,
    label: '피부',
    gradient: 'from-rose-400 to-pink-500',
    shadow: 'shadow-rose-500/30',
    href: '/analysis/skin/result',
  },
  body: {
    icon: User,
    label: '체형',
    gradient: 'from-blue-400 to-indigo-500',
    shadow: 'shadow-blue-500/30',
    href: '/analysis/body/result',
  },
  hair: {
    icon: Scissors,
    label: '헤어',
    gradient: 'from-amber-400 to-orange-500',
    shadow: 'shadow-amber-500/30',
    href: '/analysis/hair/result',
  },
  makeup: {
    icon: Heart,
    label: '메이크업',
    gradient: 'from-pink-400 to-rose-500',
    shadow: 'shadow-pink-500/30',
    href: '/analysis/makeup/result',
  },
};

interface HomeAnalysisSummaryProps {
  analyses: AnalysisSummary[];
}

/**
 * 홈 - 기존 사용자용 분석 요약
 * Glassmorphism 스타일
 */
export default function HomeAnalysisSummary({ analyses }: HomeAnalysisSummaryProps) {
  const router = useRouter();

  // 미완료 분석 타입
  const completedTypes = new Set(analyses.map((a) => a.type));
  const allTypes = ['personal-color', 'skin', 'body', 'hair', 'makeup'] as const;
  const incompleteTypes = allTypes.filter((t) => !completedTypes.has(t));

  return (
    <section
      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-5 shadow-xl shadow-slate-200/50 dark:shadow-none"
      data-testid="home-analysis-summary"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />내 분석 결과
        </h3>
        <button
          onClick={() => router.push('/analysis')}
          className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
        >
          전체보기
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 진행도 바 - Archive 디자인 요소 */}
      <AnalysisProgressBar
        completed={analyses.length}
        total={allTypes.length}
        completedTypes={analyses.map((a) => a.type)}
      />

      {/* 완료된 분석 요약 */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {analyses.slice(0, 4).map((analysis) => {
          const meta = ANALYSIS_META[analysis.type];
          const Icon = meta.icon;
          const resultHref =
            analysis.type === 'personal-color'
              ? `/analysis/personal-color/result/${analysis.id}`
              : `${meta.href}/${analysis.id}`;

          return (
            <button
              key={analysis.id}
              onClick={() => router.push(resultHref)}
              className="group flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors text-left"
              data-testid={`home-analysis-${analysis.type}`}
            >
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-md ${meta.shadow} flex-shrink-0`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">{meta.label}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {analysis.summary}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 다음 레벨 카드 - Archive 디자인 요소 */}
      <NextLevelCard completedCount={analyses.length} incompleteTypes={incompleteTypes} />
    </section>
  );
}
