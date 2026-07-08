'use client';

/**
 * 나 탭 - UX 리스트럭처링
 * - 사용자 정보 + 웰니스 스코어
 * - 내 분석 결과
 * - 친구
 * - 리더보드
 * - 챌린지
 * - 배지
 * - 설정/공지사항/도움말
 */

import { useState, useEffect, useMemo } from 'react';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { useLocale } from 'next-intl';
import { getDateLocale } from '@/lib/utils/date-format';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trophy,
  Target,
  ChevronRight,
  Award,
  TrendingUp,
  Users,
  Settings,
  Megaphone,
  HelpCircle,
  MessageSquare,
  LogOut,
  User,
  Flame,
  QrCode,
  Dumbbell,
  Utensils,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { FadeInUp } from '@/components/animations';
import { FEATURE_FLAGS } from '@yiroom/shared';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { BadgeCard } from '@/components/gamification';
import { QRCodeDisplay } from '@/components/common/QRCodeDisplay';
import { LevelBadgeFilled, LevelProgress as NewLevelProgress } from '@/components/common';
import { getUserLevel, calculateUserLevelState, type UserLevelState } from '@/lib/levels';
import {
  getUserLevelInfo,
  getUserBadges,
  type LevelInfo,
  type UserBadge,
} from '@/lib/gamification';
import { getUserChallengeStats, type ChallengeStats } from '@/lib/challenges';
import { WellnessScoreRing, MyInfoSummaryCard, ProfileCardGrid } from '@/components/profile';
import { BeforeAfterSection } from '@/components/profile/BeforeAfterSection';
import { getGreetingWithEmoji, TIME_GRADIENTS } from '@/lib/utils/greeting';
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus';
import { useProfilePersona } from '@/hooks/useProfilePersona';

// 프로필 데이터 타입
interface ProfileData {
  levelInfo: LevelInfo | null;
  recentBadges: UserBadge[];
  badgeStats: { total: number; earned: number; progress: number };
  challengeStats: ChallengeStats;
  workoutStreak: { current: number; longest: number } | null;
  nutritionStreak: { current: number; longest: number } | null;
  // 분석 결과 (5축 요약은 ProfileCardGrid가 useAnalysisStatus로 자체 조회 — ADR-111)
  wellnessScore: number;
  // 소셜
  friendCount: number;
  friendRequests: number;
  weeklyRank: number | null;
  rankChange: number;
  // 새 등급 시스템
  userLevelState: UserLevelState | null;
}

export default function ProfilePage() {
  const locale = useLocale();
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  // 5축 분석 요약 = 홈과 동일한 정본(ProfileCardGrid). 프로필 페이지도 같은 소스를 재사용 (ADR-111)
  const { analyses } = useAnalysisStatus();
  const personaOneLine = useProfilePersona();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'activity' | 'social'>('info');

  useEffect(() => {
    async function fetchProfileData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // 병렬로 데이터 조회
        const [
          levelInfo,
          userBadges,
          challengeStats,
          friendsResult,
          friendRequestsResult,
          leaderboardResult,
          wellnessResult,
        ] = await Promise.all([
          getUserLevelInfo(supabase, user.id),
          getUserBadges(supabase, user.id),
          getUserChallengeStats(supabase, user.id),
          // 5축 분석 요약(퍼스널컬러·피부·체형 등)은 ProfileCardGrid가 useAnalysisStatus로 자체 조회 (ADR-111)
          // 친구 수 (accepted 상태)
          supabase
            .from('friendships')
            .select('id', { count: 'exact', head: true })
            .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
            .eq('status', 'accepted'),
          // 친구 요청 수 (pending 상태, 내가 받은 요청)
          supabase
            .from('friendships')
            .select('id', { count: 'exact', head: true })
            .eq('addressee_id', user.id)
            .eq('status', 'pending'),
          // 리더보드 순위
          supabase
            .from('leaderboard_cache')
            .select('rank, previous_rank')
            .eq('clerk_user_id', user.id)
            .eq('period', 'weekly')
            .single(),
          // 웰니스 스코어
          supabase
            .from('wellness_scores')
            .select('total_score')
            .eq('clerk_user_id', user.id)
            .order('calculated_at', { ascending: false })
            .limit(1)
            .single(),
        ]);

        // 스트릭 조회
        const { data: workoutStreakData } = await supabase
          .from('workout_streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', user.id)
          .single();

        const { data: nutritionStreakData } = await supabase
          .from('nutrition_streaks')
          .select('current_streak, longest_streak')
          .eq('clerk_user_id', user.id)
          .single();

        // 새 등급 시스템 데이터 조회
        const userLevelData = await getUserLevel(supabase, user.id);
        const userLevelState = userLevelData
          ? calculateUserLevelState(userLevelData.totalActivityCount)
          : null;

        // 배지 통계 — 배지 섹션은 FEATURE_FLAGS.BADGES(현재 false)로 게이팅되어 미노출.
        // 노출 재개 시 total 하드코딩(23) 대신 getAllBadges() 실카운트로 교체 필요.
        const badgeStats = {
          total: 23, // 전체 배지 수 (하드코딩 — BADGES 플래그 OFF 상태라 사용자 표면 미노출)
          earned: userBadges.length,
          progress: Math.round((userBadges.length / 23) * 100),
        };

        // 최근 획득 배지 3개
        const recentBadges = userBadges
          .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
          .slice(0, 3);

        // 리더보드 순위 변화
        const leaderData = leaderboardResult.data;
        const weeklyRank = leaderData?.rank ?? null;
        const rankChange = leaderData
          ? (leaderData.previous_rank ?? leaderData.rank) - leaderData.rank
          : 0;

        setProfileData({
          levelInfo,
          recentBadges,
          badgeStats,
          challengeStats,
          workoutStreak: workoutStreakData
            ? {
                current: workoutStreakData.current_streak,
                longest: workoutStreakData.longest_streak,
              }
            : null,
          nutritionStreak: nutritionStreakData
            ? {
                current: nutritionStreakData.current_streak,
                longest: nutritionStreakData.longest_streak,
              }
            : null,
          // 분석 결과
          wellnessScore: wellnessResult.data?.total_score ?? 0,
          // 소셜
          friendCount: friendsResult.count ?? 0,
          friendRequests: friendRequestsResult.count ?? 0,
          weeklyRank,
          rankChange,
          // 새 등급 시스템
          userLevelState,
        });
      } catch (error) {
        console.error('[ProfilePage] 데이터 조회 실패:', error);
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (isLoaded) {
      fetchProfileData();
    }
  }, [supabase, user?.id, isLoaded]);

  // K-5: 시간대별 인사말 (주변 개인화)
  // useMemo는 early return 전에 호출되어야 함 (React Hooks 규칙)
  const greetingInfo = useMemo(() => {
    const userName = user?.fullName || user?.username || undefined;
    return getGreetingWithEmoji(userName);
  }, [user?.fullName, user?.username]);

  // 로딩
  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground animate-pulse">프로필 불러오는 중...</div>
      </div>
    );
  }

  // 비로그인
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">로그인이 필요합니다</h2>
          <p className="text-muted-foreground">프로필을 확인하려면 먼저 로그인해주세요</p>
        </div>
      </div>
    );
  }

  // 데이터 로드 실패
  if (loadError && !profileData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">프로필을 불러오지 못했어요</h2>
          <p className="text-muted-foreground">네트워크 상태를 확인하고 다시 시도해주세요.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // profileData에서 값 추출 (없으면 기본값)
  const wellnessScore = profileData?.wellnessScore ?? 0;
  const friendCount = profileData?.friendCount ?? 0;
  const friendRequests = profileData?.friendRequests ?? 0;
  const weeklyRank = profileData?.weeklyRank;
  const rankChange = profileData?.rankChange ?? 0;

  const PROFILE_TABS = [
    { key: 'info' as const, label: '내 정보', icon: User },
    { key: 'activity' as const, label: '활동', icon: Flame },
    { key: 'social' as const, label: '소셜', icon: Users },
  ];

  return (
    <div className="bg-background min-h-screen pb-20" data-testid="profile-page">
      <div className="space-y-4 px-4 py-6">
        {/* K-5: 시간대별 인사말 헤더 */}
        <FadeInUp>
          <section
            className={`rounded-2xl border bg-gradient-to-r p-4 ${TIME_GRADIENTS[greetingInfo.timeOfDay]}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{greetingInfo.emoji}</span>
              <p className="font-medium">{greetingInfo.greeting}</p>
            </div>
          </section>
        </FadeInUp>

        {/* K-5: 프로필 카드 + 웰니스 스코어 링 (벤토 박스) */}
        <FadeInUp>
          <section className="bg-card rounded-2xl border p-6">
            <div className="flex items-start gap-4">
              {/* 프로필 이미지 */}
              <div className="flex flex-col items-center gap-2">
                {user.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.fullName || '프로필'}
                    width={72}
                    height={72}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-indigo-500">
                    <span className="text-2xl font-bold text-white">
                      {(user.fullName || user.username || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                {profileData?.userLevelState && (
                  <LevelBadgeFilled level={profileData.userLevelState.level} size="sm" showLabel />
                )}
              </div>

              {/* 사용자 정보 */}
              <div className="flex-1">
                <h2 className="text-lg font-bold">
                  {user.fullName || user.username || '사용자'}님
                </h2>
                {profileData?.userLevelState && (
                  <p className="text-muted-foreground text-sm">
                    {profileData.userLevelState.totalActivityCount}회 활동
                  </p>
                )}
                <p className="text-muted-foreground mt-1 text-xs">
                  가입일:{' '}
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString(getDateLocale(locale))
                    : '-'}
                </p>
              </div>

              {/* K-5: 웰니스 스코어 링 차트 — ADR-098: W/N 기반 지표, 쓰기 경로 부재로 WELLNESS_PHASE2 게이팅 */}
              {FEATURE_FLAGS.WELLNESS_PHASE2 && (
                <WellnessScoreRing score={wellnessScore} size="sm" showLabel />
              )}
            </div>
          </section>
        </FadeInUp>

        {/* 탭 네비게이션 */}
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {PROFILE_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── 탭: 내 정보 ── */}
        {activeTab === 'info' && (
          <>
            {/* 내 QR 코드 */}
            <FadeInUp>
              <section className="bg-card rounded-2xl border p-4">
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="flex w-full items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <QrCode className="h-5 w-5 text-purple-500" />
                    <span className="font-semibold">내 QR 코드</span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 text-muted-foreground transition-transform ${showQR ? 'rotate-90' : ''}`}
                  />
                </button>
                {showQR && (
                  <div className="mt-4">
                    <QRCodeDisplay
                      type="referral"
                      data={{ referralCode: user.id }}
                      description="친구가 이 QR을 스캔하면 이룸에 가입할 수 있어요"
                    />
                  </div>
                )}
              </section>
            </FadeInUp>

            {/* 내 정보 요약 */}
            <FadeInUp delay={1}>
              <MyInfoSummaryCard />
            </FadeInUp>

            {/* 내 분석 결과 = 홈과 동일한 정본 카드(5축 채워지는 프로필, ADR-111) */}
            <FadeInUp delay={2}>
              <ProfileCardGrid analyses={analyses} personaOneLine={personaOneLine} />
            </FadeInUp>

            {/* Before/After 비교 */}
            <FadeInUp delay={3}>
              <BeforeAfterSection />
            </FadeInUp>

            {/* 등급 진행률 */}
            {profileData?.userLevelState && (
              <FadeInUp delay={4}>
                <section className="bg-card rounded-2xl border p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    나의 등급
                  </h3>
                  <NewLevelProgress
                    level={profileData.userLevelState.level}
                    currentCount={profileData.userLevelState.totalActivityCount}
                    nextThreshold={profileData.userLevelState.nextLevelThreshold}
                    progress={profileData.userLevelState.progress}
                    showDetails
                  />
                </section>
              </FadeInUp>
            )}
          </>
        )}

        {/* ── 탭: 활동 ── */}
        {activeTab === 'activity' && (
          <>
            {/* 스트릭 — ADR-098: 운동/식단 연속기록은 W/N 숨김 (WELLNESS_PHASE2) */}
            {FEATURE_FLAGS.WELLNESS_PHASE2 && (
              <FadeInUp>
                <section className="bg-card rounded-2xl border p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                    <Flame className="h-5 w-5 text-orange-500" />
                    연속 기록
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl bg-orange-50 p-4 dark:bg-orange-900/20">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                          <Dumbbell className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <div className="font-medium">운동</div>
                          <div className="text-muted-foreground text-xs">
                            최장 {profileData?.workoutStreak?.longest || 0}일
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {profileData?.workoutStreak?.current || 0}일
                        </div>
                        <div className="text-muted-foreground text-xs">현재</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-green-50 p-4 dark:bg-green-900/20">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                          <Utensils className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <div className="font-medium">식단</div>
                          <div className="text-muted-foreground text-xs">
                            최장 {profileData?.nutritionStreak?.longest || 0}일
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {profileData?.nutritionStreak?.current || 0}일
                        </div>
                        <div className="text-muted-foreground text-xs">현재</div>
                      </div>
                    </div>
                  </div>
                </section>
              </FadeInUp>
            )}

            {/* 배지 — ADR-098 기능 과잉 정리(2026-05-16): BADGES 게이팅 */}
            {FEATURE_FLAGS.BADGES && (
              <FadeInUp delay={1}>
                <section className="bg-card rounded-2xl border p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      배지 컬렉션
                    </h3>
                    <Link
                      href="/profile/badges"
                      className="text-primary flex items-center gap-1 text-sm hover:underline"
                    >
                      전체 보기 <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="bg-muted/50 mb-4 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">획득한 배지</span>
                      <span className="font-medium">
                        {profileData?.badgeStats.earned || 0}/{profileData?.badgeStats.total || 0}개
                      </span>
                    </div>
                    <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
                        style={{ width: `${profileData?.badgeStats.progress || 0}%` }}
                      />
                    </div>
                  </div>
                  {profileData?.recentBadges && profileData.recentBadges.length > 0 ? (
                    <div className="flex gap-3">
                      {profileData.recentBadges
                        .filter((ub) => ub.badge !== undefined)
                        .map((ub) => (
                          <div key={ub.id} className="flex-1">
                            <BadgeCard
                              badge={ub.badge!}
                              isEarned
                              earnedAt={ub.earnedAt}
                              size="sm"
                            />
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground py-6 text-center">
                      <Award className="mx-auto mb-2 h-10 w-10 opacity-30" />
                      <p className="text-sm">아직 획득한 배지가 없어요</p>
                    </div>
                  )}
                </section>
              </FadeInUp>
            )}

            {/* 챌린지 */}
            <FadeInUp delay={2}>
              <section className="bg-card rounded-2xl border p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Target className="h-5 w-5 text-blue-500" />
                    챌린지
                  </h3>
                  <Link
                    href="/challenges"
                    className="text-primary flex items-center gap-1 text-sm hover:underline"
                  >
                    챌린지 보기 <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {profileData?.challengeStats.inProgress || 0}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">진행 중</div>
                  </div>
                  <div className="rounded-xl bg-green-50 p-4 dark:bg-green-900/20">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {profileData?.challengeStats.completed || 0}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">완료</div>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900/20">
                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {profileData?.challengeStats.total || 0}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">전체 참여</div>
                  </div>
                </div>
              </section>
            </FadeInUp>
          </>
        )}

        {/* ── 탭: 소셜 ── */}
        {activeTab === 'social' && (
          <>
            {/* 친구 */}
            <FadeInUp>
              <section className="bg-card rounded-2xl border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-foreground flex items-center gap-2 font-semibold">
                    <Users className="h-5 w-5 text-blue-500" />
                    친구 ({friendCount}명)
                  </h3>
                  <Link
                    href="/friends"
                    className="text-primary flex items-center gap-1 text-sm hover:underline"
                  >
                    전체보기 <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                {/* 친구 아바타 placeholder 제거 — 실제 친구 목록은 /friends에서 확인 */}
                {friendCount === 0 && (
                  <p className="text-muted-foreground mb-3 text-sm">
                    아직 친구가 없어요. 친구를 추가해보세요.
                  </p>
                )}
                <div className="flex gap-2">
                  <Link
                    href="/friends/search"
                    className="bg-muted hover:bg-muted/80 flex-1 rounded-lg py-2 text-center text-sm font-medium"
                  >
                    친구 추가
                  </Link>
                  <Link
                    href="/friends/requests"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 rounded-lg py-2 text-center text-sm font-medium"
                  >
                    친구 요청 ({friendRequests})
                  </Link>
                </div>
              </section>
            </FadeInUp>

            {/* 리더보드 */}
            <FadeInUp delay={1}>
              <section className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-foreground flex items-center gap-2 font-semibold">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      리더보드
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {weeklyRank !== null ? (
                        <>
                          이번 주 {weeklyRank}위
                          {rankChange !== 0 && (
                            <span className={rankChange > 0 ? 'text-green-600' : 'text-red-600'}>
                              {' '}
                              ({rankChange > 0 ? '+' : ''}
                              {rankChange}
                              {rankChange > 0 ? '↑' : '↓'})
                            </span>
                          )}
                        </>
                      ) : (
                        '아직 순위 없음'
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link
                      href="/leaderboard"
                      className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300"
                    >
                      전체 순위
                    </Link>
                    {/* ADR-098: 영양/운동 순위는 W/N 숨김 (WELLNESS_PHASE2) */}
                    {FEATURE_FLAGS.WELLNESS_PHASE2 && (
                      <>
                        <Link
                          href="/leaderboard/nutrition"
                          className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300"
                        >
                          영양 순위
                        </Link>
                        <Link
                          href="/leaderboard/workout"
                          className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300"
                        >
                          운동 순위
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </section>
            </FadeInUp>
          </>
        )}

        {/* 설정/도움말 링크들 (항상 표시) */}
        <FadeInUp delay={4}>
          <section className="bg-card overflow-hidden rounded-2xl border">
            <Link
              href="/profile/settings"
              className="hover:bg-muted/50 flex items-center justify-between border-b p-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-gray-500" />
                <span>설정</span>
              </div>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </Link>
            <Link
              href="/announcements"
              className="hover:bg-muted/50 flex items-center justify-between border-b p-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Megaphone className="h-5 w-5 text-gray-500" />
                <span>공지사항</span>
              </div>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </Link>
            <Link
              href="/help/faq"
              className="hover:bg-muted/50 flex items-center justify-between border-b p-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-gray-500" />
                <span>도움말/FAQ</span>
              </div>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </Link>
            <Link
              href="/help/feedback"
              className="hover:bg-muted/50 flex items-center justify-between border-b p-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-gray-500" />
                <span>피드백 보내기</span>
              </div>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </Link>
            <SignOutButton redirectUrl="/">
              <button className="hover:bg-muted/50 flex w-full items-center justify-between p-4 text-left transition-colors">
                <div className="flex items-center gap-3 text-red-500">
                  <LogOut className="h-5 w-5" />
                  <span>로그아웃</span>
                </div>
              </button>
            </SignOutButton>
          </section>
        </FadeInUp>
      </div>

      <BottomNav />
    </div>
  );
}
