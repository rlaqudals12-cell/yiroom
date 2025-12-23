'use client';

/**
 * 챌린지 목록 페이지
 * - 진행 중인 챌린지
 * - 참여 가능한 챌린지 목록
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target, Trophy, Flame } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { ChallengeList } from '@/components/challenges';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getActiveChallenges,
  getUserChallenges,
  joinChallenge,
  getUserChallengeStats,
  type ChallengeStats,
} from '@/lib/challenges';
import type { Challenge, UserChallenge } from '@/types/challenges';
import { toast } from 'sonner';

export default function ChallengesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const supabase = useClerkSupabaseClient();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'explore' | 'my'>('explore');

  // 데이터 로드
  useEffect(() => {
    async function fetchData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const [allChallenges, myUserChallenges, myStats] = await Promise.all([
          getActiveChallenges(supabase),
          getUserChallenges(supabase, user.id),
          getUserChallengeStats(supabase, user.id),
        ]);

        setChallenges(allChallenges);
        setUserChallenges(myUserChallenges);
        setStats(myStats);
      } catch (error) {
        console.error('[ChallengesPage] 데이터 조회 실패:', error);
        toast.error('챌린지 목록을 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    }

    if (isLoaded) {
      fetchData();
    }
  }, [supabase, user?.id, isLoaded]);

  // 챌린지 참여
  const handleJoin = async (challengeId: string) => {
    if (!user?.id) {
      toast.error('로그인이 필요합니다');
      return;
    }

    try {
      const result = await joinChallenge(supabase, user.id, challengeId);

      if (result.success && result.userChallenge) {
        setUserChallenges((prev) => [...prev, result.userChallenge!]);
        toast.success('챌린지에 참여했습니다!');

        // 통계 업데이트
        if (stats) {
          setStats({
            ...stats,
            inProgress: stats.inProgress + 1,
            total: stats.total + 1,
          });
        }
      } else {
        toast.error(result.error || '참여에 실패했습니다');
      }
    } catch (error) {
      console.error('[ChallengesPage] 참여 실패:', error);
      toast.error('챌린지 참여에 실패했습니다');
    }
  };

  // 상세 보기
  const handleView = (challengeId: string) => {
    router.push(`/challenges/${challengeId}`);
  };

  // 진행 중인 챌린지만 필터링
  const activeChallenges = userChallenges.filter(
    (uc) => uc.status === 'in_progress'
  );

  // 완료된 챌린지만 필터링
  const completedChallenges = userChallenges.filter(
    (uc) => uc.status === 'completed'
  );

  // 로딩
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          챌린지 불러오는 중...
        </div>
      </div>
    );
  }

  // 비로그인
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">로그인이 필요합니다</h2>
          <p className="text-muted-foreground">
            챌린지에 참여하려면 먼저 로그인해주세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 헤더 */}
        <header className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
            aria-label="대시보드로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">챌린지</h1>
              <p className="text-sm text-muted-foreground">
                목표를 설정하고 달성해보세요
              </p>
            </div>
          </div>
        </header>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border bg-card p-4 text-center">
              <div className="flex justify-center mb-2">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <div className="text-xs text-muted-foreground">진행 중</div>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <div className="flex justify-center mb-2">
                <Trophy className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">완료</div>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <div className="flex justify-center mb-2">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">전체 참여</div>
            </div>
          </div>
        )}

        {/* 탭 */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'explore' | 'my')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="explore">탐색</TabsTrigger>
            <TabsTrigger value="my">
              내 챌린지 {activeChallenges.length > 0 && `(${activeChallenges.length})`}
            </TabsTrigger>
          </TabsList>

          {/* 탐색 탭 */}
          <TabsContent value="explore" className="mt-4">
            <ChallengeList
              challenges={challenges}
              userChallenges={userChallenges}
              onJoin={handleJoin}
              onView={handleView}
              showFilters
            />
          </TabsContent>

          {/* 내 챌린지 탭 */}
          <TabsContent value="my" className="mt-4 space-y-6">
            {/* 진행 중 */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                진행 중 ({activeChallenges.length})
              </h2>
              {activeChallenges.length === 0 ? (
                <div className="py-8 text-center bg-muted/50 rounded-xl">
                  <p className="text-muted-foreground">진행 중인 챌린지가 없어요</p>
                  <button
                    onClick={() => setActiveTab('explore')}
                    className="mt-2 text-primary hover:underline text-sm"
                  >
                    챌린지 탐색하기
                  </button>
                </div>
              ) : (
                <ChallengeList
                  challenges={challenges.filter((c) =>
                    activeChallenges.some((ac) => ac.challengeId === c.id)
                  )}
                  userChallenges={activeChallenges}
                  onView={handleView}
                  showFilters={false}
                />
              )}
            </section>

            {/* 완료 */}
            {completedChallenges.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-green-500" />
                  완료 ({completedChallenges.length})
                </h2>
                <ChallengeList
                  challenges={challenges.filter((c) =>
                    completedChallenges.some((cc) => cc.challengeId === c.id)
                  )}
                  userChallenges={completedChallenges}
                  onView={handleView}
                  showFilters={false}
                />
              </section>
            )}
          </TabsContent>
        </Tabs>

        {/* 안내 메시지 (처음 사용자) */}
        {stats && stats.total === 0 && activeTab === 'explore' && (
          <div className="text-center py-4 px-6 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-sm text-muted-foreground">
              처음이시네요! 관심있는 챌린지에 참여해보세요.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
