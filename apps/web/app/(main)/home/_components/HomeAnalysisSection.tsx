'use client';

import { useAnalysisStatus } from '@/hooks/useAnalysisStatus';
// 정적 import로 변환 - LCP 최적화 (dynamic ssr:false 제거)
// 이미 'use client' 컴포넌트이므로 동적 로딩 불필요
import HomeAnalysisPrompt from './HomeAnalysisPrompt';
import HomeAnalysisSummary from './HomeAnalysisSummary';

// 스켈레톤 컴포넌트 - 분석 섹션
function AnalysisSkeleton() {
  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-5 shadow-xl shadow-slate-200/50 dark:shadow-none">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30"
          >
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 홈 분석 섹션 - Client Component
 * 사용자 분석 상태에 따라 다른 UI 표시
 */
export default function HomeAnalysisSection() {
  const { isLoading, analyses, isNewUser } = useAnalysisStatus();

  if (isLoading) {
    return (
      <section className="animate-fade-in-up animation-delay-100">
        <AnalysisSkeleton />
      </section>
    );
  }

  return (
    <section className="animate-fade-in-up animation-delay-100">
      {isNewUser ? (
        <HomeAnalysisPrompt />
      ) : (
        <HomeAnalysisSummary analyses={analyses} />
      )}
    </section>
  );
}
