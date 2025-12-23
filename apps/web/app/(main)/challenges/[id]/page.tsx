'use client';

/**
 * 챌린지 상세 페이지
 * - 진행 상황 표시
 * - 참여/포기 기능
 * - 완료 보상 수령
 */

import { useState, useEffect, use } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Trophy,
  Gift,
  AlertTriangle,
} from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { Button } from '@/components/ui/button';
import { ChallengeProgress } from '@/components/challenges';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  getChallengeById,
  getUserChallengeByChallenge,
  joinChallenge,
  abandonChallenge,
  completeChallenge,
} from '@/lib/challenges';
import {
  DOMAIN_COLORS,
  DOMAIN_NAMES,
  DIFFICULTY_NAMES,
  STATUS_NAMES,
} from '@/types/challenges';
import type { Challenge, UserChallenge } from '@/types/challenges';
import { toast } from 'sonner';
import { useGamification } from '@/components/gamification';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ChallengeDetailPage({ params }: PageProps) {
  const { id: challengeId } = use(params);
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const supabase = useClerkSupabaseClient();
  const { processGamificationResult } = useGamification();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // 데이터 로드
  useEffect(() => {
    async function fetchData() {
      try {
        const challengeData = await getChallengeById(supabase, challengeId);

        if (!challengeData) {
          toast.error('챌린지를 찾을 수 없습니다');
          router.push('/challenges');
          return;
        }

        setChallenge(challengeData);

        // 로그인한 경우 사용자 챌린지 조회
        if (user?.id) {
          const userChallengeData = await getUserChallengeByChallenge(
            supabase,
            user.id,
            challengeId
          );
          setUserChallenge(userChallengeData);
        }
      } catch (error) {
        console.error('[ChallengeDetailPage] 데이터 조회 실패:', error);
        toast.error('챌린지 정보를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    }

    if (isLoaded) {
      fetchData();
    }
  }, [supabase, challengeId, user?.id, isLoaded, router]);

  // 참여하기
  const handleJoin = async () => {
    if (!user?.id) {
      toast.error('로그인이 필요합니다');
      return;
    }

    setIsJoining(true);
    try {
      const result = await joinChallenge(supabase, user.id, challengeId);

      if (result.success && result.userChallenge) {
        setUserChallenge(result.userChallenge);
        toast.success('챌린지에 참여했습니다!');
      } else {
        toast.error(result.error || '참여에 실패했습니다');
      }
    } catch (error) {
      console.error('[ChallengeDetailPage] 참여 실패:', error);
      toast.error('챌린지 참여에 실패했습니다');
    } finally {
      setIsJoining(false);
    }
  };

  // 포기하기
  const handleAbandon = async () => {
    if (!userChallenge) return;

    setIsAbandoning(true);
    try {
      const success = await abandonChallenge(supabase, userChallenge.id);

      if (success) {
        setUserChallenge((prev) =>
          prev ? { ...prev, status: 'abandoned' } : null
        );
        toast.success('챌린지를 포기했습니다');
        router.push('/challenges');
      } else {
        toast.error('포기 처리에 실패했습니다');
      }
    } catch (error) {
      console.error('[ChallengeDetailPage] 포기 실패:', error);
      toast.error('포기 처리에 실패했습니다');
    } finally {
      setIsAbandoning(false);
    }
  };

  // 보상 수령
  const handleClaimReward = async () => {
    if (!user?.id || !userChallenge) return;

    setIsClaiming(true);
    try {
      const result = await completeChallenge(supabase, userChallenge.id, user.id);

      if (result.success) {
        setUserChallenge((prev) =>
          prev ? { ...prev, rewardClaimed: true } : null
        );

        // 게이미피케이션 알림
        if (result.xpAwarded || result.badgeAwarded) {
          processGamificationResult({
            xpAwarded: result.xpAwarded,
          });
        }

        toast.success(
          `🎉 축하합니다! ${result.xpAwarded || 0} XP를 획득했습니다!`
        );
      } else {
        toast.error(result.error || '보상 수령에 실패했습니다');
      }
    } catch (error) {
      console.error('[ChallengeDetailPage] 보상 수령 실패:', error);
      toast.error('보상 수령에 실패했습니다');
    } finally {
      setIsClaiming(false);
    }
  };

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

  // 챌린지 없음
  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">챌린지를 찾을 수 없습니다</h2>
          <Link href="/challenges" className="text-primary hover:underline">
            챌린지 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const domainColor = DOMAIN_COLORS[challenge.domain];
  const isParticipating = !!userChallenge;
  const isInProgress = userChallenge?.status === 'in_progress';
  const isCompleted = userChallenge?.status === 'completed';
  const canClaimReward = isCompleted && !userChallenge?.rewardClaimed;

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 헤더 */}
        <header className="flex items-center gap-4">
          <Link
            href="/challenges"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
            aria-label="챌린지 목록으로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">챌린지 상세</h1>
        </header>

        {/* 챌린지 카드 */}
        <section className="rounded-2xl border bg-card p-6 space-y-4">
          {/* 아이콘 + 제목 */}
          <div className="flex items-start gap-4">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${domainColor.bg}`}
            >
              {challenge.icon}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{challenge.name}</h2>
              <p className="text-muted-foreground mt-1">
                {challenge.description}
              </p>
            </div>
          </div>

          {/* 메타 정보 */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground">
              {DOMAIN_NAMES[challenge.domain]}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground">
              {DIFFICULTY_NAMES[challenge.difficulty]}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {challenge.durationDays}일
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-primary/10 text-primary flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              +{challenge.rewardXp} XP
            </span>
          </div>
        </section>

        {/* 진행 상황 (참여 중인 경우) */}
        {isParticipating && userChallenge && (
          <section className="rounded-2xl border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">진행 상황</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isCompleted
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : isInProgress
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                }`}
              >
                {STATUS_NAMES[userChallenge.status]}
              </span>
            </div>

            <ChallengeProgress
              progress={userChallenge.progress}
              durationDays={challenge.durationDays}
              showDayIndicators
            />

            {/* 시작일/종료일 */}
            <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
              <span>
                시작: {new Date(userChallenge.startedAt).toLocaleDateString('ko-KR')}
              </span>
              <span>
                목표: {new Date(userChallenge.targetEndAt).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </section>
        )}

        {/* 보상 수령 (완료 + 미수령) */}
        {canClaimReward && (
          <section className="rounded-2xl border-2 border-green-300 bg-green-50 dark:bg-green-950/20 p-6 text-center">
            <Gift className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-green-700 dark:text-green-400">
              축하합니다! 챌린지를 완료했어요!
            </h3>
            <p className="text-sm text-green-600 dark:text-green-500 mt-1 mb-4">
              아래 버튼을 눌러 보상을 받으세요
            </p>
            <Button
              onClick={handleClaimReward}
              disabled={isClaiming}
              className="bg-green-500 hover:bg-green-600 text-white"
              size="lg"
            >
              {isClaiming ? '수령 중...' : `보상 받기 (+${challenge.rewardXp} XP)`}
            </Button>
          </section>
        )}

        {/* 액션 버튼 */}
        <section className="flex gap-3">
          {!isParticipating ? (
            <Button
              onClick={handleJoin}
              disabled={isJoining || !user}
              className="flex-1"
              size="lg"
            >
              {isJoining ? '참여 중...' : '챌린지 참여하기'}
            </Button>
          ) : isInProgress ? (
            <>
              <Button
                onClick={() => router.push('/challenges')}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                목록으로
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    size="lg"
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    포기
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>챌린지를 포기하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                      포기하면 진행 상황이 모두 사라지고, 다시 시작해야 합니다.
                      정말 포기하시겠습니까?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleAbandon}
                      className="bg-red-500 hover:bg-red-600"
                      disabled={isAbandoning}
                    >
                      {isAbandoning ? '처리 중...' : '포기하기'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <Button
              onClick={() => router.push('/challenges')}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              목록으로 돌아가기
            </Button>
          )}
        </section>

        {/* 비로그인 안내 */}
        {!user && (
          <div className="text-center py-4 px-6 bg-muted rounded-xl">
            <p className="text-sm text-muted-foreground">
              챌린지에 참여하려면 로그인이 필요합니다
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
