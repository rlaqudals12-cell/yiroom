/**
 * 리더보드 사용자 프로필 화면
 *
 * 리더보드에서 사용자 탭 시 상세 프로필.
 * - 기본 정보 (닉네임, 아바타, 레벨, 티어)
 * - XP 및 활동 통계
 * - 친구 관계 액션 (친구 추가/삭제)
 */
import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import {
  UserPlus,
  UserCheck,
  Trophy,
  TrendingUp,
  Award,
  Flame,
  Dumbbell,
} from 'lucide-react-native';
import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';
import { TIMING } from '@/lib/animations';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { getTierColor, getTierLabel, sendFriendRequest } from '../../../lib/social';
import { socialLogger } from '../../../lib/utils/logger';

interface UserProfile {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  tier: string;
  totalXp: number;
  joinedAt: string;
  isFriend: boolean;
  isPendingRequest: boolean;
}

interface UserStats {
  totalAnalyses: number;
  totalWorkouts: number;
  currentStreak: number;
  badges: number;
}

export default function LeaderboardProfileScreen(): React.JSX.Element {
  const { colors, spacing, radii, typography, brand, shadows } = useTheme();
  const supabase = useClerkSupabaseClient();
  const { user: currentUser } = useUser();
  const params = useLocalSearchParams<{ userId?: string }>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const isMe = currentUser?.id === params.userId;

  const fetchProfile = useCallback(async () => {
    if (!params.userId) return;
    setIsLoading(true);

    try {
      // 사용자 기본 정보
      const { data: userData } = await supabase
        .from('users')
        .select('clerk_user_id, display_name, avatar_url, created_at')
        .eq('clerk_user_id', params.userId)
        .single();

      // 레벨 정보
      const { data: levelData } = await supabase
        .from('user_levels')
        .select('level, tier, total_xp')
        .eq('clerk_user_id', params.userId)
        .single();

      // 친구 관계 확인
      let isFriend = false;
      let isPending = false;

      if (currentUser?.id && currentUser.id !== params.userId) {
        const { data: friendship } = await supabase
          .from('friendships')
          .select('status')
          .or(
            `and(requester_id.eq.${currentUser.id},addressee_id.eq.${params.userId}),` +
              `and(requester_id.eq.${params.userId},addressee_id.eq.${currentUser.id})`
          )
          .maybeSingle();

        if (friendship) {
          isFriend = friendship.status === 'accepted';
          isPending = friendship.status === 'pending';
        }
      }

      if (userData) {
        setProfile({
          userId: userData.clerk_user_id,
          displayName: userData.display_name ?? '사용자',
          avatarUrl: userData.avatar_url,
          level: levelData?.level ?? 1,
          tier: levelData?.tier ?? 'beginner',
          totalXp: levelData?.total_xp ?? 0,
          joinedAt: userData.created_at,
          isFriend,
          isPendingRequest: isPending,
        });
      }

      // 활동 통계
      const [analysisCount, workoutCount, badgeCount] = await Promise.all([
        supabase
          .from('user_analyses')
          .select('*', { count: 'exact', head: true })
          .eq('clerk_user_id', params.userId),
        supabase
          .from('workout_logs')
          .select('*', { count: 'exact', head: true })
          .eq('clerk_user_id', params.userId),
        supabase
          .from('user_badges')
          .select('*', { count: 'exact', head: true })
          .eq('clerk_user_id', params.userId),
      ]);

      setStats({
        totalAnalyses: analysisCount.count ?? 0,
        totalWorkouts: workoutCount.count ?? 0,
        currentStreak: 0,
        badges: badgeCount.count ?? 0,
      });
    } catch (err) {
      socialLogger.error('Profile fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params.userId, currentUser?.id, supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSendRequest = useCallback(async () => {
    if (!currentUser?.id || !params.userId) return;
    setIsSendingRequest(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const result = await sendFriendRequest(supabase, currentUser.id, params.userId);
      if (result.success && profile) {
        setProfile({ ...profile, isPendingRequest: true });
      }
    } catch (err) {
      socialLogger.error('Friend request failed:', err);
    } finally {
      setIsSendingRequest(false);
    }
  }, [currentUser?.id, params.userId, supabase, profile]);

  if (isLoading) {
    return (
      <SafeAreaView
        testID="leaderboard-profile-screen"
        style={[styles.center, { flex: 1, backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <ActivityIndicator size="large" color={brand.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView
        testID="leaderboard-profile-screen"
        style={[styles.center, { flex: 1, backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <Text style={{ fontSize: typography.size.base, fontWeight: '600', color: colors.foreground }}>
          사용자를 찾을 수 없어요
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: brand.primary, borderRadius: radii.lg, marginTop: spacing.md }]}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: typography.size.sm }}>
            돌아가기
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const tierColor = getTierColor(profile.tier);

  return (
    <SafeAreaView
      testID="leaderboard-profile-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {/* 프로필 히어로 */}
        <Animated.View
          entering={FadeInUp.duration(TIMING.normal)}
          style={[
            {
              backgroundColor: brand.primary,
              padding: spacing.xl,
              alignItems: 'center',
            },
          ]}
        >
          {profile.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={[styles.avatar, { borderColor: '#fff' }]}
              transition={200}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={{ fontSize: 32, fontWeight: '700', color: '#fff' }}>
                {profile.displayName.charAt(0)}
              </Text>
            </View>
          )}

          <Text
            style={{
              fontSize: typography.size.xl,
              fontWeight: typography.weight.bold,
              color: '#fff',
              marginTop: spacing.md,
            }}
          >
            {profile.displayName}
          </Text>

          <View style={[styles.tierBadge, { backgroundColor: tierColor + '30', borderRadius: radii.full, marginTop: spacing.sm }]}>
            <Text style={{ fontSize: typography.size.sm, fontWeight: '600', color: tierColor }}>
              {getTierLabel(profile.tier)} · Lv.{profile.level}
            </Text>
          </View>

          {/* 친구 액션 */}
          {!isMe && (
            <View style={{ marginTop: spacing.md }}>
              {profile.isFriend ? (
                <View
                  style={[
                    styles.friendButton,
                    { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radii.lg },
                  ]}
                >
                  <UserCheck size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: typography.size.sm, marginLeft: spacing.xs }}>
                    친구
                  </Text>
                </View>
              ) : profile.isPendingRequest ? (
                <View
                  style={[
                    styles.friendButton,
                    { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radii.lg },
                  ]}
                >
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: typography.size.sm }}>
                    요청 보냄
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.friendButton,
                    { backgroundColor: '#fff', borderRadius: radii.lg },
                  ]}
                  onPress={handleSendRequest}
                  disabled={isSendingRequest}
                >
                  {isSendingRequest ? (
                    <ActivityIndicator size="small" color={brand.primary} />
                  ) : (
                    <>
                      <UserPlus size={16} color={brand.primary} />
                      <Text
                        style={{
                          color: brand.primary,
                          fontWeight: '600',
                          fontSize: typography.size.sm,
                          marginLeft: spacing.xs,
                        }}
                      >
                        친구 추가
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>

        {/* XP 카드 */}
        <Animated.View
          entering={FadeInUp.delay(80).duration(TIMING.normal)}
          style={[
            shadows.card,
            {
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.border,
              margin: spacing.md,
              padding: spacing.lg,
              alignItems: 'center',
            },
          ]}
        >
          <TrendingUp size={20} color={brand.primary} />
          <Text
            style={{
              fontSize: 28,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
              marginTop: spacing.xs,
            }}
          >
            {profile.totalXp.toLocaleString()}
          </Text>
          <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
            총 XP
          </Text>
        </Animated.View>

        {/* 활동 통계 */}
        {stats && (
          <Animated.View
            entering={FadeInUp.delay(160).duration(TIMING.normal)}
            style={{ paddingHorizontal: spacing.md }}
          >
            <Text
              style={{
                fontSize: typography.size.base,
                fontWeight: typography.weight.bold,
                color: colors.foreground,
                marginBottom: spacing.sm,
              }}
            >
              활동 통계
            </Text>
            <View style={[styles.statsGrid, { gap: spacing.sm }]}>
              {[
                { icon: Trophy, label: '분석', value: stats.totalAnalyses, color: '#8b5cf6' },
                { icon: Dumbbell, label: '운동', value: stats.totalWorkouts, color: '#10b981' },
                { icon: Award, label: '뱃지', value: stats.badges, color: '#f59e0b' },
                { icon: Flame, label: '연속', value: stats.currentStreak, color: '#ef4444', unit: '일' },
              ].map((stat) => (
                <View
                  key={stat.label}
                  style={[
                    shadows.card,
                    {
                      flex: 1,
                      backgroundColor: colors.card,
                      borderRadius: radii.lg,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: spacing.md,
                      alignItems: 'center',
                    },
                  ]}
                >
                  <stat.icon size={20} color={stat.color} />
                  <Text
                    style={{
                      fontSize: typography.size.lg,
                      fontWeight: typography.weight.bold,
                      color: colors.foreground,
                      marginTop: spacing.xs,
                    }}
                  >
                    {stat.value}
                    {stat.unit ?? ''}
                  </Text>
                  <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
