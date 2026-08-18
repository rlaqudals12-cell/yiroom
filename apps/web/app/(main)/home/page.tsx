import { Suspense } from 'react';
import { HomeHeader } from './_components/HomeHeader';
import HomeStateRouter from './_components/HomeStateRouter';
import WelcomeBackBanner from './_components/WelcomeBackBanner';
import { HomeBriefingSkeleton } from './_components/HomeBriefingSkeleton';

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
  return (
    // 크림 지면(--surface-ground) 위 백색 카드 = 2단 깊이(다크는 기존 배경으로 폴백)
    <div className="min-h-screen bg-surface-ground" data-testid="home-page">
      {/* 헤더 - Server Component (LCP 요소) */}
      <HomeHeader />

      {/* 본문 */}
      <div className="px-4 py-5 space-y-5">
        {/* ADR-114: 인사는 브리핑 레터가 담당(DailyBriefing) — 서버 인사말 중복 제거 */}

        {/* 복귀자 환영 배너 (3일+ 미접속 시 표시) */}
        <WelcomeBackBanner />

        {/* 3-State 홈 라우터 */}
        <Suspense fallback={<HomeBriefingSkeleton />}>
          <HomeStateRouter />
        </Suspense>
      </div>
    </div>
  );
}
