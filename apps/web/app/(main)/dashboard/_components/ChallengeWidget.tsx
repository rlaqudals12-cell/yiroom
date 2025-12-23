'use client';

/**
 * 챌린지 위젯
 * - 진행 중인 챌린지 표시
 * - 챌린지 목록 페이지 링크
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Target, ChevronRight, Flame, Trophy } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { Progress } from '@/components/ui/progress';
import {
  getActiveUserChallenges,
  getUserChallengeStats,
  calculateProgressPercentage,
  type ChallengeStats,
} from '@/lib/challenges';
import type { UserChallenge } from '@/types/challenges';

interface ChallengeWidgetProps {
  userId?: string;
}

export default function ChallengeWidget({ userId }: ChallengeWidgetProps) {
  const supabase = useClerkSupabaseClient();
  const [activeChallenges, setActiveChallenges] = useState<UserChallenge[]>([]);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchChallengeData() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const [challenges, challengeStats] = await Promise.all([
          getActiveUserChallenges(supabase, userId),
          getUserChallengeStats(supabase, userId),
        ]);

        setActiveChallenges(challenges.slice(0, 3)); // 최대 3개
        setStats(challengeStats);
      } catch (error) {
        console.error('[ChallengeWidget] 데이터 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchChallengeData();
  }, [supabase, userId]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div
        className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-2xl p-6 animate-pulse"
        data-testid="challenge-widget-loading"
      >
        <div className="h-6 bg-orange-100 rounded w-1/3 mb-4" />
        <div className="h-12 bg-orange-100 rounded mb-4" />
        <div className="h-16 bg-orange-100 rounded" />
      </div>
    );
  }

  // 유저 없음
  if (!userId) {
    return null;
  }

  return (
    <div
      className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-2xl border border-orange-100 overflow-hidden"
      data-testid="challenge-widget"
    >
      {/* 헤더 */}
      <div className="p-4 border-b border-orange-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">챌린지</h3>
              <p className="text-sm text-orange-600">
                {stats?.inProgress || 0}개 진행 중
              </p>
            </div>
          </div>

          {/* 챌린지 통계 */}
          <div className="flex gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-orange-600">
                {stats?.completed || 0}
              </p>
              <p className="text-xs text-muted-foreground">완료</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-muted-foreground">
                {stats?.total || 0}
              </p>
              <p className="text-xs text-muted-foreground">전체</p>
            </div>
          </div>
        </div>
      </div>

      {/* 진행 중인 챌린지 목록 */}
      <div className="p-4">
        {activeChallenges.length > 0 ? (
          <div className="space-y-3">
            {activeChallenges.map((uc) => {
              const progress = uc.challenge
                ? calculateProgressPercentage(uc.progress, uc.challenge.target)
                : 0;

              return (
                <Link
                  key={uc.id}
                  href={`/challenges/${uc.challengeId}`}
                  className="flex items-center gap-3 p-3 bg-white/60 hover:bg-white/80 rounded-xl transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-lg">
                    {uc.challenge?.icon || '🎯'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {uc.challenge?.name || '챌린지'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground shrink-0">
                        {progress}%
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 bg-white/60 rounded-xl">
            <Flame className="w-8 h-8 text-orange-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              진행 중인 챌린지가 없어요
            </p>
            <Link
              href="/challenges"
              className="inline-block mt-3 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
            >
              챌린지 시작하기
            </Link>
          </div>
        )}
      </div>

      {/* 전체 보기 링크 */}
      {activeChallenges.length > 0 && (
        <div className="px-4 pb-4">
          <Link
            href="/challenges"
            className="flex items-center justify-center gap-1 w-full py-2 text-sm text-orange-600 hover:text-orange-700 bg-white/60 hover:bg-white/80 rounded-lg transition-colors"
          >
            전체 챌린지 보기
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 완료 팁 */}
      {stats && stats.completed > 0 && stats.completed < 3 && (
        <div className="mx-4 mb-4 bg-orange-100 rounded-lg p-3">
          <p className="text-xs text-orange-700">
            <Trophy className="w-3 h-3 inline mr-1" />
            <span className="font-medium">대단해요!</span> {stats.completed}개의 챌린지를 완료했어요!
          </p>
        </div>
      )}
    </div>
  );
}
