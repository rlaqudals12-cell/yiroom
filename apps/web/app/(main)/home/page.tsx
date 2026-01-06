'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  ChevronRight,
  Sparkles,
  Droplet,
  Shirt,
  Flame,
  Dumbbell,
  BarChart3,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { HomeSkeleton } from '@/components/skeletons';
import { RecentlyViewed } from '@/components/products/RecentlyViewed';

/**
 * 홈 탭 - Glassmorphism 디자인
 * - 시간 기반 인사
 * - 웰니스 점수 카드
 * - 오늘의 추천 (뷰티/스타일)
 * - 오늘 기록 요약
 */

// 시간 기반 인사말
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '좋은 아침이에요';
  if (hour >= 12 && hour < 18) return '좋은 오후예요';
  if (hour >= 18 && hour < 22) return '좋은 저녁이에요';
  return '좋은 밤이에요';
}

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setGreeting(getTimeGreeting());
  }, []);

  // 로딩 중
  if (!isLoaded) {
    return <HomeSkeleton />;
  }

  const userName = user?.firstName || user?.username || '회원';

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/30 pb-20"
      data-testid="home-page"
    >
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
      <main className="px-4 py-5 space-y-5">
        {/* 시간 기반 인사 */}
        <section className="animate-fade-in-up">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {greeting}, {userName}님
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            오늘도 나다운 하루를 시작해볼까요?
          </p>
        </section>

        {/* 오늘의 추천 - Glassmorphism Cards */}
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

        {/* 오늘 기록 요약 - Glassmorphism */}
        <section className="animate-fade-in-up animation-delay-400">
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-4 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" aria-hidden="true" />
                오늘 기록
              </h3>
              <button
                onClick={() => router.push('/record')}
                className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1 transition-colors"
              >
                상세보기
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3">
              {/* 칼로리 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Flame className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">칼로리</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      1,200 / 2,000
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-[60%] bg-gradient-to-r from-orange-400 to-red-500 rounded-full" />
                  </div>
                </div>
              </div>
              {/* 운동 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Dumbbell className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">운동</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      30 / 60분
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-[50%] bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
                  </div>
                </div>
              </div>
              {/* 수분 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Droplet className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">수분</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      6 / 8잔
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-[75%] bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 최근 본 제품 */}
        <section className="animate-fade-in-up animation-delay-600">
          <RecentlyViewed limit={6} />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
