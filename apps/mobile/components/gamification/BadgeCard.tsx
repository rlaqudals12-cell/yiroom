/**
 * BadgeCard — 뱃지 카드
 *
 * 개별 뱃지를 표시하는 카드. 해금/미해금 상태 지원.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface BadgeCardProps {
  id: string;
  name: string;
  emoji: string;
  description: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  onPress?: (id: string) => void;
  style?: ViewStyle;
}

export function BadgeCard({
  id,
  name,
  emoji,
  description,
  isUnlocked,
  unlockedAt,
  onPress,
  style,
}: BadgeCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, grade } = useTheme();

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          opacity: isUnlocked ? 1 : 0.5,
          ...shadows.card,
        },
        style,
      ]}
      onPress={() => onPress?.(id)}
      disabled={!onPress}
      testID="badge-card"
      accessibilityLabel={`${name} 뱃지${isUnlocked ? ', 해금됨' : ', 미해금'}`}
    >
      <View
        style={[
          styles.emojiContainer,
          {
            backgroundColor: isUnlocked ? grade.gold.light : colors.secondary,
            borderRadius: radii.full,
          },
        ]}
      >
        <Text style={{ fontSize: typography.size['2xl'] }}>{emoji}</Text>
      </View>
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginTop: spacing.sm,
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {name}
      </Text>
      <Text
        style={{
          fontSize: typography.size.xs,
          color: colors.mutedForeground,
          marginTop: spacing.xxs,
          textAlign: 'center',
        }}
        numberOfLines={2}
      >
        {description}
      </Text>
      {isUnlocked && unlockedAt && (
        <Text
          style={{
            fontSize: typography.size.xs,
            color: grade.gold.text,
            marginTop: spacing.xs,
            textAlign: 'center',
          }}
        >
          {unlockedAt}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
  },
  emojiContainer: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
