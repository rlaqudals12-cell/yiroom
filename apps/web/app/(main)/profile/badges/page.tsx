'use client';

/**
 * 배지 컬렉션 페이지
 * - 카테고리별 배지 목록
 * - 획득/미획득 상태 표시
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { BadgeGrid, LevelCard } from '@/components/gamification';
import {
  getAllBadges,
  getUserBadges,
  getUserLevelInfo,
  groupBadgesByCategory,
  getBadgeStats,
  type UserBadge,
  type LevelInfo,
  type BadgeGroup,
} from '@/lib/gamification';

export default function BadgesPage() {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [badgeGroups, setBadgeGroups] = useState<BadgeGroup[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [stats, setStats] = useState({ total: 0, earned: 0, progress: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBadgeData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // 병렬로 데이터 조회
        const [allBadges, earnedBadges, level] = await Promise.all([
          getAllBadges(supabase),
          getUserBadges(supabase, user.id),
          getUserLevelInfo(supabase, user.id),
        ]);

        // 그룹화
        const groups = groupBadgesByCategory(allBadges, earnedBadges);
        setBadgeGroups(groups);
        setUserBadges(earnedBadges);
        setLevelInfo(level);

        // 통계
        const badgeStats = getBadgeStats(allBadges, earnedBadges);
        setStats(badgeStats);
      } catch (error) {
        console.error('[BadgesPage] 데이터 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isLoaded) {
      fetchBadgeData();
    }
  }, [supabase, user?.id, isLoaded]);

  // 로딩
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">배지 불러오는 중...</div>
      </div>
    );
  }

  // 비로그인
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">로그인이 필요합니다</h2>
          <p className="text-muted-foreground">배지를 확인하려면 먼저 로그인해주세요</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 헤더 */}
        <header className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="대시보드로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">배지 컬렉션</h1>
              <p className="text-sm text-muted-foreground">
                {stats.earned}/{stats.total}개 획득 ({stats.progress}%)
              </p>
            </div>
          </div>
        </header>

        {/* 레벨 카드 */}
        {levelInfo && (
          <section>
            <LevelCard levelInfo={levelInfo} />
          </section>
        )}

        {/* 배지 그리드 */}
        <section className="bg-white rounded-2xl border p-6">
          <BadgeGrid
            groups={badgeGroups}
            userBadges={userBadges}
          />
        </section>

        {/* 안내 메시지 */}
        {stats.earned === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-2xl">
            <p className="text-muted-foreground mb-2">아직 획득한 배지가 없어요</p>
            <p className="text-sm text-muted-foreground">
              운동이나 식단을 기록하면 배지를 획득할 수 있어요!
            </p>
            <Link
              href="/workout"
              className="inline-block mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              운동 시작하기
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
