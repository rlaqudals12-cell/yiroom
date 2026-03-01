/**
 * FriendActivityCard — 친구 활동 카드
 *
 * 특정 친구의 최근 활동을 보여주는 카드 (운동, 분석, 식단 등).
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export type ActivityType = 'workout' | 'analysis' | 'nutrition' | 'streak';

export interface FriendActivityCardProps {
  friendName: string;
  activityType: ActivityType;
  title: string;
  detail?: string;
  timeAgo: string;
  onPress?: () => void;
  style?: ViewStyle;
}

const ACTIVITY_EMOJI: Record<ActivityType, string> = {
  workout: '💪',
  analysis: '📸',
  nutrition: '🍽️',
  streak: '🔥',
};

const ACTIVITY_LABEL: Record<ActivityType, string> = {
  workout: '운동',
  analysis: '분석',
  nutrition: '식단',
  streak: '연속 기록',
};

export function FriendActivityCard({
  friendName,
  activityType,
  title,
  detail,
  timeAgo,
  onPress,
  style,
}: FriendActivityCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows } = useTheme();

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
      onPress={onPress}
      disabled={!onPress}
      testID="friend-activity-card"
      accessibilityLabel={`${friendName}님의 ${ACTIVITY_LABEL[activityType]}: ${title}`}
    >
      <View style={styles.header}>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
          }}
        >
          {friendName}
        </Text>
        <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
          {timeAgo}
        </Text>
      </View>

      <View style={[styles.body, { marginTop: spacing.sm }]}>
        <Text style={{ fontSize: typography.size.xl }}>
          {ACTIVITY_EMOJI[activityType]}
        </Text>
        <View style={{ marginLeft: spacing.sm, flex: 1 }}>
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.medium,
              color: colors.foreground,
            }}
          >
            {title}
          </Text>
          {detail && (
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
                marginTop: spacing.xxs,
              }}
              numberOfLines={2}
            >
              {detail}
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
