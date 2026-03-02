/**
 * ChallengeCard -- 챌린지 카드
 *
 * 소셜 챌린지/목표 카드: 진행률 바, 남은 일수, 참여자 수, 참여 버튼.
 * Pressable + 햅틱 피드백.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Target, Users, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../lib/theme';

export interface ChallengeCardProps {
  title: string;
  description: string;
  progress: number; // 0-100
  daysLeft: number;
  participantCount: number;
  isJoined: boolean;
  onPress?: () => void;
  testID?: string;
}

export function ChallengeCard({
  title,
  description,
  progress,
  daysLeft,
  participantCount,
  isJoined,
  onPress,
  testID = 'challenge-card',
}: ChallengeCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, brand, status } = useTheme();

  const clampedProgress = Math.max(0, Math.min(100, progress));

  const handlePress = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Animated.View entering={FadeInDown.duration(400).springify()}>
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderRadius: radii.xl,
            padding: spacing.md,
            ...shadows.card,
          },
        ]}
        onPress={handlePress}
        testID={testID}
        accessibilityLabel={`챌린지: ${title}, 진행률 ${clampedProgress}%, ${daysLeft}일 남음, ${participantCount}명 참여`}
        accessibilityRole="button"
      >
        {/* 상단: 아이콘 + 제목 + 화살표 */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: `${brand.primary}20`,
                borderRadius: radii.full,
                width: 36,
                height: 36,
              },
            ]}
          >
            <Target size={18} color={brand.primary} />
          </View>
          <View style={[styles.titleArea, { marginLeft: spacing.sm }]}>
            <Text
              style={{
                fontSize: typography.size.base,
                fontWeight: typography.weight.bold,
                color: colors.foreground,
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
                marginTop: spacing.xxs,
              }}
              numberOfLines={2}
            >
              {description}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </View>

        {/* 진행률 바 */}
        <View style={{ marginTop: spacing.sm }}>
          <View style={styles.progressHeader}>
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
              }}
            >
              진행률
            </Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.bold,
                color: brand.primary,
              }}
            >
              {clampedProgress}%
            </Text>
          </View>
          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.full,
                height: 8,
                marginTop: spacing.xs,
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${clampedProgress}%`,
                  backgroundColor: brand.primary,
                  borderRadius: radii.full,
                },
              ]}
            />
          </View>
        </View>

        {/* 하단: D-day + 참여자 + 참여 버튼 */}
        <View style={[styles.footer, { marginTop: spacing.sm }]}>
          {/* 남은 일수 뱃지 */}
          <View
            style={[
              styles.badge,
              {
                backgroundColor: `${status.warning}18`,
                borderRadius: radii.full,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xxs,
              },
            ]}
          >
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
                color: status.warning,
              }}
            >
              D-{daysLeft}
            </Text>
          </View>

          {/* 참여자 수 */}
          <View style={[styles.participants, { marginLeft: spacing.sm }]}>
            <Users size={14} color={colors.mutedForeground} />
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
                marginLeft: spacing.xxs,
              }}
            >
              {participantCount}명
            </Text>
          </View>

          <View style={{ flex: 1 }} />

          {/* 참여 버튼 */}
          <View
            style={[
              styles.joinBadge,
              {
                backgroundColor: isJoined ? `${status.success}18` : brand.primary,
                borderRadius: radii.full,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
              },
            ]}
          >
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.bold,
                color: isJoined ? status.success : brand.primaryForeground,
              }}
            >
              {isJoined ? '참여 중' : '참여하기'}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleArea: {
    flex: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {},
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinBadge: {},
});
