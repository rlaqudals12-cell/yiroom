import { HomeHeader } from './_components/HomeHeader';

/**
 * 홈 페이지 로딩 스켈레톤
 * Next.js App Router loading.tsx - LCP 최적화
 * 실제 헤더를 렌더링하여 CLS(Cumulative Layout Shift) 방지
 */

// Server Component - 즉시 렌더링
export default function HomeLoading() {
  return (
    // 본 페이지와 동일한 크림 지면 — 로딩→콘텐츠 전환 시 배경 점프 방지(장식 그라데 해체)
    <div className="min-h-screen bg-surface-ground" data-testid="home-loading">
      {/* 실제 헤더 컴포넌트 - CLS 방지 */}
      <HomeHeader />

      {/* 본문 스켈레톤 */}
      <div className="px-4 py-5 space-y-5">
        {/* 인사 섹션 - LCP 후보 */}
        <section>
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
          <div className="h-5 w-56 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </section>

        {/* 분석 섹션 스켈레톤 */}
        <section className="bg-card rounded-2xl border border-border p-5">
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
        </section>

        {/* 추천 섹션 스켈레톤 */}
        <section>
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-4">
                <div className="w-11 h-11 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse mb-3" />
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </section>

        {/* 최근 본 제품 스켈레톤 */}
        <section>
          <div className="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-28 bg-card rounded-xl border border-border p-2"
              >
                <div className="w-full aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-2" />
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
