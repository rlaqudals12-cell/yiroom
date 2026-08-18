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
  BarChart3,
  ShoppingBag,
  Box,
  FileText,
  Shield,
} from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import { FEATURE_FLAGS } from '@yiroom/shared';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { BadgeCard } from '@/components/gamification';
import { QRCodeDisplay } from '@/components/common/QRCodeDisplay';
import { LevelBadgeFilled, LevelProgress as NewLevelProgress } from '@/components/common';
import { getUserLevel, calculateUserLevelState, type UserLevelState } from '@/lib/levels';
import { getAllBadges, getUserBadges, type UserBadge } from '@/lib/gamification';
import { getUserChallengeStats, type ChallengeStats } from '@/lib/challenges';
import { WellnessScoreRing, MyInfoSummaryCard, ProfileCardGrid } from '@/components/profile';
import { IntegratedSessionPromptCard } from '@/app/(main)/home/_components/IntegratedSessionPromptCard';
import { MyTwinCard } from '@/components/visual-expression';
import { BeforeAfterSection } from '@/components/profile/BeforeAfterSection';
import { getGreetingWithEmoji } from '@/lib/utils/greeting';
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus';
import { useProfilePersona } from '@/hooks/useProfilePersona';

// 프로필 데이터 타입
interface ProfileData {
  recentBadges: UserBadge[];
  badgeStats: { total: number; earned: number; progress: number };
  challengeStats: ChallengeStats | null;
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

type SupabaseClientLike = ReturnType<typeof useClerkSupabaseClient>;

/**
 * 배지 통계 — 전체 개수는 badges 테이블 실카운트.
 *
 * 예전엔 total이 23으로 하드코딩돼 배지를 추가/삭제하면 "N/23개"와 진행률이 즉시 거짓이 됐다.
 * BADGES 플래그가 꺼진 동안은 호출 자체를 건너뛰므로 왕복 비용도 0이다.
 */
async function fetchBadgeSummary(
  supabase: SupabaseClientLike,
  userId: string
): Promise<Pick<ProfileData, 'recentBadges' | 'badgeStats'>> {
  const [userBadges, allBadges] = await Promise.all([
    getUserBadges(supabase, userId),
    getAllBadges(supabase),
  ]);

  const total = allBadges.length;
  const earned = userBadges.length;

  return {
    // 최근 획득 배지 3개
    recentBadges: [...userBadges]
      .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
      .slice(0, 3),
    badgeStats: {
      total,
      earned,
      progress: total > 0 ? Math.round((earned / total) * 100) : 0,
    },
  };
}

/** 운동·식단 연속 기록 (WELLNESS_PHASE2 게이팅 시 미조회) */
async function fetchStreaks(
  supabase: SupabaseClientLike,
  userId: string
): Promise<Pick<ProfileData, 'workoutStreak' | 'nutritionStreak'>> {
  const [workoutResult, nutritionResult] = await Promise.all([
    supabase
      .from('workout_streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('nutrition_streaks')
      .select('current_streak, longest_streak')
      .eq('clerk_user_id', userId)
      .single(),
  ]);

  return {
    workoutStreak: workoutResult.data
      ? { current: workoutResult.data.current_streak, longest: workoutResult.data.longest_streak }
      : null,
    nutritionStreak: nutritionResult.data
      ? {
          current: nutritionResult.data.current_streak,
          longest: nutritionResult.data.longest_streak,
        }
      : null,
  };
}

/** 웰니스 스코어 (WELLNESS_PHASE2 게이팅 시 미조회) */
async function fetchWellnessScore(supabase: SupabaseClientLike, userId: string): Promise<number> {
  const { data } = await supabase
    .from('wellness_scores')
    .select('total_score')
    .eq('clerk_user_id', userId)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .single();

  return data?.total_score ?? 0;
}

/**
 * 프로필 화면 데이터 일괄 조회.
 *
 * 게이팅된 섹션(배지·챌린지·연속기록·웰니스 스코어)은 렌더되지 않으므로 조회 자체를 건너뛴다 —
 * 플래그 OFF 상태에서 매 진입마다 왕복 5건이 "결과를 버릴 목적으로" 실행되고 있었다.
 */
async function loadProfileData(supabase: SupabaseClientLike, userId: string): Promise<ProfileData> {
  const wellnessEnabled = FEATURE_FLAGS.WELLNESS_PHASE2;
  const badgesEnabled = FEATURE_FLAGS.BADGES;

  // 병렬로 데이터 조회
  const [
    badgeSummary,
    challengeStats,
    friendsResult,
    friendRequestsResult,
    leaderboardResult,
    wellnessScore,
    streaks,
    userLevelData,
  ] = await Promise.all([
    badgesEnabled ? fetchBadgeSummary(supabase, userId) : null,
    wellnessEnabled ? getUserChallengeStats(supabase, userId) : null,
    // 5축 분석 요약(퍼스널컬러·피부·체형 등)은 ProfileCardGrid가 useAnalysisStatus로 자체 조회 (ADR-111)
    // 친구 수 (accepted 상태)
    supabase
      .from('friendships')
      .select('id', { count: 'exact', head: true })
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted'),
    // 친구 요청 수 (pending 상태, 내가 받은 요청)
    supabase
      .from('friendships')
      .select('id', { count: 'exact', head: true })
      .eq('addressee_id', userId)
      .eq('status', 'pending'),
    // 리더보드 순위
    supabase
      .from('leaderboard_cache')
      .select('rank, previous_rank')
      .eq('clerk_user_id', userId)
      .eq('period', 'weekly')
      .single(),
    wellnessEnabled ? fetchWellnessScore(supabase, userId) : 0,
    wellnessEnabled ? fetchStreaks(supabase, userId) : null,
    // 새 등급 시스템 (분석·루틴 체크가 쌓는 활동 카운트)
    getUserLevel(supabase, userId),
  ]);

  // 리더보드 순위 변화
  const leaderData = leaderboardResult.data;

  return {
    recentBadges: badgeSummary?.recentBadges ?? [],
    badgeStats: badgeSummary?.badgeStats ?? { total: 0, earned: 0, progress: 0 },
    challengeStats,
    workoutStreak: streaks?.workoutStreak ?? null,
    nutritionStreak: streaks?.nutritionStreak ?? null,
    // 분석 결과
    wellnessScore,
    // 소셜
    friendCount: friendsResult.count ?? 0,
    friendRequests: friendRequestsResult.count ?? 0,
    weeklyRank: leaderData?.rank ?? null,
    rankChange: leaderData ? (leaderData.previous_rank ?? leaderData.rank) - leaderData.rank : 0,
    // 새 등급 시스템
    userLevelState: userLevelData
      ? calculateUserLevelState(userLevelData.totalActivityCount)
      : null,
  };
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
        setProfileData(await loadProfileData(supabase, user.id));
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
    <div className="bg-background min-h-screen" data-testid="profile-page">
      <div className="space-y-4 px-4 py-6">
        {/* K-5: 시간대별 인사말 헤더 */}
        <FadeInUp>
          {/* 장식 그라데 소거 — 솔리드 카드 + 헤어라인 (깊이 레시피) */}
          <section className="bg-card rounded-2xl border p-4">
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
                  <div className="bg-primary flex h-[72px] w-[72px] items-center justify-center rounded-full">
                    <span className="text-primary-foreground text-2xl font-bold">
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
            {/* 내 트윈 (ADR-115) — 승인된 트윈만 노출, 없으면 만들기 CTA */}
            <FadeInUp>
              <MyTwinCard />
            </FadeInUp>

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

            {/* 내 정체성 카드·리포트 진입 — 재방문 발견성(7/18 감사: 통합 결과 진입점이
                홈 브리핑 최하단 1개뿐이었음). 세션 유무 처리는 카드가 자체 담당 */}
            <FadeInUp delay={2}>
              <IntegratedSessionPromptCard />
            </FadeInUp>

            {/* Before/After 비교 */}
            <FadeInUp delay={3}>
              <BeforeAfterSection />
            </FadeInUp>

            {/* 등급 진행률 */}
            {profileData?.userLevelState && (
              <FadeInUp delay={4}>
                <LevelProgressSection state={profileData.userLevelState} />
              </FadeInUp>
            )}
          </>
        )}

        {/* ── 탭: 활동 ── */}
        {activeTab === 'activity' && (
          <>
            <FadeInUp>
              <ActivitySummarySection
                activityCount={profileData?.userLevelState?.totalActivityCount ?? 0}
              />
            </FadeInUp>

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
                        className="bg-primary h-full rounded-full"
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

            {/* 챌린지 — ADR-098: 챌린지 목록이 전부 운동·영양 의존이라 W/N 숨김 상태에선
                달성 불가능한 목표만 노출됐다. 스트릭·배지와 동일하게 WELLNESS_PHASE2 게이팅.
                (3-up 채점판 ChallengeStatsPanel도 이 섹션 안이라 함께 숨겨진다) */}
            {FEATURE_FLAGS.WELLNESS_PHASE2 && (
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
                  <ChallengeStatsPanel stats={profileData?.challengeStats ?? undefined} />
                </section>
              </FadeInUp>
            )}
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
                <FriendActionButtons friendRequests={friendRequests} />
              </section>
            </FadeInUp>

            {/* 리더보드 */}
            <FadeInUp delay={1}>
              {/* 장식 그라데 소거 — 솔리드 카드, 앰버 정체성은 아이콘·링크 액센트로 유지 (깊이 레시피) */}
              <section className="bg-card rounded-2xl border p-4">
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

        {/* 더 보기 — 5탭 표면에 진입점이 없는 깊은 기능 보존 (ADR-114 죽은 링크 방지).
            분석 5축은 위 ProfileCardGrid가 정본으로 커버 → 여기엔 기록/제품/캡슐만. */}
        <FadeInUp delay={3}>
          <section className="bg-card overflow-hidden rounded-2xl border">
            <div className="px-4 pt-4 pb-1 text-xs font-medium text-muted-foreground">더 보기</div>
            <Link
              href="/dashboard"
              className="hover:bg-muted/50 flex items-center justify-between border-b p-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-gray-500" />
                <span>분석 기록</span>
              </div>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </Link>
            <Link
              href="/products"
              className="hover:bg-muted/50 flex items-center justify-between border-b p-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-gray-500" />
                <span>제품 둘러보기</span>
              </div>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </Link>
            <Link
              href="/capsule/daily"
              className="hover:bg-muted/50 flex items-center justify-between p-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Box className="h-5 w-5 text-gray-500" />
                {/* 사용자 대면 명칭은 "오늘의 루틴"으로 통일 — 경로/식별자(capsule)는 유지. (배치 IA-3)
                    링크는 정본 표면 /capsule/daily로 (/capsule은 캡슐 워드로브 대시보드). */}
                <span>오늘의 루틴</span>
              </div>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </Link>
          </section>
        </FadeInUp>

        {/* 약관·정책 — 법적 고지 및 개인정보/동의 관리 도달 경로 (운영 요소 가시성 확보) */}
        <FadeInUp delay={4}>
          <section className="bg-card overflow-hidden rounded-2xl border">
            <div className="px-4 pt-4 pb-1 text-xs font-medium text-muted-foreground">
              약관·정책
            </div>
            <Link
              href="/terms"
              className="hover:bg-muted/50 flex items-center justify-between border-b p-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-500" />
                <span>이용약관</span>
              </div>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </Link>
            <Link
              href="/privacy"
              className="hover:bg-muted/50 flex items-center justify-between border-b p-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-500" />
                <span>개인정보처리방침</span>
              </div>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </Link>
            <Link
              href="/settings/privacy"
              className="hover:bg-muted/50 flex items-center justify-between p-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-500" />
                <span>개인정보·동의 관리</span>
              </div>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </Link>
          </section>
        </FadeInUp>

        {/* 설정/도움말 링크들 (항상 표시) */}
        <FadeInUp delay={5}>
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
    </div>
  );
}

/** 나의 등급 — 활동 0이면 "왜 0인지"를 알 방법이 없어 블록이 고장처럼 보이므로 안내를 덧붙인다 */
function LevelProgressSection({ state }: { state: UserLevelState }): React.JSX.Element {
  return (
    <section className="bg-card rounded-2xl border p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <TrendingUp className="h-5 w-5 text-purple-500" />
        나의 등급
      </h3>
      <NewLevelProgress
        level={state.level}
        currentCount={state.totalActivityCount}
        nextThreshold={state.nextLevelThreshold}
        progress={state.progress}
        showDetails
      />
      {state.totalActivityCount === 0 && (
        <p className="text-muted-foreground mt-3 text-sm">
          분석을 완료하거나 오늘의 루틴을 체크하면 활동이 쌓여요.
        </p>
      )}
    </section>
  );
}

/**
 * 활동 기록 — 등급을 쌓는 활동이 무엇인지 알려주는 유일한 비게이팅 표면.
 *
 * 운동·영양(스트릭)·배지·챌린지가 모두 숨김이라 이 카드가 없으면 활동 탭이 통째로 빈다.
 * 분석 완료(2점)·오늘의 루틴 체크(1점/일)가 실제로 카운트를 올리는 활동이다.
 */
function ActivitySummarySection({ activityCount }: { activityCount: number }): React.JSX.Element {
  return (
    <section className="bg-card rounded-2xl border p-6" data-testid="activity-summary">
      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <Flame className="h-5 w-5 text-orange-500" />
        활동 기록
      </h3>
      <p className="text-3xl font-bold">
        {activityCount}
        <span className="text-muted-foreground ml-1 text-base font-medium">회</span>
      </p>
      <p className="text-muted-foreground mt-2 text-sm">
        {activityCount === 0
          ? '아직 쌓인 활동이 없어요. 분석을 완료하거나 오늘의 루틴을 체크하면 활동이 쌓여요.'
          : '분석 완료와 오늘의 루틴 체크가 활동으로 쌓여요.'}
      </p>
      <Link
        href="/capsule/daily"
        className="text-primary mt-3 inline-flex items-center gap-1 text-sm hover:underline"
      >
        오늘의 루틴 확인 <ChevronRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

/** 챌린지 스탯 — 참여 이력 0이면 "0·0·0" 빈 채점판 대신 1행 진입 링크로 축약 (배치 C4) */
function ChallengeStatsPanel({ stats }: { stats: ChallengeStats | undefined }): React.JSX.Element {
  if ((stats?.total ?? 0) === 0) {
    return (
      <Link
        href="/challenges"
        className="bg-muted/50 hover:bg-muted flex items-center justify-between rounded-xl p-4 transition-colors"
        data-testid="challenge-empty-entry"
      >
        <span className="text-muted-foreground text-sm">
          아직 참여한 챌린지가 없어요. 첫 챌린지를 시작해보세요.
        </span>
        <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
      </Link>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {stats?.inProgress || 0}
        </div>
        <div className="text-muted-foreground mt-1 text-xs">진행 중</div>
      </div>
      <div className="rounded-xl bg-green-50 p-4 dark:bg-green-900/20">
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
          {stats?.completed || 0}
        </div>
        <div className="text-muted-foreground mt-1 text-xs">완료</div>
      </div>
      <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900/20">
        <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
          {stats?.total || 0}
        </div>
        <div className="text-muted-foreground mt-1 text-xs">전체 참여</div>
      </div>
    </div>
  );
}

/** 친구 액션 — 받은 요청이 0이면 응답할 대상이 없으므로 '친구 추가'를 주 액션으로 승격 (배치 C4) */
function FriendActionButtons({ friendRequests }: { friendRequests: number }): React.JSX.Element {
  const primaryClass = 'bg-primary text-primary-foreground hover:bg-primary/90';
  const mutedClass = 'bg-muted hover:bg-muted/80';
  const hasRequests = friendRequests > 0;

  return (
    <div className="flex gap-2">
      <Link
        href="/friends/search"
        className={`flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors ${
          hasRequests ? mutedClass : primaryClass
        }`}
      >
        친구 추가
      </Link>
      <Link
        href="/friends/requests"
        className={`flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors ${
          hasRequests ? primaryClass : mutedClass
        }`}
      >
        친구 요청 ({friendRequests})
      </Link>
    </div>
  );
}
