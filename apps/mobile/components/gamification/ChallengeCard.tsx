/**
 * ChallengeCard — 챌린지 카드
 *
 * 진행 중인 챌린지를 표시. 진행률, 기간, 참여자 수.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export type ChallengeStatus = 'active' | 'completed' | 'upcoming';

export interface ChallengeCardProps {
  id: string;
  title: string;
  description: string;
  emoji?: string;
  status: ChallengeStatus;
  currentProgress: number;
  targetProgress: number;
  participants?: number;
  daysLeft?: number;
  onPress?: (id: string) => void;
  style?: ViewStyle;
}

const STATUS_LABEL: Record<ChallengeStatus, string> = {
  active: '진행 중',
  completed: '완료',
  upcoming: '예정',
};

export function ChallengeCard({
  id,
  title,
  description,
  emoji = '🎯',
  status,
  currentProgress,
  targetProgress,
  participants,
  daysLeft,
  onPress,
  style,
}: ChallengeCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, status: statusColors, brand } = useTheme();

  const progress = targetProgress > 0 ? Math.min(currentProgress / targetProgress, 1) : 0;
  const percentage = Math.round(progress * 100);

  const statusColor = status === 'completed' ? statusColors.success : status === 'active' ? brand.primary : colors.mutedForeground;

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
        },
        style,
      ]}
      onPress={() => onPress?.(id)}
      disabled={!onPress}
      testID="challenge-card"
      accessibilityLabel={`${title} 챌린지, ${STATUS_LABEL[status]}, ${percentage}% 달성`}
    >
      <View style={styles.header}>
        <Text style={{ fontSize: typography.size.xl }}>{emoji}</Text>
        <View style={{ marginLeft: spacing.sm, flex: 1 }}>
          <Text
            style={{
              fontSize: typography.size.sm,
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
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusColor,
              borderRadius: radii.full,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xxs,
            },
          ]}
        >
          <Text
            style={{
              fontSize: typography.size.xs,
              fontWeight: typography.weight.medium,
              color: colors.overlayForeground,
            }}
          >
            {STATUS_LABEL[status]}
          </Text>
        </View>
      </View>

      {/* 진행 바 */}
      <View
        style={[
          styles.trackBar,
          {
            backgroundColor: colors.secondary,
            borderRadius: radii.full,
            marginTop: spacing.sm,
          },
        ]}
      >
        <View
          style={[
            styles.fillBar,
            {
              backgroundColor: statusColor,
              borderRadius: radii.full,
              width: `${percentage}%` as unknown as number,
            },
          ]}
        />
      </View>

      <View style={[styles.footer, { marginTop: spacing.xs }]}>
        <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
          {currentProgress}/{targetProgress} ({percentage}%)
        </Text>
        <View style={styles.footerRight}>
          {participants !== undefined && (
            <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
              👥 {participants}명
            </Text>
          )}
          {daysLeft !== undefined && status === 'active' && (
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
                marginLeft: spacing.sm,
              }}
            >
              {daysLeft}일 남음
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusBadge: {},
  trackBar: {
    height: 6,
    overflow: 'hidden',
  },
  fillBar: {
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
