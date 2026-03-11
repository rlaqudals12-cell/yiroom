/**
 * 친구 프로필 화면
 *
 * 개별 친구의 프로필, 활동, 공유 분석 결과를 확인한다.
 */
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { GlassCard, ScreenContainer } from '../../../components/ui';
import { staggeredEntry, TIMING } from '../../../lib/animations';
import { useClerkSupabaseClient } from '../../../lib/supabase';
import { useTheme } from '../../../lib/theme';

interface FriendProfile {
  nickname: string;
  emoji: string;
  level: number;
  joinDate: string;
  streakDays: number;
  badges: { name: string; emoji: string }[];
  recentActivities: { date: string; action: string; module: string }[];
  sharedResults: { type: string; label: string; value: string; date: string }[];
}

export default function FriendProfileScreen(): React.ReactElement {
  const { colors, brand, spacing, radii, typography } = useTheme();
  const { friendId } = useLocalSearchParams<{ friendId: string }>();
  const supabase = useClerkSupabaseClient();
  const [friend, setFriend] = useState<FriendProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase에서 친구 프로필 조회
  useEffect(() => {
    if (!friendId) return;
    const fetchProfile = async (): Promise<void> => {
      setIsLoading(true);

      // 사용자 기본 정보
      const { data: userData } = await supabase
        .from('users')
        .select('nickname, avatar_emoji, created_at')
        .eq('clerk_user_id', friendId)
        .single();

      // 레벨 정보
      const { data: levelData } = await supabase
        .from('user_levels')
        .select('level, streak_days')
        .eq('clerk_user_id', friendId)
        .single();

      // 뱃지 정보
      const { data: badgeData } = await supabase
        .from('user_badges')
        .select('name, emoji')
        .eq('clerk_user_id', friendId)
        .order('earned_at', { ascending: false })
        .limit(8);

      if (userData) {
        setFriend({
          nickname: userData.nickname ?? '사용자',
          emoji: userData.avatar_emoji ?? '🌸',
          level: levelData?.level ?? 1,
          joinDate: userData.created_at?.slice(0, 10) ?? '',
          streakDays: levelData?.streak_days ?? 0,
          badges: badgeData ?? [],
          recentActivities: [],
          sharedResults: [],
        });
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, [friendId, supabase]);

  if (isLoading) {
    return (
      <ScreenContainer testID="friend-profile-screen" backgroundGradient="social">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </ScreenContainer>
    );
  }

  if (!friend) {
    return (
      <ScreenContainer testID="friend-profile-screen" backgroundGradient="social">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.mutedForeground }}>프로필을 찾을 수 없습니다</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      testID="friend-profile-screen"
      scrollable
      edges={['bottom']}
      contentPadding={spacing.md}
      backgroundGradient="social"
    >
      {/* 프로필 헤더 */}
      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: brand.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.sm,
          }}
        >
          <Text style={{ fontSize: typography.size['4xl'] }}>{friend.emoji}</Text>
        </View>
        <Text
          style={{
            fontSize: typography.size['2xl'],
            fontWeight: typography.weight.bold,
            color: colors.foreground,
          }}
        >
          {friend.nickname}
        </Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
            marginTop: spacing.xxs,
          }}
        >
          Lv.{friend.level} · {friend.joinDate}부터
        </Text>
      </View>

      {/* 요약 스탯 */}
      <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
        <GlassCard shadowSize="md" style={{ flexDirection: 'row', marginBottom: spacing.lg }}>
          {[
            { label: '레벨', value: `${friend.level}` },
            { label: '연속', value: `${friend.streakDays}일` },
            { label: '뱃지', value: `${friend.badges.length}개` },
          ].map((stat) => (
            <View key={stat.label} style={{ flex: 1, alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: typography.size.xl,
                  fontWeight: typography.weight.bold,
                  color: brand.primary,
                }}
              >
                {stat.value}
              </Text>
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  marginTop: spacing.xxs,
                }}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </GlassCard>
      </Animated.View>

      {/* 뱃지 */}
      <Text
        style={{
          fontSize: typography.size.lg,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
        accessibilityRole="header"
      >
        획득 뱃지
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
          marginBottom: spacing.lg,
        }}
      >
        {friend.badges.map((badge) => (
          <View
            key={badge.name}
            style={{
              paddingHorizontal: spacing.smx,
              paddingVertical: spacing.xs,
              borderRadius: radii.full,
              backgroundColor: colors.card,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xxs,
            }}
          >
            <Text style={{ fontSize: typography.size.sm }}>{badge.emoji}</Text>
            <Text style={{ fontSize: typography.size.xs, color: colors.foreground }}>
              {badge.name}
            </Text>
          </View>
        ))}
      </View>

      {/* 공유 분석 결과 */}
      {friend.sharedResults.length > 0 && (
        <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
          <Text
            style={{
              fontSize: typography.size.lg,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
              marginBottom: spacing.sm,
            }}
            accessibilityRole="header"
          >
            공유된 분석 결과
          </Text>
          <GlassCard shadowSize="md" style={{ marginBottom: spacing.lg }}>
            <View style={{ gap: spacing.sm }}>
              {friend.sharedResults.map((result, idx) => (
                <Animated.View
                  key={result.type}
                  entering={staggeredEntry(idx)}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: spacing.xs,
                  }}
                >
                  <View>
                    <Text
                      style={{
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.semibold,
                        color: colors.foreground,
                      }}
                    >
                      {result.label}
                    </Text>
                    <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
                      {result.date}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: typography.size.base,
                      fontWeight: typography.weight.bold,
                      color: brand.primary,
                    }}
                  >
                    {result.value}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>
      )}

      {/* 최근 활동 */}
      <Text
        style={{
          fontSize: typography.size.lg,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
        accessibilityRole="header"
      >
        최근 활동
      </Text>
      <View style={{ gap: spacing.xs }}>
        {friend.recentActivities.map((activity, index) => (
          <Animated.View
            key={index}
            entering={staggeredEntry(index)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: spacing.xs,
              borderBottomWidth: index < friend.recentActivities.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xxs,
                borderRadius: radii.full,
                backgroundColor: colors.secondary,
                marginRight: spacing.sm,
              }}
            >
              <Text style={{ fontSize: typography.size.xs, color: colors.foreground }}>
                {activity.module}
              </Text>
            </View>
            <Text style={{ flex: 1, fontSize: typography.size.sm, color: colors.foreground }}>
              {activity.action}
            </Text>
            <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
              {activity.date}
            </Text>
          </Animated.View>
        ))}
      </View>
    </ScreenContainer>
  );
}
