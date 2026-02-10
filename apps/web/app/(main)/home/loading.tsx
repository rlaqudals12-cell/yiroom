import { HomeHeader } from './_components/HomeHeader';

/**
 * 홈 페이지 로딩 스켈레톤
 * Next.js App Router loading.tsx - LCP 최적화
 * 실제 헤더를 렌더링하여 CLS(Cumulative Layout Shift) 방지
 */

// Server Component - 즉시 렌더링
export default function HomeLoading() {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/30 pb-20"
      data-testid="home-loading"
    >
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
        <section className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-5 shadow-xl shadow-slate-200/50 dark:shadow-none">
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
              <div
                key={i}
                className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-4"
              >
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
                className="flex-shrink-0 w-28 bg-white/60 dark:bg-slate-800/60 rounded-xl p-2"
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
