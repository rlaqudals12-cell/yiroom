'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Bell, Search, ChevronRight, Sparkles, Droplet, Shirt } from 'lucide-react';
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus';
import HomeAnalysisPrompt from './HomeAnalysisPrompt';
import HomeAnalysisSummary from './HomeAnalysisSummary';

// 최근 본 제품 - lazy loading (비필수 콘텐츠)
const RecentlyViewed = dynamic(
  () =>
    import('@/components/products/RecentlyViewed').then((mod) => ({ default: mod.RecentlyViewed })),
  {
    ssr: false,
    loading: () => <RecentlyViewedSkeleton />,
  }
);

// 스켈레톤 - 최근 본 제품
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

// 시간 기반 인사말
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '좋은 아침이에요';
  if (hour >= 12 && hour < 18) return '좋은 오후예요';
  if (hour >= 18 && hour < 22) return '좋은 저녁이에요';
  return '좋은 밤이에요';
}

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
 * 홈 탭 클라이언트 컴포넌트 - 데이터 페칭 및 인터랙션 담당
 * 정적 헤더는 Server Component에서 렌더링
 */
export default function HomeContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [greeting, setGreeting] = useState('');
  const { isLoading: isAnalysisLoading, analyses, isNewUser } = useAnalysisStatus();

  useEffect(() => {
    setGreeting(getTimeGreeting());
  }, []);

  // 사용자 이름 (로딩 중이어도 기본값 사용)
  const userName = user?.firstName || user?.username || '회원';

  // LCP 최적화: 인사말은 즉시 렌더링, 데이터 의존 콘텐츠만 로딩 표시
  const isDataLoading = !isLoaded || isAnalysisLoading;

  return (
    <>
      {/* 헤더 - Glassmorphism */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/30">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.push('/notifications')}
            className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            aria-label="알림 확인"
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            이룸
          </h1>
          <button
            onClick={() => router.push('/search')}
            className="p-2 -mr-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            aria-label="검색 페이지로 이동"
          >
            <Search className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* 본문 */}
      <div className="px-4 py-5 space-y-5">
        {/* 시간 기반 인사 - LCP 최적화: 즉시 렌더링 */}
        <section className="animate-fade-in-up">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {greeting || '안녕하세요'}, {userName}님
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            오늘도 나다운 하루를 시작해볼까요?
          </p>
        </section>

        {/* AI 분석 섹션 (조건부) */}
        <section className="animate-fade-in-up animation-delay-100">
          {isDataLoading ? (
            <AnalysisSkeleton />
          ) : isNewUser ? (
            <HomeAnalysisPrompt />
          ) : (
            <HomeAnalysisSummary analyses={analyses} />
          )}
        </section>

        {/* 오늘의 추천 - 기존 사용자만 표시 (로딩 완료 후) */}
        {!isDataLoading && !isNewUser && (
          <section aria-label="오늘의 맞춤 추천" className="animate-fade-in-up animation-delay-200">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" aria-hidden="true" />
              오늘의 추천
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {/* 피부 맞춤 추천 */}
              <button
                onClick={() => router.push('/beauty')}
                className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-4 text-left hover:shadow-lg hover:shadow-pink-500/10 hover:scale-[1.02] transition-all duration-300 overflow-hidden"
                aria-label="피부 맞춤 제품 추천 보기"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center mb-3 shadow-lg shadow-pink-500/30">
                    <Droplet className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white">피부 맞춤</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">스킨케어 추천</p>
                  <ChevronRight
                    className="w-4 h-4 text-slate-400 mt-2 group-hover:translate-x-1 transition-transform"
                    aria-hidden="true"
                  />
                </div>
              </button>
              {/* 체형 맞춤 추천 */}
              <button
                onClick={() => router.push('/style')}
                className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-4 text-left hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02] transition-all duration-300 overflow-hidden"
                aria-label="체형 맞춤 코디 추천 보기"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
                    <Shirt className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white">체형 맞춤</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">코디 추천</p>
                  <ChevronRight
                    className="w-4 h-4 text-slate-400 mt-2 group-hover:translate-x-1 transition-transform"
                    aria-hidden="true"
                  />
                </div>
              </button>
            </div>
          </section>
        )}

        {/* 최근 본 제품 - lazy loading */}
        <section className="animate-fade-in-up animation-delay-400">
          <Suspense fallback={<RecentlyViewedSkeleton />}>
            <RecentlyViewed limit={6} />
          </Suspense>
        </section>
      </div>
    </>
  );
}
