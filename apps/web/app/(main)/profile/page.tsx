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

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
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
  Palette,
  FlaskConical,
  User,
  Flame,
  Calendar,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { FadeInUp } from '@/components/animations';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { LevelProgress, BadgeCard } from '@/components/gamification';
import {
  getUserLevelInfo,
  getUserBadges,
  type LevelInfo,
  type UserBadge,
} from '@/lib/gamification';
import {
  getUserChallengeStats,
  type ChallengeStats,
} from '@/lib/challenges';

// 프로필 데이터 타입
interface ProfileData {
  levelInfo: LevelInfo | null;
  recentBadges: UserBadge[];
  badgeStats: { total: number; earned: number; progress: number };
  challengeStats: ChallengeStats;
  workoutStreak: { current: number; longest: number } | null;
  nutritionStreak: { current: number; longest: number } | null;
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfileData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // 병렬로 데이터 조회
        const [levelInfo, userBadges, challengeStats] = await Promise.all([
          getUserLevelInfo(supabase, user.id),
          getUserBadges(supabase, user.id),
          getUserChallengeStats(supabase, user.id),
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

        // 배지 통계 (전체 배지 수는 임시로 고정)
        const badgeStats = {
          total: 23, // 전체 배지 수
          earned: userBadges.length,
          progress: Math.round((userBadges.length / 23) * 100),
        };

        // 최근 획득 배지 3개
        const recentBadges = userBadges
          .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
          .slice(0, 3);

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
        });
      } catch (error) {
        console.error('[ProfilePage] 데이터 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isLoaded) {
      fetchProfileData();
    }
  }, [supabase, user?.id, isLoaded]);

  // 로딩
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">프로필 불러오는 중...</div>
      </div>
    );
  }

  // 비로그인
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">로그인이 필요합니다</h2>
          <p className="text-muted-foreground">프로필을 확인하려면 먼저 로그인해주세요</p>
        </div>
      </div>
    );
  }

  // TODO: 실제 데이터 연동
  const wellnessScore = 85;
  const personalColor = '봄 웜톤';
  const skinType = '복합성/민감성';
  const bodyType = '웨이브';
  const friendCount = 12;
  const friendRequests = 3;
  const weeklyRank = 127;
  const rankChange = 23;

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="profile-page">
      <main className="px-4 py-6 space-y-4">
        {/* 프로필 카드 */}
        <FadeInUp>
          <section className="bg-card rounded-2xl border p-6">
            <div className="flex items-center gap-4">
              {user.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={user.fullName || '프로필'}
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {(user.fullName || user.username || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {user.fullName || user.username || '사용자'}님
                </h2>
                {profileData?.levelInfo && (
                  <p className="text-sm text-muted-foreground">
                    Lv.{profileData.levelInfo.level} {profileData.levelInfo.tierName}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">
                    웰니스 스코어: {wellnessScore}점
                  </span>
                </div>
              </div>
            </div>
          </section>
        </FadeInUp>

        {/* 내 분석 결과 */}
        <FadeInUp delay={1}>
          <section className="bg-card rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">📊 내 분석 결과</h3>
              <Link
                href="/profile/analysis"
                className="text-xs text-primary hover:underline"
              >
                분석 다시하기
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <Palette className="w-4 h-4 text-rose-500" />
                <span className="text-sm text-muted-foreground">퍼스널 컬러:</span>
                <span className="text-sm font-medium">{personalColor}</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <FlaskConical className="w-4 h-4 text-pink-500" />
                <span className="text-sm text-muted-foreground">피부:</span>
                <span className="text-sm font-medium">{skinType}</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <User className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">체형:</span>
                <span className="text-sm font-medium">{bodyType}</span>
              </div>
            </div>
          </section>
        </FadeInUp>

        {/* 친구 */}
        <FadeInUp delay={2}>
          <section className="bg-card rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                친구 ({friendCount}명)
              </h3>
              <Link
                href="/profile/friends"
                className="text-sm text-primary flex items-center gap-1 hover:underline"
              >
                전체보기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex gap-2 mb-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground"
                >
                  👤
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Link
                href="/friends/search"
                className="flex-1 py-2 bg-muted rounded-lg text-center text-sm font-medium hover:bg-muted/80"
              >
                친구 추가
              </Link>
              <Link
                href="/friends/requests"
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-center text-sm font-medium hover:bg-primary/90"
              >
                친구 요청 ({friendRequests})
              </Link>
            </div>
          </section>
        </FadeInUp>

        {/* 리더보드 */}
        <FadeInUp delay={3}>
          <section className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  리더보드
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  이번 주 {weeklyRank}위 (+{rankChange}↑)
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Link
                  href="/leaderboard"
                  className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200"
                >
                  전체 순위
                </Link>
                <Link
                  href="/leaderboard/nutrition"
                  className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200"
                >
                  영양 순위
                </Link>
                <Link
                  href="/leaderboard/workout"
                  className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200"
                >
                  운동 순위
                </Link>
              </div>
            </div>
          </section>
        </FadeInUp>

        {/* 레벨 & XP */}
        {profileData?.levelInfo && (
          <section className="bg-card rounded-2xl border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              레벨 & 경험치
            </h3>
            <LevelProgress levelInfo={profileData.levelInfo} showDetails />
          </section>
        )}

        {/* 배지 */}
        <section className="bg-card rounded-2xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              배지 컬렉션
            </h3>
            <Link
              href="/profile/badges"
              className="text-sm text-primary flex items-center gap-1 hover:underline"
            >
              전체 보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 통계 */}
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">획득한 배지</span>
              <span className="font-medium">
                {profileData?.badgeStats.earned || 0}/{profileData?.badgeStats.total || 0}개
              </span>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                style={{ width: `${profileData?.badgeStats.progress || 0}%` }}
              />
            </div>
          </div>

          {/* 최근 획득 배지 */}
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
            <div className="text-center py-6 text-muted-foreground">
              <Award className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">아직 획득한 배지가 없어요</p>
            </div>
          )}
        </section>

        {/* 챌린지 */}
        <section className="bg-card rounded-2xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              챌린지
            </h3>
            <Link
              href="/challenges"
              className="text-sm text-primary flex items-center gap-1 hover:underline"
            >
              챌린지 보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {profileData?.challengeStats.inProgress || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">진행 중</div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {profileData?.challengeStats.completed || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">완료</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-xl">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {profileData?.challengeStats.total || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">전체 참여</div>
            </div>
          </div>
        </section>

        {/* 스트릭 */}
        <section className="bg-card rounded-2xl border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            연속 기록
          </h3>

          <div className="space-y-4">
            {/* 운동 스트릭 */}
            <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <span className="text-lg">💪</span>
                </div>
                <div>
                  <div className="font-medium">운동</div>
                  <div className="text-xs text-muted-foreground">
                    최장 {profileData?.workoutStreak?.longest || 0}일
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {profileData?.workoutStreak?.current || 0}일
                </div>
                <div className="text-xs text-muted-foreground">현재</div>
              </div>
            </div>

            {/* 영양 스트릭 */}
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <span className="text-lg">🥗</span>
                </div>
                <div>
                  <div className="font-medium">식단</div>
                  <div className="text-xs text-muted-foreground">
                    최장 {profileData?.nutritionStreak?.longest || 0}일
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {profileData?.nutritionStreak?.current || 0}일
                </div>
                <div className="text-xs text-muted-foreground">현재</div>
              </div>
            </div>
          </div>
        </section>

        {/* 가입 정보 */}
        <section className="bg-card rounded-2xl border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            가입 정보
          </h3>
          <div className="text-sm text-muted-foreground">
            가입일:{' '}
            {user.createdAt
              ? new Date(user.createdAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : '-'}
          </div>
        </section>

        {/* 설정/도움말 링크들 */}
        <FadeInUp delay={6}>
          <section className="bg-card rounded-2xl border overflow-hidden">
            <Link
              href="/profile/settings"
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-gray-500" />
                <span>설정</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link
              href="/announcements"
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b"
            >
              <div className="flex items-center gap-3">
                <Megaphone className="w-5 h-5 text-gray-500" />
                <span>공지사항</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link
              href="/help"
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-gray-500" />
                <span>도움말/FAQ</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link
              href="/help/feedback"
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                <span>피드백 보내기</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <button
              onClick={() => {
                // TODO: 로그아웃 처리
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 text-red-500">
                <LogOut className="w-5 h-5" />
                <span>로그아웃</span>
              </div>
            </button>
          </section>
        </FadeInUp>
      </main>

      <BottomNav />
    </div>
  );
}
