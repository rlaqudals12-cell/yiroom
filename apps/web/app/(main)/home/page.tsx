import { Suspense } from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { HomeHeader } from './_components/HomeHeader';
import { HomeGreeting } from './_components/HomeGreeting';
import HomeAnalysisSection from './_components/HomeAnalysisSection';
import HomeTodayRecommendation from './_components/HomeTodayRecommendation';
import HomeRecentlyViewed from './_components/HomeRecentlyViewed';

// 스켈레톤 컴포넌트 - 인라인으로 정의하여 빠른 렌더링
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

function RecommendationSkeleton() {
  return (
    <div>
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
    </div>
  );
}

function RecentlyViewedSkeleton() {
  return (
    <div>
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
    </div>
  );
}

/**
 * 홈 탭 - Server Component
 * LCP 최적화: 정적 헤더와 인사말을 Server에서 즉시 렌더링
 *
 * 구조:
 * - page.tsx (Server Component): 헤더 + 인사말 (LCP)
 * - HomeAnalysisSection (Client): 분석 데이터 (Suspense)
 * - HomeTodayRecommendation (Client): 추천 섹션 (Suspense)
 * - HomeRecentlyViewed (Client): 최근 본 제품 (Suspense)
 */
export default async function HomePage() {
  // Server에서 사용자 정보 미리 가져오기 (LCP 최적화)
  const user = await currentUser();
  const userName = user?.firstName || user?.username || '회원';

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/30 pb-20"
      data-testid="home-page"
    >
      {/* 헤더 - Server Component (LCP 요소) */}
      <HomeHeader />

      {/* 본문 */}
      <main className="px-4 py-5 space-y-5">
        {/* 인사말 - Server Component (LCP 요소) */}
        <HomeGreeting userName={userName} />

        {/* AI 분석 섹션 - Client Component (Suspense boundary) */}
        <Suspense fallback={<AnalysisSkeleton />}>
          <HomeAnalysisSection />
        </Suspense>

        {/* 오늘의 추천 - Client Component (Suspense boundary) */}
        <Suspense fallback={<RecommendationSkeleton />}>
          <HomeTodayRecommendation />
        </Suspense>

        {/* 최근 본 제품 - Client Component (Suspense boundary) */}
        <Suspense fallback={<RecentlyViewedSkeleton />}>
          <HomeRecentlyViewed />
        </Suspense>
      </main>
    </div>
  );
}
