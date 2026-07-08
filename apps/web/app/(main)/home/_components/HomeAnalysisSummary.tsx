'use client';

import { useRouter } from 'next/navigation';
import { Sparkles, ChevronRight, Plus } from 'lucide-react';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';
import { AnalysisProgressBar } from '@/components/home/AnalysisProgressBar';
import {
  ANALYSIS_META,
  ANALYSIS_ORDER,
  TOTAL_ANALYSIS_TYPES,
  getResultHref,
} from '@/components/profile/analysis-meta';

interface HomeAnalysisSummaryProps {
  analyses: AnalysisSummary[];
}

/**
 * 홈 - 기존 사용자용 분석 요약
 * Glassmorphism 스타일
 */
export default function HomeAnalysisSummary({ analyses }: HomeAnalysisSummaryProps) {
  const router = useRouter();
  const isAllComplete = analyses.length >= TOTAL_ANALYSIS_TYPES;

  // 미완료 분석 중 첫 번째 추천
  const completedTypes = new Set(analyses.map((a) => a.type));
  const nextAnalysis = ANALYSIS_ORDER.find((t) => !completedTypes.has(t));

  return (
    <section
      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-5 shadow-xl shadow-slate-200/50 dark:shadow-none"
      data-testid="home-analysis-summary"
      aria-label="내 분석 결과"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />내 분석 결과
        </h3>
        <button
          onClick={() => router.push('/analysis/integrated')}
          className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1 min-h-[44px]"
        >
          전체보기
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 진행도 바 — 100% 완료 시 숨김 */}
      {!isAllComplete && (
        <AnalysisProgressBar
          completed={analyses.length}
          total={TOTAL_ANALYSIS_TYPES}
          completedTypes={analyses.map((a) => a.type)}
        />
      )}

      {/* 완료된 분석 요약 */}
      <div className="grid grid-cols-2 gap-2">
        {analyses.slice(0, 6).map((analysis) => {
          const meta = ANALYSIS_META[analysis.type];
          const Icon = meta.icon;
          const resultHref = getResultHref(analysis);

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
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  {meta.narrative}
                </p>
              </div>
            </button>
          );
        })}

        {/* 미완료 분석 CTA 슬롯 */}
        {!isAllComplete && nextAnalysis && (
          <button
            onClick={() => router.push(ANALYSIS_META[nextAnalysis].analysisHref)}
            className="group flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/30 dark:hover:bg-violet-950/20 transition-colors text-left"
            data-testid="home-analysis-next-cta"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30 transition-colors">
              <Plus className="w-5 h-5 text-slate-400 group-hover:text-violet-500 transition-colors" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {ANALYSIS_META[nextAnalysis].label}
              </p>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                분석해보기
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {ANALYSIS_META[nextAnalysis].valueHint}
              </p>
            </div>
          </button>
        )}
      </div>
    </section>
  );
}
