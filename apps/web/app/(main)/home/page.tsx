import { Suspense } from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { BottomNav } from '@/components/BottomNav';
import { HomeHeader } from './_components/HomeHeader';
import { HomeGreeting } from './_components/HomeGreeting';
import HomeStateRouter from './_components/HomeStateRouter';
import WelcomeBackBanner from './_components/WelcomeBackBanner';

// 스켈레톤 컴포넌트 — State 로딩 중 표시
function HomeStateSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-6">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-5 shadow-sm">
        <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  );
}

/**
 * 홈 탭 - Server Component
 *
 * 3-State 홈 모델 (ADR-076):
 * - New (0개 분석): 깔끔한 히어로 + 2개 CTA
 * - Growing (1-3개): 발견 프로그레스 + 인과 추천
 * - Active (4+개): 오늘의 제안 + Daily Capsule
 *
 * LCP 최적화: 정적 헤더와 인사말을 Server에서 즉시 렌더링
 * State 분기는 Client Component(HomeStateRouter)가 담당
 */
export default async function HomePage() {
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
      <div className="px-4 py-5 space-y-5">
        {/* 인사말 - Server Component (LCP 요소) */}
        <HomeGreeting userName={userName} />

        {/* 복귀자 환영 배너 (3일+ 미접속 시 표시) */}
        <WelcomeBackBanner />

        {/* 3-State 홈 라우터 */}
        <Suspense fallback={<HomeStateSkeleton />}>
          <HomeStateRouter />
        </Suspense>
      </div>

      <BottomNav />
    </div>
  );
}
