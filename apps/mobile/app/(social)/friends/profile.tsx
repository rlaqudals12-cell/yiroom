/**
 * 친구 프로필 화면
 *
 * 개별 친구의 프로필, 활동, 공유 분석 결과를 확인한다.
 */
import { View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { GlassCard, ScreenContainer } from '../../../components/ui';
import { staggeredEntry, TIMING } from '../../../lib/animations';
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

const MOCK_FRIEND: FriendProfile = {
  nickname: '뷰티러버',
  emoji: '🌸',
  level: 15,
  joinDate: '2025-11-01',
  streakDays: 42,
  badges: [
    { name: '피부 마스터', emoji: '🧴' },
    { name: '운동 7일 연속', emoji: '💪' },
    { name: '영양 균형왕', emoji: '🥗' },
    { name: '얼리어답터', emoji: '🚀' },
  ],
  recentActivities: [
    { date: '2026-03-01', action: '피부 분석 완료', module: '피부' },
    { date: '2026-02-28', action: '운동 세션 30분', module: '운동' },
    { date: '2026-02-28', action: '식사 기록', module: '영양' },
    { date: '2026-02-27', action: '퍼스널컬러 분석', module: '분석' },
  ],
  sharedResults: [
    { type: 'personal-color', label: '퍼스널컬러', value: '봄 웜톤', date: '2026-02-27' },
    { type: 'skin', label: '피부 타입', value: '복합성', date: '2026-02-25' },
  ],
};

export default function FriendProfileScreen(): React.ReactElement {
  const { colors, brand, spacing, radii, typography } = useTheme();

  const friend = MOCK_FRIEND;

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
