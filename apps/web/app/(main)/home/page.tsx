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
import { FadeInUp } from '@/components/animations';
import { HomeSkeleton } from '@/components/skeletons';
import { RecentlyViewed } from '@/components/products/RecentlyViewed';

/**
 * 홈 탭 - UX 리스트럭처링 메인
 * - 시간 기반 인사
 * - 오늘의 추천 (뷰티/스타일)
 * - 오늘 기록 요약
 */

// 시간 기반 인사말
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '좋은 아침';
  if (hour >= 12 && hour < 18) return '좋은 오후';
  if (hour >= 18 && hour < 22) return '좋은 저녁';
  return '좋은 밤';
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
    <div className="min-h-screen bg-background pb-20" data-testid="home-page">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.push('/notifications')}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="알림 확인"
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
          </button>
          <h1 className="text-lg font-semibold">이룸</h1>
          <button
            onClick={() => router.push('/search')}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="검색 페이지로 이동"
          >
            <Search className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* 본문 */}
      <main className="px-4 py-4 space-y-4">
        {/* 시간 기반 인사 */}
        <FadeInUp>
          <section className="py-2">
            <h2 className="text-2xl font-bold text-foreground">
              {greeting}, {userName}님!
            </h2>
            <p className="text-muted-foreground mt-1">
              오늘도 나다운 하루를 시작해볼까요?
            </p>
          </section>
        </FadeInUp>

        {/* 오늘의 추천 */}
        <FadeInUp delay={1}>
          <section aria-label="오늘의 맞춤 추천">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
              오늘의 추천
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {/* 피부 맞춤 추천 */}
              <button
                onClick={() => router.push('/beauty')}
                className="group bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/30 dark:to-rose-900/20 rounded-2xl border border-pink-200/50 dark:border-pink-800/30 p-4 text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                aria-label="피부 맞춤 제품 추천 보기"
              >
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center mb-3">
                  <Droplet className="w-5 h-5 text-pink-500" aria-hidden="true" />
                </div>
                <p className="font-semibold text-foreground">피부 맞춤</p>
                <p className="text-sm text-muted-foreground">스킨케어 추천</p>
                <ChevronRight className="w-4 h-4 text-muted-foreground mt-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </button>
              {/* 체형 맞춤 추천 */}
              <button
                onClick={() => router.push('/style')}
                className="group bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 p-4 text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                aria-label="체형 맞춤 코디 추천 보기"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                  <Shirt className="w-5 h-5 text-blue-500" aria-hidden="true" />
                </div>
                <p className="font-semibold text-foreground">체형 맞춤</p>
                <p className="text-sm text-muted-foreground">코디 추천</p>
                <ChevronRight className="w-4 h-4 text-muted-foreground mt-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </button>
            </div>
          </section>
        </FadeInUp>

        {/* 오늘 기록 요약 */}
        <FadeInUp delay={2}>
          <section className="bg-card rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" aria-hidden="true" />
                오늘 기록
              </h3>
              <button
                onClick={() => router.push('/record')}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                상세보기
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-orange-500" aria-hidden="true" />
                  </div>
                  <span className="text-sm text-muted-foreground">칼로리</span>
                </div>
                <span className="font-medium text-sm">1,200 / 2,000 kcal</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Dumbbell className="w-4 h-4 text-green-500" aria-hidden="true" />
                  </div>
                  <span className="text-sm text-muted-foreground">운동</span>
                </div>
                <span className="font-medium text-sm">30분 완료</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Droplet className="w-4 h-4 text-blue-500" aria-hidden="true" />
                  </div>
                  <span className="text-sm text-muted-foreground">수분</span>
                </div>
                <span className="font-medium text-sm">6 / 8잔</span>
              </div>
            </div>
          </section>
        </FadeInUp>

        {/* 최근 본 제품 */}
        <FadeInUp delay={3}>
          <RecentlyViewed limit={6} />
        </FadeInUp>
      </main>

      <BottomNav />
    </div>
  );
}
